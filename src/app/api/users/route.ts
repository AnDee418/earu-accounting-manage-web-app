import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { UserRole } from '@/types';

export interface CompanyUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  companyId: string;
  departmentId?: string;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: Date;
  lastSignInTime?: Date;
}

/**
 * GET /api/users
 * 会社のユーザー一覧取得（管理者のみ）
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Fetching users for company:', user.companyId);

    // Firebase Authから全ユーザーを取得し、同じ会社のユーザーをフィルタリング
    const users: CompanyUser[] = [];
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
      
      for (const userRecord of listUsersResult.users) {
        // カスタムクレームを確認
        const customClaims = userRecord.customClaims || {};
        const userCompanyId = customClaims.companyId as string;
        
        // 同じ会社のユーザーのみ追加
        if (userCompanyId === user.companyId) {
          users.push({
            uid: userRecord.uid,
            email: userRecord.email || '',
            displayName: userRecord.displayName,
            role: (customClaims.role as UserRole) || 'staff',
            companyId: userCompanyId,
            departmentId: customClaims.departmentId as string,
            disabled: userRecord.disabled,
            emailVerified: userRecord.emailVerified,
            createdAt: new Date(userRecord.metadata.creationTime),
            lastSignInTime: userRecord.metadata.lastSignInTime ? 
              new Date(userRecord.metadata.lastSignInTime) : undefined,
          });
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`Found ${users.length} users for company ${user.companyId}`);

    // 作成日でソート（新しい順）
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users
 * ユーザー情報更新（管理者のみ）
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { uid, role, departmentId, disabled, newPassword } = body;

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 対象ユーザーの確認
    const targetUser = await adminAuth.getUser(uid);
    const targetUserClaims = targetUser.customClaims || {};
    
    // 同じ会社のユーザーかチェック
    if (targetUserClaims.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Cannot modify users from other companies' }, { status: 403 });
    }

    // 自分自身の管理者権限は変更不可
    if (uid === user.uid && role !== 'admin') {
      return NextResponse.json({ 
        error: 'Cannot remove admin role from yourself' 
      }, { status: 400 });
    }

    console.log('Updating user:', uid, { role, departmentId, disabled });

    // カスタムクレームの更新
    if (role !== undefined || departmentId !== undefined) {
      const newClaims = {
        ...targetUserClaims,
        role: role || targetUserClaims.role,
        companyId: user.companyId, // 会社IDは維持
        departmentId: departmentId !== undefined ? departmentId : targetUserClaims.departmentId,
      };

      await adminAuth.setCustomUserClaims(uid, newClaims);
    }

    // アカウントの有効/無効切り替え
    if (disabled !== undefined) {
      await adminAuth.updateUser(uid, { disabled });
    }

    // パスワード更新
    if (newPassword && newPassword.trim()) {
      await adminAuth.updateUser(uid, { 
        password: newPassword.trim()
      });
    }

    // 監査ログの記録
    const companyRef = adminDb.collection('companies').doc(user.companyId);
    const auditLogData: any = {
      actorId: user.uid,
      action: 'update_user',
      targetPath: `users/${uid}`,
      after: {
        role: role || targetUserClaims.role,
        departmentId: departmentId !== undefined ? departmentId : targetUserClaims.departmentId,
        disabled: disabled !== undefined ? disabled : targetUser.disabled,
      },
      at: new Date(),
    };

    // パスワード変更の場合はフラグを追加（パスワード自体はログに残さない）
    if (newPassword && newPassword.trim()) {
      auditLogData.after.passwordChanged = true;
    }

    await companyRef.collection('auditLogs').add(auditLogData);

    let message = 'ユーザー情報を更新しました。';
    if (newPassword && newPassword.trim()) {
      message += ' パスワードも変更されました。';
    }

    return NextResponse.json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の更新に失敗しました。' },
      { status: 500 }
    );
  }
}
