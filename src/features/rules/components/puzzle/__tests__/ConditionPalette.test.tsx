import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONDITION_TYPES } from '../ConditionPalette';

describe('ConditionPalette', () => {
  const mockOnAddCondition = vi.fn();

  beforeEach(() => {
    mockOnAddCondition.mockClear();
  });

  describe('CONDITION_TYPES定数', () => {
    it('すべての必要な条件タイプが定義されている', () => {
      const expectedTypes = ['expenseType', 'merchant', 'keyword', 'amount', 'receiptContent'];
      
      expectedTypes.forEach(type => {
        expect(CONDITION_TYPES).toHaveProperty(type);
      });
    });

    it('経費種別の設定が正しい', () => {
      const expenseType = CONDITION_TYPES.expenseType;
      
      expect(expenseType.id).toBe('expenseType');
      expect(expenseType.label).toBe('経費種別');
      expect(expenseType.description).toBe('領収書の経費種別（駐車場代、交通費など）');
      expect(expenseType.icon).toBe('💰');
      expect(expenseType.color).toBe('#4CAF50');
      expect(expenseType.inputType).toBe('tags');
      expect(expenseType.examples).toContain('駐車場代');
      expect(expenseType.examples).toContain('交通費');
    });

    it('取引先の設定が正しい', () => {
      const merchant = CONDITION_TYPES.merchant;
      
      expect(merchant.id).toBe('merchant');
      expect(merchant.label).toBe('取引先');
      expect(merchant.description).toBe('支払先の会社名や店舗名');
      expect(merchant.icon).toBe('🏪');
      expect(merchant.color).toBe('#2196F3');
      expect(merchant.inputType).toBe('tags');
      expect(merchant.examples).toContain('JR東日本');
      expect(merchant.examples).toContain('セブンイレブン');
    });

    it('摘要キーワードの設定が正しい', () => {
      const keyword = CONDITION_TYPES.keyword;
      
      expect(keyword.id).toBe('keyword');
      expect(keyword.label).toBe('摘要キーワード');
      expect(keyword.description).toBe('領収書の摘要や説明に含まれる言葉');
      expect(keyword.icon).toBe('🔍');
      expect(keyword.color).toBe('#FF9800');
      expect(keyword.inputType).toBe('tags');
      expect(keyword.examples).toContain('電車代');
      expect(keyword.examples).toContain('駐車場');
    });

    it('金額範囲の設定が正しい', () => {
      const amount = CONDITION_TYPES.amount;
      
      expect(amount.id).toBe('amount');
      expect(amount.label).toBe('金額範囲');
      expect(amount.description).toBe('支払金額の範囲');
      expect(amount.icon).toBe('💴');
      expect(amount.color).toBe('#9C27B0');
      expect(amount.inputType).toBe('range');
      expect(amount.examples).toContain('1000円以上');
      expect(amount.examples).toContain('5000円以下');
    });

    it('領収書内容の設定が正しい', () => {
      const receiptContent = CONDITION_TYPES.receiptContent;
      
      expect(receiptContent.id).toBe('receiptContent');
      expect(receiptContent.label).toBe('領収書内容');
      expect(receiptContent.description).toBe('領収書全体の内容パターン');
      expect(receiptContent.icon).toBe('📄');
      expect(receiptContent.color).toBe('#607D8B');
      expect(receiptContent.inputType).toBe('text');
      expect(receiptContent.examples).toContain('.*駐車場.*');
      expect(receiptContent.examples).toContain('.*交通費.*');
    });
  });

  describe('条件タイプの色分け', () => {
    it('各条件タイプが異なる色を持つ', () => {
      const colors = Object.values(CONDITION_TYPES).map(type => type.color);
      const uniqueColors = [...new Set(colors)];
      
      expect(uniqueColors.length).toBe(colors.length);
    });

    it('すべての色がHEX形式である', () => {
      Object.values(CONDITION_TYPES).forEach(type => {
        expect(type.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('条件タイプのアイコン', () => {
    it('各条件タイプが異なるアイコンを持つ', () => {
      const icons = Object.values(CONDITION_TYPES).map(type => type.icon);
      const uniqueIcons = [...new Set(icons)];
      
      expect(uniqueIcons.length).toBe(icons.length);
    });

    it('すべてのアイコンが絵文字である', () => {
      Object.values(CONDITION_TYPES).forEach(type => {
        // 絵文字は通常1-4文字の範囲
        expect(type.icon.length).toBeGreaterThan(0);
        expect(type.icon.length).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('条件タイプの例示データ', () => {
    it('すべての条件タイプに例示データが存在する', () => {
      Object.values(CONDITION_TYPES).forEach(type => {
        expect(type.examples).toBeDefined();
        expect(Array.isArray(type.examples)).toBe(true);
        expect(type.examples.length).toBeGreaterThan(0);
      });
    });

    it('例示データが適切な内容である', () => {
      // 経費種別の例示データ
      expect(CONDITION_TYPES.expenseType.examples).toEqual(
        expect.arrayContaining(['駐車場代', '交通費', 'ガソリン代', '通信費'])
      );

      // 取引先の例示データ
      expect(CONDITION_TYPES.merchant.examples).toEqual(
        expect.arrayContaining(['JR東日本', 'セブンイレブン', 'ENEOS', 'NTT'])
      );

      // 摘要キーワードの例示データ
      expect(CONDITION_TYPES.keyword.examples).toEqual(
        expect.arrayContaining(['電車代', '駐車場', 'ガソリン', '会議'])
      );

      // 金額範囲の例示データ
      expect(CONDITION_TYPES.amount.examples).toEqual(
        expect.arrayContaining(['1000円以上', '5000円以下', '1000-5000円'])
      );

      // 領収書内容の例示データ
      expect(CONDITION_TYPES.receiptContent.examples).toEqual(
        expect.arrayContaining(['.*駐車場.*', '.*交通費.*'])
      );
    });
  });

  describe('入力タイプの設定', () => {
    it('適切な入力タイプが設定されている', () => {
      expect(CONDITION_TYPES.expenseType.inputType).toBe('tags');
      expect(CONDITION_TYPES.merchant.inputType).toBe('tags');
      expect(CONDITION_TYPES.keyword.inputType).toBe('tags');
      expect(CONDITION_TYPES.amount.inputType).toBe('range');
      expect(CONDITION_TYPES.receiptContent.inputType).toBe('text');
    });

    it('有効な入力タイプのみが使用されている', () => {
      const validInputTypes = ['tags', 'range', 'text'];
      
      Object.values(CONDITION_TYPES).forEach(type => {
        expect(validInputTypes).toContain(type.inputType);
      });
    });
  });

  describe('Requirements 2.1-2.6, 5.3の検証', () => {
    it('Requirement 2.1: 経費種別条件が正しく定義されている', () => {
      const expenseType = CONDITION_TYPES.expenseType;
      expect(expenseType.icon).toBe('💰');
      expect(expenseType.color).toBe('#4CAF50'); // 緑色
      expect(expenseType.label).toBe('経費種別');
    });

    it('Requirement 2.2: 取引先条件が正しく定義されている', () => {
      const merchant = CONDITION_TYPES.merchant;
      expect(merchant.icon).toBe('🏪');
      expect(merchant.color).toBe('#2196F3'); // 青色
      expect(merchant.label).toBe('取引先');
    });

    it('Requirement 2.3: 摘要キーワード条件が正しく定義されている', () => {
      const keyword = CONDITION_TYPES.keyword;
      expect(keyword.icon).toBe('🔍');
      expect(keyword.color).toBe('#FF9800'); // オレンジ色
      expect(keyword.label).toBe('摘要キーワード');
    });

    it('Requirement 2.4: 金額範囲条件が正しく定義されている', () => {
      const amount = CONDITION_TYPES.amount;
      expect(amount.icon).toBe('💴');
      expect(amount.color).toBe('#9C27B0'); // 紫色
      expect(amount.label).toBe('金額範囲');
    });

    it('Requirement 2.5: 領収書内容条件が正しく定義されている', () => {
      const receiptContent = CONDITION_TYPES.receiptContent;
      expect(receiptContent.icon).toBe('📄');
      expect(receiptContent.color).toBe('#607D8B'); // グレー色
      expect(receiptContent.label).toBe('領収書内容');
    });

    it('Requirement 2.6: 条件タイプごとの色分けとアイコン表示が実装されている', () => {
      // すべての条件タイプが異なる色とアイコンを持つことを確認
      const types = Object.values(CONDITION_TYPES);
      const colors = types.map(t => t.color);
      const icons = types.map(t => t.icon);
      
      expect(new Set(colors).size).toBe(types.length);
      expect(new Set(icons).size).toBe(types.length);
    });

    it('Requirement 5.3: ツールチップで具体例を表示する機能のデータが準備されている', () => {
      // すべての条件タイプに具体例が存在することを確認
      Object.values(CONDITION_TYPES).forEach(type => {
        expect(type.examples).toBeDefined();
        expect(type.examples.length).toBeGreaterThan(0);
        expect(type.description).toBeDefined();
        expect(type.description.length).toBeGreaterThan(0);
      });
    });
  });
});