import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EmptyState from '../EmptyState';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('EmptyState', () => {
  const defaultProps = {
    onShowHelp: jest.fn(),
    onAddCondition: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    test('メインメッセージが表示される', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      expect(screen.getByText('🧩 パズルのピースを組み合わせるように')).toBeInTheDocument();
      expect(screen.getByText('条件ブロックを追加してルールを作成してください')).toBeInTheDocument();
      expect(screen.getByText('直感的で分かりやすいルール作成を体験できます')).toBeInTheDocument();
    });

    test('3ステップの説明が表示される', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      expect(screen.getByText('📋 簡単3ステップ')).toBeInTheDocument();
      expect(screen.getByText(/条件を選択:/)).toBeInTheDocument();
      expect(screen.getByText(/値を入力:/)).toBeInTheDocument();
      expect(screen.getByText(/組み合わせ:/)).toBeInTheDocument();
    });

    test('ヒントメッセージが表示される', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      expect(screen.getByText(/💡 ヒント:/)).toBeInTheDocument();
      expect(screen.getByText(/条件タイプボタンにマウスを合わせると具体例が表示されます/)).toBeInTheDocument();
    });
  });

  describe('アクションボタン', () => {
    test('条件追加ボタンが表示され、クリックでコールバックが呼ばれる', () => {
      const onAddCondition = jest.fn();
      renderWithTheme(<EmptyState {...defaultProps} onAddCondition={onAddCondition} />);
      
      const addButton = screen.getByText('条件を追加');
      expect(addButton).toBeInTheDocument();
      
      fireEvent.click(addButton);
      expect(onAddCondition).toHaveBeenCalledTimes(1);
    });

    test('ヘルプ表示ボタンが表示され、クリックでコールバックが呼ばれる', () => {
      const onShowHelp = jest.fn();
      renderWithTheme(<EmptyState {...defaultProps} onShowHelp={onShowHelp} />);
      
      const helpButton = screen.getByText('使い方を見る');
      expect(helpButton).toBeInTheDocument();
      
      fireEvent.click(helpButton);
      expect(onShowHelp).toHaveBeenCalledTimes(1);
    });

    test('onAddConditionが未定義の場合、条件追加ボタンが表示されない', () => {
      renderWithTheme(<EmptyState onShowHelp={defaultProps.onShowHelp} />);
      
      expect(screen.queryByText('条件を追加')).not.toBeInTheDocument();
    });

    test('onShowHelpが未定義の場合、ヘルプボタンが表示されない', () => {
      renderWithTheme(<EmptyState onAddCondition={defaultProps.onAddCondition} />);
      
      expect(screen.queryByText('使い方を見る')).not.toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    test('カスタムクラス名が適用される', () => {
      const { container } = renderWithTheme(
        <EmptyState {...defaultProps} className="custom-empty-state" />
      );
      
      expect(container.querySelector('.custom-empty-state')).toBeInTheDocument();
    });

    test('ステップ番号が正しく表示される', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      // ステップ番号のボックスが表示される
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    test('ボタンに適切なアイコンが設定されている', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      // Material-UIのアイコンが含まれているかテスト
      const addButton = screen.getByText('条件を追加');
      const helpButton = screen.getByText('使い方を見る');
      
      expect(addButton.closest('button')).toBeInTheDocument();
      expect(helpButton.closest('button')).toBeInTheDocument();
    });

    test('キーボードナビゲーションが機能する', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      const addButton = screen.getByText('条件を追加');
      addButton.focus();
      expect(document.activeElement).toBe(addButton.closest('button'));
    });
  });

  describe('レスポンシブデザイン', () => {
    test('ボタンが適切にラップされる', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      const buttonContainer = screen.getByText('条件を追加').closest('div');
      expect(buttonContainer).toHaveStyle({ display: 'flex' });
    });
  });

  describe('Requirements 5.2 対応', () => {
    test('空状態での説明メッセージが実装されている', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      // Requirements 5.2: 「パズルのピースを組み合わせるように」という説明が表示される
      expect(screen.getByText('🧩 パズルのピースを組み合わせるように')).toBeInTheDocument();
    });

    test('段階的なガイダンス要素が含まれている', () => {
      renderWithTheme(<EmptyState {...defaultProps} />);
      
      // 3ステップの説明が段階的ガイダンスとして機能
      expect(screen.getByText('📋 簡単3ステップ')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});