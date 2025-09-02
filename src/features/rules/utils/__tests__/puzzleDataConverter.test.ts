import {
  convertLegacyToBlocks,
  convertBlocksToLegacy,
  convertLegacyToBlocksWithValidation,
  convertBlocksToLegacyWithValidation,
  validateBlocksIntegrity,
  validateLegacyIntegrity,
  batchConvertLegacyData,
  generateConditionId,
  generateNaturalLanguage,
} from '../puzzleDataConverter';
import { ConditionBlock, RuleConditions, AmountRange } from '@/types/rules';

describe('puzzleDataConverter', () => {
  describe('convertLegacyToBlocks', () => {
    test('経費種別パターンを正しく変換する', () => {
      const legacyConditions: RuleConditions = {
        expenseTypePatterns: ['駐車場代', '交通費'],
        merchantPatterns: [],
        keywords: [],
        receiptContentPatterns: [],
      };

      const blocks = convertLegacyToBlocks(legacyConditions);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('expenseType');
      expect(blocks[0].values).toEqual(['駐車場代', '交通費']);
      expect(blocks[0].operator).toBe('AND');
    });

    test('複数の条件タイプを正しく変換する', () => {
      const legacyConditions: RuleConditions = {
        expenseTypePatterns: ['駐車場代'],
        merchantPatterns: ['JR東日本'],
        keywords: ['電車'],
        receiptContentPatterns: [],
        amountRange: { min: 1000, max: 5000 },
      };

      const blocks = convertLegacyToBlocks(legacyConditions);

      expect(blocks).toHaveLength(4);
      expect(blocks.map(b => b.type)).toEqual(['expenseType', 'merchant', 'keyword', 'amount']);
    });

    test('空の条件を無視する', () => {
      const legacyConditions: RuleConditions = {
        expenseTypePatterns: [],
        merchantPatterns: ['JR東日本'],
        keywords: [],
        receiptContentPatterns: [],
      };

      const blocks = convertLegacyToBlocks(legacyConditions);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('merchant');
    });
  });

  describe('convertBlocksToLegacy', () => {
    test('パズルブロックを従来形式に変換する', () => {
      const blocks: ConditionBlock[] = [
        {
          id: 'test-1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代', '交通費'],
          label: '経費種別',
          description: 'テスト',
          uiState: { isExpanded: true, isDragging: false, hasError: false },
          validation: { required: true, minValues: 1, maxValues: 10 },
        },
        {
          id: 'test-2',
          type: 'amount',
          operator: 'AND',
          values: { min: 1000, max: 5000, currency: 'JPY' } as AmountRange,
          label: '金額範囲',
          description: 'テスト',
          uiState: { isExpanded: true, isDragging: false, hasError: false },
          validation: { required: true, minValues: 1, maxValues: 1 },
        },
      ];

      const conditions = convertBlocksToLegacy(blocks);

      expect(conditions.expenseTypePatterns).toEqual(['駐車場代', '交通費']);
      expect(conditions.amountRange).toEqual({ min: 1000, max: 5000 });
      expect(conditions.conditionBlocks).toEqual(blocks);
    });
  });

  describe('validateBlocksIntegrity', () => {
    test('有効なブロックデータを検証する', () => {
      const blocks: ConditionBlock[] = [
        {
          id: 'test-1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代'],
          label: '経費種別',
          description: 'テスト',
          uiState: { isExpanded: true, isDragging: false, hasError: false },
          validation: { required: true, minValues: 1, maxValues: 10 },
        },
      ];

      const result = validateBlocksIntegrity(blocks);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('無効なブロックデータを検出・修正する', () => {
      const blocks: ConditionBlock[] = [
        {
          id: '',
          type: 'expenseType',
          operator: 'INVALID' as any,
          values: [],
          label: '経費種別',
          description: 'テスト',
        } as ConditionBlock,
      ];

      const result = validateBlocksIntegrity(blocks);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.fixedData).toBeDefined();
      
      const fixedBlocks = result.fixedData as ConditionBlock[];
      expect(fixedBlocks[0].id).toBeTruthy();
      expect(fixedBlocks[0].operator).toBe('AND');
    });

    test('金額範囲の整合性をチェックする', () => {
      const blocks: ConditionBlock[] = [
        {
          id: 'test-1',
          type: 'amount',
          operator: 'AND',
          values: { min: 5000, max: 1000, currency: 'JPY' } as AmountRange,
          label: '金額範囲',
          description: 'テスト',
          uiState: { isExpanded: true, isDragging: false, hasError: false },
          validation: { required: true, minValues: 1, maxValues: 1 },
        },
      ];

      const result = validateBlocksIntegrity(blocks);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('最小金額が最大金額より大きく'))).toBe(true);
    });
  });

  describe('validateLegacyIntegrity', () => {
    test('有効な従来形式データを検証する', () => {
      const conditions: RuleConditions = {
        expenseTypePatterns: ['駐車場代'],
        merchantPatterns: ['JR東日本'],
        keywords: ['電車'],
        receiptContentPatterns: [],
        amountRange: { min: 1000, max: 5000 },
      };

      const result = validateLegacyIntegrity(conditions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('無効な従来形式データを検出・修正する', () => {
      const conditions: RuleConditions = {
        expenseTypePatterns: null as any,
        merchantPatterns: ['', '  ', 'JR東日本'],
        keywords: [],
        receiptContentPatterns: [],
        amountRange: { min: 5000, max: 1000 },
      };

      const result = validateLegacyIntegrity(conditions);

      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const fixedConditions = result.fixedData as RuleConditions;
      expect(Array.isArray(fixedConditions.expenseTypePatterns)).toBe(true);
      expect(fixedConditions.merchantPatterns).toEqual(['JR東日本']);
    });
  });

  describe('convertLegacyToBlocksWithValidation', () => {
    test('整合性チェック付きで変換する', () => {
      const conditions: RuleConditions = {
        expenseTypePatterns: ['駐車場代', ''],
        merchantPatterns: [],
        keywords: [],
        receiptContentPatterns: [],
      };

      const { blocks, integrity } = convertLegacyToBlocksWithValidation(conditions);

      expect(blocks).toHaveLength(1);
      expect(integrity.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('batchConvertLegacyData', () => {
    test('複数のルールを一括変換する', () => {
      const legacyRules: RuleConditions[] = [
        {
          expenseTypePatterns: ['駐車場代'],
          merchantPatterns: [],
          keywords: [],
          receiptContentPatterns: [],
        },
        {
          expenseTypePatterns: [],
          merchantPatterns: ['JR東日本'],
          keywords: [],
          receiptContentPatterns: [],
        },
      ];

      const { convertedRules, summary } = batchConvertLegacyData(legacyRules);

      expect(convertedRules).toHaveLength(2);
      expect(summary.total).toBe(2);
      expect(summary.successful + summary.withWarnings + summary.withErrors).toBe(2);
    });
  });

  describe('generateNaturalLanguage', () => {
    test('条件ブロックから自然言語を生成する', () => {
      const blocks: ConditionBlock[] = [
        {
          id: 'test-1',
          type: 'expenseType',
          operator: 'AND',
          values: ['駐車場代'],
          label: '経費種別',
          description: 'テスト',
          uiState: { isExpanded: true, isDragging: false, hasError: false },
          validation: { required: true, minValues: 1, maxValues: 10 },
        },
        {
          id: 'test-2',
          type: 'merchant',
          operator: 'OR',
          values: ['JR東日本'],
          label: '取引先',
          description: 'テスト',
          uiState: { isExpanded: true, isDragging: false, hasError: false },
          validation: { required: true, minValues: 1, maxValues: 10 },
        },
      ];

      const naturalLanguage = generateNaturalLanguage(blocks);

      expect(naturalLanguage).toContain('経費種別 (駐車場代) AND 取引先 (JR東日本)');
    });

    test('空のブロック配列を処理する', () => {
      const naturalLanguage = generateNaturalLanguage([]);
      expect(naturalLanguage).toBe('条件が設定されていません');
    });

    test('金額範囲を含む条件を処理する', () => {
      const blocks: ConditionBlock[] = [
        {
          id: 'test-1',
          type: 'amount',
          operator: 'AND',
          values: { min: 1000, max: 5000, currency: 'JPY' } as AmountRange,
          label: '金額範囲',
          description: 'テスト',
          uiState: { isExpanded: true, isDragging: false, hasError: false },
          validation: { required: true, minValues: 1, maxValues: 1 },
        },
      ];

      const naturalLanguage = generateNaturalLanguage(blocks);

      expect(naturalLanguage).toContain('金額範囲 (1000円〜5000円)');
    });
  });

  describe('generateConditionId', () => {
    test('一意なIDを生成する', () => {
      const id1 = generateConditionId();
      const id2 = generateConditionId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^condition-\d+-[a-z0-9]+$/);
    });
  });
});