/**
 * 包括的ルール検証エンジン
 * 要件7.1, 7.2, 7.3, 7.4に対応
 */

import {
  ComprehensiveRuleSet,
  AccountAssignmentRule,
  TaxAssignmentRule,
  DepartmentCashMapping,
  DataFormatSettings,
  ValidationResult,
  ValidationReport,
  ConflictResult,
  ComplianceResult,
  ValidationError,
  ValidationWarning,
} from '../../types/rules';
import { RuleValidator } from './rules';

/**
 * 包括的ルール検証エンジン
 */
export class ComprehensiveRuleValidationEngine {
  private validator: RuleValidator;
  
  constructor() {
    this.validator = new RuleValidator();
  }
  
  /**
   * ルール整合性チェック機能の実装
   * 要件7.1: ルールの完全性と整合性を検証
   */
  async validateRuleConsistency(rules: ComprehensiveRuleSet): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // 1. 基本的なルール検証
    const basicValidation = this.validator.validateRuleSet(rules);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);
    suggestions.push(...basicValidation.suggestions);
    
    // 2. ルール間の整合性チェック
    await this.validateInterRuleConsistency(rules, errors, warnings, suggestions);
    
    // 3. ビジネスロジックの整合性チェック
    this.validateBusinessLogicConsistency(rules, errors, warnings, suggestions);
    
    // 4. データ完全性チェック
    this.validateDataCompleteness(rules, errors, warnings, suggestions);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * PCA準拠性検証機能の実装
   * 要件7.2: PCA会計ソフトウェアとの互換性を検証
   */
  async validatePCACompliance(rules: ComprehensiveRuleSet): Promise<ComplianceResult> {
    const complianceResult = this.validator.validatePCACompliance(rules);
    
    // 追加のPCA固有検証
    const additionalViolations = await this.performAdvancedPCAValidation(rules);
    complianceResult.violations.push(...additionalViolations);
    
    // 準拠性の再評価
    complianceResult.isCompliant = complianceResult.violations
      .filter(v => v.severity === 'error').length === 0;
    
    return complianceResult;
  }
  
  /**
   * ルール競合検出機能の実装
   * 要件7.3: ルール間の競合を検出し報告
   */
  async detectRuleConflicts(rules: ComprehensiveRuleSet): Promise<ConflictResult[]> {
    const conflictResults: ConflictResult[] = [];
    
    // 勘定科目割り当てルールの競合チェック
    if (rules.accountAssignmentRules && rules.accountAssignmentRules.length > 1) {
      for (let i = 0; i < rules.accountAssignmentRules.length; i++) {
        const currentRule = rules.accountAssignmentRules[i];
        const otherRules = rules.accountAssignmentRules.filter((_, index) => index !== i);
        
        const conflictResult = this.validator.checkRuleConflicts(currentRule, otherRules);
        if (conflictResult.hasConflicts) {
          conflictResults.push(conflictResult);
        }
      }
    }
    
    // 税区分判定ルールの競合チェック
    if (rules.taxAssignmentRules && rules.taxAssignmentRules.length > 1) {
      for (let i = 0; i < rules.taxAssignmentRules.length; i++) {
        const currentRule = rules.taxAssignmentRules[i];
        const otherRules = rules.taxAssignmentRules.filter((_, index) => index !== i);
        
        const conflictResult = this.validator.checkRuleConflicts(currentRule, otherRules);
        if (conflictResult.hasConflicts) {
          conflictResults.push(conflictResult);
        }
      }
    }
    
    // 部門マッピングの競合チェック
    const departmentConflicts = await this.detectDepartmentMappingConflicts(rules.departmentCashMappings || []);
    if (departmentConflicts.hasConflicts) {
      conflictResults.push(departmentConflicts);
    }
    
    return conflictResults;
  }
  
  /**
   * 包括的検証レポート生成機能の実装
   * 要件7.4: 詳細な検証レポートを生成
   */
  async generateComprehensiveValidationReport(rules: ComprehensiveRuleSet): Promise<ValidationReport> {
    // 基本的な検証レポート生成
    const baseReport = this.validator.generateValidationReport(rules);
    
    // 追加の詳細分析
    const consistencyResult = await this.validateRuleConsistency(rules);
    const complianceResult = await this.validatePCACompliance(rules);
    const conflictResults = await this.detectRuleConflicts(rules);
    
    // レポートの拡張
    const enhancedReport: ValidationReport = {
      ...baseReport,
      timestamp: new Date(),
      details: [
        ...baseReport.details,
        consistencyResult,
        {
          isValid: complianceResult.isCompliant,
          errors: complianceResult.violations
            .filter(v => v.severity === 'error')
            .map(v => ({
              code: v.code,
              message: v.description,
              field: v.field,
              severity: 'error' as const,
            })),
          warnings: complianceResult.violations
            .filter(v => v.severity === 'warning')
            .map(v => ({
              code: v.code,
              message: v.description,
              field: v.field,
            })),
          suggestions: [],
        },
      ],
      recommendations: [
        ...baseReport.recommendations,
        ...this.generateAdvancedRecommendations(rules, conflictResults),
      ],
    };
    
    // 競合情報の追加
    if (conflictResults.length > 0) {
      const conflictErrors = conflictResults.flatMap(cr => 
        cr.conflicts.filter(c => c.severity === 'high').map(c => ({
          code: 'RULE_CONFLICT',
          message: c.description,
          field: `conflicts.${c.existingRuleId}`,
          severity: 'error' as const,
        }))
      );
      
      const conflictWarnings = conflictResults.flatMap(cr => 
        cr.conflicts.filter(c => c.severity !== 'high').map(c => ({
          code: 'RULE_CONFLICT',
          message: c.description,
          field: `conflicts.${c.existingRuleId}`,
        }))
      );
      
      enhancedReport.details.push({
        isValid: conflictErrors.length === 0,
        errors: conflictErrors,
        warnings: conflictWarnings,
        suggestions: ['ルール競合を解決してください'],
      });
    }
    
    // 統計情報の更新
    const totalErrors = enhancedReport.details.reduce((sum, detail) => sum + detail.errors.length, 0);
    const totalWarnings = enhancedReport.details.reduce((sum, detail) => sum + detail.warnings.length, 0);
    
    enhancedReport.summary.invalidRules = totalErrors;
    enhancedReport.summary.warningRules = totalWarnings;
    enhancedReport.summary.validRules = enhancedReport.summary.totalRules - totalErrors;
    
    // 全体ステータスの更新
    if (totalErrors > 0) {
      enhancedReport.overallStatus = 'invalid';
    } else if (totalWarnings > 0) {
      enhancedReport.overallStatus = 'warning';
    } else {
      enhancedReport.overallStatus = 'valid';
    }
    
    return enhancedReport;
  }
  
  /**
   * ルール間の整合性チェック
   */
  private async validateInterRuleConsistency(
    rules: ComprehensiveRuleSet,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): Promise<void> {
    // 勘定科目と税区分の対応チェック
    if (rules.accountAssignmentRules && rules.taxAssignmentRules) {
      const accountCodes = new Set(
        rules.accountAssignmentRules.map(rule => rule.assignment.debitAccountCode)
      );
      
      const taxRuleAccountCodes = new Set(
        rules.taxAssignmentRules.flatMap(rule => rule.conditions.accountCodes || [])
      );
      
      // 勘定科目に対応する税区分ルールがない場合
      for (const accountCode of accountCodes) {
        if (!taxRuleAccountCodes.has(accountCode)) {
          warnings.push({
            code: 'MISSING_TAX_RULE_FOR_ACCOUNT',
            message: `勘定科目${accountCode}に対応する税区分ルールがありません`,
            field: 'taxAssignmentRules',
          });
        }
      }
    }
    
    // 部門と現金補助科目の対応チェック
    if (rules.departmentCashMappings) {
      const departmentCodes = new Set(
        rules.departmentCashMappings.map(mapping => mapping.departmentCode)
      );
      const cashCodes = new Set(
        rules.departmentCashMappings.map(mapping => mapping.cashAuxiliaryCode)
      );
      
      // 1対1対応の確認
      if (departmentCodes.size !== cashCodes.size) {
        warnings.push({
          code: 'INCONSISTENT_DEPARTMENT_CASH_MAPPING',
          message: '部門コードと現金補助科目コードの対応が1対1になっていません',
          field: 'departmentCashMappings',
        });
      }
    }
  }
  
  /**
   * ビジネスロジックの整合性チェック
   */
  private validateBusinessLogicConsistency(
    rules: ComprehensiveRuleSet,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // 租税公課の特別処理チェック
    if (rules.accountAssignmentRules && rules.taxAssignmentRules) {
      const hasRentaxAccount = rules.accountAssignmentRules.some(
        rule => rule.assignment.debitAccountCode === '738'
      );
      
      if (hasRentaxAccount) {
        const hasRentaxTaxRule = rules.taxAssignmentRules.some(
          rule => rule.conditions.accountCodes?.includes('738') && 
                  rule.assignment.debitTaxCode === 'P0'
        );
        
        if (!hasRentaxTaxRule) {
          errors.push({
            code: 'MISSING_RENTAX_TAX_RULE',
            message: '租税公課（738）には税区分P0（非仕入）のルールが必要です',
            field: 'taxAssignmentRules',
            severity: 'error',
          });
        }
      }
    }
    
    // 現金勘定科目の統一チェック
    if (rules.accountAssignmentRules) {
      const creditAccountCodes = new Set(
        rules.accountAssignmentRules.map(rule => rule.assignment.creditAccountCode)
      );
      
      if (creditAccountCodes.size > 1 || !creditAccountCodes.has('111')) {
        errors.push({
          code: 'INVALID_CREDIT_ACCOUNT',
          message: '貸方勘定科目は111（現金）に統一する必要があります',
          field: 'accountAssignmentRules',
          severity: 'error',
        });
      }
    }
  }
  
  /**
   * データ完全性チェック
   */
  private validateDataCompleteness(
    rules: ComprehensiveRuleSet,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // 必須ルールタイプの存在チェック
    if (!rules.accountAssignmentRules || rules.accountAssignmentRules.length === 0) {
      errors.push({
        code: 'MISSING_ACCOUNT_RULES',
        message: '勘定科目割り当てルールが設定されていません',
        field: 'accountAssignmentRules',
        severity: 'error',
      });
    }
    
    if (!rules.taxAssignmentRules || rules.taxAssignmentRules.length === 0) {
      errors.push({
        code: 'MISSING_TAX_RULES',
        message: '税区分判定ルールが設定されていません',
        field: 'taxAssignmentRules',
        severity: 'error',
      });
    }
    
    if (!rules.departmentCashMappings || rules.departmentCashMappings.length === 0) {
      errors.push({
        code: 'MISSING_DEPARTMENT_MAPPINGS',
        message: '部門・現金補助科目マッピングが設定されていません',
        field: 'departmentCashMappings',
        severity: 'error',
      });
    }
    
    if (!rules.formatSettings) {
      errors.push({
        code: 'MISSING_FORMAT_SETTINGS',
        message: 'データフォーマット設定が設定されていません',
        field: 'formatSettings',
        severity: 'error',
      });
    }
    
    // カバレッジチェック
    if (rules.accountAssignmentRules && rules.accountAssignmentRules.length > 0) {
      const hasDefaultRule = rules.accountAssignmentRules.some(
        rule => !rule.conditions || Object.keys(rule.conditions).length === 0
      );
      
      if (!hasDefaultRule) {
        warnings.push({
          code: 'NO_DEFAULT_ACCOUNT_RULE',
          message: 'デフォルトの勘定科目割り当てルールがありません。条件に一致しない取引の処理ができない可能性があります',
          field: 'accountAssignmentRules',
        });
        suggestions.push('条件を設定しないデフォルトルールの追加を検討してください');
      }
    }
  }
  
  /**
   * 高度なPCA検証
   */
  private async performAdvancedPCAValidation(rules: ComprehensiveRuleSet) {
    const violations = [];
    
    // 税区分コードの組み合わせチェック
    if (rules.taxAssignmentRules) {
      for (const rule of rules.taxAssignmentRules) {
        // 借方と貸方の税区分の妥当性チェック
        if (rule.assignment.debitTaxCode !== '00' && rule.assignment.creditTaxCode !== '00') {
          violations.push({
            code: 'INVALID_TAX_CODE_COMBINATION',
            description: `借方と貸方の両方に課税区分が設定されています。通常、貸方（現金）は00（対象外）である必要があります`,
            field: `taxAssignmentRules[${rule.id}].assignment`,
            severity: 'warning' as const,
          });
        }
      }
    }
    
    // 補助科目の使用パターンチェック
    if (rules.accountAssignmentRules) {
      for (const rule of rules.accountAssignmentRules) {
        const accountCode = rule.assignment.debitAccountCode;
        const hasSubAccount = rule.assignment.debitSubAccountCode;
        
        // 車両費（729）と租税公課（738）以外で補助科目を使用している場合
        if (hasSubAccount && !['729', '738'].includes(accountCode)) {
          violations.push({
            code: 'UNEXPECTED_SUB_ACCOUNT_USAGE',
            description: `勘定科目${accountCode}で補助科目が使用されています。通常、補助科目は車両費（729）と租税公課（738）のみで使用されます`,
            field: `accountAssignmentRules[${rule.id}].assignment.debitSubAccountCode`,
            severity: 'warning' as const,
          });
        }
      }
    }
    
    return violations;
  }
  
  /**
   * 部門マッピングの競合検出
   */
  private async detectDepartmentMappingConflicts(mappings: DepartmentCashMapping[]): Promise<ConflictResult> {
    const conflicts = [];
    
    // 部門コードの重複チェック
    const departmentCodes = mappings.map(m => m.departmentCode);
    const duplicateDepartments = departmentCodes.filter((code, index) => 
      departmentCodes.indexOf(code) !== index
    );
    
    for (const duplicateCode of [...new Set(duplicateDepartments)]) {
      conflicts.push({
        existingRuleId: duplicateCode,
        conflictType: 'duplicate' as const,
        description: `部門コード${duplicateCode}が重複しています`,
        severity: 'high' as const,
      });
    }
    
    // 現金補助科目コードの重複チェック
    const cashCodes = mappings.map(m => m.cashAuxiliaryCode);
    const duplicateCashCodes = cashCodes.filter((code, index) => 
      cashCodes.indexOf(code) !== index
    );
    
    for (const duplicateCode of [...new Set(duplicateCashCodes)]) {
      conflicts.push({
        existingRuleId: duplicateCode,
        conflictType: 'duplicate' as const,
        description: `現金補助科目コード${duplicateCode}が重複しています`,
        severity: 'high' as const,
      });
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }
  
  /**
   * 高度な推奨事項生成
   */
  private generateAdvancedRecommendations(
    rules: ComprehensiveRuleSet,
    conflictResults: ConflictResult[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 競合に基づく推奨事項
    if (conflictResults.length > 0) {
      const highSeverityConflicts = conflictResults.flatMap(cr => 
        cr.conflicts.filter(c => c.severity === 'high')
      );
      
      if (highSeverityConflicts.length > 0) {
        recommendations.push('高優先度の競合を解決してください。これらは処理結果に直接影響します。');
      }
      
      const duplicateConflicts = conflictResults.flatMap(cr => 
        cr.conflicts.filter(c => c.conflictType === 'duplicate')
      );
      
      if (duplicateConflicts.length > 0) {
        recommendations.push('重複するルールを統合または削除してください。');
      }
    }
    
    // ルールカバレッジに基づく推奨事項
    if (rules.accountAssignmentRules && rules.accountAssignmentRules.length > 0) {
      const priorityGaps = this.findPriorityGaps(rules.accountAssignmentRules);
      if (priorityGaps.length > 0) {
        recommendations.push(`優先度に空きがあります（${priorityGaps.join(', ')}）。ルールの優先度を見直してください。`);
      }
    }
    
    // パフォーマンスに基づく推奨事項
    const totalRules = (rules.accountAssignmentRules?.length || 0) + 
                      (rules.taxAssignmentRules?.length || 0);
    
    if (totalRules > 50) {
      recommendations.push('ルール数が多くなっています。パフォーマンスを考慮してルールの統合を検討してください。');
    }
    
    return recommendations;
  }
  
  /**
   * 優先度の空きを検出
   */
  private findPriorityGaps(rules: { priority: number }[]): number[] {
    const priorities = rules.map(r => r.priority).sort((a, b) => a - b);
    const gaps: number[] = [];
    
    for (let i = 1; i < priorities.length; i++) {
      const current = priorities[i];
      const previous = priorities[i - 1];
      
      if (current - previous > 1) {
        for (let gap = previous + 1; gap < current; gap++) {
          gaps.push(gap);
        }
      }
    }
    
    return gaps;
  }
}

// シングルトンインスタンス
export const comprehensiveRuleValidationEngine = new ComprehensiveRuleValidationEngine();