import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PuzzleRuleBuilder from '../PuzzleRuleBuilder';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('HelpPanel Integration with PuzzleRuleBuilder', () => {
  const defaultProps = {
    initialConditions: [],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirements 5.1 - ヘルプボタンクリック時の説明表示', () => {
    test('ヘルプボタンをクリックすると使い方の説明が表示される', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} />);
      
      // ヘルプボタンを探してクリック
      const helpButton = screen.getByLabelText(/使い方を表示/);
      fireEvent.click(helpButton);
      
      // 使い方の説明が表示されることを確認
      expect(screen.getByText('🧩 パズル型ルール作成の使い方')).toBeInTheDocument();
      expect(screen.getByText('📋 基本的な使い方')).toBeInTheDocument();
      expect(screen.getByText('🎯 段階的ガイダンス')).toBeInTheDocument();
    });

    test('ヘルプパネルの閉じるボタンをクリックするとヘルプが非表示になる', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} />);
      
      // ヘルプを表示
      const helpButton = screen.getByLabelText(/使い方を表示/);
      fireEvent.click(helpButton);
      
      // ヘルプが表示されることを確認
      expect(screen.getByText('🧩 パズル型ルール作成の使い方')).toBeInTheDocument();
      
      // 閉じるボタンをクリック
      const closeButton = screen.getByLabelText('ヘルプを閉じる');
      fireEvent.click(closeButton);
      
      // ヘルプが非表示になることを確認
      expect(screen.queryByText('🧩 パズル型ルール作成の使い方')).not.toBeInTheDocument();
    });
  });

  describe('Requirements 5.2 - 空状態での説明メッセージ', () => {
    test('条件ブロックが空の状態で「パズルのピースを組み合わせるように」という説明が表示される', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} />);
      
      // 空状態のメッセージが表示されることを確認
      expect(screen.getByText('🧩 パズルのピースを組み合わせるように')).toBeInTheDocument();
      expect(screen.getByText('条件ブロックを追加してルールを作成してください')).toBeInTheDocument();
      expect(screen.getByText('直感的で分かりやすいルール作成を体験できます')).toBeInTheDocument();
    });

    test('空状態から「使い方を見る」ボタンをクリックするとヘルプが表示される', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} />);
      
      // 空状態の「使い方を見る」ボタンをクリック
      const showHelpButton = screen.getByText('使い方を見る');
      fireEvent.click(showHelpButton);
      
      // ヘルプパネルが表示されることを確認
      expect(screen.getByText('🧩 パズル型ルール作成の使い方')).toBeInTheDocument();
    });

    test('空状態から「条件を追加」ボタンをクリックすると条件が追加される', () => {
      const onChange = jest.fn();
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} onChange={onChange} />);
      
      // 空状態の「条件を追加」ボタンをクリック
      const addConditionButton = screen.getByText('条件を追加');
      fireEvent.click(addConditionButton);
      
      // onChangeが呼ばれることを確認（条件が追加された）
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('段階的ガイダンス機能', () => {
    test('条件ブロック数に応じてガイダンスの完了状態が更新される', () => {
      // 条件ブロックが1つある状態でレンダリング
      const conditionsWithOne = [
        {
          id: '1',
          type: 'expenseType' as const,
          operator: 'AND' as const,
          values: ['駐車場代'],
          label: '経費種別',
          description: '経費種別条件',
        },
      ];

      renderWithTheme(
        <PuzzleRuleBuilder 
          {...defaultProps} 
          initialConditions={conditionsWithOne}
        />
      );
      
      // ヘルプを表示
      const helpButton = screen.getByLabelText(/使い方を表示/);
      fireEvent.click(helpButton);
      
      // 段階的ガイダンスで完了マークが表示されることを確認
      expect(screen.getByText('完了')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    test('ヘルプボタンに適切なaria-labelが設定されている', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} />);
      
      const helpButton = screen.getByLabelText(/使い方を表示/);
      expect(helpButton).toBeInTheDocument();
    });

    test('ヘルプパネルの閉じるボタンに適切なaria-labelが設定されている', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} />);
      
      // ヘルプを表示
      const helpButton = screen.getByLabelText(/使い方を表示/);
      fireEvent.click(helpButton);
      
      // 閉じるボタンのaria-labelを確認
      const closeButton = screen.getByLabelText('ヘルプを閉じる');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('初期表示設定', () => {
    test('showHelp=trueで初期化するとヘルプが最初から表示される', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} showHelp={true} />);
      
      // 最初からヘルプが表示されることを確認
      expect(screen.getByText('🧩 パズル型ルール作成の使い方')).toBeInTheDocument();
    });

    test('showHelp=falseで初期化するとヘルプが最初は非表示', () => {
      renderWithTheme(<PuzzleRuleBuilder {...defaultProps} showHelp={false} />);
      
      // 最初はヘルプが非表示であることを確認
      expect(screen.queryByText('🧩 パズル型ルール作成の使い方')).not.toBeInTheDocument();
    });
  });
});