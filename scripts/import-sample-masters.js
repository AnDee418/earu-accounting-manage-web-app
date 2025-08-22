/**
 * マスターデータのサンプルインポートスクリプト
 * 
 * 使用方法:
 * node scripts/import-sample-masters.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const xlsx = require('xlsx');

// Firebase Admin SDK の初期化
if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(__dirname, '../firebase-service-account.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Firebase service account file not found.');
    console.log('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const COMPANY_ID = 'ACME'; // テスト用の会社ID

/**
 * CSVファイルを読み込んでパース
 */
function parseCSV(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // Shift-JISからUTF-8に変換
  const text = iconv.decode(buffer, 'Shift_JIS');
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  
  // バージョン情報行をスキップ
  let startIndex = 0;
  if (lines[0].includes('text version')) {
    startIndex = 1;
  }
  
  // ヘッダー行を取得
  const headers = lines[startIndex].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  // データ行をパース
  for (let i = startIndex + 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      data.push(record);
    }
  }
  
  return data;
}

/**
 * Excelファイルを読み込んでパース
 */
function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet, { raw: false });
}

/**
 * 勘定科目をインポート
 */
async function importAccounts() {
  console.log('勘定科目をインポート中...');
  const filePath = path.join(__dirname, '../docs/format/勘定科目コード一覧.csv');
  const data = parseCSV(filePath);
  
  const batch = db.batch();
  const companyRef = db.collection('companies').doc(COMPANY_ID);
  let count = 0;
  
  for (const row of data) {
    const pcaCode = row['勘定科目コード'];
    if (!pcaCode || pcaCode === '勘定科目コード') continue;
    
    const account = {
      pcaCode: pcaCode,
      name: row['勘定科目名'] || '',
      taxCode: row['借方税区分コード'] || '00',
      isActive: true,
      effectiveFrom: admin.firestore.Timestamp.now(),
      subAccounts: []
    };
    
    const docRef = companyRef.collection('accounts').doc(pcaCode);
    batch.set(docRef, account, { merge: true });
    count++;
  }
  
  await batch.commit();
  console.log(`  ${count}件の勘定科目をインポートしました`);
}

/**
 * 補助科目をインポート
 */
async function importSubAccounts() {
  console.log('補助科目をインポート中...');
  const filePath = path.join(__dirname, '../docs/format/補助科目コード一覧.csv');
  const data = parseCSV(filePath);
  
  const companyRef = db.collection('companies').doc(COMPANY_ID);
  
  // 勘定科目ごとにグループ化
  const subAccountsByAccount = {};
  
  for (const row of data) {
    const accountCode = row['勘定科目コード'];
    const subCode = row['補助科目コード'];
    if (!accountCode || !subCode || accountCode === '勘定科目コード') continue;
    
    const subAccount = {
      pcaSubCode: subCode,
      name: row['補助科目名'] || '',
      shortName: row['略称'] || '',
      taxCode: row['借方税区分コード'] || '',
      isActive: true
    };
    
    if (!subAccountsByAccount[accountCode]) {
      subAccountsByAccount[accountCode] = [];
    }
    subAccountsByAccount[accountCode].push(subAccount);
  }
  
  // バッチ更新
  const batch = db.batch();
  let count = 0;
  
  for (const [accountCode, subAccounts] of Object.entries(subAccountsByAccount)) {
    const accountRef = companyRef.collection('accounts').doc(accountCode);
    const accountDoc = await accountRef.get();
    
    if (accountDoc.exists) {
      batch.update(accountRef, { subAccounts });
      count += subAccounts.length;
    } else {
      console.warn(`  勘定科目 ${accountCode} が見つかりません`);
    }
  }
  
  await batch.commit();
  console.log(`  ${count}件の補助科目をインポートしました`);
}

/**
 * 部門をインポート
 */
async function importDepartments() {
  console.log('部門をインポート中...');
  const filePath = path.join(__dirname, '../docs/format/部門コード一覧.csv');
  const data = parseCSV(filePath);
  
  const batch = db.batch();
  const companyRef = db.collection('companies').doc(COMPANY_ID);
  let count = 0;
  
  for (const row of data) {
    const deptCode = row['部門コード'];
    if (!deptCode || deptCode === '部門コード') continue;
    
    const department = {
      pcaDeptCode: deptCode,
      name: row['部門名'] || '',
      isActive: true,
      effectiveFrom: admin.firestore.Timestamp.now()
    };
    
    const docRef = companyRef.collection('departments').doc(deptCode);
    batch.set(docRef, department, { merge: true });
    count++;
  }
  
  await batch.commit();
  console.log(`  ${count}件の部門をインポートしました`);
}

/**
 * 税区分をインポート（Excelファイルの場合）
 */
async function importTaxes() {
  console.log('税区分をインポート中...');
  const filePath = path.join(__dirname, '../docs/format/税区分コード一覧.xlsx');
  
  // Excelファイルを読み込み
  const data = parseExcel(filePath);
  
  const batch = db.batch();
  const companyRef = db.collection('companies').doc(COMPANY_ID);
  let count = 0;
  
  for (const row of data) {
    const taxCode = row['コード'] || row['税区分コード'];
    if (!taxCode || taxCode === 'コード') continue;
    
    // 税率を計算
    let rate = 0;
    const rateStr = (row['税率'] || '0').toString();
    const rateValue = rateStr.replace('%', '').replace('％', '');
    rate = parseFloat(rateValue) / 100;
    
    // 税区分名から計算方法を推定
    const taxName = row['名称'] || row['税区分名'] || '';
    const method = taxName.includes('内税') ? 'inclusive' : 'exclusive';
    
    const tax = {
      pcaTaxCode: taxCode.toString(),
      rate: isNaN(rate) ? 0 : rate,
      rounding: 'floor',
      method: method,
      isActive: true,
      effectiveFrom: admin.firestore.Timestamp.now()
    };
    
    const docRef = companyRef.collection('taxes').doc(taxCode.toString());
    batch.set(docRef, tax, { merge: true });
    count++;
  }
  
  await batch.commit();
  console.log(`  ${count}件の税区分をインポートしました`);
}

/**
 * 会社データを作成（存在しない場合）
 */
async function ensureCompanyExists() {
  const companyRef = db.collection('companies').doc(COMPANY_ID);
  const companyDoc = await companyRef.get();
  
  if (!companyDoc.exists) {
    console.log('会社データを作成中...');
    await companyRef.set({
      name: 'ACME Corporation',
      createdAt: admin.firestore.Timestamp.now(),
      isActive: true
    });
    console.log('  会社データを作成しました');
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('=== マスターデータのインポートを開始 ===\n');
    
    // 会社データの確認・作成
    await ensureCompanyExists();
    
    // 各マスターデータをインポート
    await importAccounts();
    await importSubAccounts();
    await importDepartments();
    await importTaxes();
    
    console.log('\n=== インポート完了 ===');
    process.exit(0);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();