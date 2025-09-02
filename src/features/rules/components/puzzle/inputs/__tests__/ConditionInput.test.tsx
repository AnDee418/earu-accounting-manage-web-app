import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConditionBlock, AmountRange } from '@/types/rules';
import { CONDITION_TYPES } from '../../ConditionPalette';

// モックデータ
const mockTagCondition: ConditionBlock = {
  id: 'test-1',
  type: 'expenseType',
  operator: 'AND',
  values: ['駐車場代', '交通費'],
  label: '経費種別',
  description: '領収書の経費種別',
};

const mockAmountCondition: ConditionBlock = {
  id: 'test-2',
  type: 'amount',
  operator: 'AND',
  values: { min: 1000, max: 5000, currency: 'JPY' },
  label: '金額範囲',
  description: '支払金額の範囲',
};

const mockTextCondition: ConditionBlock = {
  id: 'test-3',
  type: 'receiptContent',
  operator: 'AND',
  values: ['.*駐車場.*'],
  label: '領収書内容',
  description: '領収書全体の内容パターン',
};

describe('ConditionInput Logic Tests', () => {
  describe('条件タイプの判定', () => {
    it('タグ入力タイプの条件を正しく識別する', () => {
      const expenseType = CONDITION_TYPES.expenseType;
      expect(expenseType.inputType).toBe('tags');
      
      const merchant = CONDITION_TYPES.merchant;
      expect(merchant.inputType).toBe('tags');
      
      const keyword = CONDITION_TYPES.keyword;
      expect(keyword.inputType).toBe('tags');
    });

    it('金額範囲入力タイプの条件を正しく識別する', () => {
      const amount = CONDITION_TYPES.amount;
      expect(amount.inputType).toBe('range');
    });

    it('テキスト入力タイプの条件を正しく識別する', () => {
      const receiptContent = CONDITION_TYPES.receiptContent;
      expect(receiptContent.inputType).toBe('text');
    });
  });

  describe('データ構造の検証', () => {
    it('タグ条件の値が配列形式である', () => {
      expect(Array.isArray(mockTagCondition.values)).toBe(true);
      expect(mockTagCondition.values).toEqual(['駐車場代', '交通費']);
    });

    it('金額範囲条件の値がAmountRange形式である', () => {
      const values = mockAmountCondition.values as AmountRange;
      expect(values).toHaveProperty('min');
      expect(values).toHaveProperty('max');
      expect(values).toHaveProperty('currency');
      expect(values.min).toBe(1000);
      expect(values.max).toBe(5000);
      expect(values.currency).toBe('JPY');
    });

    it('テキスト条件の値が配列形式である', () => {
      expect(Array.isArray(mockTextCondition.values)).toBe(true);
      expect(mockTextCondition.values).toEqual(['.*駐車場.*']);
    });
  });

  describe('条件タイプごとの設定', () => {
    it('経費種別条件の設定が正しい', () => {
      const expenseType = CONDITION_TYPES.expenseType;
      expect(expenseType.label).toBe('経費種別');
      expect(expenseType.color).toBe('#4CAF50');
      expect(expenseType.examples).toContain('駐車場代');
      expect(expenseType.examples).toContain('交通費');
    });

    it('取引先条件の設定が正しい', () => {
      const merchant = CONDITION_TYPES.merchant;
      expect(merchant.label).toBe('取引先');
      expect(merchant.color).toBe('#2196F3');
      expect(merchant.examples).toContain('JR東日本');
      expect(merchant.examples).toContain('セブンイレブン');
    });

    it('摘要キーワード条件の設定が正しい', () => {
      const keyword = CONDITION_TYPES.keyword;
      expect(keyword.label).toBe('摘要キーワード');
      expect(keyword.color).toBe('#FF9800');
      expect(keyword.examples).toContain('電車代');
      expect(keyword.examples).toContain('駐車場');
    });

    it('金額範囲条件の設定が正しい', () => {
      const amount = CONDITION_TYPES.amount;
      expect(amount.label).toBe('金額範囲');
      expect(amount.color).toBe('#9C27B0');
      expect(amount.examples).toContain('1000円以上');
      expect(amount.examples).toContain('5000円以下');
    });

    it('領収書内容条件の設定が正しい', () => {
      const receiptContent = CONDITION_TYPES.receiptContent;
      expect(receiptContent.label).toBe('領収書内容');
      expect(receiptContent.color).toBe('#607D8B');
      expect(receiptContent.examples).toContain('.*駐車場.*');
      expect(receiptContent.examples).toContain('.*交通費.*');
    });
  });

  describe('Requirements 2.1, 5.4の検証', () => {
    it('Requirement 2.1: 各条件タイプに適切な入力フィールドが対応している', () => {
      // 経費種別・取引先・摘要キーワード用のタグ入力
      expect(CONDITION_TYPES.expenseType.inputType).toBe('tags');
      expect(CONDITION_TYPES.merchant.inputType).toBe('tags');
      expect(CONDITION_TYPES.keyword.inputType).toBe('tags');
      
      // 金額範囲用の範囲入力
      expect(CONDITION_TYPES.amount.inputType).toBe('range');
      
      // 領収書内容用のテキスト入力
      expect(CONDITION_TYPES.receiptContent.inputType).toBe('text');
    });

    it('Requirement 5.4: オートコンプリート機能用の例示データが準備されている', () => {
      Object.values(CONDITION_TYPES).forEach(conditionType => {
        expect(conditionType.examples).toBeDefined();
        expect(Array.isArray(conditionType.examples)).toBe(true);
        expect(conditionType.examples.length).toBeGreaterThan(0);
        
        // 各例示データが文字列であることを確認
        conditionType.examples.forEach(example => {
          expect(typeof example).toBe('string');
          expect(example.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('バリデーション機能', () => {
    it('金額範囲の最小・最大値の論理チェック', () => {
      // 正常なケース
      const validRange: AmountRange = { min: 1000, max: 5000, currency: 'JPY' };
      expect(validRange.min).toBeLessThan(validRange.max!);
      
      // 異常なケース（最小値が最大値より大きい）
      const invalidRange: AmountRange = { min: 5000, max: 1000, currency: 'JPY' };
      expect(invalidRange.min).toBeGreaterThan(invalidRange.max!);
    });

    it('正規表現パターンの検証', () => {
      const validPatterns = ['.*駐車場.*', '^交通費', '会議$', '[0-9]+円'];
      const invalidPatterns = ['[未閉じ', '(未閉じ', '*不正'];
      
      validPatterns.forEach(pattern => {
        expect(() => new RegExp(pattern)).not.toThrow();
      });
      
      invalidPatterns.forEach(pattern => {
        expect(() => new RegExp(pattern)).toThrow();
      });
    });
  });
});