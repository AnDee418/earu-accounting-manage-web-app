import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { getRuleFirestoreService } from '@/lib/firebase/rules';
import { ruleValidator } from '@/lib/validation/rules';
import { DepartmentCashMapping } from '@/types/rules';

/**
 * GET /api/rules/department-mapping
 * 部門・現金補助科目マッピングの一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleService = getRuleFirestoreService(user.companyId);
    const mappings = await ruleService.getDepartmentCashMappings();

    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('Department cash mappings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules/department-mapping
 * 部門・現金補助科目マッピングの作成
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
    
    // マッピングデータの構築
    const mappingData: Omit<DepartmentCashMapping, 'id' | 'createdAt' | 'updatedAt'> = {
      departmentCode: body.departmentCode,
      departmentName: body.departmentName,
      cashAuxiliaryCode: body.cashAuxiliaryCode,
      cashAuxiliaryName: body.cashAuxiliaryName,
      isActive: body.isActive !== false,
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined,
      createdBy: user.uid,
    };

    // バリデーション
    const validationResult = ruleValidator.validateDepartmentCashMapping(mappingData as DepartmentCashMapping);
    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors,
        warnings: validationResult.warnings,
      }, { status: 400 });
    }

    // 重複チェック（同じ部門コードが既に存在するか）
    const ruleService = getRuleFirestoreService(user.companyId);
    const existingMappings = await ruleService.getDepartmentCashMappings();
    const duplicateMapping = existingMappings.find(m => 
      m.departmentCode === mappingData.departmentCode && m.isActive
    );
    
    if (duplicateMapping) {
      return NextResponse.json({
        error: 'Duplicate department code',
        message: `部門コード ${mappingData.departmentCode} は既に使用されています`,
      }, { status: 409 });
    }

    // マッピング作成
    const mappingId = await ruleService.createDepartmentCashMapping(mappingData);

    return NextResponse.json({
      success: true,
      mappingId,
      message: '部門・現金補助科目マッピングを作成しました',
      warnings: validationResult.warnings,
    }, { status: 201 });
  } catch (error) {
    console.error('Department cash mapping creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}