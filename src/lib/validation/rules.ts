/**
 * ルール管理システムのバリデーション機能
 */

import {
  AccountAssignmentRule,
  TaxAssignmentRule,
  DepartmentCashMapping,
  DataFormatSettings,
  ComprehensiveRuleSet,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ConflictResult,
  RuleConflict,
  ComplianceResult,
  ComplianceViolation,
  ValidationReport,
  PCA_TAX_CODES,
} from '../../types/rules';

/**
 * ルールバリデーター
 */
export class RuleValidator {
  
  /**
   * 勘定科目割り当てルールの検証
   */
  validateAccountAssignmentRule(rule: AccountAssignmentRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // 必須フィールドチェック
    if (!rule.name?.trim()) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: 'ルール名は必須です',
        field: 'name',
        severity: 'error',
      });
    }
    
    if (!rule.assignment?.debitAccountCode) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '借方勘定科目コードは必須です',
        field: 'assignment.debitAccountCode',
        severity: 'error',
      });
    }
    
    if (!rule.assignment?.creditAccountCode) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '貸方勘定科目コードは必須です',
        field: 'assignment.creditAccountCode',
        severity: 'error',
      });
    }
    
    // フォーマットチェック
    if (rule.assignment?.debitAccountCode && !/^[0-9]{3}$/.test(rule.assignment.debitAccountCode)) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: '借方勘定科目コードは3桁の数字である必要があります',
        field: 'assignment.debitAccountCode',
        severity: 'error',
      });
    }
    
    if (rule.assignment?.creditAccountCode && !/^[0-9]{3}$/.test(rule.assignment.creditAccountCode)) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: '貸方勘定科目コードは3桁の数字である必要があります',
        field: 'assignment.creditAccountCode',
        severity: 'error',
      });
    }
    
    // 優先度チェック
    if (rule.priority < 1 || rule.priority > 999) {
      errors.push({
        code: 'INVALID_RANGE',
        message: '優先度は1から999の間で設定してください',
        field: 'priority',
        severity: 'error',
      });
    }
    
    // 条件チェック
    if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
      warnings.push({
        code: 'NO_CONDITIONS',
        message: '条件が設定されていません。すべての取引に適用される可能性があります',
        field: 'conditions',
      });
    }
    
    // 有効期間チェック
    if (rule.effectiveTo && rule.effectiveFrom > rule.effectiveTo) {
      errors.push({
        code: 'INVALID_DATE_RANGE',
        message: '有効期間の開始日が終了日より後になっています',
        field: 'effectiveTo',
        severity: 'error',
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * 税区分判定ルールの検証
   */
  validateTaxAssignmentRule(rule: TaxAssignmentRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // 必須フィールドチェック
    if (!rule.name?.trim()) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: 'ルール名は必須です',
        field: 'name',
        severity: 'error',
      });
    }
    
    if (!rule.assignment?.debitTaxCode) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '借方税区分コードは必須です',
        field: 'assignment.debitTaxCode',
        severity: 'error',
      });
    }
    
    if (!rule.assignment?.creditTaxCode) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '貸方税区分コードは必須です',
        field: 'assignment.creditTaxCode',
        severity: 'error',
      });
    }
    
    // PCA税区分コードチェック
    const validTaxCodes = Object.keys(PCA_TAX_CODES);
    if (rule.assignment?.debitTaxCode && !validTaxCodes.includes(rule.assignment.debitTaxCode)) {
      errors.push({
        code: 'INVALID_TAX_CODE',
        message: `無効な借方税区分コードです。有効な値: ${validTaxCodes.join(', ')}`,
        field: 'assignment.debitTaxCode',
        severity: 'error',
      });
    }
    
    if (rule.assignment?.creditTaxCode && !validTaxCodes.includes(rule.assignment.creditTaxCode)) {
      errors.push({
        code: 'INVALID_TAX_CODE',
        message: `無効な貸方税区分コードです。有効な値: ${validTaxCodes.join(', ')}`,
        field: 'assignment.creditTaxCode',
        severity: 'error',
      });
    }
    
    // 税率チェック
    if (rule.conditions?.taxRate && ![0.08, 0.10].includes(rule.conditions.taxRate)) {
      warnings.push({
        code: 'UNUSUAL_TAX_RATE',
        message: '一般的でない税率が設定されています（8%または10%が標準）',
        field: 'conditions.taxRate',
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  } 
 
  /**
   * 部門・現金補助科目マッピングの検証
   */
  validateDepartmentCashMapping(mapping: DepartmentCashMapping): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // 必須フィールドチェック
    if (!mapping.departmentCode?.trim()) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '部門コードは必須です',
        field: 'departmentCode',
        severity: 'error',
      });
    }
    
    if (!mapping.departmentName?.trim()) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '部門名は必須です',
        field: 'departmentName',
        severity: 'error',
      });
    }
    
    if (!mapping.cashAuxiliaryCode?.trim()) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '現金補助科目コードは必須です',
        field: 'cashAuxiliaryCode',
        severity: 'error',
      });
    }
    
    if (!mapping.cashAuxiliaryName?.trim()) {
      errors.push({
        code: 'REQUIRED_FIELD',
        message: '現金補助科目名は必須です',
        field: 'cashAuxiliaryName',
        severity: 'error',
      });
    }
    
    // フォーマットチェック
    if (mapping.departmentCode && !/^[1-6]$/.test(mapping.departmentCode)) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: '部門コードは1から6の数字である必要があります',
        field: 'departmentCode',
        severity: 'error',
      });
    }
    
    if (mapping.cashAuxiliaryCode && !/^[0-9]{3}$/.test(mapping.cashAuxiliaryCode)) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: '現金補助科目コードは3桁の数字である必要があります',
        field: 'cashAuxiliaryCode',
        severity: 'error',
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * データフォーマット設定の検証
   */
  validateDataFormatSettings(settings: DataFormatSettings): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // 日付フォーマットチェック
    if (settings.dateFormat !== 'YYYYMMDD') {
      errors.push({
        code: 'INVALID_DATE_FORMAT',
        message: '日付フォーマットはYYYYMMDDである必要があります',
        field: 'dateFormat',
        severity: 'error',
      });
    }
    
    // 摘要テンプレートチェック
    if (!settings.descriptionTemplate?.includes('{expenseType}') || !settings.descriptionTemplate?.includes('{merchant}')) {
      warnings.push({
        code: 'INCOMPLETE_TEMPLATE',
        message: '摘要テンプレートに{expenseType}と{merchant}の両方を含めることを推奨します',
        field: 'descriptionTemplate',
      });
    }
    
    // 固定値チェック
    if (settings.fixedValues?.programClassification !== '2') {
      errors.push({
        code: 'INVALID_PROGRAM_CLASSIFICATION',
        message: 'プログラム区分は"2"である必要があります',
        field: 'fixedValues.programClassification',
        severity: 'error',
      });
    }
    
    if (!['blank', 'calculated'].includes(settings.fixedValues?.taxAmountHandling)) {
      errors.push({
        code: 'INVALID_TAX_HANDLING',
        message: '税額処理は"blank"または"calculated"である必要があります',
        field: 'fixedValues.taxAmountHandling',
        severity: 'error',
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * ルール競合チェック（拡張版）
   */
  checkRuleConflicts(
    newRule: AccountAssignmentRule | TaxAssignmentRule, 
    existingRules: (AccountAssignmentRule | TaxAssignmentRule)[]
  ): ConflictResult {
    const conflicts: RuleConflict[] = [];
    
    for (const existingRule of existingRules) {
      if (existingRule.id === newRule.id) continue;
      
      // アクティブなルールのみチェック
      if (!existingRule.isActive || !newRule.isActive) continue;
      
      // 有効期間の重複チェック
      if (!this.hasDateOverlap(newRule, existingRule)) continue;
      
      // 同じ優先度チェック
      if (existingRule.priority === newRule.priority) {
        conflicts.push({
          existingRuleId: existingRule.id,
          conflictType: 'duplicate',
          description: `同じ優先度（${newRule.priority}）のアクティブなルールが有効期間内に存在します: ${existingRule.name}`,
          severity: 'high',
        });
      }
      
      // 条件の重複チェック
      const overlapSeverity = this.checkConditionOverlap(newRule, existingRule);
      if (overlapSeverity) {
        conflicts.push({
          existingRuleId: existingRule.id,
          conflictType: 'overlap',
          description: `条件が重複するルールが存在します: ${existingRule.name}（優先度: ${existingRule.priority}）`,
          severity: overlapSeverity,
        });
      }
      
      // 矛盾する割り当てチェック
      const contradictionSeverity = this.checkAssignmentContradiction(newRule, existingRule);
      if (contradictionSeverity) {
        conflicts.push({
          existingRuleId: existingRule.id,
          conflictType: 'contradiction',
          description: `同じ条件で異なる割り当てを行うルールが存在します: ${existingRule.name}`,
          severity: contradictionSeverity,
        });
      }
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }
  
  /**
   * 日付範囲の重複チェック
   */
  private hasDateOverlap(rule1: any, rule2: any): boolean {
    const start1 = rule1.effectiveFrom;
    const end1 = rule1.effectiveTo || new Date('2099-12-31');
    const start2 = rule2.effectiveFrom;
    const end2 = rule2.effectiveTo || new Date('2099-12-31');
    
    return start1 <= end2 && end1 >= start2;
  }
  
  /**
   * 条件の重複チェック（詳細版）
   */
  private checkConditionOverlap(rule1: any, rule2: any): 'high' | 'medium' | 'low' | null {
    let overlapScore = 0;
    let totalConditions = 0;
    
    // 経費種別パターンの重複チェック
    if (rule1.conditions?.expenseTypePatterns && rule2.conditions?.expenseTypePatterns) {
      totalConditions++;
      const patterns1 = new Set(rule1.conditions.expenseTypePatterns);
      const patterns2 = new Set(rule2.conditions.expenseTypePatterns);
      const intersection = new Set([...patterns1].filter(x => patterns2.has(x)));
      if (intersection.size > 0) {
        overlapScore += intersection.size / Math.min(patterns1.size, patterns2.size);
      }
    }
    
    // 取引先パターンの重複チェック
    if (rule1.conditions?.merchantPatterns && rule2.conditions?.merchantPatterns) {
      totalConditions++;
      const patterns1 = rule1.conditions.merchantPatterns;
      const patterns2 = rule2.conditions.merchantPatterns;
      
      for (const pattern1 of patterns1) {
        for (const pattern2 of patterns2) {
          try {
            const regex1 = new RegExp(pattern1, 'i');
            const regex2 = new RegExp(pattern2, 'i');
            // 簡易的な重複チェック（完全ではない）
            if (pattern1 === pattern2 || pattern1.includes(pattern2) || pattern2.includes(pattern1)) {
              overlapScore += 0.5;
              break;
            }
          } catch (e) {
            // 正規表現エラーは無視
          }
        }
      }
    }
    
    // 金額範囲の重複チェック
    if (rule1.conditions?.amountRange && rule2.conditions?.amountRange) {
      totalConditions++;
      const range1 = rule1.conditions.amountRange;
      const range2 = rule2.conditions.amountRange;
      
      const min1 = range1.min || 0;
      const max1 = range1.max || Number.MAX_SAFE_INTEGER;
      const min2 = range2.min || 0;
      const max2 = range2.max || Number.MAX_SAFE_INTEGER;
      
      if (min1 <= max2 && max1 >= min2) {
        const overlapStart = Math.max(min1, min2);
        const overlapEnd = Math.min(max1, max2);
        const overlapSize = overlapEnd - overlapStart;
        const totalSize = Math.max(max1, max2) - Math.min(min1, min2);
        overlapScore += overlapSize / totalSize;
      }
    }
    
    // キーワードの重複チェック
    if (rule1.conditions?.keywords && rule2.conditions?.keywords) {
      totalConditions++;
      const keywords1 = new Set(rule1.conditions.keywords.map((k: string) => k.toLowerCase()));
      const keywords2 = new Set(rule2.conditions.keywords.map((k: string) => k.toLowerCase()));
      const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
      if (intersection.size > 0) {
        overlapScore += intersection.size / Math.min(keywords1.size, keywords2.size);
      }
    }
    
    // 税区分ルール特有の条件チェック
    if (this.isTaxAssignmentRule(rule1) && this.isTaxAssignmentRule(rule2)) {
      // 税率の重複チェック
      if (rule1.conditions?.taxRate && rule2.conditions?.taxRate) {
        totalConditions++;
        if (rule1.conditions.taxRate === rule2.conditions.taxRate) {
          overlapScore += 1;
        }
      }
      
      // インボイス対応の重複チェック
      if (rule1.conditions?.invoiceCompliant !== undefined && rule2.conditions?.invoiceCompliant !== undefined) {
        totalConditions++;
        if (rule1.conditions.invoiceCompliant === rule2.conditions.invoiceCompliant) {
          overlapScore += 1;
        }
      }
      
      // 対象勘定科目の重複チェック
      if (rule1.conditions?.accountCodes && rule2.conditions?.accountCodes) {
        totalConditions++;
        const accounts1 = new Set(rule1.conditions.accountCodes);
        const accounts2 = new Set(rule2.conditions.accountCodes);
        const intersection = new Set([...accounts1].filter(x => accounts2.has(x)));
        if (intersection.size > 0) {
          overlapScore += intersection.size / Math.min(accounts1.size, accounts2.size);
        }
      }
    }
    
    if (totalConditions === 0) return null;
    
    const averageOverlap = overlapScore / totalConditions;
    
    if (averageOverlap >= 0.8) return 'high';
    if (averageOverlap >= 0.5) return 'medium';
    if (averageOverlap >= 0.2) return 'low';
    
    return null;
  }
  
  /**
   * 割り当ての矛盾チェック
   */
  private checkAssignmentContradiction(rule1: any, rule2: any): 'high' | 'medium' | null {
    // 同じタイプのルールでない場合は矛盾チェックしない
    if (this.isAccountAssignmentRule(rule1) !== this.isAccountAssignmentRule(rule2)) {
      return null;
    }
    
    // 条件が完全に一致する場合の割り当て矛盾チェック
    if (this.hasIdenticalConditions(rule1, rule2)) {
      if (this.isAccountAssignmentRule(rule1)) {
        const assignment1 = rule1.assignment;
        const assignment2 = rule2.assignment;
        
        if (assignment1.debitAccountCode !== assignment2.debitAccountCode ||
            assignment1.creditAccountCode !== assignment2.creditAccountCode) {
          return 'high';
        }
        
        if (assignment1.debitSubAccountCode !== assignment2.debitSubAccountCode ||
            assignment1.creditSubAccountCode !== assignment2.creditSubAccountCode) {
          return 'medium';
        }
      } else if (this.isTaxAssignmentRule(rule1)) {
        const assignment1 = rule1.assignment;
        const assignment2 = rule2.assignment;
        
        if (assignment1.debitTaxCode !== assignment2.debitTaxCode ||
            assignment1.creditTaxCode !== assignment2.creditTaxCode) {
          return 'high';
        }
      }
    }
    
    return null;
  }
  
  /**
   * 条件が完全に一致するかチェック
   */
  private hasIdenticalConditions(rule1: any, rule2: any): boolean {
    const conditions1 = rule1.conditions || {};
    const conditions2 = rule2.conditions || {};
    
    // 簡易的な比較（実際にはより詳細な比較が必要）
    return JSON.stringify(conditions1) === JSON.stringify(conditions2);
  }
  
  /**
   * ルールタイプ判定ヘルパー
   */
  private isAccountAssignmentRule(rule: any): rule is AccountAssignmentRule {
    return rule.assignment && 'debitAccountCode' in rule.assignment;
  }
  
  private isTaxAssignmentRule(rule: any): rule is TaxAssignmentRule {
    return rule.assignment && 'debitTaxCode' in rule.assignment;
  }
  
  /**
   * 条件の重複チェック（簡易版）- 後方互換性のため保持
   */
  private hasOverlappingConditions(rule1: any, rule2: any): boolean {
    return this.checkConditionOverlap(rule1, rule2) !== null;
  }
  
  /**
   * 包括的ルールセット検証
   */
  validateRuleSet(rules: ComprehensiveRuleSet): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // 各ルールタイプの個別検証
    if (rules.accountAssignmentRules) {
      for (const rule of rules.accountAssignmentRules) {
        const result = this.validateAccountAssignmentRule(rule);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
        suggestions.push(...result.suggestions);
      }
    }
    
    if (rules.taxAssignmentRules) {
      for (const rule of rules.taxAssignmentRules) {
        const result = this.validateTaxAssignmentRule(rule);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
        suggestions.push(...result.suggestions);
      }
    }
    
    if (rules.departmentCashMappings) {
      for (const mapping of rules.departmentCashMappings) {
        const result = this.validateDepartmentCashMapping(mapping);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
        suggestions.push(...result.suggestions);
      }
    }
    
    if (rules.formatSettings) {
      const result = this.validateDataFormatSettings(rules.formatSettings);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      suggestions.push(...result.suggestions);
    }
    
    // ルールセット全体の整合性チェック
    this.validateRuleSetConsistency(rules, errors, warnings, suggestions);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * ルールセット整合性チェック
   */
  private validateRuleSetConsistency(
    rules: ComprehensiveRuleSet,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // 必要なルールタイプの存在チェック
    if (!rules.accountAssignmentRules || rules.accountAssignmentRules.length === 0) {
      warnings.push({
        code: 'MISSING_ACCOUNT_RULES',
        message: '勘定科目割り当てルールが設定されていません',
        field: 'accountAssignmentRules',
      });
    }
    
    if (!rules.taxAssignmentRules || rules.taxAssignmentRules.length === 0) {
      warnings.push({
        code: 'MISSING_TAX_RULES',
        message: '税区分判定ルールが設定されていません',
        field: 'taxAssignmentRules',
      });
    }
    
    if (!rules.departmentCashMappings || rules.departmentCashMappings.length === 0) {
      warnings.push({
        code: 'MISSING_DEPARTMENT_MAPPINGS',
        message: '部門・現金補助科目マッピングが設定されていません',
        field: 'departmentCashMappings',
      });
    }
    
    // 勘定科目と税区分の整合性チェック
    this.validateAccountTaxConsistency(rules, errors, warnings);
    
    // 部門マッピングの完全性チェック
    this.validateDepartmentMappingCompleteness(rules, warnings, suggestions);
  }
  
  /**
   * 勘定科目と税区分の整合性チェック
   */
  private validateAccountTaxConsistency(
    rules: ComprehensiveRuleSet,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!rules.accountAssignmentRules || !rules.taxAssignmentRules) return;
    
    const accountCodes = new Set(
      rules.accountAssignmentRules.map(rule => rule.assignment.debitAccountCode)
    );
    
    // 租税公課（738）の特別処理チェック
    const hasRentaxRule = accountCodes.has('738');
    const hasRentaxTaxRule = rules.taxAssignmentRules.some(
      rule => rule.conditions.accountCodes?.includes('738') && rule.assignment.debitTaxCode === 'P0'
    );
    
    if (hasRentaxRule && !hasRentaxTaxRule) {
      errors.push({
        code: 'MISSING_RENTAX_TAX_RULE',
        message: '租税公課（738）には税区分P0（非仕入）のルールが必要です',
        field: 'taxAssignmentRules',
        severity: 'error',
      });
    }
    
    // 車両費（729）のインボイス対応チェック
    const hasVehicleRule = accountCodes.has('729');
    if (hasVehicleRule) {
      const hasInvoiceCompliantRule = rules.taxAssignmentRules.some(
        rule => rule.conditions.accountCodes?.includes('729') && rule.conditions.invoiceCompliant === true
      );
      const hasNonInvoiceCompliantRule = rules.taxAssignmentRules.some(
        rule => rule.conditions.accountCodes?.includes('729') && rule.conditions.invoiceCompliant === false
      );
      
      if (!hasInvoiceCompliantRule || !hasNonInvoiceCompliantRule) {
        warnings.push({
          code: 'INCOMPLETE_VEHICLE_TAX_RULES',
          message: '車両費（729）にはインボイス対応・非対応両方の税区分ルールを設定することを推奨します',
          field: 'taxAssignmentRules',
        });
      }
    }
  }
  
  /**
   * 部門マッピングの完全性チェック
   */
  private validateDepartmentMappingCompleteness(
    rules: ComprehensiveRuleSet,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    if (!rules.departmentCashMappings) return;
    
    const expectedDepartments = ['1', '2', '3', '4', '5', '6'];
    const expectedCashCodes = ['001', '002', '003', '005', '006'];
    
    const mappedDepartments = new Set(
      rules.departmentCashMappings.map(mapping => mapping.departmentCode)
    );
    const mappedCashCodes = new Set(
      rules.departmentCashMappings.map(mapping => mapping.cashAuxiliaryCode)
    );
    
    // 不足している部門のチェック
    const missingDepartments = expectedDepartments.filter(dept => !mappedDepartments.has(dept));
    if (missingDepartments.length > 0) {
      warnings.push({
        code: 'INCOMPLETE_DEPARTMENT_MAPPING',
        message: `部門マッピングが不足しています: ${missingDepartments.join(', ')}`,
        field: 'departmentCashMappings',
      });
      suggestions.push(`不足している部門（${missingDepartments.join(', ')}）のマッピングを追加してください`);
    }
    
    // 重複チェック
    const duplicateDepartments = this.findDuplicates(
      rules.departmentCashMappings.map(m => m.departmentCode)
    );
    if (duplicateDepartments.length > 0) {
      warnings.push({
        code: 'DUPLICATE_DEPARTMENT_MAPPING',
        message: `重複する部門コードがあります: ${duplicateDepartments.join(', ')}`,
        field: 'departmentCashMappings',
      });
    }
  }
  
  /**
   * 配列内の重複要素を検出
   */
  private findDuplicates(arr: string[]): string[] {
    const seen = new Set();
    const duplicates = new Set();
    
    for (const item of arr) {
      if (seen.has(item)) {
        duplicates.add(item);
      } else {
        seen.add(item);
      }
    }
    
    return Array.from(duplicates);
  }
  
  /**
   * PCA準拠性チェック
   */
  validatePCACompliance(rules: ComprehensiveRuleSet): ComplianceResult {
    const violations: ComplianceViolation[] = [];
    
    // 勘定科目コードの妥当性チェック
    if (rules.accountAssignmentRules) {
      for (const rule of rules.accountAssignmentRules) {
        // 借方勘定科目コードチェック
        if (rule.assignment?.debitAccountCode && !/^[0-9]{3}$/.test(rule.assignment.debitAccountCode)) {
          violations.push({
            code: 'INVALID_DEBIT_ACCOUNT_CODE',
            description: `無効な借方勘定科目コード: ${rule.assignment.debitAccountCode}（3桁の数字である必要があります）`,
            field: `accountAssignmentRules[${rule.id}].assignment.debitAccountCode`,
            severity: 'error',
          });
        }
        
        // 貸方勘定科目コードチェック（現金111のみ許可）
        if (rule.assignment?.creditAccountCode && rule.assignment.creditAccountCode !== '111') {
          violations.push({
            code: 'INVALID_CREDIT_ACCOUNT_CODE',
            description: `貸方勘定科目コードは111（現金）である必要があります: ${rule.assignment.creditAccountCode}`,
            field: `accountAssignmentRules[${rule.id}].assignment.creditAccountCode`,
            severity: 'error',
          });
        }
        
        // 補助科目コードフォーマットチェック
        if (rule.assignment?.debitSubAccountCode && !/^[0-9]{3}$/.test(rule.assignment.debitSubAccountCode)) {
          violations.push({
            code: 'INVALID_SUB_ACCOUNT_CODE',
            description: `無効な借方補助科目コード: ${rule.assignment.debitSubAccountCode}（3桁の数字である必要があります）`,
            field: `accountAssignmentRules[${rule.id}].assignment.debitSubAccountCode`,
            severity: 'error',
          });
        }
        
        if (rule.assignment?.creditSubAccountCode && !/^[0-9]{3}$/.test(rule.assignment.creditSubAccountCode)) {
          violations.push({
            code: 'INVALID_SUB_ACCOUNT_CODE',
            description: `無効な貸方補助科目コード: ${rule.assignment.creditSubAccountCode}（3桁の数字である必要があります）`,
            field: `accountAssignmentRules[${rule.id}].assignment.creditSubAccountCode`,
            severity: 'error',
          });
        }
      }
    }
    
    // 税区分コードの妥当性チェック
    if (rules.taxAssignmentRules) {
      const validTaxCodes = Object.keys(PCA_TAX_CODES);
      for (const rule of rules.taxAssignmentRules) {
        if (rule.assignment?.debitTaxCode && !validTaxCodes.includes(rule.assignment.debitTaxCode)) {
          violations.push({
            code: 'INVALID_DEBIT_TAX_CODE',
            description: `無効な借方税区分コード: ${rule.assignment.debitTaxCode}（有効な値: ${validTaxCodes.join(', ')}）`,
            field: `taxAssignmentRules[${rule.id}].assignment.debitTaxCode`,
            severity: 'error',
          });
        }
        
        if (rule.assignment?.creditTaxCode && !validTaxCodes.includes(rule.assignment.creditTaxCode)) {
          violations.push({
            code: 'INVALID_CREDIT_TAX_CODE',
            description: `無効な貸方税区分コード: ${rule.assignment.creditTaxCode}（有効な値: ${validTaxCodes.join(', ')}）`,
            field: `taxAssignmentRules[${rule.id}].assignment.creditTaxCode`,
            severity: 'error',
          });
        }
        
        // 貸方税区分は通常00（対象外）であることをチェック
        if (rule.assignment?.creditTaxCode && rule.assignment.creditTaxCode !== '00') {
          violations.push({
            code: 'UNUSUAL_CREDIT_TAX_CODE',
            description: `貸方税区分コードは通常00（対象外）である必要があります: ${rule.assignment.creditTaxCode}`,
            field: `taxAssignmentRules[${rule.id}].assignment.creditTaxCode`,
            severity: 'warning',
          });
        }
      }
    }
    
    // 部門・現金補助科目マッピングの妥当性チェック
    if (rules.departmentCashMappings) {
      const validDepartmentCodes = ['1', '2', '3', '4', '5', '6'];
      const validCashAuxiliaryCodes = ['001', '002', '003', '005', '006'];
      
      for (const mapping of rules.departmentCashMappings) {
        if (!validDepartmentCodes.includes(mapping.departmentCode)) {
          violations.push({
            code: 'INVALID_DEPARTMENT_CODE',
            description: `無効な部門コード: ${mapping.departmentCode}（有効な値: ${validDepartmentCodes.join(', ')}）`,
            field: `departmentCashMappings[${mapping.id}].departmentCode`,
            severity: 'error',
          });
        }
        
        if (!validCashAuxiliaryCodes.includes(mapping.cashAuxiliaryCode)) {
          violations.push({
            code: 'INVALID_CASH_AUXILIARY_CODE',
            description: `無効な現金補助科目コード: ${mapping.cashAuxiliaryCode}（有効な値: ${validCashAuxiliaryCodes.join(', ')}）`,
            field: `departmentCashMappings[${mapping.id}].cashAuxiliaryCode`,
            severity: 'error',
          });
        }
      }
    }
    
    // データフォーマット設定の妥当性チェック
    if (rules.formatSettings) {
      if (rules.formatSettings.dateFormat !== 'YYYYMMDD') {
        violations.push({
          code: 'INVALID_DATE_FORMAT',
          description: `日付フォーマットはYYYYMMDDである必要があります: ${rules.formatSettings.dateFormat}`,
          field: 'formatSettings.dateFormat',
          severity: 'error',
        });
      }
      
      if (rules.formatSettings.fixedValues?.programClassification !== '2') {
        violations.push({
          code: 'INVALID_PROGRAM_CLASSIFICATION',
          description: `入力プログラム区分は"2"である必要があります: ${rules.formatSettings.fixedValues?.programClassification}`,
          field: 'formatSettings.fixedValues.programClassification',
          severity: 'error',
        });
      }
      
      if (rules.formatSettings.fixedValues?.taxAmountHandling !== 'blank') {
        violations.push({
          code: 'INVALID_TAX_AMOUNT_HANDLING',
          description: `税額処理は"blank"（空欄）である必要があります: ${rules.formatSettings.fixedValues?.taxAmountHandling}`,
          field: 'formatSettings.fixedValues.taxAmountHandling',
          severity: 'error',
        });
      }
      
      if (rules.formatSettings.fixedValues?.amountType !== 'tax_inclusive') {
        violations.push({
          code: 'INVALID_AMOUNT_TYPE',
          description: `金額タイプは"tax_inclusive"（税込）である必要があります: ${rules.formatSettings.fixedValues?.amountType}`,
          field: 'formatSettings.fixedValues.amountType',
          severity: 'error',
        });
      }
    }
    
    return {
      isCompliant: violations.filter(v => v.severity === 'error').length === 0,
      violations,
    };
  }
  
  /**
   * 包括的検証レポート生成
   */
  generateValidationReport(rules: ComprehensiveRuleSet): ValidationReport {
    const validationResult = this.validateRuleSet(rules);
    const complianceResult = this.validatePCACompliance(rules);
    
    // 統計情報の計算
    const totalRules = 
      (rules.accountAssignmentRules?.length || 0) +
      (rules.taxAssignmentRules?.length || 0) +
      (rules.departmentCashMappings?.length || 0) +
      (rules.formatSettings ? 1 : 0);
    
    const errorCount = validationResult.errors.length + 
      complianceResult.violations.filter(v => v.severity === 'error').length;
    const warningCount = validationResult.warnings.length + 
      complianceResult.violations.filter(v => v.severity === 'warning').length;
    
    // 全体ステータスの決定
    let overallStatus: 'valid' | 'invalid' | 'warning';
    if (errorCount > 0) {
      overallStatus = 'invalid';
    } else if (warningCount > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'valid';
    }
    
    // 推奨事項の生成
    const recommendations: string[] = [
      ...validationResult.suggestions,
    ];
    
    if (complianceResult.violations.length > 0) {
      recommendations.push('PCA準拠性の問題を解決してください');
    }
    
    if (!rules.accountAssignmentRules || rules.accountAssignmentRules.length === 0) {
      recommendations.push('勘定科目割り当てルールを設定してください');
    }
    
    if (!rules.taxAssignmentRules || rules.taxAssignmentRules.length === 0) {
      recommendations.push('税区分判定ルールを設定してください');
    }
    
    // 詳細結果の統合
    const details: ValidationResult[] = [validationResult];
    
    // PCA準拠性結果を ValidationResult 形式に変換
    if (complianceResult.violations.length > 0) {
      details.push({
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
      });
    }
    
    return {
      timestamp: new Date(),
      ruleSetVersion: rules.version || '1.0.0',
      overallStatus,
      summary: {
        totalRules,
        validRules: totalRules - errorCount,
        invalidRules: errorCount,
        warningRules: warningCount,
      },
      details,
      recommendations,
    };
  }
}

// シングルトンインスタンス
export const ruleValidator = new RuleValidator();