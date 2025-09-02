/**
 * ルール適用エンジン
 * 要件1.3, 1.5, 2.3, 3.3, 4.1, 4.2, 4.3に対応
 * 
 * 領収書データに対してルールを適用し、勘定科目、税区分、部門情報を自動割り当てする
 */

import {
  AccountAssignmentRule,
  TaxAssignmentRule,
  DepartmentCashMapping,
  DataFormatSettings,
  ProcessingReceiptData,
  ProcessedReceiptData,
  AccountAssignment,
  TaxAssignment,
  DepartmentAssignment,
  FormattedData,
  ReceiptData,
  PCA_TAX_CODES,
} from '../../types/rules';
import { UserProfile } from '../../types/auth';

/**
 * ルール適用エンジンのメインクラス
 */
export class RuleApplicationEngine {
  
  /**
   * 領収書データに対する勘定科目自動割り当て機能の実装
   * 要件1.3: AIが領収書データを処理する際に適切な勘定科目を自動割り当て
   * 要件1.5: 勘定科目割り当てルールに基づいて借方・貸方の勘定科目を決定
   */
  async applyAccountRules(
    receiptData: ProcessingReceiptData,
    rules: AccountAssignmentRule[]
  ): Promise<AccountAssignment> {
    // アクティブなルールを優先度順にソート
    const activeRules = rules
      .filter(rule => rule.isActive && this.isRuleEffective(rule))
      .sort((a, b) => a.priority - b.priority);

    // 各ルールを順番に評価
    for (const rule of activeRules) {
      if (this.matchesAccountRule(receiptData, rule)) {
        return {
          debitAccountCode: rule.assignment.debitAccountCode,
          debitAccountName: await this.getAccountName(rule.assignment.debitAccountCode),
          creditAccountCode: rule.assignment.creditAccountCode,
          creditAccountName: await this.getAccountName(rule.assignment.creditAccountCode),
          debitSubAccountCode: rule.assignment.debitSubAccountCode,
          debitSubAccountName: rule.assignment.debitSubAccountCode 
            ? await this.getSubAccountName(rule.assignment.debitSubAccountCode)
            : undefined,
          creditSubAccountCode: rule.assignment.creditSubAccountCode,
          creditSubAccountName: rule.assignment.creditSubAccountCode
            ? await this.getSubAccountName(rule.assignment.creditSubAccountCode)
            : undefined,
          appliedRuleId: rule.id,
          confidence: this.calculateAccountRuleConfidence(receiptData, rule),
        };
      }
    }

    // デフォルトルールが見つからない場合のフォールバック
    throw new Error('適用可能な勘定科目割り当てルールが見つかりません');
  }

  /**
   * 税区分自動判定機能の実装
   * 要件2.3: 税区分判定ルールに基づいて適切な税区分コードを自動割り当て
   */
  async applyTaxRules(
    receiptData: ProcessingReceiptData,
    accountInfo: AccountAssignment,
    rules: TaxAssignmentRule[]
  ): Promise<TaxAssignment> {
    // アクティブなルールを優先度順にソート
    const activeRules = rules
      .filter(rule => rule.isActive && this.isRuleEffective(rule))
      .sort((a, b) => a.priority - b.priority);

    // 租税公課の特別処理（要件: 租税公課は税区分P0）
    if (accountInfo.debitAccountCode === '738') {
      return {
        debitTaxCode: 'P0',
        debitTaxName: PCA_TAX_CODES.P0,
        creditTaxCode: '00',
        creditTaxName: PCA_TAX_CODES['00'],
        appliedRuleId: 'system-rentax-rule',
        confidence: 1.0,
      };
    }

    // 現金取引の特別処理（要件: 現金取引は税区分00）
    if (accountInfo.creditAccountCode === '111') {
      // 税率とインボイス対応状況に基づく判定
      const taxCode = this.determineTaxCodeByRate(receiptData);
      
      return {
        debitTaxCode: taxCode,
        debitTaxName: PCA_TAX_CODES[taxCode as keyof typeof PCA_TAX_CODES],
        creditTaxCode: '00',
        creditTaxName: PCA_TAX_CODES['00'],
        appliedRuleId: 'system-cash-rule',
        confidence: this.calculateTaxRuleConfidence(receiptData),
      };
    }

    // カスタムルールの適用
    for (const rule of activeRules) {
      if (this.matchesTaxRule(receiptData, accountInfo, rule)) {
        return {
          debitTaxCode: rule.assignment.debitTaxCode,
          debitTaxName: PCA_TAX_CODES[rule.assignment.debitTaxCode as keyof typeof PCA_TAX_CODES],
          creditTaxCode: rule.assignment.creditTaxCode,
          creditTaxName: PCA_TAX_CODES[rule.assignment.creditTaxCode as keyof typeof PCA_TAX_CODES],
          appliedRuleId: rule.id,
          confidence: this.calculateTaxRuleConfidence(receiptData, rule),
        };
      }
    }

    // デフォルトの税区分判定
    const defaultTaxCode = this.determineTaxCodeByRate(receiptData);
    return {
      debitTaxCode: defaultTaxCode,
      debitTaxName: PCA_TAX_CODES[defaultTaxCode as keyof typeof PCA_TAX_CODES],
      creditTaxCode: '00',
      creditTaxName: PCA_TAX_CODES['00'],
      appliedRuleId: 'system-default-tax-rule',
      confidence: 0.8,
    };
  }

  /**
   * 部門情報に基づく現金補助科目自動設定機能の実装
   * 要件3.3: ユーザーの部門情報に基づいて現金補助科目を自動設定
   */
  async applyDepartmentRules(
    userId: string,
    receiptData: ProcessingReceiptData,
    mappings: DepartmentCashMapping[],
    userProfile?: UserProfile
  ): Promise<DepartmentAssignment> {
    // ユーザープロファイルから部門情報を取得
    let departmentCode: string;
    
    if (userProfile?.departmentId) {
      departmentCode = userProfile.departmentId;
    } else if (receiptData.departmentCode) {
      departmentCode = receiptData.departmentCode;
    } else {
      throw new Error('ユーザーの部門情報が見つかりません');
    }

    // 部門コードに対応するマッピングを検索
    const mapping = mappings.find(
      m => m.isActive && m.departmentCode === departmentCode
    );

    if (!mapping) {
      throw new Error(`部門コード ${departmentCode} に対応するマッピングが見つかりません`);
    }

    return {
      departmentCode: mapping.departmentCode,
      departmentName: mapping.departmentName,
      cashAuxiliaryCode: mapping.cashAuxiliaryCode,
      cashAuxiliaryName: mapping.cashAuxiliaryName,
      appliedRuleId: mapping.id,
    };
  }

  /**
   * 摘要自動生成機能の実装
   * 要件4.1, 4.2, 4.3: 摘要フォーマットルールに基づいて統一された摘要を生成
   */
  generateDescription(
    receiptData: ProcessingReceiptData,
    formatSettings: DataFormatSettings,
    accountAssignment?: AccountAssignment
  ): string {
    const template = formatSettings.descriptionTemplate;
    
    // 経費種別を決定（勘定科目割り当て結果から導出）
    let expenseType = receiptData.expenseType;
    if (!expenseType && accountAssignment) {
      expenseType = this.deriveExpenseTypeFromAccount(accountAssignment.debitAccountCode, receiptData);
    }
    if (!expenseType) {
      expenseType = '経費';
    }
    
    // テンプレートの変数を置換
    const description = template
      .replace('{expenseType}', expenseType)
      .replace('{accountName}', expenseType)
      .replace('{merchant}', receiptData.merchant);

    // フォーマット検証
    if (!this.validateDescriptionFormat(description)) {
      throw new Error('生成された摘要がフォーマット要件を満たしていません');
    }

    return description;
  }

  /**
   * 勘定科目コードから経費種別を導出
   */
  private deriveExpenseTypeFromAccount(accountCode: string, receiptData: ProcessingReceiptData): string {
    // 勘定科目コードから基本的な経費種別を取得
    const baseExpenseTypes: Record<string, string> = {
      '724': '福利厚生',
      '726': '交通費',
      '727': '通信費',
      '729': '駐車場', // 車両費の場合は内容に応じて細分化
      '731': '運賃',
      '733': '接待費',
      '734': '会議費',
      '737': '消耗品',
      '738': '印紙税', // 租税公課の場合は内容に応じて細分化
      '754': '事務用消耗品',
    };

    let expenseType = baseExpenseTypes[accountCode] || '経費';

    // 車両費の場合は内容に応じて細分化
    if (accountCode === '729') {
      const content = `${receiptData.description || ''} ${receiptData.merchant}`.toLowerCase();
      if (content.includes('駐車場') || content.includes('パーキング')) {
        expenseType = '駐車場';
      } else if (content.includes('ガソリン') || content.includes('燃料')) {
        expenseType = 'ガソリン';
      } else if (content.includes('高速') || content.includes('有料道路')) {
        expenseType = '高速道路';
      } else {
        expenseType = '車両';
      }
    }

    // 租税公課の場合は内容に応じて細分化
    if (accountCode === '738') {
      const content = `${receiptData.description || ''} ${receiptData.merchant}`.toLowerCase();
      if (content.includes('印紙')) {
        expenseType = '印紙税';
      } else if (content.includes('登録')) {
        expenseType = '登録免許税';
      } else if (content.includes('固定資産')) {
        expenseType = '固定資産税';
      } else if (content.includes('自動車税')) {
        expenseType = '自動車税';
      } else {
        expenseType = '税金';
      }
    }

    return expenseType;
  }

  /**
   * 勘定科目名取得（同期版）
   */
  private getAccountNameSync(accountCode: string): string {
    const accountNames: Record<string, string> = {
      '111': '現金',
      '724': '福利厚生費',
      '726': '旅費交通費',
      '727': '通信費',
      '729': '車両費',
      '731': '運賃',
      '733': '交際接待費',
      '734': '会議費',
      '737': '消耗品費',
      '738': '租税公課',
      '754': '事務用消耗品費',
    };
    
    return accountNames[accountCode] || '経費';
  }

  /**
   * データフォーマット適用機能の実装
   * 要件4.1, 4.2, 4.3: PCA形式に準拠したデータフォーマットを適用
   */
  applyFormatRules(
    processedData: ProcessedReceiptData,
    formatSettings: DataFormatSettings
  ): FormattedData {
    return {
      date: this.formatDate(processedData.date, formatSettings.dateFormat),
      description: processedData.formattedData?.description || 
                  this.generateDescription(processedData, formatSettings),
      programClassification: formatSettings.fixedValues.programClassification,
      taxAmountHandling: formatSettings.fixedValues.taxAmountHandling,
      amountType: formatSettings.fixedValues.amountType,
    };
  }

  /**
   * 包括的ルール適用（全ルールを順次適用）
   */
  async processReceipt(
    receiptData: ProcessingReceiptData,
    accountRules: AccountAssignmentRule[],
    taxRules: TaxAssignmentRule[],
    departmentMappings: DepartmentCashMapping[],
    formatSettings: DataFormatSettings,
    userProfile?: UserProfile
  ): Promise<ProcessedReceiptData> {
    try {
      // 1. 勘定科目割り当て
      const accountAssignment = await this.applyAccountRules(receiptData, accountRules);
      
      // 2. 税区分判定
      const taxAssignment = await this.applyTaxRules(receiptData, accountAssignment, taxRules);
      
      // 3. 部門・現金補助科目設定
      const departmentAssignment = await this.applyDepartmentRules(
        receiptData.userId,
        receiptData,
        departmentMappings,
        userProfile
      );
      
      // 4. 摘要生成
      const description = this.generateDescription(receiptData, formatSettings, accountAssignment);
      
      // 5. データフォーマット適用
      const processedReceiptData: ProcessedReceiptData = {
        ...receiptData,
        accountAssignment,
        taxAssignment,
        departmentAssignment,
        formattedData: {
          date: this.formatDate(receiptData.date, formatSettings.dateFormat),
          description,
          programClassification: formatSettings.fixedValues.programClassification,
          taxAmountHandling: formatSettings.fixedValues.taxAmountHandling,
          amountType: formatSettings.fixedValues.amountType,
        },
      };
      
      const formattedData = this.applyFormatRules(processedReceiptData, formatSettings);
      
      return {
        ...processedReceiptData,
        formattedData,
      };
      
    } catch (error) {
      throw new Error(`領収書処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // プライベートヘルパーメソッド

  /**
   * ルールの有効期間チェック
   */
  private isRuleEffective(rule: { effectiveFrom: Date; effectiveTo?: Date }): boolean {
    const now = new Date();
    const effectiveFrom = new Date(rule.effectiveFrom);
    const effectiveTo = rule.effectiveTo ? new Date(rule.effectiveTo) : null;
    
    return now >= effectiveFrom && (!effectiveTo || now <= effectiveTo);
  }

  /**
   * 勘定科目ルールのマッチング判定（経費種別パターンベース）
   */
  private matchesAccountRule(receiptData: ProcessingReceiptData, rule: AccountAssignmentRule): boolean {
    const conditions = rule.conditions;
    
    // 経費種別パターン条件（最重要）
    if (conditions.expenseTypePatterns && conditions.expenseTypePatterns.length > 0) {
      const expenseTypeMatches = conditions.expenseTypePatterns.some(pattern => {
        const searchText = `${receiptData.expenseType || ''} ${receiptData.description || ''} ${receiptData.merchant}`.toLowerCase();
        return searchText.includes(pattern.toLowerCase());
      });
      if (!expenseTypeMatches) {
        return false;
      }
    }
    
    // 取引先パターン条件
    if (conditions.merchantPatterns && conditions.merchantPatterns.length > 0) {
      const merchantMatches = conditions.merchantPatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(receiptData.merchant);
        } catch {
          return receiptData.merchant.toLowerCase().includes(pattern.toLowerCase());
        }
      });
      if (!merchantMatches) {
        return false;
      }
    }
    
    // 金額範囲条件
    if (conditions.amountRange) {
      const { min, max } = conditions.amountRange;
      if (min !== undefined && receiptData.amount < min) {
        return false;
      }
      if (max !== undefined && receiptData.amount > max) {
        return false;
      }
    }
    
    // キーワード条件
    if (conditions.keywords && conditions.keywords.length > 0) {
      const description = receiptData.description || '';
      const keywordMatches = conditions.keywords.some(keyword =>
        description.toLowerCase().includes(keyword.toLowerCase()) ||
        receiptData.merchant.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!keywordMatches) {
        return false;
      }
    }
    
    // 領収書内容パターン条件
    if (conditions.receiptContentPatterns && conditions.receiptContentPatterns.length > 0) {
      const contentText = `${receiptData.description || ''} ${receiptData.merchant}`.toLowerCase();
      const contentMatches = conditions.receiptContentPatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(contentText);
        } catch {
          return contentText.includes(pattern.toLowerCase());
        }
      });
      if (!contentMatches) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 税区分ルールのマッチング判定
   */
  private matchesTaxRule(
    receiptData: ProcessingReceiptData,
    accountInfo: AccountAssignment,
    rule: TaxAssignmentRule
  ): boolean {
    const conditions = rule.conditions;
    
    // 税率条件
    if (conditions.taxRate !== undefined) {
      if (receiptData.taxRate !== conditions.taxRate) {
        return false;
      }
    }
    
    // インボイス対応条件
    if (conditions.invoiceCompliant !== undefined) {
      if (receiptData.invoiceCompliant !== conditions.invoiceCompliant) {
        return false;
      }
    }
    
    // 勘定科目条件（必須）
    if (conditions.accountCodes && conditions.accountCodes.length > 0) {
      if (!conditions.accountCodes.includes(accountInfo.debitAccountCode)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 税率に基づく税区分コード決定
   */
  private determineTaxCodeByRate(receiptData: ProcessingReceiptData): string {
    const taxRate = receiptData.taxRate || 0.10; // デフォルト10%
    const invoiceCompliant = receiptData.invoiceCompliant || false;
    
    if (taxRate === 0.10) {
      return invoiceCompliant ? 'Q5' : 'QD';
    } else if (taxRate === 0.08) {
      return invoiceCompliant ? 'Q6' : 'QE';
    } else {
      return '00'; // その他の税率は対象外
    }
  }

  /**
   * 勘定科目ルールの信頼度計算（経費種別パターンベース）
   */
  private calculateAccountRuleConfidence(
    receiptData: ProcessingReceiptData,
    rule: AccountAssignmentRule
  ): number {
    let confidence = 0.3; // ベース信頼度
    
    // 経費種別パターンの一致度（最重要）
    if (rule.conditions.expenseTypePatterns?.some(pattern => {
      const searchText = `${receiptData.expenseType || ''} ${receiptData.description || ''} ${receiptData.merchant}`.toLowerCase();
      return searchText.includes(pattern.toLowerCase());
    })) {
      confidence += 0.4;
    }
    
    // 取引先パターンの一致度
    if (rule.conditions.merchantPatterns?.some(pattern => {
      try {
        return new RegExp(pattern, 'i').test(receiptData.merchant);
      } catch {
        return receiptData.merchant.toLowerCase().includes(pattern.toLowerCase());
      }
    })) {
      confidence += 0.2;
    }
    
    // キーワードの一致度
    if (rule.conditions.keywords?.some(keyword =>
      (receiptData.description || '').toLowerCase().includes(keyword.toLowerCase()) ||
      receiptData.merchant.toLowerCase().includes(keyword.toLowerCase())
    )) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 税区分ルールの信頼度計算
   */
  private calculateTaxRuleConfidence(
    receiptData: ProcessingReceiptData,
    rule?: TaxAssignmentRule
  ): number {
    let confidence = 0.7; // ベース信頼度
    
    if (rule) {
      // 税率が一致する場合
      if (rule.conditions.taxRate === receiptData.taxRate) {
        confidence += 0.2;
      }
      
      // インボイス対応状況が一致する場合
      if (rule.conditions.invoiceCompliant === receiptData.invoiceCompliant) {
        confidence += 0.1;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 摘要フォーマット検証（PCA仕様準拠）
   */
  private validateDescriptionFormat(description: string): boolean {
    // PCA形式の検証（[○○代　ABC株式会社]の形式）
    const formatRegex = /^\[.+代　.+\]$/;
    return formatRegex.test(description);
  }

  /**
   * 日付フォーマット
   */
  private formatDate(date: Date, format: string): string {
    if (format === 'YYYYMMDD') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    }
    
    return date.toISOString().split('T')[0];
  }

  /**
   * 勘定科目名取得（PCA仕様準拠）
   */
  private async getAccountName(accountCode: string): Promise<string> {
    // PCA仕様に基づく勘定科目マスター
    const accountNames: Record<string, string> = {
      '111': '現金',
      '724': '福利厚生費',
      '726': '旅費交通費',
      '727': '通信費',
      '729': '車両費',
      '731': '運賃',
      '733': '交際接待費',
      '734': '会議費',
      '737': '消耗品費',
      '738': '租税公課',
      '754': '事務用消耗品費',
    };
    
    return accountNames[accountCode] || `勘定科目${accountCode}`;
  }

  /**
   * 補助科目名取得（PCA仕様準拠）
   */
  private async getSubAccountName(subAccountCode: string): Promise<string> {
    // PCA仕様に基づく補助科目マスター
    // 現金補助科目（部門別）
    const cashSubAccounts: Record<string, string> = {
      '001': '札幌支店',
      '002': '仙台事業所', 
      '003': '東京支店',
      '004': '福岡事業所',
      '005': '大阪事業所',
      '006': '名古屋事務所',
    };
    
    // 車両費補助科目（インボイス対応別）
    const vehicleSubAccounts: Record<string, string> = {
      '001': '課税事業者', // インボイス対応
      '002': '免税事業者', // インボイス非対応
    };
    
    // 租税公課補助科目
    const taxSubAccounts: Record<string, string> = {
      '001': '通常',
    };
    
    // 現金補助科目として使用される場合が多いのでデフォルトとする
    return cashSubAccounts[subAccountCode] || 
           vehicleSubAccounts[subAccountCode] || 
           taxSubAccounts[subAccountCode] || 
           `補助科目${subAccountCode}`;
  }
}

/**
 * カテゴリマスターテーブル機能の無効化
 * 既存のカテゴリベースルールを経費種別パターンに変換
 */
export function migrateCategoryRulesToExpenseTypePatterns(
  categoryRules: any[]
): AccountAssignmentRule[] {
  const categoryToExpenseTypeMapping: Record<string, string[]> = {
    'welfare': ['福利厚生', '健康保険', '厚生年金'],
    'benefits': ['福利厚生', '手当', '給付'],
    'travel': ['交通費', '旅費', '電車代'],
    'transportation': ['交通費', 'バス代', '運賃'],
    'fuel': ['ガソリン代', '燃料費'],
    'parking': ['駐車場代', 'パーキング代'],
    'tax': ['印紙税', '登録免許税', '固定資産税'],
    'dues': ['税金', '公課', '手数料'],
    'communication': ['通信費', '電話代', 'インターネット'],
    'office_supplies': ['事務用品', '消耗品', '文房具'],
    'entertainment': ['接待費', '会食費', '贈答品'],
    'meeting': ['会議費', '研修費', 'セミナー'],
  };

  return categoryRules.map((rule, index) => {
    const expenseTypePatterns: string[] = [];
    
    // カテゴリを経費種別パターンに変換
    if (rule.conditions?.categories) {
      rule.conditions.categories.forEach((category: string) => {
        const patterns = categoryToExpenseTypeMapping[category];
        if (patterns) {
          expenseTypePatterns.push(...patterns);
        } else {
          // 未知のカテゴリの場合はそのまま使用
          expenseTypePatterns.push(category);
        }
      });
    }

    return {
      id: rule.id || `migrated-rule-${index}`,
      name: rule.name || `移行ルール${index + 1}`,
      description: `カテゴリベースルールから移行: ${rule.description || ''}`,
      conditions: {
        expenseTypePatterns,
        merchantPatterns: rule.conditions?.merchantPatterns,
        amountRange: rule.conditions?.amountRange,
        keywords: rule.conditions?.keywords,
        receiptContentPatterns: rule.conditions?.receiptContentPatterns,
      },
      assignment: rule.assignment,
      priority: rule.priority || (index + 1),
      isActive: rule.isActive !== false,
      effectiveFrom: rule.effectiveFrom || new Date(),
      effectiveTo: rule.effectiveTo,
      createdAt: rule.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: rule.createdBy || 'system-migration',
    } as AccountAssignmentRule;
  });
}

/**
 * PCA準拠性向上のための勘定科目コード検証
 */
export function validatePCAAccountCode(accountCode: string): boolean {
  const validPCAAccountCodes = [
    '111', // 現金
    '724', // 福利厚生費
    '726', // 旅費交通費
    '727', // 通信費
    '729', // 車両費
    '731', // 運賃
    '733', // 交際接待費
    '734', // 会議費
    '737', // 消耗品費
    '738', // 租税公課
    '754', // 事務用消耗品費
  ];
  
  return validPCAAccountCodes.includes(accountCode);
}

/**
 * PCA準拠性向上のための税区分コード検証
 */
export function validatePCATaxCode(taxCode: string): boolean {
  const validPCATaxCodes = ['Q5', 'Q6', 'QD', 'QE', 'P0', '00'];
  return validPCATaxCodes.includes(taxCode);
}

/**
 * 経費種別から推奨勘定科目コードを取得
 */
export function getRecommendedAccountCodeByExpenseType(expenseType: string): string | null {
  const expenseTypeToAccountMapping: Record<string, string> = {
    '福利厚生': '724',
    '健康保険': '724',
    '厚生年金': '724',
    '交通費': '726',
    '旅費': '726',
    '電車代': '726',
    'バス代': '726',
    '通信費': '727',
    '電話代': '727',
    'インターネット': '727',
    '駐車場代': '729',
    'ガソリン代': '729',
    '高速代': '729',
    '運賃': '731',
    '宅配便': '731',
    '接待費': '733',
    '会食費': '733',
    '会議費': '734',
    '研修費': '734',
    '消耗品': '737',
    '事務用品': '737',
    '印紙税': '738',
    '登録免許税': '738',
    '固定資産税': '738',
    '事務用消耗品': '754',
  };

  return expenseTypeToAccountMapping[expenseType] || null;
}

// シングルトンインスタンス
export const ruleApplicationEngine = new RuleApplicationEngine();