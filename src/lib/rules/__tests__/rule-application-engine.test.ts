/**
 * ルール適用エンジンのテスト
 * 要件1.3, 1.5, 2.3, 3.3, 4.1, 4.2, 4.3のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuleApplicationEngine } from '../rule-application-engine';
import {
  AccountAssignmentRule,
  TaxAssignmentRule,
  DepartmentCashMapping,
  DataFormatSettings,
  ProcessingReceiptData,
  DEFAULT_DATA_FORMAT_SETTINGS,
  DEFAULT_DEPARTMENT_MAPPINGS,
} from '../../../types/rules';
import { UserProfile } from '../../../types/auth';

describe('RuleApplicationEngine', () => {
  let engine: RuleApplicationEngine;
  let sampleReceiptData: ProcessingReceiptData;
  let sampleAccountRules: AccountAssignmentRule[];
  let sampleTaxRules: TaxAssignmentRule[];
  let sampleDepartmentMappings: DepartmentCashMapping[];
  let sampleFormatSettings: DataFormatSettings;
  let sampleUserProfile: UserProfile;

  beforeEach(() => {
    engine = new RuleApplicationEngine();
    
    // サンプル領収書データ
    sampleReceiptData = {
      id: 'receipt-001',
      merchant: 'JR東日本',
      expenseType: '交通費', // 経費種別
      amount: 1500,
      taxAmount: 136,
      taxRate: 0.10,
      date: new Date('2024-01-15'),
      description: '新宿-渋谷 電車代',
      invoiceCompliant: true,
      userId: 'user-001',
      departmentCode: '3',
    };

    // サンプル勘定科目ルール
    sampleAccountRules = [
      {
        id: 'account-rule-001',
        name: '旅費交通費ルール',
        description: '交通費の自動割り当て',
        conditions: {
          expenseTypePatterns: ['交通費', '旅費', '電車代'], // 経費種別パターン
          merchantPatterns: ['JR', '地下鉄', 'バス'],
        },
        assignment: {
          debitAccountCode: '726',
          creditAccountCode: '111',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      },
      {
        id: 'account-rule-002',
        name: 'デフォルトルール',
        description: 'その他経費',
        conditions: {},
        assignment: {
          debitAccountCode: '744',
          creditAccountCode: '111',
        },
        priority: 999,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      },
    ];

    // サンプル税区分ルール
    sampleTaxRules = [
      {
        id: 'tax-rule-001',
        name: '10%インボイス対応',
        conditions: {
          taxRate: 0.10,
          invoiceCompliant: true,
        },
        assignment: {
          debitTaxCode: 'Q5',
          creditTaxCode: '00',
        },
        priority: 1,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      },
    ];

    // サンプル部門マッピング
    sampleDepartmentMappings = DEFAULT_DEPARTMENT_MAPPINGS.map((mapping, index) => ({
      ...mapping,
      id: `dept-mapping-${index + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
    }));

    // サンプルフォーマット設定
    sampleFormatSettings = {
      ...DEFAULT_DATA_FORMAT_SETTINGS,
      id: 'format-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
    };

    // サンプルユーザープロファイル
    sampleUserProfile = {
      id: 'user-001',
      uid: 'user-001',
      email: 'test@example.com',
      displayName: 'テストユーザー',
      role: 'employee',
      companyId: 'company-001',
      departmentId: '3',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('勘定科目自動割り当て機能', () => {
    it('条件に一致するルールを適用できる', async () => {
      const result = await engine.applyAccountRules(sampleReceiptData, sampleAccountRules);
      
      expect(result.debitAccountCode).toBe('726');
      expect(result.creditAccountCode).toBe('111');
      expect(result.appliedRuleId).toBe('account-rule-001');
      expect(result.confidence).toBeGreaterThan(0.6); // 経費種別パターンマッチで0.3 + 0.4 = 0.7
    });

    it('優先度の高いルールが適用される', async () => {
      const highPriorityRule: AccountAssignmentRule = {
        ...sampleAccountRules[0],
        id: 'high-priority-rule',
        priority: 0,
        assignment: {
          debitAccountCode: '741',
          creditAccountCode: '111',
        },
      };

      const rules = [sampleAccountRules[0], highPriorityRule];
      const result = await engine.applyAccountRules(sampleReceiptData, rules);
      
      expect(result.debitAccountCode).toBe('741');
      expect(result.appliedRuleId).toBe('high-priority-rule');
    });

    it('条件に一致しない場合はデフォルトルールが適用される', async () => {
      const nonMatchingReceiptData = {
        ...sampleReceiptData,
        accountCode: '754', // 事務用消耗品費
        merchant: 'オフィス用品店',
      };

      const result = await engine.applyAccountRules(nonMatchingReceiptData, sampleAccountRules);
      
      expect(result.debitAccountCode).toBe('744');
      expect(result.appliedRuleId).toBe('account-rule-002');
    });

    it('適用可能なルールがない場合はエラーを投げる', async () => {
      const inactiveRules = sampleAccountRules.map(rule => ({
        ...rule,
        isActive: false,
      }));

      await expect(
        engine.applyAccountRules(sampleReceiptData, inactiveRules)
      ).rejects.toThrow('適用可能な勘定科目割り当てルールが見つかりません');
    });
  });

  describe('税区分自動判定機能', () => {
    it('租税公課の特別処理が正しく動作する', async () => {
      const accountInfo = {
        debitAccountCode: '738',
        debitAccountName: '租税公課',
        creditAccountCode: '111',
        creditAccountName: '現金',
        appliedRuleId: 'test-rule',
        confidence: 1.0,
      };

      const result = await engine.applyTaxRules(sampleReceiptData, accountInfo, sampleTaxRules);
      
      expect(result.debitTaxCode).toBe('P0');
      expect(result.creditTaxCode).toBe('00');
      expect(result.appliedRuleId).toBe('system-rentax-rule');
      expect(result.confidence).toBe(1.0);
    });

    it('10%インボイス対応の税区分が正しく適用される', async () => {
      const accountInfo = {
        debitAccountCode: '726',
        debitAccountName: '旅費交通費',
        creditAccountCode: '111',
        creditAccountName: '現金',
        appliedRuleId: 'test-rule',
        confidence: 1.0,
      };

      const result = await engine.applyTaxRules(sampleReceiptData, accountInfo, sampleTaxRules);
      
      expect(result.debitTaxCode).toBe('Q5');
      expect(result.creditTaxCode).toBe('00');
    });

    it('8%インボイス対応の税区分が正しく適用される', async () => {
      const receiptData8Percent = {
        ...sampleReceiptData,
        taxRate: 0.08,
      };

      const accountInfo = {
        debitAccountCode: '726',
        debitAccountName: '旅費交通費',
        creditAccountCode: '111',
        creditAccountName: '現金',
        appliedRuleId: 'test-rule',
        confidence: 1.0,
      };

      const result = await engine.applyTaxRules(receiptData8Percent, accountInfo, sampleTaxRules);
      
      expect(result.debitTaxCode).toBe('Q6');
      expect(result.creditTaxCode).toBe('00');
    });

    it('インボイス非対応の税区分が正しく適用される', async () => {
      const receiptDataNonCompliant = {
        ...sampleReceiptData,
        invoiceCompliant: false,
      };

      const accountInfo = {
        debitAccountCode: '726',
        debitAccountName: '旅費交通費',
        creditAccountCode: '111',
        creditAccountName: '現金',
        appliedRuleId: 'test-rule',
        confidence: 1.0,
      };

      const result = await engine.applyTaxRules(receiptDataNonCompliant, accountInfo, sampleTaxRules);
      
      expect(result.debitTaxCode).toBe('QD');
      expect(result.creditTaxCode).toBe('00');
    });
  });

  describe('部門情報に基づく現金補助科目自動設定機能', () => {
    it('ユーザープロファイルの部門情報から正しくマッピングされる', async () => {
      const result = await engine.applyDepartmentRules(
        'user-001',
        sampleReceiptData,
        sampleDepartmentMappings,
        sampleUserProfile
      );
      
      expect(result.departmentCode).toBe('3');
      expect(result.departmentName).toBe('東京支店');
      expect(result.cashAuxiliaryCode).toBe('003');
      expect(result.cashAuxiliaryName).toBe('東京支店');
    });

    it('領収書データの部門情報から正しくマッピングされる', async () => {
      const receiptDataWithDept = {
        ...sampleReceiptData,
        departmentCode: '1',
      };

      const result = await engine.applyDepartmentRules(
        'user-001',
        receiptDataWithDept,
        sampleDepartmentMappings
      );
      
      expect(result.departmentCode).toBe('1');
      expect(result.departmentName).toBe('札幌支店');
      expect(result.cashAuxiliaryCode).toBe('001');
      expect(result.cashAuxiliaryName).toBe('札幌支店');
    });

    it('部門情報がない場合はエラーを投げる', async () => {
      const receiptDataNoDept = {
        ...sampleReceiptData,
        departmentCode: undefined,
      };

      await expect(
        engine.applyDepartmentRules('user-001', receiptDataNoDept, sampleDepartmentMappings)
      ).rejects.toThrow('ユーザーの部門情報が見つかりません');
    });

    it('対応するマッピングがない場合はエラーを投げる', async () => {
      const receiptDataInvalidDept = {
        ...sampleReceiptData,
        departmentCode: '999',
      };

      await expect(
        engine.applyDepartmentRules('user-001', receiptDataInvalidDept, sampleDepartmentMappings)
      ).rejects.toThrow('部門コード 999 に対応するマッピングが見つかりません');
    });
  });

  describe('摘要自動生成機能', () => {
    it('正しいフォーマットで摘要が生成される', () => {
      const result = engine.generateDescription(sampleReceiptData, sampleFormatSettings);
      
      expect(result).toBe('[交通費代　JR東日本]');
    });

    it('経費種別がない場合はデフォルト値が使用される', () => {
      const receiptDataNoExpenseType = {
        ...sampleReceiptData,
        expenseType: undefined,
      };

      const result = engine.generateDescription(receiptDataNoExpenseType, sampleFormatSettings);
      
      expect(result).toBe('[経費代　JR東日本]');
    });

    it('無効なフォーマットの場合はエラーを投げる', () => {
      const invalidFormatSettings = {
        ...sampleFormatSettings,
        descriptionTemplate: '{merchant}', // 無効なフォーマット
      };

      expect(() => {
        engine.generateDescription(sampleReceiptData, invalidFormatSettings);
      }).toThrow('生成された摘要がフォーマット要件を満たしていません');
    });
  });

  describe('データフォーマット適用機能', () => {
    it('正しいPCA形式でデータがフォーマットされる', () => {
      const processedData = {
        ...sampleReceiptData,
        accountAssignment: {
          debitAccountCode: '726',
          debitAccountName: '旅費交通費',
          creditAccountCode: '111',
          creditAccountName: '現金',
          appliedRuleId: 'test-rule',
          confidence: 1.0,
        },
        taxAssignment: {
          debitTaxCode: 'Q5',
          debitTaxName: '仕入10%',
          creditTaxCode: '00',
          creditTaxName: '対象外',
          appliedRuleId: 'test-rule',
          confidence: 1.0,
        },
        departmentAssignment: {
          departmentCode: '3',
          departmentName: '東京本社',
          cashAuxiliaryCode: '003',
          cashAuxiliaryName: '東京本社',
          appliedRuleId: 'test-rule',
        },
        formattedData: {
          date: '20240115',
          description: '[travel JR東日本]',
          programClassification: '2',
          taxAmountHandling: 'blank' as const,
          amountType: 'tax_inclusive' as const,
        },
      };

      const result = engine.applyFormatRules(processedData, sampleFormatSettings);
      
      expect(result.date).toBe('20240115');
      expect(result.description).toBe('[travel JR東日本]');
      expect(result.programClassification).toBe('2');
      expect(result.taxAmountHandling).toBe('blank');
      expect(result.amountType).toBe('tax_inclusive');
    });
  });

  describe('包括的ルール適用', () => {
    it('全ルールが正しく順次適用される', async () => {
      const result = await engine.processReceipt(
        sampleReceiptData,
        sampleAccountRules,
        sampleTaxRules,
        sampleDepartmentMappings,
        sampleFormatSettings,
        sampleUserProfile
      );
      
      // 勘定科目割り当て
      expect(result.accountAssignment.debitAccountCode).toBe('726');
      expect(result.accountAssignment.creditAccountCode).toBe('111');
      
      // 税区分判定
      expect(result.taxAssignment.debitTaxCode).toBe('Q5');
      expect(result.taxAssignment.creditTaxCode).toBe('00');
      
      // 部門・現金補助科目設定
      expect(result.departmentAssignment.departmentCode).toBe('3');
      expect(result.departmentAssignment.cashAuxiliaryCode).toBe('003');
      
      // フォーマット適用
      expect(result.formattedData.date).toBe('20240115');
      expect(result.formattedData.description).toBe('[交通費代　JR東日本]');
      expect(result.formattedData.programClassification).toBe('2');
    });

    it('処理中にエラーが発生した場合は適切にハンドリングされる', async () => {
      const invalidReceiptData = {
        ...sampleReceiptData,
        departmentCode: undefined,
      };

      await expect(
        engine.processReceipt(
          invalidReceiptData,
          sampleAccountRules,
          sampleTaxRules,
          sampleDepartmentMappings,
          sampleFormatSettings
        )
      ).rejects.toThrow('領収書処理中にエラーが発生しました');
    });
  });

  describe('ヘルパーメソッドのテスト', () => {
    it('日付フォーマットが正しく動作する', () => {
      const date = new Date('2024-01-15');
      const result = (engine as any).formatDate(date, 'YYYYMMDD');
      
      expect(result).toBe('20240115');
    });

    it('摘要フォーマット検証が正しく動作する', () => {
      expect((engine as any).validateDescriptionFormat('[旅費交通費代　JR東日本]')).toBe(true);
      expect((engine as any).validateDescriptionFormat('travel JR東日本')).toBe(false);
      expect((engine as any).validateDescriptionFormat('[travel]')).toBe(false);
    });

    it('税率に基づく税区分コード決定が正しく動作する', () => {
      const receiptData10Percent = { ...sampleReceiptData, taxRate: 0.10, invoiceCompliant: true };
      const receiptData8Percent = { ...sampleReceiptData, taxRate: 0.08, invoiceCompliant: false };
      const receiptDataOther = { ...sampleReceiptData, taxRate: 0.05, invoiceCompliant: true };
      
      expect((engine as any).determineTaxCodeByRate(receiptData10Percent)).toBe('Q5');
      expect((engine as any).determineTaxCodeByRate(receiptData8Percent)).toBe('QE');
      expect((engine as any).determineTaxCodeByRate(receiptDataOther)).toBe('00');
    });
  });
});