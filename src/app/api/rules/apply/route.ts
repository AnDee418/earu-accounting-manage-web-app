/**
 * ルール適用API
 * 要件1.3, 1.5, 2.3, 3.3, 4.1, 4.2, 4.3に対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { ruleApplicationEngine } from '@/lib/rules/rule-application-engine';
import { 
  getAccountAssignmentRules,
  getTaxAssignmentRules,
  getDepartmentCashMappings,
  getDataFormatSettings,
} from '@/lib/firebase/rules';
import { ProcessingReceiptData, AccountAssignment } from '@/types/rules';
import { UserProfile } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptData, companyId, userProfile } = body as {
      receiptData: ProcessingReceiptData;
      companyId: string;
      userProfile?: UserProfile;
    };

    // 入力検証
    if (!receiptData || !companyId) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // 各種ルールを取得
    const [
      accountRules,
      taxRules,
      departmentMappings,
      formatSettings,
    ] = await Promise.all([
      getAccountAssignmentRules(companyId),
      getTaxAssignmentRules(companyId),
      getDepartmentCashMappings(companyId),
      getDataFormatSettings(companyId),
    ]);

    // ルール適用エンジンで処理
    const processedReceipt = await ruleApplicationEngine.processReceipt(
      receiptData,
      accountRules,
      taxRules,
      departmentMappings,
      formatSettings,
      userProfile
    );

    return NextResponse.json({
      success: true,
      data: processedReceipt,
    });

  } catch (error) {
    console.error('ルール適用エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'ルール適用中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 個別ルール適用API（テスト用）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      receiptData, 
      companyId, 
      ruleType, 
      userProfile,
      accountAssignment,
    } = body as {
      receiptData: ProcessingReceiptData;
      companyId: string;
      ruleType: 'account' | 'tax' | 'department' | 'format';
      userProfile?: UserProfile;
      accountAssignment?: AccountAssignment;
    };

    // 入力検証
    if (!receiptData || !companyId || !ruleType) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    let result: unknown;

    switch (ruleType) {
      case 'account': {
        const accountRules = await getAccountAssignmentRules(companyId);
        result = await ruleApplicationEngine.applyAccountRules(receiptData, accountRules);
        break;
      }

      case 'tax': {
        if (!accountAssignment) {
          return NextResponse.json(
            { error: '税区分適用には勘定科目情報が必要です' },
            { status: 400 }
          );
        }
        const taxRules = await getTaxAssignmentRules(companyId);
        result = await ruleApplicationEngine.applyTaxRules(receiptData, accountAssignment, taxRules);
        break;
      }

      case 'department': {
        const departmentMappings = await getDepartmentCashMappings(companyId);
        result = await ruleApplicationEngine.applyDepartmentRules(
          receiptData.userId,
          receiptData,
          departmentMappings,
          userProfile
        );
        break;
      }

      case 'format': {
        const formatSettings = await getDataFormatSettings(companyId);
        result = ruleApplicationEngine.generateDescription(receiptData, formatSettings);
        break;
      }

      default:
        return NextResponse.json(
          { error: '無効なルールタイプです' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('個別ルール適用エラー:', error);
    
    return NextResponse.json(
      { 
        error: '個別ルール適用中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}