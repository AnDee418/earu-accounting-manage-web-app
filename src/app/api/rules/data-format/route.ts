import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { getRuleFirestoreService } from '@/lib/firebase/rules';
import { ruleValidator } from '@/lib/validation/rules';
import { DataFormatSettings, DEFAULT_DATA_FORMAT_SETTINGS } from '@/types/rules';

/**
 * GET /api/rules/data-format
 * データフォーマット設定の取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleService = getRuleFirestoreService(user.companyId);
    const settings = await ruleService.getDataFormatSettings();

    // 設定が存在しない場合はデフォルト値を返す
    if (!settings) {
      return NextResponse.json({ 
        settings: {
          ...DEFAULT_DATA_FORMAT_SETTINGS,
          id: 'default',
          createdAt: new Date(),
          createdBy: user.uid,
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Data format settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rules/data-format
 * データフォーマット設定の更新
 */
export async function PUT(request: NextRequest) {
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

    // 更新データの構築
    const updateData: Partial<DataFormatSettings> = {};
    
    if (body.dateFormat !== undefined) updateData.dateFormat = body.dateFormat;
    if (body.descriptionTemplate !== undefined) updateData.descriptionTemplate = body.descriptionTemplate;
    if (body.fixedValues !== undefined) updateData.fixedValues = body.fixedValues;
    if (body.validation !== undefined) updateData.validation = body.validation;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.effectiveFrom !== undefined) updateData.effectiveFrom = new Date(body.effectiveFrom);
    if (body.effectiveTo !== undefined) updateData.effectiveTo = body.effectiveTo ? new Date(body.effectiveTo) : undefined;

    // 既存設定を取得してマージ
    const existingSettings = await ruleService.getDataFormatSettings();
    const settingsToValidate: DataFormatSettings = existingSettings 
      ? { ...existingSettings, ...updateData }
      : { 
          ...DEFAULT_DATA_FORMAT_SETTINGS, 
          ...updateData,
          id: 'new',
          createdAt: new Date(),
          createdBy: user.uid,
        } as DataFormatSettings;

    // バリデーション
    const validationResult = ruleValidator.validateDataFormatSettings(settingsToValidate);
    if (!validationResult.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors,
        warnings: validationResult.warnings,
      }, { status: 400 });
    }

    // 設定更新（新規作成の場合も含む）
    if (!existingSettings) {
      updateData.createdBy = user.uid;
    }
    
    await ruleService.updateDataFormatSettings(updateData);

    return NextResponse.json({
      success: true,
      message: 'データフォーマット設定を更新しました',
      warnings: validationResult.warnings,
    });
  } catch (error) {
    console.error('Data format settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules/data-format/reset
 * データフォーマット設定をデフォルトにリセット
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 権限チェック（admin のみ）
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const ruleService = getRuleFirestoreService(user.companyId);

    // デフォルト設定で更新
    const defaultSettings = {
      ...DEFAULT_DATA_FORMAT_SETTINGS,
      createdBy: user.uid,
    };

    await ruleService.updateDataFormatSettings(defaultSettings);

    return NextResponse.json({
      success: true,
      message: 'データフォーマット設定をデフォルトにリセットしました',
      settings: defaultSettings,
    });
  } catch (error) {
    console.error('Data format settings reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}