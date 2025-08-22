import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { Account, SubAccount, Tax, Department } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';
import Encoding from 'encoding-japanese';

/**
 * POST /api/masters/import
 * マスタデータのCSVインポート
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    if (user.role !== 'admin' && user.role !== 'finance') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // フォームデータを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['accounts', 'subAccounts', 'departments', 'taxes'].includes(type)) {
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
        // 勘定科目のインポート
        for (const row of data) {
          const pcaCode = row['勘定科目コード'] || row['pcaCode'];
          if (!pcaCode || pcaCode === '勘定科目コード') continue; // ヘッダー行をスキップ

          const account: Partial<Account> = {
            pcaCode: pcaCode.toString(),
            name: row['勘定科目名'] || row['name'] || '',
            taxCode: (row['借方税区分コード'] || row['taxCode'] || '00').toString(),
            isActive: true,
            effectiveFrom: Timestamp.now(),
          };

          // エイリアスがある場合は追加
          if (row['略称'] || row['shortName']) {
            account.aliases = [row['略称'] || row['shortName']];
          }

          const docRef = companyRef.collection('accounts').doc(pcaCode.toString());
          batch.set(docRef, account, { merge: true });
          importedCount++;
        }
        break;

      case 'subAccounts':
        // 補助科目のインポート
        // 勘定科目ごとにグループ化
        const subAccountsByAccount: { [key: string]: SubAccount[] } = {};
        
        for (const row of data) {
          const accountCode = row['勘定科目コード'] || row['accountCode'];
          const subCode = row['補助科目コード'] || row['subCode'];
          if (!accountCode || !subCode || accountCode === '勘定科目コード') continue;

          const subAccount: SubAccount = {
            pcaSubCode: subCode.toString(),
            name: row['補助科目名'] || row['name'] || '',
            shortName: row['略称'] || row['shortName'],
            taxCode: row['借方税区分コード'] || row['taxCode'],
            isActive: true,
          };

          if (!subAccountsByAccount[accountCode]) {
            subAccountsByAccount[accountCode] = [];
          }
          subAccountsByAccount[accountCode].push(subAccount);
        }

        // バッチ更新
        for (const [accountCode, subAccounts] of Object.entries(subAccountsByAccount)) {
          const accountRef = companyRef.collection('accounts').doc(accountCode);
          const accountDoc = await accountRef.get();
          
          if (accountDoc.exists) {
            batch.update(accountRef, { subAccounts });
            importedCount += subAccounts.length;
          } else {
            skippedCount += subAccounts.length;
            console.warn(`勘定科目 ${accountCode} が見つかりません。補助科目をスキップしました。`);
          }
        }
        break;

      case 'departments':
        // 部門のインポート
        for (const row of data) {
          const deptCode = row['部門コード'] || row['deptCode'];
          if (!deptCode || deptCode === '部門コード') continue;

          const department: Partial<Department> = {
            pcaDeptCode: deptCode.toString(),
            name: row['部門名'] || row['name'] || '',
            parentCode: row['親部門コード'] || row['parentCode'],
            isActive: true,
            effectiveFrom: Timestamp.now(),
          };

          // 000は共通部門として特別扱い
          if (deptCode === '000') {
            department.name = department.name || '共通部門';
          }

          const docRef = companyRef.collection('departments').doc(deptCode.toString());
          batch.set(docRef, department, { merge: true });
          importedCount++;
        }
        break;

      case 'taxes':
        // 税区分のインポート
        for (const row of data) {
          const taxCode = row['税区分コード'] || row['コード'] || row['taxCode'];
          if (!taxCode || taxCode === '税区分コード' || taxCode === 'コード') continue;

          // 税率を計算（パーセンテージから小数に変換）
          let rate = 0;
          const rateStr = row['税率'] || row['rate'] || '0';
          const rateValue = rateStr.toString().replace('%', '').replace('％', '');
          rate = parseFloat(rateValue) / 100;

          // 税区分名から計算方法を推定
          const taxName = row['税区分名'] || row['名称'] || '';
          const method = taxName.includes('内税') ? 'inclusive' : 'exclusive';

          const tax: Partial<Tax> = {
            pcaTaxCode: taxCode.toString(),
            rate: isNaN(rate) ? 0 : rate,
            rounding: 'floor', // デフォルト値
            method,
            isActive: true,
            effectiveFrom: Timestamp.now(),
          };

          const docRef = companyRef.collection('taxes').doc(taxCode.toString());
          batch.set(docRef, tax, { merge: true });
          importedCount++;
        }
        break;
    }

    // バッチ書き込みを実行
    await batch.commit();

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