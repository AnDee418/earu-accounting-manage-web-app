import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HelpPanel from '../HelpPanel';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('HelpPanel', () => {
  const defaultProps = {
    show: true,
    onClose: jest.fn(),
    conditionCount: 0,
    enableStepByStep: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    test('ヘルプパネルが表示される', () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      expect(screen.getByText('🧩 パズル型ルール作成の使い方')).toBeInTheDocument();
      expect(screen.getByText('📋 基本的な使い方')).toBeInTheDocument();
    });

    test('show=falseの時は表示されない', () => {
      renderWithTheme(<HelpPanel {...defaultProps} show={false} />);
      
      expect(screen.queryByText('🧩 パズル型ルール作成の使い方')).not.toBeInTheDocument();
    });

    test('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      const onClose = jest.fn();
      renderWithTheme(<HelpPanel {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('ヘルプを閉じる');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('基本的な使い方説明', () => {
    test('基本的な使い方が表示される', () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      expect(screen.getByText(/パズルのピースを組み合わせるように/)).toBeInTheDocument();
      expect(screen.getByText(/条件ブロック追加:/)).toBeInTheDocument();
      expect(screen.getByText(/条件設定:/)).toBeInTheDocument();
      expect(screen.getByText(/論理演算子:/)).toBeInTheDocument();
      expect(screen.getByText(/順序調整:/)).toBeInTheDocument();
    });
  });

  describe('段階的ガイダンス', () => {
    test('段階的ガイダンスが表示される', () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      expect(screen.getByText('🎯 段階的ガイダンス')).toBeInTheDocument();
      expect(screen.getByText('条件ブロックを追加')).toBeInTheDocument();
      expect(screen.getByText('条件を設定')).toBeInTheDocument();
      expect(screen.getByText('論理演算子を選択')).toBeInTheDocument();
      expect(screen.getByText('順序を調整')).toBeInTheDocument();
    });

    test('enableStepByStep=falseの時は段階的ガイダンスが表示されない', () => {
      renderWithTheme(<HelpPanel {...defaultProps} enableStepByStep={false} />);
      
      expect(screen.queryByText('🎯 段階的ガイダンス')).not.toBeInTheDocument();
    });

    test('条件ブロック数に応じて完了状態が更新される', () => {
      renderWithTheme(<HelpPanel {...defaultProps} conditionCount={1} />);
      
      // 条件ブロックが1つある場合、最初のステップが完了状態になる
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    test('次へボタンをクリックすると次のステップに進む', async () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      const nextButton = screen.getByText('次へ');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        // 2番目のステップの内容が表示される
        expect(screen.getByText('追加したブロックで具体的な条件を入力してください')).toBeInTheDocument();
      });
    });

    test('戻るボタンをクリックすると前のステップに戻る', async () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      // まず次のステップに進む
      const nextButton = screen.getByText('次へ');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const backButton = screen.getByText('戻る');
        fireEvent.click(backButton);
      });
      
      await waitFor(() => {
        // 最初のステップの内容が表示される
        expect(screen.getByText('下のパレットから条件の種類を選んでクリックしてください')).toBeInTheDocument();
      });
    });

    test('最後のステップで完了メッセージが表示される', async () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      // 全てのステップを進む
      const nextButtons = screen.getAllByText('次へ');
      for (let i = 0; i < nextButtons.length; i++) {
        fireEvent.click(nextButtons[i]);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        expect(screen.getByText(/ガイダンス完了！/)).toBeInTheDocument();
        expect(screen.getByText('ガイダンスを最初から見る')).toBeInTheDocument();
      });
    });

    test('ガイダンスリセットボタンをクリックすると最初のステップに戻る', async () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      // 全てのステップを進む
      const nextButtons = screen.getAllByText('次へ');
      for (let i = 0; i < nextButtons.length; i++) {
        fireEvent.click(nextButtons[i]);
        await waitFor(() => {});
      }
      
      await waitFor(() => {
        const resetButton = screen.getByText('ガイダンスを最初から見る');
        fireEvent.click(resetButton);
      });
      
      await waitFor(() => {
        // 最初のステップの内容が表示される
        expect(screen.getByText('下のパレットから条件の種類を選んでクリックしてください')).toBeInTheDocument();
      });
    });
  });

  describe('便利な機能説明', () => {
    test('便利な機能の説明が表示される', () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      expect(screen.getByText('💡 便利な機能')).toBeInTheDocument();
      expect(screen.getByText(/ツールチップ:/)).toBeInTheDocument();
      expect(screen.getByText(/自然言語プレビュー:/)).toBeInTheDocument();
      expect(screen.getByText(/リアルタイム検証:/)).toBeInTheDocument();
      expect(screen.getByText(/キーボード操作:/)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    test('適切なaria-labelが設定されている', () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('ヘルプを閉じる');
      expect(closeButton).toBeInTheDocument();
    });

    test('キーボードナビゲーションが機能する', () => {
      renderWithTheme(<HelpPanel {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('ヘルプを閉じる');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('カスタマイズ', () => {
    test('カスタムクラス名が適用される', () => {
      const { container } = renderWithTheme(
        <HelpPanel {...defaultProps} className="custom-help-panel" />
      );
      
      expect(container.querySelector('.custom-help-panel')).toBeInTheDocument();
    });
  });
});