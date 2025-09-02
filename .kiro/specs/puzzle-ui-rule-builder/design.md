# Design Document

## Overview

パズル型ルール条件ビルダーは、従来の複雑なフォーム入力を、視覚的で直感的なパズルピース組み立て体験に変換します。各条件タイプを色分けされたカードとして表現し、論理演算子を視覚的な接続線で表現することで、「サルでもわかる」レベルの分かりやすさを実現します。

## Architecture

### Component Structure

```
PuzzleRuleBuilder (メインコンポーネント)
├── ConditionPalette (条件タイプ選択パレット)
├── ConditionCanvas (条件ブロック配置エリア)
│   ├── ConditionBlock (個別条件ブロック)
│   │   ├── ConditionHeader (アイコン・タイトル・削除ボタン)
│   │   ├── ConditionInput (条件値入力エリア)
│   │   └── LogicalConnector (論理演算子選択)
│   └── DropZone (ドロップ可能エリア)
├── RulePreview (自然言語プレビュー)
└── HelpPanel (使い方説明)
```

### Data Flow

1. **条件追加**: ConditionPalette → ConditionCanvas
2. **条件編集**: ConditionBlock → Parent State
3. **順序変更**: DragDrop → ConditionCanvas → Parent State
4. **プレビュー更新**: State Change → RulePreview
5. **保存**: Parent State → Backend (両形式で保存)

## Components and Interfaces

### 1. PuzzleRuleBuilder (メインコンポーネント)

```typescript
interface PuzzleRuleBuilderProps {
  initialConditions?: ConditionBlock[];
  onChange: (conditions: ConditionBlock[]) => void;
  onValidate?: (conditions: ConditionBlock[]) => ValidationResult;
  readOnly?: boolean;
  showHelp?: boolean;
}

interface PuzzleRuleBuilderState {
  conditions: ConditionBlock[];
  draggedItem: string | null;
  showHelp: boolean;
  validationErrors: ValidationError[];
}
```

### 2. ConditionPalette (条件選択パレット)

```typescript
interface ConditionType {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  examples: string[];
  inputType: 'tags' | 'range' | 'text';
}

const CONDITION_TYPES: Record<string, ConditionType> = {
  expenseType: {
    id: 'expenseType',
    label: '経費種別',
    description: '領収書の経費種別（駐車場代、交通費など）',
    icon: '💰',
    color: '#4CAF50',
    examples: ['駐車場代', '交通費', 'ガソリン代', '通信費'],
    inputType: 'tags'
  },
  merchant: {
    id: 'merchant',
    label: '取引先',
    description: '支払先の会社名や店舗名',
    icon: '🏪',
    color: '#2196F3',
    examples: ['JR東日本', 'セブンイレブン', 'ENEOS', 'NTT'],
    inputType: 'tags'
  },
  // ... 他の条件タイプ
};
```

### 3. ConditionBlock (条件ブロック)

```typescript
interface ConditionBlockProps {
  condition: ConditionBlock;
  index: number;
  isLast: boolean;
  onUpdate: (id: string, updates: Partial<ConditionBlock>) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

// 視覚的デザイン仕様
const BlockDesign = {
  borderRadius: '12px',
  borderWidth: '3px',
  padding: '16px',
  minHeight: '120px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  hoverEffect: '0 6px 20px rgba(0,0,0,0.15)',
  dragEffect: '0 8px 25px rgba(0,0,0,0.2)'
};
```

### 4. LogicalConnector (論理演算子接続部)

```typescript
interface LogicalConnectorProps {
  operator: LogicalOperator;
  onChange: (operator: LogicalOperator) => void;
  position: 'between' | 'end';
}

// 視覚的表現
const ConnectorStyles = {
  AND: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    label: 'AND (すべて満たす)',
    lineStyle: 'solid',
    lineWidth: '4px'
  },
  OR: {
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    label: 'OR (どれか満たす)',
    lineStyle: 'dashed',
    lineWidth: '4px'
  }
};
```

### 5. RulePreview (自然言語プレビュー)

```typescript
interface RulePreviewProps {
  conditions: ConditionBlock[];
  className?: string;
}

// 自然言語生成ロジック
const generateNaturalLanguage = (conditions: ConditionBlock[]): string => {
  return conditions.map((condition, index) => {
    const typeLabel = CONDITION_TYPES[condition.type].label;
    const values = formatConditionValues(condition);
    const connector = index < conditions.length - 1 
      ? ` ${condition.operator} ` 
      : '';
    
    return `${typeLabel} (${values})${connector}`;
  }).join('');
};
```

## Data Models

### Enhanced ConditionBlock

```typescript
interface ConditionBlock {
  id: string;
  type: 'expenseType' | 'merchant' | 'keyword' | 'amount' | 'receiptContent';
  operator: LogicalOperator;
  values: string[] | AmountRange;
  label: string;
  description: string;
  
  // UI状態管理用
  uiState?: {
    isExpanded: boolean;
    isDragging: boolean;
    hasError: boolean;
    errorMessage?: string;
  };
  
  // バリデーション用
  validation?: {
    required: boolean;
    minValues: number;
    maxValues: number;
    pattern?: RegExp;
  };
}

interface AmountRange {
  min?: number;
  max?: number;
  currency: 'JPY';
}
```

### Backward Compatibility Mapping

```typescript
// 従来形式 → パズルブロック形式への変換
const convertLegacyToBlocks = (conditions: RuleConditions): ConditionBlock[] => {
  const blocks: ConditionBlock[] = [];
  
  if (conditions.expenseTypePatterns?.length) {
    blocks.push({
      id: generateId(),
      type: 'expenseType',
      operator: 'AND',
      values: conditions.expenseTypePatterns,
      label: '経費種別',
      description: '領収書の経費種別パターン'
    });
  }
  
  // 他の条件タイプも同様に変換
  return blocks;
};

// パズルブロック形式 → 従来形式への変換
const convertBlocksToLegacy = (blocks: ConditionBlock[]): RuleConditions => {
  const conditions: RuleConditions = {
    conditionBlocks: blocks,
    // 後方互換性のため従来形式も生成
    expenseTypePatterns: [],
    merchantPatterns: [],
    keywords: [],
    receiptContentPatterns: []
  };
  
  blocks.forEach(block => {
    switch (block.type) {
      case 'expenseType':
        conditions.expenseTypePatterns!.push(...(block.values as string[]));
        break;
      // 他のタイプも同様に処理
    }
  });
  
  return conditions;
};
```

## Error Handling

### Validation Rules

```typescript
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
}

const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  expenseType: [
    {
      type: 'required',
      message: '経費種別を1つ以上入力してください'
    },
    {
      type: 'minLength',
      message: '経費種別は2文字以上で入力してください'
    }
  ],
  amount: [
    {
      type: 'custom',
      message: '最小金額は最大金額より小さくしてください',
      validator: (range: AmountRange) => 
        !range.min || !range.max || range.min < range.max
    }
  ]
};
```

### Error Display Strategy

1. **リアルタイム検証**: 入力中に即座にエラー表示
2. **視覚的フィードバック**: エラーブロックは赤枠で強調
3. **具体的メッセージ**: 何をどう修正すべきかを明確に表示
4. **段階的ガイド**: エラー解決のステップを提示

## Testing Strategy

### Unit Tests

```typescript
describe('PuzzleRuleBuilder', () => {
  describe('条件ブロック操作', () => {
    test('条件ブロックを追加できる', () => {
      // テストケース実装
    });
    
    test('条件ブロックを削除できる', () => {
      // テストケース実装
    });
    
    test('論理演算子を変更できる', () => {
      // テストケース実装
    });
  });
  
  describe('データ変換', () => {
    test('従来形式からパズルブロック形式に変換できる', () => {
      // テストケース実装
    });
    
    test('パズルブロック形式から従来形式に変換できる', () => {
      // テストケース実装
    });
  });
  
  describe('バリデーション', () => {
    test('必須条件の検証が動作する', () => {
      // テストケース実装
    });
    
    test('金額範囲の検証が動作する', () => {
      // テストケース実装
    });
  });
});
```

### Integration Tests

```typescript
describe('RuleFormDialog Integration', () => {
  test('パズルUIで作成したルールが正しく保存される', () => {
    // 統合テスト実装
  });
  
  test('既存ルールがパズルUIで正しく表示される', () => {
    // 統合テスト実装
  });
  
  test('ルールエンジンがパズル形式の条件を正しく評価する', () => {
    // 統合テスト実装
  });
});
```

### User Experience Tests

```typescript
describe('UX Tests', () => {
  test('初心者ユーザーが5分以内にルールを作成できる', () => {
    // UXテスト実装（自動化可能な部分）
  });
  
  test('複雑なルール条件が視覚的に理解しやすい', () => {
    // スクリーンショット比較テスト
  });
  
  test('ドラッグ&ドロップが直感的に動作する', () => {
    // インタラクションテスト
  });
});
```

## Performance Considerations

### Optimization Strategies

1. **仮想化**: 大量の条件ブロックに対応するため仮想スクロール実装
2. **メモ化**: 重い計算処理（自然言語生成等）のメモ化
3. **遅延読み込み**: 条件タイプの例示データの遅延読み込み
4. **デバウンス**: リアルタイム検証の適切なデバウンス設定

### Memory Management

```typescript
// メモリリーク防止のためのクリーンアップ
useEffect(() => {
  return () => {
    // イベントリスナーの削除
    // タイマーのクリア
    // 重いオブジェクトの解放
  };
}, []);
```

## Accessibility

### WCAG 2.1 AA準拠

1. **キーボードナビゲーション**: 全機能をキーボードで操作可能
2. **スクリーンリーダー対応**: 適切なARIAラベルとロール設定
3. **色覚対応**: 色だけでなく形状・テキストでも情報伝達
4. **コントラスト比**: 4.5:1以上のコントラスト比確保

### Implementation

```typescript
// アクセシビリティ属性の例
<div
  role="button"
  tabIndex={0}
  aria-label={`${condition.label}条件ブロック`}
  aria-describedby={`condition-help-${condition.id}`}
  onKeyDown={handleKeyDown}
>
  {/* ブロック内容 */}
</div>
```

## Migration Strategy

### Phase 1: 並行運用
- 既存UIとパズルUIを並行提供
- ユーザーが選択可能

### Phase 2: 段階的移行
- 新規ルール作成はパズルUIのみ
- 既存ルール編集時にパズルUIに誘導

### Phase 3: 完全移行
- 従来UIの廃止
- データ形式の統一

## Security Considerations

### Input Validation
- XSS攻撃防止のための入力サニタイズ
- 正規表現インジェクション防止
- ファイルアップロード制限

### Data Protection
- 機密情報の適切なマスキング
- ログ出力時の個人情報除外
- セッション管理の強化