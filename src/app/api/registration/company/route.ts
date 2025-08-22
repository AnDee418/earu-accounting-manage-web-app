import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, setCustomUserClaims } from '@/lib/firebase/admin';
import { CompanyRegistration, RegistrationResponse } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/registration/company
 * 会社とその管理者アカウントを作成
 */
export async function POST(request: NextRequest) {
  console.log('=== Company Registration API Called ===');
  try {
    // リクエストボディのログ
    const body: CompanyRegistration = await request.json();
    console.log('Request body received:', {
      companyName: body.name,
      adminEmail: body.adminUser?.email,
      hasPassword: !!body.adminUser?.password,
    });

    // バリデーション
    if (!body.name || !body.adminUser?.email || !body.adminUser?.password || !body.adminUser?.displayName) {
      return NextResponse.json({
        success: false,
        error: '必要な項目が不足しています。',
      } as RegistrationResponse, { status: 400 });
    }

    // パスワードの長さチェック
    if (body.adminUser.password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'パスワードは8文字以上である必要があります。',
      } as RegistrationResponse, { status: 400 });
    }

    // 会社IDを生成（会社名の短縮形 + タイムスタンプ）
    const timestamp = Date.now();
    const companyId = `C${timestamp}`;

    const batch = adminDb.batch();

    // 1. Firebase Auth でユーザー作成
    console.log('Creating Firebase Auth user...');
    let adminUser;
    try {
      adminUser = await adminAuth.createUser({
        email: body.adminUser.email,
        password: body.adminUser.password,
        displayName: body.adminUser.displayName,
        emailVerified: true,
      });
      console.log('Firebase Auth user created successfully:', adminUser.uid);
    } catch (error: any) {
      console.error('Firebase Auth user creation error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({
          success: false,
          error: '指定されたメールアドレスは既に使用されています。',
        } as RegistrationResponse, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        error: `ユーザー作成に失敗しました: ${error.message}`,
      } as RegistrationResponse, { status: 500 });
    }

    try {
      // 2. 会社ドキュメント作成
      const companyRef = adminDb.collection('companies').doc(companyId);
      batch.set(companyRef, {
        name: body.name,
        isActive: true,
        createdAt: Timestamp.now(),
        settings: {
          currency: body.settings?.currency || 'JPY',
          locale: body.settings?.locale || 'ja-JP',
          timezone: body.settings?.timezone || 'Asia/Tokyo',
        },
      });

      // 3. 管理者ユーザープロファイル作成
      const userRef = companyRef.collection('users').doc(adminUser.uid);
      batch.set(userRef, {
        email: adminUser.email,
        displayName: body.adminUser.displayName,
        role: 'admin',
        companyId: companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 4. 初期データは作成しない（PCAからのインポートを使用）
      // 注意: マスタデータはPCAからCSVインポートで管理してください

      // 5. 監査ログ作成
      const auditLogRef = companyRef.collection('auditLogs').doc();
      batch.set(auditLogRef, {
        actorId: adminUser.uid,
        action: 'company_created',
        targetPath: `companies/${companyId}`,
        after: {
          companyName: body.name,
          adminUserId: adminUser.uid,
          adminEmail: adminUser.email,
          note: 'マスタデータはPCAからCSVインポートで設定してください',
        },
        at: Timestamp.now(),
      });

      // バッチ書き込み実行
      await batch.commit();

      // 6. カスタムクレーム設定
      const success = await setCustomUserClaims(adminUser.uid, {
        role: 'admin',
        companyId: companyId,
      });

      if (!success) {
        console.warn('Failed to set custom claims for user:', adminUser.uid);
      }

      return NextResponse.json({
        success: true,
        companyId: companyId,
        userId: adminUser.uid,
        message: '会社とアカウントが正常に作成されました。',
      } as RegistrationResponse);

    } catch (firestoreError) {
      // Firestore作成に失敗した場合、作成したユーザーを削除
      console.error('Firestore creation error:', firestoreError);
      
      try {
        await adminAuth.deleteUser(adminUser.uid);
      } catch (deleteError) {
        console.error('Failed to cleanup user after Firestore error:', deleteError);
      }
      
      return NextResponse.json({
        success: false,
        error: 'データベースの初期化に失敗しました。',
      } as RegistrationResponse, { status: 500 });
    }

  } catch (error: any) {
    console.error('Company registration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({
      success: false,
      error: `アカウント作成中にエラーが発生しました: ${error.message}`,
    } as RegistrationResponse, { status: 500 });
  }
}
