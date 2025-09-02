import { describe, it, expect } from 'vitest';
import {
  formatConditionValues,
  getOperatorLabel,
  getOperatorColor,
  generateNaturalLanguage,
  checkCompletionStatus,
} from '../naturalLanguageGenerator';
import { ConditionBlock, AmountRange } from '@/types/rules';

describe('naturalLanguageGenerator', () => {
  describe('formatConditionValues', () => {
    it('経費種別条件の値を正しくフォーマットする', () => {
      const condition: ConditionBlock = {
        id: '1',
        type: 'expenseType',
        operator: 'AND',
        values: ['駐車場代', '交通費'],
        label: '経費種別',
        description: '経費種別条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('駐車場代, 交通費');
    });

    it('取引先条件の値を正しくフォーマットする', () => {
      const condition: ConditionBlock = {
        id: '1',
        type: 'merchant',
        operator: 'AND',
        values: ['JR東日本', 'セブンイレブン'],
        label: '取引先',
        description: '取引先条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('JR東日本, セブンイレブン');
    });

    it('摘要キーワード条件の値を正しくフォーマットする', () => {
      const condition: ConditionBlock = {
        id: '1',
        type: 'keyword',
        operator: 'AND',
        values: ['電車代', '駐車場'],
        label: '摘要キーワード',
        description: 'キーワード条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('電車代, 駐車場');
    });

    it('金額範囲条件（最小・最大両方）を正しくフォーマットする', () => {
      const amountRange: AmountRange = { min: 1000, max: 5000, currency: 'JPY' };
      const condition: ConditionBlock = {
        id: '1',
        type: 'amount',
        operator: 'AND',
        values: amountRange,
        label: '金額範囲',
        description: '金額範囲条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('1,000円〜5,000円');
    });

    it('金額範囲条件（最小のみ）を正しくフォーマットする', () => {
      const amountRange: AmountRange = { min: 1000, currency: 'JPY' };
      const condition: ConditionBlock = {
        id: '1',
        type: 'amount',
        operator: 'AND',
        values: amountRange,
        label: '金額範囲',
        description: '金額範囲条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('1,000円以上');
    });

    it('金額範囲条件（最大のみ）を正しくフォーマットする', () => {
      const amountRange: AmountRange = { max: 5000, currency: 'JPY' };
      const condition: ConditionBlock = {
        id: '1',
        type: 'amount',
        operator: 'AND',
        values: amountRange,
        label: '金額範囲',
        description: '金額範囲条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('5,000円以下');
    });

    it('領収書内容条件を正しくフォーマットする', () => {
      const condition: ConditionBlock = {
        id: '1',
        type: 'receiptContent',
        operator: 'AND',
        values: ['.*駐車場.*', '.*交通費.*'],
        label: '領収書内容',
        description: '領収書内容条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('.*駐車場.*, .*交通費.*');
    });

    it('空の値を「未設定」として表示する', () => {
      const condition: ConditionBlock = {
        id: '1',
        type: 'expenseType',
        operator: 'AND',
        values: [],
        label: '経費種別',
        description: '経費種別条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('未設定');
    });

    it('金額範囲が未設定の条件を正しく表示する', () => {
      const amountRange: AmountRange = { currency: 'JPY' };
      const condition: ConditionBlock = {
        id: '1',
        type: 'amount',
        operator: 'AND',
        values: amountRange,
        label: '金額範囲',
        description: '金額範囲条件',
      };
      
      const result = formatConditionValues(condition);
      expect(result).toBe('金額範囲未設定');
    });
  });

  describe('getOperatorLabel', () => {
    it('AND演算子を「かつ」に変換する', () => {
      expect(getOperatorLabel('AND')).toBe('かつ');
    });

    it('OR演算子を「または」に変換する', () => {
      expect(getOperatorLabel('OR')).toBe('または');
    });

    it('未知の演算子はそのまま返す', () => {
      expect(getOperatorLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getOperatorColor', () => {
    it('AND演算子は緑色を返す', () => {
      expect(getOperatorColor('AND')).toBe('#4CAF50');
    });

    it('OR演算子はオレンジ色を返す', () => {
      expect(getOperatorColor('OR')).toBe('#FF9800');
    });

    it('未知の演算子はグレー色を返す', () => {
      expect(getOperatorColor('UNKNOWN')).toBe('#757575');
    });
  });

  describe('generateNaturalLanguage', () => {
    it('空の条件配列に対して適切なメッセージを返す', () => {
      const conditions: ConditionBlock[] = [];
      const result = generateNaturalLanguage(conditions);
      expect(result).toBe('条件が設定されていません');
    });

    it('単一条件を正しく自然言語に変換する', () => {
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代'],
          label: '経費種別',
          description: '経費種別条件',
        },
      ];
      
      const result = generateNaturalLanguage(conditions);
      expect(result).toBe('経費種別 (駐車場代)');
    });

    it('AND演算子で結合された条件を正しく表示する', () => {
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代'],
          label: '経費種別',
          description: '経費種別条件',
        },
        {
          id: '2',
          type: 'merchant',
          operator: 'AND',
          values: ['パーキング'],
          label: '取引先',
          description: '取引先条件',
        },
      ];
      
      const result = generateNaturalLanguage(conditions);
      expect(result).toBe('経費種別 (駐車場代) かつ 取引先 (パーキング)');
    });

    it('OR演算子で結合された条件を正しく表示する', () => {
      const amountRange: AmountRange = { min: 1000, currency: 'JPY' };
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'amount',
          operator: 'OR',
          values: amountRange,
          label: '金額範囲',
          description: '金額範囲条件',
        },
        {
          id: '2',
          type: 'keyword',
          operator: 'AND',
          values: ['電車'],
          label: '摘要キーワード',
          description: 'キーワード条件',
        },
      ];
      
      const result = generateNaturalLanguage(conditions);
      expect(result).toBe('金額範囲 (1,000円以上) または 摘要キーワード (電車)');
    });

    it('複雑な条件組み合わせを正しく表示する', () => {
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'expenseType',
          operator: 'AND',
          values: ['交通費'],
          label: '経費種別',
          description: '経費種別条件',
        },
        {
          id: '2',
          type: 'merchant',
          operator: 'OR',
          values: ['JR東日本'],
          label: '取引先',
          description: '取引先条件',
        },
        {
          id: '3',
          type: 'keyword',
          operator: 'AND',
          values: ['電車代'],
          label: '摘要キーワード',
          description: 'キーワード条件',
        },
      ];
      
      const result = generateNaturalLanguage(conditions);
      expect(result).toBe('経費種別 (交通費) かつ 取引先 (JR東日本) または 摘要キーワード (電車代)');
    });
  });

  describe('checkCompletionStatus', () => {
    it('すべての条件が設定済みの場合、完了状態を返す', () => {
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代'],
          label: '経費種別',
          description: '経費種別条件',
        },
        {
          id: '2',
          type: 'merchant',
          operator: 'AND',
          values: ['パーキング'],
          label: '取引先',
          description: '取引先条件',
        },
      ];
      
      const result = checkCompletionStatus(conditions);
      expect(result.total).toBe(2);
      expect(result.completed).toBe(2);
      expect(result.percentage).toBe(100);
      expect(result.isComplete).toBe(true);
    });

    it('一部の条件が未設定の場合、未完了状態を返す', () => {
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代'],
          label: '経費種別',
          description: '経費種別条件',
        },
        {
          id: '2',
          type: 'merchant',
          operator: 'AND',
          values: [],
          label: '取引先',
          description: '取引先条件',
        },
      ];
      
      const result = checkCompletionStatus(conditions);
      expect(result.total).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.percentage).toBe(50);
      expect(result.isComplete).toBe(false);
    });

    it('空の条件配列の場合、適切な状態を返す', () => {
      const conditions: ConditionBlock[] = [];
      
      const result = checkCompletionStatus(conditions);
      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.isComplete).toBe(false);
    });

    it('金額範囲条件の完成度を正しく判定する', () => {
      const amountRange: AmountRange = { min: 1000, currency: 'JPY' };
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'amount',
          operator: 'AND',
          values: amountRange,
          label: '金額範囲',
          description: '金額範囲条件',
        },
      ];
      
      const result = checkCompletionStatus(conditions);
      expect(result.total).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.isComplete).toBe(true);
    });

    it('未設定の金額範囲条件を正しく判定する', () => {
      const amountRange: AmountRange = { currency: 'JPY' };
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'amount',
          operator: 'AND',
          values: amountRange,
          label: '金額範囲',
          description: '金額範囲条件',
        },
      ];
      
      const result = checkCompletionStatus(conditions);
      expect(result.total).toBe(1);
      expect(result.completed).toBe(0);
      expect(result.isComplete).toBe(false);
    });
  });

  describe('Requirements 3.1-3.4の検証', () => {
    it('Requirement 3.1: 条件ブロックから自然言語への変換ロジックが実装されている', () => {
      const condition: ConditionBlock = {
        id: '1',
        type: 'expenseType',
        operator: 'AND',
        values: ['駐車場代'],
        label: '経費種別',
        description: '経費種別条件',
      };
      
      const formattedValue = formatConditionValues(condition);
      expect(formattedValue).toBe('駐車場代');
      
      const naturalLanguage = generateNaturalLanguage([condition]);
      expect(naturalLanguage).toBe('経費種別 (駐車場代)');
    });

    it('Requirement 3.2: リアルタイムでのプレビュー更新機能のデータ構造が適切', () => {
      const conditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代'],
          label: '経費種別',
          description: '経費種別条件',
        },
      ];
      
      // 条件配列の変更を検知できる構造であることを確認
      const initialResult = generateNaturalLanguage(conditions);
      
      // 条件を変更
      conditions[0].values = ['交通費'];
      const updatedResult = generateNaturalLanguage(conditions);
      
      expect(initialResult).not.toBe(updatedResult);
      expect(updatedResult).toBe('経費種別 (交通費)');
    });

    it('Requirement 3.3: 複雑な条件組み合わせの読みやすい表示が実装されている', () => {
      const complexConditions: ConditionBlock[] = [
        {
          id: '1',
          type: 'expenseType',
          operator: 'AND',
          values: ['交通費'],
          label: '経費種別',
          description: '経費種別条件',
        },
        {
          id: '2',
          type: 'merchant',
          operator: 'OR',
          values: ['JR東日本'],
          label: '取引先',
          description: '取引先条件',
        },
        {
          id: '3',
          type: 'keyword',
          operator: 'AND',
          values: ['電車代'],
          label: '摘要キーワード',
          description: 'キーワード条件',
        },
      ];
      
      const result = generateNaturalLanguage(complexConditions);
      
      // 複雑な条件組み合わせが読みやすく表示されることを確認
      expect(result).toContain('かつ');
      expect(result).toContain('または');
      expect(result).toBe('経費種別 (交通費) かつ 取引先 (JR東日本) または 摘要キーワード (電車代)');
    });

    it('Requirement 3.4: 自然言語プレビュー機能が実装されている', () => {
      // 各関数が正しく定義されていることを確認
      expect(typeof formatConditionValues).toBe('function');
      expect(typeof getOperatorLabel).toBe('function');
      expect(typeof getOperatorColor).toBe('function');
      expect(typeof generateNaturalLanguage).toBe('function');
      expect(typeof checkCompletionStatus).toBe('function');
    });
  });
});