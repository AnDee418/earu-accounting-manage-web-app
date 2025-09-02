# ドラッグ&ドロップ機能実装ドキュメント

## 概要

パズル型ルールビルダーにドラッグ&ドロップ機能を実装しました。この機能により、ユーザーは条件ブロックを直感的にドラッグして並び替えることができます。

## 実装要件

### Requirements 4.1, 4.2 対応

- ✅ 条件ブロックのドラッグ可能化を実装
- ✅ ドロップゾーンの表示とハイライト機能を実装  
- ✅ ドラッグ中の視覚的フィードバックを実装

## 技術選択

### ライブラリ選択理由

**当初予定**: `react-beautiful-dnd`
**実際採用**: `@dnd-kit`

**変更理由**:
- React 19との互換性問題
- `react-beautiful-dnd`はReact 18までしかサポートしていない
- `@dnd-kit`はより現代的で、React 19に対応している

### インストールしたパッケージ

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
```

## 実装コンポーネント

### 1. PuzzleRuleBuilder (メインコンポーネント)

**更新内容**:
- `DndContext`でドラッグ&ドロップ機能を統合
- センサー設定（PointerSensor, KeyboardSensor）
- ドラッグイベントハンドラー実装
- `DragOverlay`でドラッグ中の視覚的フィードバック

**主要機能**:
```typescript
// センサー設定
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  })
);

// ドラッグイベント処理
const handleDragEndEvent = (event: DragEndEvent) => {
  // 条件ブロックの並び替え処理
  reorderConditions(oldIndex, newIndex);
};
```

### 2. SortableConditionBlock (新規作成)

**機能**:
- `useSortable`フックを使用してソート機能を実装
- ドラッグハンドルの表示
- ドラッグ中の視覚的エフェクト
- アクセシビリティ対応

**特徴**:
```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: condition.id });

// 視覚的フィードバック
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
};
```

### 3. DropZone (新規作成)

**機能**:
- `useDroppable`フックを使用してドロップ機能を実装
- ドラッグ中のハイライト表示
- 空状態での案内表示
- アニメーション効果

**特徴**:
```typescript
const { isOver, setNodeRef } = useDroppable({ id });

// ハイライト効果
const isHighlighted = isActive && isOver;
const highlightStyles = {
  borderColor: isHighlighted ? 'primary.main' : 'grey.300',
  transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
};
```

## 視覚的フィードバック

### ドラッグ中のエフェクト

1. **透明度変更**: `opacity: 0.5`
2. **回転効果**: `transform: 'rotate(5deg)'`
3. **影の強化**: `boxShadow: '0 10px 30px rgba(0,0,0,0.3)'`
4. **z-index調整**: `zIndex: 1000`

### ドロップゾーンのハイライト

1. **境界線の色変更**: グレー → プライマリカラー
2. **背景色の変更**: `grey.50` → `primary.50`
3. **スケール変更**: `scale(1.02)`
4. **パルスアニメーション**: CSS keyframes使用

## アクセシビリティ対応

### キーボードナビゲーション

- `KeyboardSensor`でキーボード操作をサポート
- `sortableKeyboardCoordinates`で適切な座標計算

### ARIAラベル

```typescript
// ドラッグハンドル
<Tooltip title="ドラッグして順序を変更">
  <IconButton aria-label="ドラッグして順序を変更">
    <DragIcon />
  </IconButton>
</Tooltip>

// 条件ブロック
<Box
  aria-label={`${condition.label}条件ブロック`}
  data-condition-id={condition.id}
>
```

## パフォーマンス最適化

### センサー設定

```typescript
// 誤操作防止
activationConstraint: { distance: 8 }

// 軸制限でパフォーマンス向上
modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
```

### メモ化

- `useCallback`でイベントハンドラーをメモ化
- 不要な再レンダリングを防止

## 使用方法

### 基本的な使い方

```typescript
import { PuzzleRuleBuilder } from '@/features/rules/components/puzzle';

function MyComponent() {
  const [conditions, setConditions] = useState([]);

  return (
    <PuzzleRuleBuilder
      initialConditions={conditions}
      onChange={setConditions}
      readOnly={false}
    />
  );
}
```

### 読み取り専用モード

```typescript
<PuzzleRuleBuilder
  initialConditions={conditions}
  onChange={() => {}}
  readOnly={true} // ドラッグ機能を無効化
/>
```

## テスト

### 実装されたテスト

1. **DragAndDropIntegration.test.tsx**: 統合テスト
   - ライブラリ設定の確認
   - イベントハンドラーのテスト
   - 視覚的フィードバックの確認
   - アクセシビリティ機能のテスト

### テスト実行

```bash
npm test -- src/features/rules/components/puzzle/__tests__/DragAndDropIntegration.test.tsx --run
```

## 今後の改善点

### 1. パフォーマンス

- 大量の条件ブロック（100+）での最適化
- 仮想スクロール対応

### 2. UX改善

- ドラッグ予告線の表示
- より滑らかなアニメーション
- 音声フィードバック（オプション）

### 3. 機能拡張

- 複数選択でのドラッグ
- グループ化機能
- undo/redo機能

## トラブルシューティング

### よくある問題

1. **ドラッグが開始されない**
   - `activationConstraint`の設定を確認
   - センサーの設定を確認

2. **視覚的フィードバックが表示されない**
   - `DragOverlay`の実装を確認
   - CSS transformの設定を確認

3. **キーボード操作ができない**
   - `KeyboardSensor`の設定を確認
   - `sortableKeyboardCoordinates`の実装を確認

### デバッグ方法

```typescript
// 開発環境でのデバッグ情報表示
{process.env.NODE_ENV === 'development' && (
  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100' }}>
    <Typography variant="caption">
      ドラッグ状態: {activeId || 'なし'}
    </Typography>
  </Box>
)}
```

## 関連ファイル

- `src/features/rules/components/puzzle/PuzzleRuleBuilder.tsx`
- `src/features/rules/components/puzzle/SortableConditionBlock.tsx`
- `src/features/rules/components/puzzle/DropZone.tsx`
- `src/features/rules/hooks/usePuzzleRuleBuilder.ts`
- `src/features/rules/components/puzzle/__tests__/DragAndDropIntegration.test.tsx`

## 参考資料

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [React 19 Migration Guide](https://react.dev/blog/2024/04/25/react-19)
- [Material-UI Accessibility Guidelines](https://mui.com/material-ui/guides/accessibility/)