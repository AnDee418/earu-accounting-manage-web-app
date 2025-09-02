import { BaseEntity, ActiveEntity } from '../common';

// ルール管理の基本型定義

// ルール条件の論理演算子
export type LogicalOperator = 'AND' | 'OR';

// 条件ブロック（パズルピース）
export interface ConditionBlock {
  id: string;
  type: 'expenseType' | 'merchant' | 'keyword' | 'amount' | 'receiptContent';
  operator: LogicalOperator; // 次のブロックとの関係
  values: string[] | AmountRange;
  label: string; // ユーザー表示用
  description: string; // 説明文
  
  // UI状態管理用
  uiState?: {
    isExpanded?: boolean;
    isDragging?: boolean;
    hasError?: boolean;
    errorMessage?: string;
  };
  
  // バリデーション用
  validation?: {
    required?: boolean;
    minValues?: number;
    maxValues?: number;
    pattern?: RegExp;
  };
}

// 金額範囲の型定義
export interface AmountRange {
  min?: number;
  max?: number;
  currency?: 'JPY';
}

// 条件タイプの定義
export interface ConditionType {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  examples: string[];
  inputType: 'tags' | 'range' | 'text';
}

// パズルルールビルダーのプロパティ
export interface PuzzleRuleBuilderProps {
  initialConditions?: ConditionBlock[];
  onChange: (conditions: ConditionBlock[]) => void;
  onValidate?: (conditions: ConditionBlock[]) => ValidationResult;
  readOnly?: boolean;
  showHelp?: boolean;
}

// パズルルールビルダーの状態
export interface PuzzleRuleBuilderState {
  conditions: ConditionBlock[];
  draggedItem: string | null;
  showHelp: boolean;
  validationErrors: ValidationError[];
}

// ルール条件の基本インターフェース
export interface RuleConditions {
  // 新しいパズルピース型条件
  conditionBlocks?: ConditionBlock[];
  
  // 従来の条件（後方互換性のため残す）
  expenseTypePatterns?: string[]; // 経費種別パターン（駐車場代、交通費など）
  merchantPatterns?: string[]; // 取引先パターン（正規表現）
  amountRange?: { min?: number; max?: number }; // 金額範囲
  keywords?: string[]; // 摘要キーワード
  receiptContentPatterns?: string[]; // 領収書内容パターン
}

// ルールフィルター
export interface RuleFilters {
  isActive?: boolean;
  effectiveDate?: Date;
  ruleType?: string;
  search?: string;
}

// 検証結果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  context?: Record<string, any>;
}

// テスト結果
export interface TestResult {
  success: boolean;
  processedCount: number;
  successCount: number;
  failureCount: number;
  results: TestCaseResult[];
  errors?: string[];
}

// 領収書データ（テスト用）
export interface ReceiptData {
  id: string;
  merchant?: string;
  amount?: number;
  accountCode?: string; // 勘定科目コード
  description?: string;
  date?: string;
  keywords?: string[];
  taxRate?: number;
  invoiceCompliant?: boolean;
}

export interface TestCaseResult {
  input: ReceiptData;
  matched: boolean;
  assignment?: {
    debitAccountCode: string;
    creditAccountCode: string;
    debitSubAccountCode?: string;
    creditSubAccountCode?: string;
  };
  taxAssignment?: {
    debitTaxCode: string;
    creditTaxCode: string;
  };
  reason?: string;
  error?: string;
}

// 競合結果
export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: RuleConflict[];
}

export interface RuleConflict {
  existingRuleId: string;
  conflictType: 'duplicate' | 'overlap' | 'contradiction';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

// PCA準拠性結果
export interface ComplianceResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  code: string;
  description: string;
  field: string;
  severity: 'error' | 'warning';
}

// 検証レポート
export interface ValidationReport {
  timestamp: Date;
  ruleSetVersion: string;
  overallStatus: 'valid' | 'invalid' | 'warning';
  summary: {
    totalRules: number;
    validRules: number;
    invalidRules: number;
    warningRules: number;
  };
  details: ValidationResult[];
  recommendations: string[];
}

// 1. 勘定科目自動割り当てルール
export interface AccountAssignmentRule extends ActiveEntity {
  name: string; // ルール名
  description?: string;
  
  // 条件設定
  conditions: RuleConditions;
  
  // 割り当て設定
  assignment: {
    debitAccountCode: string; // 借方勘定科目コード
    creditAccountCode: string; // 貸方勘定科目コード（通常は現金）
    debitSubAccountCode?: string; // 借方補助科目コード
    creditSubAccountCode?: string; // 貸方補助科目コード
  };
  
  priority: number; // 優先度（数値が小さいほど優先）
  createdBy: string;
}

// 2. 税区分自動判定ルール
export interface TaxAssignmentRule extends ActiveEntity {
  name: string;
  description?: string;
  
  // 判定条件
  conditions: {
    taxRate?: number; // 税率 (0.10, 0.08)
    invoiceCompliant?: boolean; // インボイス対応
    accountCodes: string[]; // 対象勘定科目コード（必須）
    specialAccountHandling?: { // 特別処理が必要な勘定科目
      '738': 'P0'; // 租税公課は常にP0（非仕入）
      '111': '00'; // 現金は常に00（対象外）
    };
  };
  
  // 税区分割り当て
  assignment: {
    debitTaxCode: string; // 借方税区分コード (Q5, Q6, QD, QE, P0, 00)
    creditTaxCode: string; // 貸方税区分コード (通常は00)
  };
  
  priority: number;
  createdBy: string;
}

// 3. 部門・現金補助科目マッピング設定
export interface DepartmentCashMapping extends ActiveEntity {
  departmentCode: string; // 部門コード (1, 2, 3, 4, 5, 6)
  departmentName: string; // 部門名
  cashAuxiliaryCode: string; // 現金補助科目コード (001, 002, 003, 005, 006)
  cashAuxiliaryName: string; // 現金補助科目名
  createdBy: string;
}

// 4. データフォーマット設定
export interface DataFormatSettings extends ActiveEntity {
  // 日付フォーマット
  dateFormat: string; // 'YYYYMMDD'
  
  // 摘要フォーマット
  descriptionTemplate: string; // '[{expenseType} {merchant}]'
  
  // 固定値設定
  fixedValues: {
    programClassification: string; // '2'
    taxAmountHandling: 'blank' | 'calculated'; // 'blank' (内税計算のため空欄)
    amountType: 'tax_inclusive'; // 税込金額
  };
  
  // 検証ルール
  validation: {
    requiredFields: string[];
    maxAmountDigits: number;
    allowedCurrencies: string[];
  };
  
  createdBy: string;
}

// 5. 包括的ルールセット
export interface ComprehensiveRuleSet extends BaseEntity {
  accountAssignmentRules: AccountAssignmentRule[];
  taxAssignmentRules: TaxAssignmentRule[];
  departmentCashMappings: DepartmentCashMapping[];
  formatSettings: DataFormatSettings;
  
  // メタデータ
  version: string;
  lastValidated: Date;
  validationStatus: 'valid' | 'invalid' | 'warning';
  validationErrors: ValidationError[];
  
  // 統計情報
  statistics: {
    totalRules: number;
    activeRules: number;
    lastApplied: Date;
    successRate: number;
  };
}

// ルール適用結果
export interface AccountAssignment {
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountCode: string;
  creditAccountName: string;
  debitSubAccountCode?: string;
  debitSubAccountName?: string;
  creditSubAccountCode?: string;
  creditSubAccountName?: string;
  appliedRuleId: string;
  confidence: number;
}

export interface TaxAssignment {
  debitTaxCode: string;
  debitTaxName: string;
  creditTaxCode: string;
  creditTaxName: string;
  appliedRuleId: string;
  confidence: number;
}

export interface DepartmentAssignment {
  departmentCode: string;
  departmentName: string;
  cashAuxiliaryCode: string;
  cashAuxiliaryName: string;
  appliedRuleId: string;
}

export interface FormattedData {
  date: string; // YYYYMMDD format
  description: string; // [expenseType merchant] format
  programClassification: string; // '2'
  taxAmountHandling: 'blank' | 'calculated';
  amountType: 'tax_inclusive';
}

// 処理用領収書データ（ルール適用用）
export interface ProcessingReceiptData {
  id: string;
  merchant: string;
  expenseType?: string; // 経費種別（駐車場代、交通費など）
  amount: number;
  taxAmount?: number;
  taxRate?: number;
  date: Date;
  description?: string;
  invoiceCompliant?: boolean;
  userId: string;
  departmentCode?: string;
}

// 処理済み領収書データ
export interface ProcessedReceiptData extends ProcessingReceiptData {
  accountAssignment: AccountAssignment;
  taxAssignment: TaxAssignment;
  departmentAssignment: DepartmentAssignment;
  formattedData: FormattedData;
}

// ルール管理インターフェース
export interface AccountAssignmentRuleManager {
  createRule(rule: Omit<AccountAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
  updateRule(id: string, rule: Partial<AccountAssignmentRule>): Promise<void>;
  deleteRule(id: string): Promise<void>;
  getRules(filters?: RuleFilters): Promise<AccountAssignmentRule[]>;
  validateRule(rule: AccountAssignmentRule): ValidationResult;
  testRule(rule: AccountAssignmentRule, testData: ReceiptData[]): TestResult;
}

export interface TaxAssignmentRuleManager {
  createRule(rule: Omit<TaxAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
  updateRule(id: string, rule: Partial<TaxAssignmentRule>): Promise<void>;
  deleteRule(id: string): Promise<void>;
  getRules(filters?: RuleFilters): Promise<TaxAssignmentRule[]>;
  validateRule(rule: TaxAssignmentRule): ValidationResult;
  testRule(rule: TaxAssignmentRule, testData: ReceiptData[]): TestResult;
}

export interface DepartmentCashMappingManager {
  createMapping(mapping: Omit<DepartmentCashMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
  updateMapping(id: string, mapping: Partial<DepartmentCashMapping>): Promise<void>;
  deleteMapping(id: string): Promise<void>;
  getMappings(): Promise<DepartmentCashMapping[]>;
  validateMapping(mapping: DepartmentCashMapping): ValidationResult;
}

export interface DataFormatSettingsManager {
  getSettings(): Promise<DataFormatSettings>;
  updateSettings(settings: Partial<DataFormatSettings>): Promise<void>;
  validateSettings(settings: DataFormatSettings): ValidationResult;
  resetToDefaults(): Promise<void>;
}

export interface RuleValidator {
  validateRuleSet(rules: ComprehensiveRuleSet): ValidationResult;
  checkRuleConflicts(newRule: AccountAssignmentRule | TaxAssignmentRule, existingRules: (AccountAssignmentRule | TaxAssignmentRule)[]): ConflictResult;
  validatePCACompliance(rules: ComprehensiveRuleSet): ComplianceResult;
  generateValidationReport(): ValidationReport;
}

export interface RuleEngine {
  applyAccountRules(receiptData: ReceiptData): AccountAssignment;
  applyTaxRules(receiptData: ReceiptData, accountInfo: AccountAssignment): TaxAssignment;
  applyDepartmentRules(userId: string, receiptData: ReceiptData): DepartmentAssignment;
  applyFormatRules(processedData: ProcessedReceiptData): FormattedData;
  generateDescription(receiptData: ReceiptData): string;
}

// Firestore コレクション名の定数
export const RULE_COLLECTIONS = {
  ACCOUNT_ASSIGNMENT_RULES: 'accountAssignmentRules',
  TAX_ASSIGNMENT_RULES: 'taxAssignmentRules',
  DEPARTMENT_CASH_MAPPINGS: 'departmentCashMappings',
  DATA_FORMAT_SETTINGS: 'dataFormatSettings',
  RULE_SETS: 'ruleSets',
} as const;

// デフォルト設定
export const DEFAULT_DATA_FORMAT_SETTINGS: Omit<DataFormatSettings, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  dateFormat: 'YYYYMMDD',
  descriptionTemplate: '[{expenseType}代　{merchant}]',
  fixedValues: {
    programClassification: '2',
    taxAmountHandling: 'blank',
    amountType: 'tax_inclusive',
  },
  validation: {
    requiredFields: ['date', 'debitAccountCode', 'creditAccountCode', 'amount', 'description'],
    maxAmountDigits: 10,
    allowedCurrencies: ['JPY'],
  },
  isActive: true,
  effectiveFrom: new Date(),
};

// PCA税区分コード定数
export const PCA_TAX_CODES = {
  // 10%税率
  Q5: '仕入10%', // インボイス対応
  QD: '仕入10%', // インボイス非対応
  
  // 8%税率
  Q6: '仕入8%', // インボイス対応
  QE: '仕入8%', // インボイス非対応
  
  // 非課税・免税
  P0: '対象外', // 租税公課等
  '00': '対象外', // 現金取引等
} as const;

// PCA準拠の勘定科目マスター（経費種別パターンマッピング）
export const PCA_ACCOUNT_MAPPINGS = {
  '724': { name: '福利厚生費', expenseTypes: ['福利厚生', '健康保険', '厚生年金', '労災保険', '雇用保険'] },
  '726': { name: '旅費交通費', expenseTypes: ['交通費', '旅費', '電車代', 'バス代', '運賃', '乗車券', '定期券'] },
  '727': { name: '通信費', expenseTypes: ['通信費', '電話代', 'インターネット', '携帯電話', 'プロバイダ'] },
  '729': { name: '車両費', expenseTypes: ['駐車場代', 'ガソリン代', '高速代', '車検代', '自動車保険'] },
  '731': { name: '運賃', expenseTypes: ['宅配便', '郵送料', '配送料', '運送費'] },
  '733': { name: '交際接待費', expenseTypes: ['接待費', '会食費', '贈答品', 'お中元', 'お歳暮'] },
  '734': { name: '会議費', expenseTypes: ['会議費', '研修費', 'セミナー', '講習会'] },
  '737': { name: '消耗品費', expenseTypes: ['消耗品', '事務用品', '文房具', '用紙', 'トナー'] },
  '738': { name: '租税公課', expenseTypes: ['印紙税', '登録免許税', '固定資産税', '自動車税', '住民税'] },
  '754': { name: '事務用消耗品費', expenseTypes: ['事務用消耗品', 'コピー用紙', 'ファイル', 'ペン', 'ノート'] },
} as const;

// 部門・現金補助科目マッピングのデフォルト値（PCA仕様準拠）
export const DEFAULT_DEPARTMENT_MAPPINGS: Omit<DepartmentCashMapping, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    departmentCode: '1',
    departmentName: '札幌支店',
    cashAuxiliaryCode: '001',
    cashAuxiliaryName: '札幌支店',
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    departmentCode: '2',
    departmentName: '仙台事業所',
    cashAuxiliaryCode: '002',
    cashAuxiliaryName: '仙台事業所',
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    departmentCode: '3',
    departmentName: '東京支店',
    cashAuxiliaryCode: '003',
    cashAuxiliaryName: '東京支店',
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    departmentCode: '4',
    departmentName: '福岡事業所',
    cashAuxiliaryCode: '004',
    cashAuxiliaryName: '福岡事業所',
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    departmentCode: '5',
    departmentName: '大阪事業所',
    cashAuxiliaryCode: '005',
    cashAuxiliaryName: '大阪事業所',
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    departmentCode: '6',
    departmentName: '名古屋事務所',
    cashAuxiliaryCode: '006',
    cashAuxiliaryName: '名古屋事務所',
    isActive: true,
    effectiveFrom: new Date(),
  },
];

// PCA準拠のデフォルト勘定科目割り当てルール
export const DEFAULT_ACCOUNT_ASSIGNMENT_RULES: Omit<AccountAssignmentRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: '福利厚生費自動割り当てルール',
    description: '福利厚生関連の経費を自動的に福利厚生費に割り当て',
    conditions: {
      expenseTypePatterns: ['福利厚生', '健康保険', '厚生年金', '労災保険', '雇用保険'],
      merchantPatterns: ['.*保険.*', '.*年金.*', '.*共済.*'],
      keywords: ['保険料', '年金', '共済', '福利厚生'],
    },
    assignment: {
      debitAccountCode: '724',
      creditAccountCode: '111',
    },
    priority: 1,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '旅費交通費自動割り当てルール',
    description: '交通費・旅費を自動的に旅費交通費に割り当て',
    conditions: {
      expenseTypePatterns: ['交通費', '旅費', '電車代', 'バス代', '運賃', '乗車券', '定期券'],
      merchantPatterns: ['JR.*', '.*地下鉄.*', '.*バス.*', '.*私鉄.*', '.*電鉄.*'],
      keywords: ['乗車券', '定期券', '回数券', '交通費', '運賃'],
    },
    assignment: {
      debitAccountCode: '726',
      creditAccountCode: '111',
    },
    priority: 2,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '通信費自動割り当てルール',
    description: '通信関連費用を自動的に通信費に割り当て',
    conditions: {
      expenseTypePatterns: ['通信費', '電話代', 'インターネット', '携帯電話', 'プロバイダ'],
      merchantPatterns: ['.*テレコム.*', '.*通信.*', '.*モバイル.*', '.*プロバイダ.*'],
      keywords: ['電話料金', 'インターネット', '通信費', '携帯'],
    },
    assignment: {
      debitAccountCode: '727',
      creditAccountCode: '111',
    },
    priority: 3,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '車両費（インボイス対応）自動割り当てルール',
    description: 'インボイス対応の車両関連費用を自動的に車両費に割り当て',
    conditions: {
      expenseTypePatterns: ['駐車場代', 'ガソリン代', '高速代', '車検代', '自動車保険'],
      merchantPatterns: ['.*駐車場.*', '.*SS.*', '.*石油.*', '.*ENEOS.*', '.*出光.*'],
      keywords: ['駐車場', 'ガソリン', '高速道路', '車検', '自動車'],
    },
    assignment: {
      debitAccountCode: '729',
      debitSubAccountCode: '001', // 課税事業者（インボイス対応）
      creditAccountCode: '111',
    },
    priority: 4,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '車両費（インボイス非対応）自動割り当てルール',
    description: 'インボイス非対応の車両関連費用を自動的に車両費に割り当て',
    conditions: {
      expenseTypePatterns: ['駐車場代', 'ガソリン代', '高速代'],
      merchantPatterns: ['.*駐車場.*', '.*個人.*'],
      keywords: ['駐車場', 'ガソリン', '個人事業主'],
    },
    assignment: {
      debitAccountCode: '729',
      debitSubAccountCode: '002', // 免税事業者（インボイス非対応）
      creditAccountCode: '111',
    },
    priority: 5,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '租税公課自動割り当てルール',
    description: '税金・公課を自動的に租税公課に割り当て',
    conditions: {
      expenseTypePatterns: ['印紙税', '登録免許税', '固定資産税', '自動車税', '住民税'],
      merchantPatterns: ['.*税務署.*', '.*市役所.*', '.*区役所.*', '.*法務局.*'],
      keywords: ['印紙', '税金', '登録', '固定資産', '自動車税'],
    },
    assignment: {
      debitAccountCode: '738',
      debitSubAccountCode: '001', // 通常
      creditAccountCode: '111',
    },
    priority: 6,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '消耗品費自動割り当てルール',
    description: '消耗品を自動的に消耗品費に割り当て',
    conditions: {
      expenseTypePatterns: ['消耗品', '事務用品', '文房具', '用紙', 'トナー'],
      merchantPatterns: ['.*文具.*', '.*オフィス.*', '.*事務.*', '.*コクヨ.*'],
      keywords: ['消耗品', '文房具', '事務用品', 'コピー用紙'],
    },
    assignment: {
      debitAccountCode: '737',
      creditAccountCode: '111',
    },
    priority: 7,
    isActive: true,
    effectiveFrom: new Date(),
  },
];

// PCA準拠のデフォルト税区分割り当てルール
export const DEFAULT_TAX_ASSIGNMENT_RULES: Omit<TaxAssignmentRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: '租税公課専用税区分ルール',
    description: '租税公課は常に非仕入（P0）を適用',
    conditions: {
      accountCodes: ['738'],
    },
    assignment: {
      debitTaxCode: 'P0',
      creditTaxCode: '00',
    },
    priority: 1,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '10%税率インボイス対応ルール',
    description: '10%税率でインボイス対応の場合はQ5を適用',
    conditions: {
      taxRate: 0.10,
      invoiceCompliant: true,
      accountCodes: ['724', '726', '727', '729', '731', '733', '734', '737', '754'],
    },
    assignment: {
      debitTaxCode: 'Q5',
      creditTaxCode: '00',
    },
    priority: 2,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '10%税率インボイス非対応ルール',
    description: '10%税率でインボイス非対応の場合はQDを適用',
    conditions: {
      taxRate: 0.10,
      invoiceCompliant: false,
      accountCodes: ['724', '726', '727', '729', '731', '733', '734', '737', '754'],
    },
    assignment: {
      debitTaxCode: 'QD',
      creditTaxCode: '00',
    },
    priority: 3,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '8%税率インボイス対応ルール',
    description: '8%税率でインボイス対応の場合はQ6を適用',
    conditions: {
      taxRate: 0.08,
      invoiceCompliant: true,
      accountCodes: ['724', '726', '727', '729', '731', '733', '734', '737', '754'],
    },
    assignment: {
      debitTaxCode: 'Q6',
      creditTaxCode: '00',
    },
    priority: 4,
    isActive: true,
    effectiveFrom: new Date(),
  },
  {
    name: '8%税率インボイス非対応ルール',
    description: '8%税率でインボイス非対応の場合はQEを適用',
    conditions: {
      taxRate: 0.08,
      invoiceCompliant: false,
      accountCodes: ['724', '726', '727', '729', '731', '733', '734', '737', '754'],
    },
    assignment: {
      debitTaxCode: 'QE',
      creditTaxCode: '00',
    },
    priority: 5,
    isActive: true,
    effectiveFrom: new Date(),
  },
];