/**
 * カテゴリ概念削除とPCA準拠性向上のための移行ユーティリティ
 * 
 * このファイルは既存のカテゴリベースルールを経費種別パターンベースルールに
 * 移行するためのユーティリティ関数を提供します。
 */

import { 
  AccountAssignmentRule, 
  TaxAssignmentRule,
  DEFAULT_ACCOUNT_ASSIGNMENT_RULES,
  DEFAULT_TAX_ASSIGNMENT_RULES,
  PCA_ACCOUNT_MAPPINGS
} from '../../types/rules';

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

/**
 * PCA準拠のデフォルトルールセットを生成
 */
export function generatePCACompliantRuleSet(): {
  accountRules: AccountAssignmentRule[];
  taxRules: TaxAssignmentRule[];
} {
  return {
    accountRules: DEFAULT_ACCOUNT_ASSIGNMENT_RULES.map((rule, index) => ({
      ...rule,
      id: `pca-account-rule-${index + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system-pca-migration',
    })),
    taxRules: DEFAULT_TAX_ASSIGNMENT_RULES.map((rule, index) => ({
      ...rule,
      id: `pca-tax-rule-${index + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system-pca-migration',
    })),
  };
}

/**
 * カテゴリマスターテーブルの無効化
 * 既存のカテゴリマスターデータを非アクティブ化
 */
export function disableCategoryMasterTable(categories: any[]): any[] {
  return categories.map(category => ({
    ...category,
    isActive: false,
    disabledAt: new Date(),
    disabledReason: 'PCA準拠性向上のため経費種別パターンベースシステムに移行',
    updatedAt: new Date(),
  }));
}

/**
 * 移行レポートの生成
 */
export interface MigrationReport {
  totalCategoryRules: number;
  migratedRules: number;
  failedMigrations: number;
  newExpenseTypePatterns: string[];
  recommendedActions: string[];
  pcaComplianceIssues: string[];
}

export function generateMigrationReport(
  originalCategoryRules: any[],
  migratedRules: AccountAssignmentRule[]
): MigrationReport {
  const newExpenseTypePatterns = new Set<string>();
  const pcaComplianceIssues: string[] = [];
  
  migratedRules.forEach(rule => {
    rule.conditions.expenseTypePatterns?.forEach(pattern => {
      newExpenseTypePatterns.add(pattern);
    });
    
    // PCA準拠性チェック
    if (!validatePCAAccountCode(rule.assignment.debitAccountCode)) {
      pcaComplianceIssues.push(
        `ルール "${rule.name}": 無効な借方勘定科目コード ${rule.assignment.debitAccountCode}`
      );
    }
    
    if (!validatePCAAccountCode(rule.assignment.creditAccountCode)) {
      pcaComplianceIssues.push(
        `ルール "${rule.name}": 無効な貸方勘定科目コード ${rule.assignment.creditAccountCode}`
      );
    }
  });

  const recommendedActions: string[] = [
    '1. 移行されたルールの動作確認を実施してください',
    '2. 経費種別パターンの精度向上のため、実際の領収書データでテストしてください',
    '3. PCA準拠性の問題がある場合は、該当ルールを修正してください',
    '4. カテゴリマスターテーブルの無効化を実行してください',
    '5. 新しいルールセットでの運用テストを実施してください',
  ];

  if (pcaComplianceIssues.length > 0) {
    recommendedActions.unshift('⚠️ PCA準拠性の問題を修正してください');
  }

  return {
    totalCategoryRules: originalCategoryRules.length,
    migratedRules: migratedRules.length,
    failedMigrations: originalCategoryRules.length - migratedRules.length,
    newExpenseTypePatterns: Array.from(newExpenseTypePatterns),
    recommendedActions,
    pcaComplianceIssues,
  };
}

/**
 * 移行実行のメイン関数
 */
export async function executeCategoryMigration(
  categoryRules: any[],
  categories: any[]
): Promise<{
  migratedRules: AccountAssignmentRule[];
  disabledCategories: any[];
  report: MigrationReport;
}> {
  // 1. カテゴリルールを経費種別パターンルールに移行
  const migratedRules = migrateCategoryRulesToExpenseTypePatterns(categoryRules);
  
  // 2. カテゴリマスターテーブルを無効化
  const disabledCategories = disableCategoryMasterTable(categories);
  
  // 3. 移行レポートを生成
  const report = generateMigrationReport(categoryRules, migratedRules);
  
  return {
    migratedRules,
    disabledCategories,
    report,
  };
}