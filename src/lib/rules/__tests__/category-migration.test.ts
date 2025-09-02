/**
 * カテゴリ移行ユーティリティのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  migrateCategoryRulesToExpenseTypePatterns,
  validatePCAAccountCode,
  validatePCATaxCode,
  getRecommendedAccountCodeByExpenseType,
  generatePCACompliantRuleSet,
  disableCategoryMasterTable,
  generateMigrationReport,
  executeCategoryMigration,
} from '../category-migration';

describe('カテゴリ移行ユーティリティ', () => {
  let sampleCategoryRules: any[];
  let sampleCategories: any[];

  beforeEach(() => {
    sampleCategoryRules = [
      {
        id: 'old-rule-1',
        name: '旅費交通費ルール',
        description: '交通費の自動割り当て',
        conditions: {
          categories: ['travel', 'transportation'],
          merchantPatterns: ['JR', '地下鉄'],
          keywords: ['電車', '運賃'],
        },
        assignment: {
          debitAccountCode: '726',
          creditAccountCode: '111',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdBy: 'admin',
      },
      {
        id: 'old-rule-2',
        name: '福利厚生費ルール',
        conditions: {
          categories: ['welfare', 'benefits'],
          keywords: ['保険', '年金'],
        },
        assignment: {
          debitAccountCode: '724',
          creditAccountCode: '111',
        },
        priority: 2,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdBy: 'admin',
      },
    ];

    sampleCategories = [
      {
        id: 'cat-1',
        name: '交通費',
        code: 'travel',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'cat-2',
        name: '福利厚生',
        code: 'welfare',
        isActive: true,
        createdAt: new Date(),
      },
    ];
  });

  describe('migrateCategoryRulesToExpenseTypePatterns', () => {
    it('カテゴリベースルールを経費種別パターンルールに正しく変換する', () => {
      const result = migrateCategoryRulesToExpenseTypePatterns(sampleCategoryRules);

      expect(result).toHaveLength(2);
      
      // 最初のルール（旅費交通費）
      expect(result[0].name).toBe('旅費交通費ルール');
      expect(result[0].conditions.expenseTypePatterns).toEqual([
        '交通費', '旅費', '電車代', // travel
        '交通費', 'バス代', '運賃',  // transportation
      ]);
      expect(result[0].conditions.merchantPatterns).toEqual(['JR', '地下鉄']);
      expect(result[0].conditions.keywords).toEqual(['電車', '運賃']);
      expect(result[0].assignment.debitAccountCode).toBe('726');

      // 2番目のルール（福利厚生費）
      expect(result[1].name).toBe('福利厚生費ルール');
      expect(result[1].conditions.expenseTypePatterns).toEqual([
        '福利厚生', '健康保険', '厚生年金', // welfare
        '福利厚生', '手当', '給付',        // benefits
      ]);
      expect(result[1].assignment.debitAccountCode).toBe('724');
    });

    it('未知のカテゴリはそのまま経費種別パターンとして使用される', () => {
      const ruleWithUnknownCategory = [{
        id: 'unknown-rule',
        name: '未知カテゴリルール',
        conditions: {
          categories: ['unknown_category'],
        },
        assignment: {
          debitAccountCode: '737',
          creditAccountCode: '111',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: 'admin',
      }];

      const result = migrateCategoryRulesToExpenseTypePatterns(ruleWithUnknownCategory);

      expect(result[0].conditions.expenseTypePatterns).toEqual(['unknown_category']);
    });

    it('カテゴリがないルールも正しく処理される', () => {
      const ruleWithoutCategories = [{
        id: 'no-cat-rule',
        name: 'カテゴリなしルール',
        conditions: {
          merchantPatterns: ['テスト'],
        },
        assignment: {
          debitAccountCode: '737',
          creditAccountCode: '111',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: 'admin',
      }];

      const result = migrateCategoryRulesToExpenseTypePatterns(ruleWithoutCategories);

      expect(result[0].conditions.expenseTypePatterns).toEqual([]);
      expect(result[0].conditions.merchantPatterns).toEqual(['テスト']);
    });
  });

  describe('validatePCAAccountCode', () => {
    it('有効なPCA勘定科目コードを正しく検証する', () => {
      expect(validatePCAAccountCode('111')).toBe(true); // 現金
      expect(validatePCAAccountCode('724')).toBe(true); // 福利厚生費
      expect(validatePCAAccountCode('726')).toBe(true); // 旅費交通費
      expect(validatePCAAccountCode('738')).toBe(true); // 租税公課
    });

    it('無効な勘定科目コードを正しく検証する', () => {
      expect(validatePCAAccountCode('999')).toBe(false);
      expect(validatePCAAccountCode('123')).toBe(false);
      expect(validatePCAAccountCode('')).toBe(false);
    });
  });

  describe('validatePCATaxCode', () => {
    it('有効なPCA税区分コードを正しく検証する', () => {
      expect(validatePCATaxCode('Q5')).toBe(true);
      expect(validatePCATaxCode('Q6')).toBe(true);
      expect(validatePCATaxCode('QD')).toBe(true);
      expect(validatePCATaxCode('QE')).toBe(true);
      expect(validatePCATaxCode('P0')).toBe(true);
      expect(validatePCATaxCode('00')).toBe(true);
    });

    it('無効な税区分コードを正しく検証する', () => {
      expect(validatePCATaxCode('XX')).toBe(false);
      expect(validatePCATaxCode('Q9')).toBe(false);
      expect(validatePCATaxCode('')).toBe(false);
    });
  });

  describe('getRecommendedAccountCodeByExpenseType', () => {
    it('経費種別から正しい勘定科目コードを取得する', () => {
      expect(getRecommendedAccountCodeByExpenseType('交通費')).toBe('726');
      expect(getRecommendedAccountCodeByExpenseType('福利厚生')).toBe('724');
      expect(getRecommendedAccountCodeByExpenseType('駐車場代')).toBe('729');
      expect(getRecommendedAccountCodeByExpenseType('印紙税')).toBe('738');
    });

    it('未知の経費種別の場合はnullを返す', () => {
      expect(getRecommendedAccountCodeByExpenseType('未知の経費')).toBeNull();
      expect(getRecommendedAccountCodeByExpenseType('')).toBeNull();
    });
  });

  describe('generatePCACompliantRuleSet', () => {
    it('PCA準拠のデフォルトルールセットを生成する', () => {
      const result = generatePCACompliantRuleSet();

      expect(result.accountRules).toBeDefined();
      expect(result.taxRules).toBeDefined();
      expect(result.accountRules.length).toBeGreaterThan(0);
      expect(result.taxRules.length).toBeGreaterThan(0);

      // 各ルールがPCA準拠であることを確認
      result.accountRules.forEach(rule => {
        expect(validatePCAAccountCode(rule.assignment.debitAccountCode)).toBe(true);
        expect(validatePCAAccountCode(rule.assignment.creditAccountCode)).toBe(true);
        expect(rule.conditions.expenseTypePatterns).toBeDefined();
        expect(rule.conditions.expenseTypePatterns!.length).toBeGreaterThan(0);
      });

      result.taxRules.forEach(rule => {
        expect(validatePCATaxCode(rule.assignment.debitTaxCode)).toBe(true);
        expect(validatePCATaxCode(rule.assignment.creditTaxCode)).toBe(true);
        expect(rule.conditions.accountCodes).toBeDefined();
      });
    });
  });

  describe('disableCategoryMasterTable', () => {
    it('カテゴリマスターテーブルを正しく無効化する', () => {
      const result = disableCategoryMasterTable(sampleCategories);

      expect(result).toHaveLength(2);
      result.forEach(category => {
        expect(category.isActive).toBe(false);
        expect(category.disabledAt).toBeInstanceOf(Date);
        expect(category.disabledReason).toContain('PCA準拠性向上');
        expect(category.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('generateMigrationReport', () => {
    it('移行レポートを正しく生成する', () => {
      const migratedRules = migrateCategoryRulesToExpenseTypePatterns(sampleCategoryRules);
      const report = generateMigrationReport(sampleCategoryRules, migratedRules);

      expect(report.totalCategoryRules).toBe(2);
      expect(report.migratedRules).toBe(2);
      expect(report.failedMigrations).toBe(0);
      expect(report.newExpenseTypePatterns).toContain('交通費');
      expect(report.newExpenseTypePatterns).toContain('福利厚生');
      expect(report.recommendedActions).toBeDefined();
      expect(report.recommendedActions.length).toBeGreaterThan(0);
      expect(report.pcaComplianceIssues).toEqual([]); // サンプルデータはPCA準拠
    });

    it('PCA準拠性の問題を検出する', () => {
      const invalidRule = [{
        id: 'invalid-rule',
        name: '無効ルール',
        conditions: {
          expenseTypePatterns: ['テスト'],
        },
        assignment: {
          debitAccountCode: '999', // 無効なコード
          creditAccountCode: '111',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test',
      }];

      const report = generateMigrationReport([], invalidRule);

      expect(report.pcaComplianceIssues.length).toBeGreaterThan(0);
      expect(report.pcaComplianceIssues[0]).toContain('無効な借方勘定科目コード 999');
      expect(report.recommendedActions[0]).toContain('⚠️ PCA準拠性の問題を修正');
    });
  });

  describe('executeCategoryMigration', () => {
    it('完全な移行プロセスを正しく実行する', async () => {
      const result = await executeCategoryMigration(sampleCategoryRules, sampleCategories);

      expect(result.migratedRules).toHaveLength(2);
      expect(result.disabledCategories).toHaveLength(2);
      expect(result.report).toBeDefined();

      // 移行されたルールの確認
      expect(result.migratedRules[0].conditions.expenseTypePatterns).toBeDefined();
      expect(result.migratedRules[0].conditions.expenseTypePatterns!.length).toBeGreaterThan(0);

      // 無効化されたカテゴリの確認
      result.disabledCategories.forEach(category => {
        expect(category.isActive).toBe(false);
      });

      // レポートの確認
      expect(result.report.totalCategoryRules).toBe(2);
      expect(result.report.migratedRules).toBe(2);
      expect(result.report.failedMigrations).toBe(0);
    });
  });
});