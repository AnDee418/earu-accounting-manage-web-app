// テストユーザーのセットアップスクリプト
// 使用方法: node scripts/setup-test-user.js

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Firebase Admin初期化
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

async function setupTestUser() {
  try {
    const email = 'test@example.com'; // 変更してください
    const password = 'test123456'; // 変更してください
    
    // ユーザー作成（既に存在する場合はスキップ）
    let user;
    try {
      user = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: 'テスト経理担当者',
      });
      console.log('ユーザーを作成しました:', user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        user = await admin.auth().getUserByEmail(email);
        console.log('既存のユーザーを使用します:', user.uid);
      } else {
        throw error;
      }
    }

    // Custom Claimsを設定
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'finance', // finance | manager | admin から選択
      companyId: 'ACME', // 会社ID
      departmentId: 'D0101', // 部門ID（オプション）
    });

    console.log('Custom Claimsを設定しました');

    // Firestoreに初期データを作成
    const db = admin.firestore();
    
    // 会社データ
    await db.collection('companies').doc('ACME').set({
      name: 'ACME株式会社',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
    }, { merge: true });

    // テスト用マスタデータ
    await db.collection('companies/ACME/departments').doc('D0101').set({
      name: '営業部',
      isActive: true,
      effectiveFrom: new Date('2024-01-01'),
    });

    await db.collection('companies/ACME/accounts').doc('6001').set({
      name: '旅費交通費',
      taxCode: '課税10',
      isActive: true,
      effectiveFrom: new Date('2024-01-01'),
    });

    await db.collection('companies/ACME/taxes').doc('課税10').set({
      rate: 0.1,
      method: 'exclusive',
      rounding: 'floor',
      isActive: true,
      effectiveFrom: new Date('2024-01-01'),
    });

    await db.collection('companies/ACME/categories').doc('travel').set({
      name: '交通費',
      defaultDebitAccountPcaCode: '6001',
      sortOrder: 1,
    });

    await db.collection('companies/ACME/exportProfiles').doc('pca-standard').set({
      name: 'PCA標準',
      encoding: 'Shift_JIS',
      delimiter: ',',
      dateFormat: 'YYYY/MM/DD',
      mappingJson: {},
    });

    console.log('初期データを作成しました');
    
    console.log('\n========================================');
    console.log('セットアップ完了！');
    console.log('========================================');
    console.log('ログイン情報:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', 'finance (経理)');
    console.log('Company:', 'ACME');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

setupTestUser();