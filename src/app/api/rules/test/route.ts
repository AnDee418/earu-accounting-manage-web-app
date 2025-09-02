/**
 * ルール検証テストAPI
 * サンプルデータを使用してルール検証機能をテスト
 */

import { NextRequest, NextResponse } from 'next/server';
import { ComprehensiveRuleValidationEngine } from '../../../../lib/validation/rule-engine';
import {
  ComprehensiveRuleSet,
  AccountAssignmentRule,
  TaxAssignmentRule,
  DepartmentCashMapping,
  DataFormatSettings,
  DEFAULT_DATA_FORMAT_SETTINGS,
  DEFAULT_DEPARTMENT_MAPPINGS,
} from '../../../../types/rules';

const validationEngine = new ComprehensiveRuleValidationEngine();

/**
 * GET /api/rules/test
 * サンプルルールセットを使用した検証テスト
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'valid';

    let testRuleSet: ComprehensiveRuleSet;

    switch (testType) {
      case 'valid':
        testRuleSet = createValidRuleSet();
        break;
      case 'invalid':
        testRuleSet = createInvalidRuleSet();
        break;
      case 'conflicting':
        testRuleSet = createConflictingRuleSet();
        break;
      default:
        return NextResponse.json(
          { error: '無効なテストタイプです。valid, invalid, conflicting のいずれかを指定してください。' },
          { status: 400 }
        );
    }

    // 包括的検証を実行
    const report = await validationEngine.generateComprehensiveValidationReport(testRuleSet);

    return NextResponse.json({
      success: true,
      testType,
      ruleSet: {
        id: testRuleSet.id,
        version: testRuleSet.version,
        statistics: testRuleSet.statistics,
      },
      validationReport: report,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('テスト実行エラー:', error);
    return NextResponse.json(
      { 
        error: 'テスト実行中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules/test/custom
 * カスタムルールセットでのテスト
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleSet, testName = 'カスタムテスト' } = body;

    if (!ruleSet) {
      return NextResponse.json(
        { error: 'ルールセットが指定されていません' },
        { status: 400 }
      );
    }

    const rules = ruleSet as ComprehensiveRuleSet;

    // 各種検証を実行
    const consistencyResult = await validationEngine.validateRuleConsistency(rules);
    const complianceResult = await validationEngine.validatePCACompliance(rules);
    const conflictResults = await validationEngine.detectRuleConflicts(rules);
    const comprehensiveReport = await validationEngine.generateComprehensiveValidationReport(rules);

    return NextResponse.json({
      success: true,
      testName,
      results: {
        consistency: consistencyResult,
        compliance: complianceResult,
        conflicts: conflictResults,
        comprehensive: comprehensiveReport,
      },
      summary: {
        overallStatus: comprehensiveReport.overallStatus,
        totalRules: comprehensiveReport.summary.totalRules,
        validRules: comprehensiveReport.summary.validRules,
        invalidRules: comprehensiveReport.summary.invalidRules,
        warningRules: comprehensiveReport.summary.warningRules,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('カスタムテスト実行エラー:', error);
    return NextResponse.json(
      { 
        error: 'カスタムテスト実行中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 有効なルールセットを作成
 */
function createValidRuleSet(): ComprehensiveRuleSet {
  return {
    id: 'test-valid-ruleset',
    accountAssignmentRules: [
      {
        id: 'travel-rule',
        name: '旅費交通費ルール',
        conditions: {
          categories: ['travel', 'transportation'],
        },
        assignment: {
          debitAccountCode: '726',
          creditAccountCode: '111',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
      {
        id: 'welfare-rule',
        name: '福利厚生費ルール',
        conditions: {
          categories: ['welfare'],
        },
        assignment: {
          debitAccountCode: '724',
          creditAccountCode: '111',
        },
        priority: 2,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
    ] as AccountAssignmentRule[],
    taxAssignmentRules: [
      {
        id: 'tax-10-invoice',
        name: '10%税率（インボイス対応）',
        conditions: {
          taxRate: 0.10,
          invoiceCompliant: true,
        },
        assignment: {
          debitTaxCode: 'Q5',
          creditTaxCode: '00',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
    ] as TaxAssignmentRule[],
    departmentCashMappings: DEFAULT_DEPARTMENT_MAPPINGS.map((mapping, index) => ({
      ...mapping,
      id: `test-dept-mapping-${index + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-system',
    })) as DepartmentCashMapping[],
    formatSettings: {
      ...DEFAULT_DATA_FORMAT_SETTINGS,
      id: 'test-format-settings',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-system',
    } as DataFormatSettings,
    version: '1.0.0',
    lastValidated: new Date(),
    validationStatus: 'valid',
    validationErrors: [],
    statistics: {
      totalRules: 8,
      activeRules: 8,
      lastApplied: new Date(),
      successRate: 1.0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 無効なルールセットを作成
 */
function createInvalidRuleSet(): ComprehensiveRuleSet {
  return {
    id: 'test-invalid-ruleset',
    accountAssignmentRules: [
      {
        id: 'invalid-account-rule',
        name: '', // 無効：空の名前
        conditions: {},
        assignment: {
          debitAccountCode: 'ABC', // 無効：不正なフォーマット
          creditAccountCode: '112', // 無効：現金以外
        },
        priority: 0, // 無効：範囲外
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
    ] as AccountAssignmentRule[],
    taxAssignmentRules: [
      {
        id: 'invalid-tax-rule',
        name: '無効な税区分ルール',
        conditions: {},
        assignment: {
          debitTaxCode: 'XX', // 無効：存在しない税区分
          creditTaxCode: 'YY', // 無効：存在しない税区分
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
    ] as TaxAssignmentRule[],
    departmentCashMappings: [],
    formatSettings: {
      id: 'invalid-format-settings',
      dateFormat: 'DD/MM/YYYY', // 無効：PCA非準拠
      descriptionTemplate: '{merchant}', // 無効：不完全
      fixedValues: {
        programClassification: '1', // 無効：PCA非準拠
        taxAmountHandling: 'calculated', // 無効：PCA非準拠
        amountType: 'tax_exclusive', // 無効：PCA非準拠
      },
      validation: {
        requiredFields: [],
        maxAmountDigits: 10,
        allowedCurrencies: ['JPY'],
      },
      isActive: true,
      effectiveFrom: new Date('2024-01-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-system',
    } as DataFormatSettings,
    version: '1.0.0',
    lastValidated: new Date(),
    validationStatus: 'invalid',
    validationErrors: [],
    statistics: {
      totalRules: 3,
      activeRules: 3,
      lastApplied: new Date(),
      successRate: 0.0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 競合するルールセットを作成
 */
function createConflictingRuleSet(): ComprehensiveRuleSet {
  return {
    id: 'test-conflicting-ruleset',
    accountAssignmentRules: [
      {
        id: 'rule-1',
        name: 'ルール1',
        conditions: {
          categories: ['travel'],
        },
        assignment: {
          debitAccountCode: '726',
          creditAccountCode: '111',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
      {
        id: 'rule-2',
        name: 'ルール2（競合）',
        conditions: {
          categories: ['travel'], // 同じカテゴリ
        },
        assignment: {
          debitAccountCode: '727', // 異なる勘定科目
          creditAccountCode: '111',
        },
        priority: 1, // 同じ優先度
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
    ] as AccountAssignmentRule[],
    taxAssignmentRules: [],
    departmentCashMappings: [
      {
        id: 'dept-1',
        departmentCode: '1',
        departmentName: '札幌支店',
        cashAuxiliaryCode: '001',
        cashAuxiliaryName: '札幌支店',
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
      {
        id: 'dept-2',
        departmentCode: '1', // 重複する部門コード
        departmentName: '札幌支店（重複）',
        cashAuxiliaryCode: '002',
        cashAuxiliaryName: '仙台事業所',
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-system',
      },
    ] as DepartmentCashMapping[],
    formatSettings: {
      ...DEFAULT_DATA_FORMAT_SETTINGS,
      id: 'test-format-settings',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-system',
    } as DataFormatSettings,
    version: '1.0.0',
    lastValidated: new Date(),
    validationStatus: 'invalid',
    validationErrors: [],
    statistics: {
      totalRules: 5,
      activeRules: 5,
      lastApplied: new Date(),
      successRate: 0.6,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}