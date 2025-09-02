import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { getRuleFirestoreService } from '@/lib/firebase/rules';
import { ruleValidator } from '@/lib/validation/rules';
import { DepartmentCashMapping } from '@/types/rules';

/**
 * GET /api/rules/department-mapping/[id]
 * 部門・現金補助科目マッピングの個別取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleService = getRuleFirestoreService(user.companyId);
    const mapping = await ruleService.getRuleById<DepartmentCashMapping>('departmentCashMappings', params.id);

    if (!mapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    return NextResponse.json({ mapping });
  } catch (error) {
    console.error('Department cash mapping GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rules/department-mapping/[id]
 * 部門・現金補助科目マッピングの更新
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

    // 既存マッピングの確認
    const existingMapping = await ruleService.getRuleById<DepartmentCashMapping>('departmentCashMappings', params.id);
    if (!existingMapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    // 更新データの構築
    const updateData: Partial<DepartmentCashMapping> = {};
    
    if (body.departmentCode !== undefined) updateData.departmentCode = body.departmentCode;
    if (body.departmentName !== undefined) updateData.departmentName = body.departmentName;
    if (body.cashAuxiliaryCode !== undefined) updateData.cashAuxiliaryCode = body.cashAuxiliaryCode;
    if (body.cashAuxiliaryName !== undefined) updateData.cashAuxiliaryName = body.cashAuxiliaryName;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.effectiveFrom !== undefined) updateData.effectiveFrom = new Date(body.effectiveFrom);
    if (body.effectiveTo !== undefined) updateData.effectiveTo = body.effectiveTo ? new Date(body.effectiveTo) : undefined;

    // 更新後のマッピングデータを構築してバリデーション
    const updatedMapping: DepartmentCashMapping = {
      ...existingMapping,
      ...updateData,
    };

    const validationResult = ruleValidator.validateDepartmentCashMapping(updatedMapping);
    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors,
        warnings: validationResult.warnings,
      }, { status: 400 });
    }

    // 重複チェック（部門コードが変更される場合）
    if (updateData.departmentCode && updateData.departmentCode !== existingMapping.departmentCode) {
      const allMappings = await ruleService.getDepartmentCashMappings();
      const duplicateMapping = allMappings.find(m => 
        m.id !== params.id && 
        m.departmentCode === updateData.departmentCode && 
        m.isActive
      );
      
      if (duplicateMapping) {
        return NextResponse.json({
          error: 'Duplicate department code',
          message: `部門コード ${updateData.departmentCode} は既に使用されています`,
        }, { status: 409 });
      }
    }

    // マッピング更新
    await ruleService.updateDepartmentCashMapping(params.id, updateData);

    return NextResponse.json({
      success: true,
      message: '部門・現金補助科目マッピングを更新しました',
      warnings: validationResult.warnings,
    });
  } catch (error) {
    console.error('Department cash mapping update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rules/department-mapping/[id]
 * 部門・現金補助科目マッピングの削除
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

    // 既存マッピングの確認
    const existingMapping = await ruleService.getRuleById<DepartmentCashMapping>('departmentCashMappings', params.id);
    if (!existingMapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    // マッピング削除
    await ruleService.deleteDepartmentCashMapping(params.id);

    return NextResponse.json({
      success: true,
      message: '部門・現金補助科目マッピングを削除しました',
    });
  } catch (error) {
    console.error('Department cash mapping deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}