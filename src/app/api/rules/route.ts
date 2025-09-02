import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { getRuleFirestoreService } from '@/lib/firebase/rules';
import { ruleValidator } from '@/lib/validation/rules';
import { RuleFilters, ComprehensiveRuleSet } from '@/types/rules';

/**
 * GET /api/rules
 * 全ルールタイプの一覧取得（包括的ルールセット）
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const ruleType = searchParams.get('type');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const effectiveDate = searchParams.get('effectiveDate') ? new Date(searchParams.get('effectiveDate')!) : undefined;

    const filters: RuleFilters = {
      isActive: !includeInactive,
      effectiveDate,
    };

    const ruleService = getRuleFirestoreService(user.companyId);

    // 特定のルールタイプのみ取得する場合
    if (ruleType) {
      switch (ruleType) {
        case 'account-assignment':
          const accountRules = await ruleService.getAccountAssignmentRules(filters);
          return NextResponse.json({ accountAssignmentRules: accountRules });

        case 'tax-assignment':
          const taxRules = await ruleService.getTaxAssignmentRules(filters);
          return NextResponse.json({ taxAssignmentRules: taxRules });

        case 'department-mapping':
          const departmentMappings = await ruleService.getDepartmentCashMappings();
          return NextResponse.json({ departmentCashMappings: departmentMappings });

        case 'data-format':
          const formatSettings = await ruleService.getDataFormatSettings();
          return NextResponse.json({ dataFormatSettings: formatSettings });

        default:
          return NextResponse.json({
            error: 'Invalid rule type',
            message: 'サポートされていないルールタイプです',
          }, { status: 400 });
      }
    }

    // 全ルールタイプを取得
    const [
      accountAssignmentRules,
      taxAssignmentRules,
      departmentCashMappings,
      formatSettings
    ] = await Promise.all([
      ruleService.getAccountAssignmentRules(filters),
      ruleService.getTaxAssignmentRules(filters),
      ruleService.getDepartmentCashMappings(),
      ruleService.getDataFormatSettings()
    ]);

    // 統計情報の計算
    const totalRules = accountAssignmentRules.length + taxAssignmentRules.length + departmentCashMappings.length + (formatSettings ? 1 : 0);
    const activeRules = [
      ...accountAssignmentRules.filter(r => r.isActive),
      ...taxAssignmentRules.filter(r => r.isActive),
      ...departmentCashMappings.filter(r => r.isActive),
      ...(formatSettings?.isActive ? [formatSettings] : [])
    ].length;

    // 包括的ルールセットの構築
    const comprehensiveRuleSet: Partial<ComprehensiveRuleSet> = {
      accountAssignmentRules,
      taxAssignmentRules,
      departmentCashMappings,
      formatSettings: formatSettings || undefined,
      version: '1.0.0', // バージョン管理は今後実装
      lastValidated: new Date(),
      validationStatus: 'valid', // 実際の検証は別途実行
      validationErrors: [],
      statistics: {
        totalRules,
        activeRules,
        lastApplied: new Date(), // 実際の適用履歴は今後実装
        successRate: 1.0, // 実際の成功率は今後実装
      },
    };

    // 簡易検証の実行
    try {
      const complianceResult = ruleValidator.validatePCACompliance(comprehensiveRuleSet);
      comprehensiveRuleSet.validationStatus = complianceResult.isCompliant ? 'valid' : 'invalid';
      comprehensiveRuleSet.validationErrors = complianceResult.violations.map(v => ({
        code: v.code,
        message: v.description,
        field: v.field,
        severity: v.severity,
      }));
    } catch (validationError) {
      console.warn('Rule validation failed:', validationError);
      comprehensiveRuleSet.validationStatus = 'warning';
    }

    return NextResponse.json({
      ruleSet: comprehensiveRuleSet,
      summary: {
        totalRules,
        activeRules,
        ruleTypes: {
          accountAssignment: accountAssignmentRules.length,
          taxAssignment: taxAssignmentRules.length,
          departmentMapping: departmentCashMappings.length,
          dataFormat: formatSettings ? 1 : 0,
        },
        validationStatus: comprehensiveRuleSet.validationStatus,
      },
    });
  } catch (error) {
    console.error('Rules overview GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules/search
 * ルール検索
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchTerm, ruleTypes, filters } = body;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({
        error: 'Invalid search term',
        message: '検索キーワードは2文字以上で入力してください',
      }, { status: 400 });
    }

    const ruleService = getRuleFirestoreService(user.companyId);
    const results = await ruleService.searchRules(searchTerm.trim(), ruleTypes);

    // フィルターの適用
    let filteredResults = results;
    if (filters?.isActive !== undefined) {
      filteredResults = filteredResults.filter(r => r.isActive === filters.isActive);
    }
    if (filters?.effectiveDate) {
      const effectiveDate = new Date(filters.effectiveDate);
      filteredResults = filteredResults.filter(r => 
        r.effectiveFrom <= effectiveDate && 
        (!r.effectiveTo || r.effectiveTo >= effectiveDate)
      );
    }

    // 結果の分類
    const categorizedResults = {
      accountAssignmentRules: filteredResults.filter(r => r.collectionType === 'accountAssignmentRules'),
      taxAssignmentRules: filteredResults.filter(r => r.collectionType === 'taxAssignmentRules'),
      departmentCashMappings: filteredResults.filter(r => r.collectionType === 'departmentCashMappings'),
    };

    return NextResponse.json({
      searchTerm,
      totalResults: filteredResults.length,
      results: categorizedResults,
      summary: {
        accountAssignment: categorizedResults.accountAssignmentRules.length,
        taxAssignment: categorizedResults.taxAssignmentRules.length,
        departmentMapping: categorizedResults.departmentCashMappings.length,
      },
    });
  } catch (error) {
    console.error('Rule search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}