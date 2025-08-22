import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, setCustomUserClaims } from '@/lib/firebase/admin';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { UserRegistration, RegistrationResponse } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

// 一時パスワード生成関数
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // 必須文字種を含める
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26)); // 大文字
  password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26)); // 小文字
  password += '0123456789'.charAt(Math.floor(Math.random() * 10)); // 数字
  password += '!@#$%^&*'.charAt(Math.floor(Math.random() * 8)); // 記号
  
  // 残りの文字をランダム生成
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // パスワードをシャッフル
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * POST /api/registration/user
 * 既存会社にユーザーを追加（管理者のみ）
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const currentUser = await getSessionUserFromAppRouter(request);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as RegistrationResponse, { status: 401 });
    }

    // 管理者権限チェック
    if (currentUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden - 管理者権限が必要です',
      } as RegistrationResponse, { status: 403 });
    }

    const body: UserRegistration = await request.json();

    // バリデーション
    if (!body.email || !body.displayName || !body.role) {
      return NextResponse.json({
        success: false,
        error: '必要な項目が不足しています。',
      } as RegistrationResponse, { status: 400 });
    }

    // パスワードが提供されていない場合は一時パスワードを生成
    const password = body.password || generateTemporaryPassword();

    // ロールの妥当性チェック
    const validRoles = ['staff', 'manager', 'finance', 'admin'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({
        success: false,
        error: '無効なロールが指定されています。',
      } as RegistrationResponse, { status: 400 });
    }

    // 会社IDの設定（リクエストボディから、なければ現在のユーザーの会社ID）
    const companyId = body.companyId || currentUser.companyId;

    // 会社の存在確認
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    
    if (!companyDoc.exists) {
      return NextResponse.json({
        success: false,
        error: '指定された会社が見つかりません。',
      } as RegistrationResponse, { status: 404 });
    }

    // 部門の存在確認（指定されている場合）
    if (body.departmentId) {
      const deptRef = companyRef.collection('departments').doc(body.departmentId);
      const deptDoc = await deptRef.get();
      
      if (!deptDoc.exists) {
        return NextResponse.json({
          success: false,
          error: '指定された部門が見つかりません。',
        } as RegistrationResponse, { status: 404 });
      }
    }

    // Firebase Auth でユーザー作成
    let newUser;
    try {
      newUser = await adminAuth.createUser({
        email: body.email,
        password: password,
        displayName: body.displayName,
        emailVerified: false, // 新規ユーザーはメール確認が必要
      });
    } catch (error: any) {
      console.error('Firebase Auth user creation error:', error);
      
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({
          success: false,
          error: '指定されたメールアドレスは既に使用されています。',
        } as RegistrationResponse, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'ユーザー作成に失敗しました。',
      } as RegistrationResponse, { status: 500 });
    }

    try {
      const batch = adminDb.batch();

      // ユーザープロファイル作成
      const userRef = companyRef.collection('users').doc(newUser.uid);
      batch.set(userRef, {
        email: newUser.email,
        displayName: body.displayName,
        role: body.role,
        companyId: companyId,
        departmentId: body.departmentId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 監査ログ作成
      const auditLogRef = companyRef.collection('auditLogs').doc();
      batch.set(auditLogRef, {
        actorId: currentUser.uid,
        action: 'user_created',
        targetPath: `companies/${companyId}/users/${newUser.uid}`,
        after: {
          userId: newUser.uid,
          email: newUser.email,
          displayName: body.displayName,
          role: body.role,
          departmentId: body.departmentId,
        },
        at: Timestamp.now(),
      });

      // バッチ書き込み実行
      await batch.commit();

      // カスタムクレーム設定
      const claims: Record<string, any> = {
        role: body.role,
        companyId: companyId,
      };
      
      if (body.departmentId) {
        claims.departmentId = body.departmentId;
      }

      const success = await setCustomUserClaims(newUser.uid, claims);

      if (!success) {
        console.warn('Failed to set custom claims for user:', newUser.uid);
      }

      // メール確認送信（オプション）
      try {
        await adminAuth.generateEmailVerificationLink(body.email);
      } catch (emailError) {
        console.warn('Failed to send email verification:', emailError);
        // メール送信失敗は致命的エラーではない
      }

      return NextResponse.json({
        success: true,
        companyId: companyId,
        userId: newUser.uid,
        message: 'ユーザーが正常に作成されました。',
        temporaryPassword: body.password ? undefined : password, // 一時パスワードが生成された場合のみ返す
      } as RegistrationResponse);

    } catch (firestoreError) {
      // Firestore作成に失敗した場合、作成したユーザーを削除
      console.error('Firestore creation error:', firestoreError);
      
      try {
        await adminAuth.deleteUser(newUser.uid);
      } catch (deleteError) {
        console.error('Failed to cleanup user after Firestore error:', deleteError);
      }
      
      return NextResponse.json({
        success: false,
        error: 'データベースへの保存に失敗しました。',
      } as RegistrationResponse, { status: 500 });
    }

  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'ユーザー作成中にエラーが発生しました。',
    } as RegistrationResponse, { status: 500 });
  }
}
