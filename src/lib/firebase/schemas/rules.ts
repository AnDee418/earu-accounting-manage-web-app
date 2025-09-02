/**
 * ルール管理システムのFirestoreスキーマ設計
 * 
 * コレクション構造:
 * companies/{companyId}/
 *   ├── accountAssignmentRules/{ruleId}
 *   ├── taxAssignmentRules/{ruleId}
 *   ├── departmentCashMappings/{mappingId}
 *   ├── dataFormatSettings/{settingsId}
 *   └── ruleSets/{ruleSetId}
 */

import { 
  AccountAssignmentRule, 
  TaxAssignmentRule, 
  DepartmentCashMapping, 
  DataFormatSettings,
  ComprehensiveRuleSet,
  RULE_COLLECTIONS 
} from '../../../types/rules';

// Firestoreドキュメント構造の定義

/**
 * 勘定科目自動割り当てルール コレクション
 * Path: companies/{companyId}/accountAssignmentRules/{ruleId}
 */
export interface AccountAssignmentRuleDocument extends Omit<AccountAssignmentRule, 'createdAt' | 'updatedAt' | 'effectiveFrom' | 'effectiveTo'> {
  // Firestoreでは日付はTimestamp型で保存
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  effectiveFrom: FirebaseFirestore.Timestamp;
  effectiveTo?: FirebaseFirestore.Timestamp;
  
  // 会社ID（パーティション用）
  companyId: string;
  
  // インデックス用フィールド
  searchKeywords: string[]; // 検索用キーワード配列
  ruleType: 'account_assignment'; // ルール種別
}

/**
 * 税区分自動判定ルール コレクション
 * Path: companies/{companyId}/taxAssignmentRules/{ruleId}
 */
export interface TaxAssignmentRuleDocument extends Omit<TaxAssignmentRule, 'createdAt' | 'updatedAt' | 'effectiveFrom' | 'effectiveTo'> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  effectiveFrom: FirebaseFirestore.Timestamp;
  effectiveTo?: FirebaseFirestore.Timestamp;
  
  companyId: string;
  searchKeywords: string[];
  ruleType: 'tax_assignment';
}

/**
 * 部門・現金補助科目マッピング コレクション
 * Path: companies/{companyId}/departmentCashMappings/{mappingId}
 */
export interface DepartmentCashMappingDocument extends Omit<DepartmentCashMapping, 'createdAt' | 'updatedAt' | 'effectiveFrom' | 'effectiveTo'> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  effectiveFrom: FirebaseFirestore.Timestamp;
  effectiveTo?: FirebaseFirestore.Timestamp;
  
  companyId: string;
  searchKeywords: string[];
  ruleType: 'department_mapping';
}

/**
 * データフォーマット設定 コレクション
 * Path: companies/{companyId}/dataFormatSettings/{settingsId}
 */
export interface DataFormatSettingsDocument extends Omit<DataFormatSettings, 'createdAt' | 'updatedAt' | 'effectiveFrom' | 'effectiveTo'> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  effectiveFrom: FirebaseFirestore.Timestamp;
  effectiveTo?: FirebaseFirestore.Timestamp;
  
  companyId: string;
  ruleType: 'data_format';
}

/**
 * 包括的ルールセット コレクション
 * Path: companies/{companyId}/ruleSets/{ruleSetId}
 */
export interface ComprehensiveRuleSetDocument extends Omit<ComprehensiveRuleSet, 'createdAt' | 'updatedAt' | 'lastValidated' | 'statistics'> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  lastValidated: FirebaseFirestore.Timestamp;
  
  companyId: string;
  
  // 統計情報（Timestamp対応）
  statistics: {
    totalRules: number;
    activeRules: number;
    lastApplied: FirebaseFirestore.Timestamp;
    successRate: number;
  };
}

// Firestoreインデックス設計
export const FIRESTORE_INDEXES = {
  // 勘定科目割り当てルール用インデックス
  accountAssignmentRules: [
    'companyId+isActive+priority+effectiveFrom',
    'companyId+isActive+ruleType+createdAt',
    'companyId+searchKeywords+isActive',
    'companyId+createdBy+isActive',
  ],
  
  // 税区分判定ルール用インデックス
  taxAssignmentRules: [
    'companyId+isActive+priority+effectiveFrom',
    'companyId+isActive+ruleType+createdAt',
    'companyId+searchKeywords+isActive',
    'companyId+createdBy+isActive',
  ],
  
  // 部門マッピング用インデックス
  departmentCashMappings: [
    'companyId+isActive+departmentCode',
    'companyId+isActive+createdAt',
    'companyId+searchKeywords+isActive',
  ],
  
  // データフォーマット設定用インデックス
  dataFormatSettings: [
    'companyId+isActive+createdAt',
    'companyId+ruleType+isActive',
  ],
  
  // ルールセット用インデックス
  ruleSets: [
    'companyId+isActive+version',
    'companyId+validationStatus+createdAt',
  ],
} as const;

// コレクションパス生成ヘルパー
export class RuleCollectionPaths {
  constructor(private companyId: string) {}
  
  accountAssignmentRules(ruleId?: string): string {
    const basePath = `companies/${this.companyId}/${RULE_COLLECTIONS.ACCOUNT_ASSIGNMENT_RULES}`;
    return ruleId ? `${basePath}/${ruleId}` : basePath;
  }
  
  taxAssignmentRules(ruleId?: string): string {
    const basePath = `companies/${this.companyId}/${RULE_COLLECTIONS.TAX_ASSIGNMENT_RULES}`;
    return ruleId ? `${basePath}/${ruleId}` : basePath;
  }
  
  departmentCashMappings(mappingId?: string): string {
    const basePath = `companies/${this.companyId}/${RULE_COLLECTIONS.DEPARTMENT_CASH_MAPPINGS}`;
    return mappingId ? `${basePath}/${mappingId}` : basePath;
  }
  
  dataFormatSettings(settingsId?: string): string {
    const basePath = `companies/${this.companyId}/${RULE_COLLECTIONS.DATA_FORMAT_SETTINGS}`;
    return settingsId ? `${basePath}/${settingsId}` : basePath;
  }
  
  ruleSets(ruleSetId?: string): string {
    const basePath = `companies/${this.companyId}/${RULE_COLLECTIONS.RULE_SETS}`;
    return ruleSetId ? `${basePath}/${ruleSetId}` : basePath;
  }
}

// データ変換ヘルパー
export class FirestoreDataConverter {
  /**
   * TypeScript型からFirestoreドキュメント型に変換
   */
  static toFirestoreDocument<T extends { createdAt: Date; updatedAt?: Date; effectiveFrom: Date; effectiveTo?: Date }>(
    data: T,
    companyId: string
  ): Omit<T, 'createdAt' | 'updatedAt' | 'effectiveFrom' | 'effectiveTo'> & {
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt?: FirebaseFirestore.Timestamp;
    effectiveFrom: FirebaseFirestore.Timestamp;
    effectiveTo?: FirebaseFirestore.Timestamp;
    companyId: string;
  } {
    const { createdAt, updatedAt, effectiveFrom, effectiveTo, ...rest } = data;
    
    return {
      ...rest,
      createdAt: FirebaseFirestore.Timestamp.fromDate(createdAt),
      updatedAt: updatedAt ? FirebaseFirestore.Timestamp.fromDate(updatedAt) : undefined,
      effectiveFrom: FirebaseFirestore.Timestamp.fromDate(effectiveFrom),
      effectiveTo: effectiveTo ? FirebaseFirestore.Timestamp.fromDate(effectiveTo) : undefined,
      companyId,
    } as any;
  }
  
  /**
   * Firestoreドキュメント型からTypeScript型に変換
   */
  static fromFirestoreDocument<T>(
    doc: FirebaseFirestore.DocumentSnapshot
  ): T | null {
    if (!doc.exists) return null;
    
    const data = doc.data();
    if (!data) return null;
    
    // Timestampを日付に変換
    const converted = { ...data };
    if (data.createdAt?.toDate) {
      converted.createdAt = data.createdAt.toDate();
    }
    if (data.updatedAt?.toDate) {
      converted.updatedAt = data.updatedAt.toDate();
    }
    if (data.effectiveFrom?.toDate) {
      converted.effectiveFrom = data.effectiveFrom.toDate();
    }
    if (data.effectiveTo?.toDate) {
      converted.effectiveTo = data.effectiveTo.toDate();
    }
    if (data.lastValidated?.toDate) {
      converted.lastValidated = data.lastValidated.toDate();
    }
    if (data.statistics?.lastApplied?.toDate) {
      converted.statistics.lastApplied = data.statistics.lastApplied.toDate();
    }
    
    return { id: doc.id, ...converted } as T;
  }
  
  /**
   * 検索キーワード生成
   */
  static generateSearchKeywords(data: any): string[] {
    const keywords: string[] = [];
    
    if (data.name) {
      keywords.push(data.name.toLowerCase());
    }
    if (data.description) {
      keywords.push(data.description.toLowerCase());
    }
    if (data.departmentName) {
      keywords.push(data.departmentName.toLowerCase());
    }
    if (data.departmentCode) {
      keywords.push(data.departmentCode);
    }
    if (data.assignment?.debitAccountCode) {
      keywords.push(data.assignment.debitAccountCode);
    }
    if (data.assignment?.creditAccountCode) {
      keywords.push(data.assignment.creditAccountCode);
    }
    
    return [...new Set(keywords)]; // 重複除去
  }
}

// バリデーション用スキーマ
export const VALIDATION_SCHEMAS = {
  accountAssignmentRule: {
    required: ['name', 'conditions', 'assignment', 'priority', 'isActive', 'effectiveFrom', 'createdBy'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      priority: { type: 'number', minimum: 1, maximum: 999 },
      'assignment.debitAccountCode': { type: 'string', pattern: '^[0-9]{3}$' },
      'assignment.creditAccountCode': { type: 'string', pattern: '^[0-9]{3}$' },
    },
  },
  
  taxAssignmentRule: {
    required: ['name', 'conditions', 'assignment', 'priority', 'isActive', 'effectiveFrom', 'createdBy'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      priority: { type: 'number', minimum: 1, maximum: 999 },
      'assignment.debitTaxCode': { type: 'string', enum: ['Q5', 'Q6', 'QD', 'QE', 'P0', '00'] },
      'assignment.creditTaxCode': { type: 'string', enum: ['Q5', 'Q6', 'QD', 'QE', 'P0', '00'] },
    },
  },
  
  departmentCashMapping: {
    required: ['departmentCode', 'departmentName', 'cashAuxiliaryCode', 'cashAuxiliaryName', 'isActive', 'effectiveFrom', 'createdBy'],
    properties: {
      departmentCode: { type: 'string', pattern: '^[1-6]$' },
      departmentName: { type: 'string', minLength: 1, maxLength: 50 },
      cashAuxiliaryCode: { type: 'string', pattern: '^[0-9]{3}$' },
      cashAuxiliaryName: { type: 'string', minLength: 1, maxLength: 50 },
    },
  },
  
  dataFormatSettings: {
    required: ['dateFormat', 'descriptionTemplate', 'fixedValues', 'validation', 'isActive', 'effectiveFrom', 'createdBy'],
    properties: {
      dateFormat: { type: 'string', enum: ['YYYYMMDD'] },
      descriptionTemplate: { type: 'string', minLength: 1 },
      'fixedValues.programClassification': { type: 'string', enum: ['2'] },
      'fixedValues.taxAmountHandling': { type: 'string', enum: ['blank', 'calculated'] },
      'fixedValues.amountType': { type: 'string', enum: ['tax_inclusive'] },
    },
  },
} as const;