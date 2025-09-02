import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PuzzleRuleBuilder from '../PuzzleRuleBuilder';
import { ConditionBlock } from '@/types/rules';

// Mock @dnd-kit modules
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => (
    <div data-testid="dnd-context" onDrop={onDragEnd}>
      {children}
    </div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((array, from, to) => {
    const result = [...array];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: vi.fn(),
  restrictToWindowEdges: vi.fn(),
}));

describe('Drag & Drop Functionality', () => {
  const mockConditions: ConditionBlock[] = [
    {
      id: 'condition-1',
      type: 'expenseType',
      operator: 'AND',
      values: ['駐車場代'],
      label: '経費種別',
      description: '領収書の経費種別',
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: 10,
      },
    },
    {
      id: 'condition-2',
      type: 'merchant',
      operator: 'OR',
      values: ['パーキング'],
      label: '取引先',
      description: '支払先の会社名や店舗名',
      uiState: {
        isExpanded: true,
        isDragging: false,
        hasError: false,
      },
      validation: {
        required: true,
        minValues: 1,
        maxValues: 10,
      },
    },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('DndContext が正しく設定される', () => {
    render(
      <PuzzleRuleBuilder
        initialConditions={mockConditions}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  test('条件ブロックがソート可能な状態で表示される', () => {
    render(
      <PuzzleRuleBuilder
        initialConditions={mockConditions}
        onChange={mockOnChange}
      />
    );

    // 条件ブロックが表示されることを確認
    expect(screen.getByText('経費種別')).toBeInTheDocument();
    expect(screen.getByText('取引先')).toBeInTheDocument();

    // ドラッグハンドルが表示されることを確認
    const dragHandles = screen.getAllByTitle('ドラッグして順序を変更');
    expect(dragHandles).toHaveLength(2);
  });

  test('読み取り専用モードではドラッグハンドルが表示されない', () => {
    render(
      <PuzzleRuleBuilder
        initialConditions={mockConditions}
        onChange={mockOnChange}
        readOnly={true}
      />
    );

    // ドラッグハンドルが表示されないことを確認
    expect(screen.queryByTitle('ドラッグして順序を変更')).not.toBeInTheDocument();
  });

  test('空状態でドロップゾーンが表示される', () => {
    render(
      <PuzzleRuleBuilder
        initialConditions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('条件ブロックをドラッグしてください')).toBeInTheDocument();
  });

  test('ドラッグオーバーレイが設定される', () => {
    render(
      <PuzzleRuleBuilder
        initialConditions={mockConditions}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });

  test('ドラッグ&ドロップの視覚的フィードバックが適用される', () => {
    const { container } = render(
      <PuzzleRuleBuilder
        initialConditions={mockConditions}
        onChange={mockOnChange}
      />
    );

    // 条件ブロックコンテナが存在することを確認
    const conditionBlocks = container.querySelectorAll('[data-condition-block]');
    expect(conditionBlocks).toHaveLength(2);

    // 各ブロックにdata属性が設定されていることを確認
    expect(conditionBlocks[0]).toHaveAttribute('data-condition-id', 'condition-1');
    expect(conditionBlocks[1]).toHaveAttribute('data-condition-id', 'condition-2');
  });
});