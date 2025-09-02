# ルール管理システム Firestore スキーマ設計

## 概要

このドキュメントは、会計ルール管理システムのFirestoreデータベース設計について説明します。

## コレクション構造

```
companies/{companyId}/
├── accountAssignmentRules/{ruleId}     # 勘定科目自動割り当てルール
├── taxAssignmentRules/{ruleId}         # 税区分自動判定ルール  
├── departmentCashMappings/{mappingId}  # 部門・現金補助科目マッピング
├── dataFormatSettings/{settingsId}     # データフォーマット設定
└── ruleSets/{ruleSetId}               # 包括的ルールセット
```

## 各コレクションの詳細

### 1. accountAssignmentRules (勘定科目自動割り当てルール)

**パス**: `companies/{companyId}/accountAssignmentRules/{ruleId}`

**フィールド**:
```typescript
{
  id: string;                    // ドキュメントID
  companyId: string;            // 会社ID
  name: string;                 // ルール名
  description?: string;         // 説明
  
  // 条件設定
  conditions: {
    categories?: string[];       // 対象カテゴリ
    merchantPatterns?: string[]; // 取引先パターン（正規表現）
    amountRange?: {             // 金額範囲
      min?: number;
      max?: number;
    };
    keywords?: string[];        // 摘要キーワード
  };
  
  // 割り当て設定
  assignment: {
    debitAccountCode: string;   // 借方勘定科目コード（3桁）
    creditAccountCode: string;  // 貸方勘定科目コード（3桁）
    debitSubAccountCode?: string;  // 借方補助科目コード
    creditSubAccountCode?: string; // 貸方補助科目コード
  };
  
  priority: number;             // 優先度（1-999）
  isActive: boolean;           // 有効フラグ
  effectiveFrom: Timestamp;    // 有効開始日
  effectiveTo?: Timestamp;     // 有効終了日
  createdAt: Timestamp;        // 作成日時
  updatedAt?: Timestamp;       // 更新日時
  createdBy: string;           // 作成者ID
  
  // 検索・インデックス用
  searchKeywords: string[];    // 検索キーワード配列
  ruleType: 'account_assignment'; // ルール種別
}
```

**インデックス**:
- `companyId + isActive + priority + effectiveFrom`
- `companyId + isActive + ruleType + createdAt`
- `companyId + searchKeywords + isActive`

### 2. taxAssignmentRules (税区分自動判定ルール)

**パス**: `companies/{companyId}/taxAssignmentRules/{ruleId}`

**フィールド**:
```typescript
{
  id: string;
  companyId: string;
  name: string;
  description?: string;
  
  // 判定条件
  conditions: {
    taxRate?: number;           // 税率 (0.10, 0.08)
    invoiceCompliant?: boolean; // インボイス対応
    accountCodes?: string[];    // 対象勘定科目
    categories?: string[];      // 対象カテゴリ
  };
  
  // 税区分割り当て
  assignment: {
    debitTaxCode: string;      // 借方税区分コード (Q5, Q6, QD, QE, P0, 00)
    creditTaxCode: string;     // 貸方税区分コード
  };
  
  priority: number;
  isActive: boolean;
  effectiveFrom: Timestamp;
  effectiveTo?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  createdBy: string;
  
  searchKeywords: string[];
  ruleType: 'tax_assignment';
}
```

### 3. departmentCashMappings (部門・現金補助科目マッピング)

**パス**: `companies/{companyId}/departmentCashMappings/{mappingId}`

**フィールド**:
```typescript
{
  id: string;
  companyId: string;
  departmentCode: string;      // 部門コード (1-6)
  departmentName: string;      // 部門名
  cashAuxiliaryCode: string;   // 現金補助科目コード (001, 002, 003, 005, 006)
  cashAuxiliaryName: string;   // 現金補助科目名
  
  isActive: boolean;
  effectiveFrom: Timestamp;
  effectiveTo?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  createdBy: string;
  
  searchKeywords: string[];
  ruleType: 'department_mapping';
}
```

### 4. dataFormatSettings (データフォーマット設定)

**パス**: `companies/{companyId}/dataFormatSettings/{settingsId}`

**フィールド**:
```typescript
{
  id: string;
  companyId: string;
  
  // 日付フォーマット
  dateFormat: string;          // 'YYYYMMDD'
  
  // 摘要フォーマット
  descriptionTemplate: string; // '[{category} {merchant}]'
  
  // 固定値設定
  fixedValues: {
    programClassification: string;    // '2'
    taxAmountHandling: 'blank' | 'calculated'; // 'blank'
    amountType: 'tax_inclusive';     // 税込金額
  };
  
  // 検証ルール
  validation: {
    requiredFields: string[];        // 必須フィールド
    maxAmountDigits: number;         // 金額最大桁数
    allowedCurrencies: string[];     // 許可通貨
  };
  
  isActive: boolean;
  effectiveFrom: Timestamp;
  effectiveTo?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  createdBy: string;
  
  ruleType: 'data_format';
}
```

## セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ルール管理関連のセキュリティルール
    match /companies/{companyId}/{ruleCollection}/{ruleId} {
      allow read: if isAuthenticated() && belongsToCompany(companyId);
      allow write: if isAuthenticated() && belongsToCompany(companyId) && 
                      (hasRole('finance') || hasRole('admin'));
    }
    
    // ヘルパー関数
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function belongsToCompany(companyId) {
      return request.auth.token.companyId == companyId;
    }
    
    function hasRole(role) {
      return request.auth.token.role == role;
    }
  }
}
```

## データ変換

### TypeScript型 ↔ Firestore変換

```typescript
// TypeScript → Firestore
const firestoreDoc = FirestoreDataConverter.toFirestoreDocument(rule, companyId);

// Firestore → TypeScript  
const rule = FirestoreDataConverter.fromFirestoreDocument<AccountAssignmentRule>(doc);
```

## 使用例

### ルール作成
```typescript
const ruleService = getRuleFirestoreService('company123');

const newRule: Omit<AccountAssignmentRule, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '旅費交通費自動割り当て',
  conditions: {
    categories: ['travel', 'transportation'],
    merchantPatterns: ['JR.*', '.*地下鉄.*']
  },
  assignment: {
    debitAccountCode: '726',
    creditAccountCode: '100'
  },
  priority: 1,
  isActive: true,
  effectiveFrom: new Date(),
  createdBy: 'user123'
};

const ruleId = await ruleService.createAccountAssignmentRule(newRule);
```

### ルール検索
```typescript
// アクティブなルールのみ取得
const activeRules = await ruleService.getAccountAssignmentRules({ 
  isActive: true 
});

// キーワード検索
const searchResults = await ruleService.searchRules('旅費', ['accountAssignmentRules']);
```

## パフォーマンス考慮事項

1. **インデックス最適化**: 頻繁なクエリパターンに対応したインデックスを設定
2. **キャッシュ戦略**: アクティブなルールセットをメモリキャッシュ
3. **バッチ処理**: 複数ルールの一括操作をサポート
4. **ページネーション**: 大量データの効率的な取得

## 監査・ログ

- 全ての変更操作は監査ログに記録
- ルール適用結果の統計情報を収集
- エラー発生時の詳細ログを保存