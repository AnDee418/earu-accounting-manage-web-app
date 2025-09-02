import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { getRuleFirestoreService } from '@/lib/firebase/rules';
import { ruleValidator } from '@/lib/validation/rules';
import { TaxAssignmentRule, RuleFilters } from '@/types/rules';

/**
 * GET /api/rules/tax-assignment
 * 税区分判定ルールの一覧取得
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
    const filters: RuleFilters = {
      isActive: searchParams.get('isActive') !== 'false',
      effectiveDate: searchParams.get('effectiveDate') ? new Date(searchParams.get('effectiveDate')!) : undefined,
      search: searchParams.get('search') || undefined,
    };

    const ruleService = getRuleFirestoreService(user.companyId);
    const rules = await ruleService.getTaxAssignmentRules(filters);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Tax assignment rules GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules/tax-assignment
 * 税区分判定ルールの作成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 権限チェック（finance または admin のみ）
    if (!['finance', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    
    // ルールデータの構築
    const ruleData: Omit<TaxAssignmentRule, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      description: body.description,
      conditions: body.conditions || {},
      assignment: body.assignment,
      priority: body.priority,
      isActive: body.isActive !== false,
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined,
      createdBy: user.uid,
    };

    // バリデーション
    const validationResult = ruleValidator.validateTaxAssignmentRule(ruleData as TaxAssignmentRule);
    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors,
        warnings: validationResult.warnings,
      }, { status: 400 });
    }

    // 競合チェック
    const ruleService = getRuleFirestoreService(user.companyId);
    const existingRules = await ruleService.getTaxAssignmentRules();
    const conflictResult = ruleValidator.checkRuleConflicts(ruleData as TaxAssignmentRule, existingRules);
    
    if (conflictResult.hasConflicts) {
      const highSeverityConflicts = conflictResult.conflicts.filter(c => c.severity === 'high');
      if (highSeverityConflicts.length > 0) {
        return NextResponse.json({
          error: 'Rule conflicts detected',
          conflicts: conflictResult.conflicts,
        }, { status: 409 });
      }
    }

    // ルール作成
    const ruleId = await ruleService.createTaxAssignmentRule(ruleData);

    return NextResponse.json({
      success: true,
      ruleId,
      message: '税区分判定ルールを作成しました',
      warnings: validationResult.warnings,
      conflicts: conflictResult.conflicts.filter(c => c.severity !== 'high'),
    }, { status: 201 });
  } catch (error) {
    console.error('Tax assignment rule creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}