import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { getRuleFirestoreService } from '@/lib/firebase/rules';
import { ruleValidator } from '@/lib/validation/rules';
import { TaxAssignmentRule } from '@/types/rules';

/**
 * GET /api/rules/tax-assignment/[id]
 * 税区分判定ルールの個別取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleService = getRuleFirestoreService(user.companyId);
    const rule = await ruleService.getRuleById<TaxAssignmentRule>('taxAssignmentRules', id);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Tax assignment rule GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rules/tax-assignment/[id]
 * 税区分判定ルールの更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const ruleService = getRuleFirestoreService(user.companyId);

    // 既存ルールの確認
    const existingRule = await ruleService.getRuleById<TaxAssignmentRule>('taxAssignmentRules', params.id);
    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // 更新データの構築
    const updateData: Partial<TaxAssignmentRule> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.conditions !== undefined) updateData.conditions = body.conditions;
    if (body.assignment !== undefined) updateData.assignment = body.assignment;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.effectiveFrom !== undefined) updateData.effectiveFrom = new Date(body.effectiveFrom);
    if (body.effectiveTo !== undefined) updateData.effectiveTo = body.effectiveTo ? new Date(body.effectiveTo) : undefined;

    // 更新後のルールデータを構築してバリデーション
    const updatedRule: TaxAssignmentRule = {
      ...existingRule,
      ...updateData,
    };

    const validationResult = ruleValidator.validateTaxAssignmentRule(updatedRule);
    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors,
        warnings: validationResult.warnings,
      }, { status: 400 });
    }

    // 競合チェック（自分以外のルールと）
    const allRules = await ruleService.getTaxAssignmentRules();
    const otherRules = allRules.filter(r => r.id !== params.id);
    const conflictResult = ruleValidator.checkRuleConflicts(updatedRule, otherRules);
    
    if (conflictResult.hasConflicts) {
      const highSeverityConflicts = conflictResult.conflicts.filter(c => c.severity === 'high');
      if (highSeverityConflicts.length > 0) {
        return NextResponse.json({
          error: 'Rule conflicts detected',
          conflicts: conflictResult.conflicts,
        }, { status: 409 });
      }
    }

    // ルール更新
    await ruleService.updateTaxAssignmentRule(params.id, updateData);

    return NextResponse.json({
      success: true,
      message: '税区分判定ルールを更新しました',
      warnings: validationResult.warnings,
      conflicts: conflictResult.conflicts.filter(c => c.severity !== 'high'),
    });
  } catch (error) {
    console.error('Tax assignment rule update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rules/tax-assignment/[id]
 * 税区分判定ルールの削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ruleService = getRuleFirestoreService(user.companyId);

    // 既存ルールの確認
    const existingRule = await ruleService.getRuleById<TaxAssignmentRule>('taxAssignmentRules', params.id);
    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // ルール削除
    await ruleService.deleteTaxAssignmentRule(params.id);

    return NextResponse.json({
      success: true,
      message: '税区分判定ルールを削除しました',
    });
  } catch (error) {
    console.error('Tax assignment rule deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}