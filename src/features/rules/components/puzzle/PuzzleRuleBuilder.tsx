'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Help as HelpIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

import {
  PuzzleRuleBuilderProps,
  ConditionType,
} from '@/types/rules';
import { usePuzzleRuleBuilder } from '../../hooks/usePuzzleRuleBuilder';
import ConditionPalette from './ConditionPalette';
import SortableConditionBlock from './SortableConditionBlock';
import DropZone from './DropZone';
import VisualConnectionLines from './VisualConnectionLines';
import RulePreview from './RulePreview';
import HelpPanel from './HelpPanel';
import EmptyState from './EmptyState';
import ValidationDisplay from './ValidationDisplay';

// 条件タイプの定義（設計書に基づく）
export const CONDITION_TYPES: Record<string, ConditionType> = {
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
  keyword: {
    id: 'keyword',
    label: '摘要キーワード',
    description: '領収書の摘要や説明に含まれる言葉',
    icon: '🔍',
    color: '#FF9800',
    examples: ['電車代', '駐車場', 'ガソリン', '会議'],
    inputType: 'tags'
  },
  amount: {
    id: 'amount',
    label: '金額範囲',
    description: '支払金額の範囲',
    icon: '💴',
    color: '#9C27B0',
    examples: ['1000円以上', '5000円以下', '1000-5000円'],
    inputType: 'range'
  },
  receiptContent: {
    id: 'receiptContent',
    label: '領収書内容',
    description: '領収書全体の内容パターン',
    icon: '📄',
    color: '#607D8B',
    examples: ['.*駐車場.*', '.*交通費.*'],
    inputType: 'text'
  },
};

/**
 * パズル型ルール条件ビルダーのメインコンポーネント
 * 
 * Requirements: 1.1, 1.2, 6.2
 * - パズルピース型の条件ブロックを表示
 * - 条件ブロックの基本データ構造とstate管理
 * - TypeScript型定義をパズル形式に対応
 */
export default function PuzzleRuleBuilder({
  initialConditions = [],
  onChange,
  onValidate,
  readOnly = false,
  showHelp: initialShowHelp = false,
}: PuzzleRuleBuilderProps) {
  // パズルルールビルダーのフック使用
  const {
    conditions,
    draggedItem,
    validationErrors,
    isValid,
    addCondition,
    updateCondition,
    removeCondition,
    reorderConditions,
    handleDragStart,
    handleDragEnd,
  } = usePuzzleRuleBuilder({
    initialConditions,
    onValidate,
    autoValidate: true,
  });

  // 全体のバリデーション結果を取得
  const overallValidationResult = React.useMemo(() => {
    if (validationErrors.length === 0 && isValid) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      };
    }
    return {
      isValid,
      errors: validationErrors,
      warnings: [],
      suggestions: [],
    };
  }, [validationErrors, isValid]);

  // ローカル状態（UI関連）
  const [showHelp, setShowHelp] = useState(initialShowHelp);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // 条件ブロックコンテナの参照（視覚的接続線用）
  const conditionsContainerRef = React.useRef<HTMLDivElement>(null);

  // ドラッグ&ドロップセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動してからドラッグ開始
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 条件変更時のコールバック
  useEffect(() => {
    onChange(conditions);
  }, [conditions, onChange]);

  // ヘルプ表示切り替え
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // ドラッグ開始ハンドラー
  const handleDragStartEvent = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    handleDragStart(active.id as string);
  }, [handleDragStart]);

  // ドラッグ終了ハンドラー
  const handleDragEndEvent = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    handleDragEnd();

    if (over && active.id !== over.id) {
      const oldIndex = conditions.findIndex(condition => condition.id === active.id);
      const newIndex = conditions.findIndex(condition => condition.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderConditions(oldIndex, newIndex);
      }
    }
  }, [conditions, handleDragEnd, reorderConditions]);

  // ドラッグ中の条件ブロックを取得
  const activeCondition = activeId ? conditions.find(condition => condition.id === activeId) : null;

  return (
    <Box sx={{ width: '100%' }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          パズル型ルール条件ビルダー
        </Typography>
        <Tooltip title="使い方を表示">
          <IconButton onClick={toggleHelp}>
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ヘルプパネル */}
      <HelpPanel
        show={showHelp}
        onClose={() => setShowHelp(false)}
        conditionCount={conditions.length}
        enableStepByStep={true}
      />

      {/* バリデーション結果表示 */}
      <ValidationDisplay
        validationResult={overallValidationResult}
        showDetails={true}
        compact={false}
      />

      {/* 空状態の表示 */}
      {conditions.length === 0 && (
        <EmptyState
          onShowHelp={() => setShowHelp(true)}
          onAddCondition={() => {
            // 最初の条件タイプ（経費種別）を追加
            addCondition('expenseType');
          }}
        />
      )}

      {/* 条件パレット */}
      {!readOnly && (
        <ConditionPalette
          onAddCondition={addCondition}
          disabled={false}
          sx={{ mb: 3 }}
        />
      )}

      {/* 条件ブロック表示エリア */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStartEvent}
        onDragEnd={handleDragEndEvent}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <Box 
          ref={conditionsContainerRef}
          sx={{ 
            mb: 3,
            position: 'relative',
            minHeight: conditions.length > 0 ? 'auto' : 0,
          }}
        >
          {/* 視覚的接続線 */}
          {conditions.length > 1 && (
            <VisualConnectionLines
              conditions={conditions}
              containerRef={conditionsContainerRef}
            />
          )}
          
          {/* 条件ブロック */}
          <SortableContext 
            items={conditions.map(condition => condition.id)}
            strategy={verticalListSortingStrategy}
          >
            <DropZone
              id="conditions-container"
              isActive={!!activeId}
              isEmpty={conditions.length === 0}
            >
              {conditions.map((condition, index) => (
                <SortableConditionBlock
                  key={condition.id}
                  condition={condition}
                  index={index}
                  isLast={index === conditions.length - 1}
                  onUpdate={updateCondition}
                  onDelete={removeCondition}
                  readOnly={readOnly}
                />
              ))}
            </DropZone>
          </SortableContext>

          {/* ドラッグオーバーレイ */}
          <DragOverlay>
            {activeCondition ? (
              <SortableConditionBlock
                condition={activeCondition}
                index={conditions.findIndex(c => c.id === activeCondition.id)}
                isLast={false}
                onUpdate={() => {}} // オーバーレイでは更新不要
                onDelete={() => {}} // オーバーレイでは削除不要
                readOnly={true}
                isDragOverlay={true}
              />
            ) : null}
          </DragOverlay>
        </Box>
      </DndContext>

      {/* 自然言語プレビュー */}
      <RulePreview
        conditions={conditions}
        sx={{ mb: 3 }}
      />

      {/* 開発用の状態表示（デバッグ用） */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" gutterBottom>
            開発用デバッグ情報:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
            {JSON.stringify({ conditions, draggedItem, validationErrors, isValid }, null, 2)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}