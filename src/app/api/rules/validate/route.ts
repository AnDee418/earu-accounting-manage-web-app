/**
 * ルール検証API
 * 包括的なルール検証機能を提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { ComprehensiveRuleValidationEngine } from '../../../../lib/validation/rule-engine';
import { ComprehensiveRuleSet } from '../../../../types/rules';

const validationEngine = new ComprehensiveRuleValidationEngine();

/**
 * POST /api/rules/validate
 * ルールセットの包括的検証を実行
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleSet, validationType = 'comprehensive' } = body;

    if (!ruleSet) {
      return NextResponse.json(
        { error: 'ルールセットが指定されていません' },
        { status: 400 }
      );
    }

    const rules = ruleSet as ComprehensiveRuleSet;
    let result;

    switch (validationType) {
      case 'consistency':
        result = await validationEngine.validateRuleConsistency(rules);
        break;
      
      case 'compliance':
        result = await validationEngine.validatePCACompliance(rules);
        break;
      
      case 'conflicts':
        result = await validationEngine.detectRuleConflicts(rules);
        break;
      
      case 'comprehensive':
      default:
        result = await validationEngine.generateComprehensiveValidationReport(rules);
        break;
    }

    return NextResponse.json({
      success: true,
      validationType,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('ルール検証エラー:', error);
    return NextResponse.json(
      { 
        error: 'ルール検証中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rules/validate/status
 * 検証エンジンのステータスを取得
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: 'operational',
      availableValidationTypes: [
        'consistency',
        'compliance', 
        'conflicts',
        'comprehensive'
      ],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('ステータス取得エラー:', error);
    return NextResponse.json(
      { 
        error: 'ステータス取得中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}