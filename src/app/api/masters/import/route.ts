import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { Account, SubAccount, Tax, Department } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';
import Encoding from 'encoding-japanese';

// Firestore用にundefined値を除去するユーティリティ関数
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
  }
  return result;
}

/**
 * POST /api/masters/import
 * マスタデータのCSVインポート
 */
export async function POST(request: NextRequest) {
  console.log('=== Masters Import API Called ===');
  try {
    // 認証チェック
    console.log('Checking authentication...');
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      console.log('Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User authenticated:', user.uid, user.role);

    // 管理者権限チェック
    if (user.role !== 'admin' && user.role !== 'finance') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // フォームデータを取得
    console.log('Getting form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    
    console.log('Import request:', { fileName: file?.name, type, fileSize: file?.size });

    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['accounts', 'subAccounts', 'departments', 'taxes'].includes(type)) {
      console.log('Invalid type provided:', type);
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // ファイルの処理
    let data: any[] = [];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Excelファイルの処理
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    } else if (fileName.endsWith('.csv')) {
      // CSVファイルの処理（Shift-JIS対応）
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 文字コードを検出して変換
      const detectedEncoding = Encoding.detect(uint8Array);
      let text: string;
      
      if (detectedEncoding === 'SJIS' || detectedEncoding === 'EUCJP') {
        // Shift-JISまたはEUC-JPの場合、UTF-8に変換
        const converted = Encoding.convert(uint8Array, {
          to: 'UNICODE',
          from: detectedEncoding,
          type: 'string'
        });
        text = converted as string;
      } else {
        // その他の場合はそのまま文字列として扱う
        text = new TextDecoder('utf-8').decode(uint8Array);
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

      // 最初の行がバージョン情報の場合はスキップ
      let startIndex = 0;
      if (lines[0].includes('text version')) {
        startIndex = 1;
      }

      // ヘッダー行を取得
      const headers = parseCSVLine(lines[startIndex]);

      // データ行を解析
      for (let i = startIndex + 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = values[index];
          });
          data.push(record);
        }
      }
    } else {
      return NextResponse.json({ error: 'サポートされていないファイル形式です。CSVまたはExcelファイルを使用してください。' }, { status: 400 });
    }

    const companyRef = adminDb.collection('companies').doc(user.companyId);
    const batch = adminDb.batch();
    let importedCount = 0;
    let skippedCount = 0;

    switch (type) {
      case 'accounts':
        // 勘定科目のインポート（PCA形式）
        console.log('Processing accounts import, data rows:', data.length);
        for (const row of data) {
          const pcaCode = row['勘定科目コード'] || row['pcaCode'];
          if (!pcaCode || pcaCode === '勘定科目コード') continue; // ヘッダー行をスキップ

          try {
            console.log('Processing account:', pcaCode, row['勘定科目名']);

          // 貸借区分の安全な変換
          const balanceTypeValue = parseInt(row['貸借区分'] || '1');
          const balanceType = (balanceTypeValue === 1 || balanceTypeValue === 2) ? balanceTypeValue : 1;

          const account: Partial<Account> = {
            // 基本情報
            pcaCode: pcaCode.toString(),
            attributeCode: row['勘定科目属性'] || undefined,
            name: row['勘定科目名'] || row['name'] || '',
            kanaIndex: row['ｶﾅ索引'] || row['カナ索引'] || undefined,
            fullName: row['勘定科目正式名'] || undefined,
            
            // 貸借区分
            balanceType: balanceType as 1 | 2,
            
            // 税区分設定
            debitTaxCode: (row['借方税区分コード'] || row['taxCode'] || '0').toString(),
            debitTaxName: row['借方税区分名'] || undefined,
            creditTaxCode: (row['貸方税区分コード'] || '0').toString(),
            creditTaxName: row['貸方税区分名'] || undefined,
            
            // 関連科目
            relatedAccountCode: row['関連科目コード'] || undefined,
            relatedAccountName: row['関連科目名'] || undefined,
            
            // 表示・計算設定
            displayType: parseInt(row['表示区分'] || '1'),
            autoTaxCalc: parseInt(row['消費税自動計算'] || '0') as 0 | 9,
            taxRounding: parseInt(row['消費税端数処理'] || '9') as 0 | 9,
            
            // 原価管理
            costType: parseInt(row['固定費変動費区分'] || '0') as 0 | 1 | 2 | 3,
            fixedCostRatio: parseFloat(row['固定費割合'] || '0'),
            
            // 簡易課税
            businessType: parseInt(row['簡易課税業種'] || '1') as 1 | 2 | 3 | 4 | 5 | 6,
            
            // 入力設定
            requiresPartner: (row['取引先入力'] || '').toString() === '1',
            statementSetting: row['内訳書の設定'] || undefined,
            
            // システム情報
            isActive: true,
            effectiveFrom: Timestamp.now(),
          };

          // カナ索引があればエイリアスとして追加
          if (account.kanaIndex) {
            account.aliases = [account.kanaIndex];
          }

            console.log('Account object created:', JSON.stringify(account, null, 2));

            // undefined値を除去してFirestore用にクリーンアップ
            const cleanAccount = removeUndefined(account);
            console.log('Clean account object:', JSON.stringify(cleanAccount, null, 2));

            const docRef = companyRef.collection('accounts').doc(pcaCode.toString());
            batch.set(docRef, cleanAccount, { merge: true });
            importedCount++;
            console.log('Account processed successfully:', pcaCode);
          } catch (error) {
            console.error('Error processing account:', pcaCode, error);
            skippedCount++;
          }
        }
        console.log('Accounts processing completed. Imported:', importedCount, 'Skipped:', skippedCount);
        break;

      case 'subAccounts':
        // 補助科目のインポート（PCA形式：25列完全対応）
        console.log('Processing subAccounts data...');
        
        for (const row of data) {
          const accountCode = row['勘定科目コード'] || row['accountCode'];
          const subCode = row['補助科目コード'] || row['subCode'];
          if (!accountCode || !subCode || accountCode === '勘定科目コード') continue;

          const accountName = row['勘定科目名'] || '';
          const name = row['補助科目名'] || row['name'] || '';
          const kanaIndex = row['ｶﾅ索引'] || row['カナ索引'] || '';
          const fullName = row['補助科目正式名'] || '';
          const fullNameKana = row['正式名ﾌﾘｶﾞﾅ'] || '';

          if (!name || !kanaIndex || !fullName || !fullNameKana) {
            console.log('Skipping sub-account row with missing required data:', { accountCode, subCode, name, kanaIndex });
            skippedCount++;
            continue;
          }

          const subAccount: Partial<SubAccount> = {
            // 基本情報（PCA順序通り）
            accountCode: accountCode.toString(),
            accountName: accountName,
            pcaSubCode: subCode.toString(),
            name: name,
            kanaIndex: kanaIndex,
            fullName: fullName,
            fullNameKana: fullNameKana,

            // 税設定
            debitTaxCode: row['借方税区分コード'] || '',
            debitTaxName: row['借方税区分名'] || '',
            creditTaxCode: row['貸方税区分コード'] || '',
            creditTaxName: row['貸方税区分名'] || '',
            autoTaxCalc: parseInt(row['消費税自動計算'] || '0') || 0,
            taxRounding: parseInt(row['消費税端数処理'] || '9') || 9,

            // 連絡先情報
            postalCode: row['郵便番号'] || undefined,
            address1: row['住所１'] || undefined,
            address2: row['住所２'] || undefined,
            tel: row['TEL'] || undefined,
            fax: row['FAX'] || undefined,

            // 取引条件
            bankInfo: row['振込先'] || '',
            closingDay: parseInt(row['締日']) || 0,
            paymentDay: parseInt(row['支払日']) || 0,

            // 事業者情報
            corporateNumber: row['法人番号'] || undefined,
            businessType: parseInt(row['事業者区分']) || 3,
            invoiceRegistrationNumber: row['適格請求書発行事業者の登録番号'] || undefined,
            digitalInvoiceReceive: parseInt(row['デジタルインボイス受信']) || 0,

            isActive: true,
          };

          // 補助科目を直接保存
          const subAccountRef = companyRef.collection('subAccounts').doc(`${accountCode}-${subCode}`);
          batch.set(subAccountRef, cleanSubAccount, { merge: true });
          importedCount++;
        }
        console.log('SubAccounts processing completed. Imported:', importedCount, 'Skipped:', skippedCount);
        break;

      case 'departments':
        // 部門のインポート（PCA形式）
        console.log('Processing departments import, data rows:', data.length);
        for (const row of data) {
          const deptCode = row['部門コード'] || row['deptCode'];
          if (!deptCode || deptCode === '部門コード') continue;

          try {
            console.log('Processing department:', deptCode, row['部門名']);

            const department: Partial<Department> = {
              pcaDeptCode: deptCode.toString(),
              name: row['部門名'] || row['name'] || '',
              kanaIndex: row['ｶﾅ索引'] || row['カナ索引'],
              businessType: parseInt(row['簡易課税業種']) || undefined,
              parentCode: row['親部門コード'] || row['parentCode'],
              isActive: true,
              effectiveFrom: Timestamp.now(),
            };

            // 0または000は共通部門として特別扱い
            if (deptCode === '0' || deptCode === '000') {
              department.name = department.name || '共通部門';
              department.kanaIndex = department.kanaIndex || 'ｷｮｳﾂｳ';
            }

            console.log('Department object created:', JSON.stringify(department, null, 2));

            const cleanDepartment = removeUndefined(department);
            const docRef = companyRef.collection('departments').doc(deptCode.toString());
            batch.set(docRef, cleanDepartment, { merge: true });
            importedCount++;
            console.log('Department processed successfully:', deptCode);
          } catch (error) {
            console.error('Error processing department:', deptCode, error);
            skippedCount++;
          }
        }
        console.log('Departments processing completed. Imported:', importedCount, 'Skipped:', skippedCount);
        break;

      case 'taxes':
        // 税区分のインポート（PCA形式）
        console.log('Processing taxes data...');
        for (const row of data) {
          const taxCode = row['コード'] || row['税区分コード'] || row['taxCode'];
          if (!taxCode || taxCode === 'コード' || taxCode === '税区分コード') continue;

          const shortName = row['略称'] || row['shortName'] || '';
          const description = row['説明'] || row['description'] || row['名称'] || '';

          if (!shortName || !description) {
            console.log('Skipping tax row with missing data:', { taxCode, shortName, description });
            skippedCount++;
            continue;
          }

          const tax: Partial<Tax> = {
            pcaTaxCode: taxCode.toString(),
            shortName: shortName,
            description: description,
            isActive: true,
            effectiveFrom: Timestamp.now(),
          };

          const cleanTax = removeUndefined(tax);
          const docRef = companyRef.collection('taxes').doc(taxCode.toString());
          batch.set(docRef, cleanTax, { merge: true });
          importedCount++;
        }
        console.log('Taxes processing completed. Imported:', importedCount, 'Skipped:', skippedCount);
        break;
    }

    // バッチ書き込みを実行
    console.log('Committing batch with', importedCount, 'records...');
    await batch.commit();
    console.log('Batch commit successful');

    // 監査ログを記録
    await companyRef.collection('auditLogs').add({
      actorId: user.uid,
      action: `import_${type}`,
      targetPath: `companies/${user.companyId}/${type}`,
      after: { 
        count: importedCount,
        skipped: skippedCount,
        fileName: file.name
      },
      at: Timestamp.now(),
    });

    const message = skippedCount > 0 
      ? `${importedCount}件のデータをインポートしました。${skippedCount}件はスキップされました。`
      : `${importedCount}件のデータをインポートしました。`;

    return NextResponse.json({
      success: true,
      type,
      importedCount,
      skippedCount,
      message,
    });
  } catch (error) {
    console.error('Masters import error:', error);
    return NextResponse.json(
      { error: 'インポート処理中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}



/**
 * CSVの1行をパースする関数
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // 最後のフィールドを追加
  result.push(current.trim());

  return result;
}