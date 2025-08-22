import { ActiveEntity, BaseEntity } from '../common';

// 部門マスタ
export interface Department extends Omit<ActiveEntity, 'id'> {
  pcaDeptCode: string; // 部門コード（主キー）
  name: string; // 部門名
  kanaIndex?: string; // ｶﾅ索引
  businessType?: number; // 簡易課税業種 (1-6)
  parentCode?: string; // 親部門コード（階層構造用）
}

// 勘定科目マスタ（PCA形式）
export interface Account extends Omit<ActiveEntity, 'id'> {
  // 基本情報
  pcaCode: string; // 勘定科目コード（3桁）（主キー）
  attributeCode?: string; // 勘定科目属性（8桁）
  name: string; // 勘定科目名
  kanaIndex?: string; // カナ索引
  fullName?: string; // 勘定科目正式名
  
  // 貸借区分
  balanceType?: 1 | 2; // 1=資産・費用, 2=負債・収益・純資産
  
  // 税区分設定
  debitTaxCode: string; // 借方税区分コード
  debitTaxName?: string; // 借方税区分名
  creditTaxCode: string; // 貸方税区分コード
  creditTaxName?: string; // 貸方税区分名
  
  // 関連科目
  relatedAccountCode?: string; // 関連科目コード
  relatedAccountName?: string; // 関連科目名
  
  // 表示・計算設定
  displayType?: number; // 表示区分
  autoTaxCalc?: 0 | 9; // 消費税自動計算（0=しない, 9=する）
  taxRounding?: 0 | 9; // 消費税端数処理
  
  // 原価管理
  costType?: 0 | 1 | 2 | 3; // 固定費変動費区分（0=変動費, 1=固定費, 2=半変動費, 3=売上）
  fixedCostRatio?: number; // 固定費割合（0-100）
  
  // 簡易課税
  businessType?: 1 | 2 | 3 | 4 | 5 | 6; // 簡易課税業種（1-6）
  
  // 入力設定
  requiresPartner?: boolean; // 取引先入力
  statementSetting?: string; // 内訳書の設定
  
  // その他
  aliases?: string[];
  subAccounts?: SubAccount[]; // 補助科目のリスト
}

// 補助科目マスタ（PCA形式：25列完全対応）
export interface SubAccount {
  // 基本情報（複合キー: accountCode-pcaSubCode）
  accountCode: string; // 勘定科目コード
  accountName: string; // 勘定科目名
  pcaSubCode: string; // 補助科目コード
  name: string; // 補助科目名
  kanaIndex: string; // ｶﾅ索引
  fullName: string; // 補助科目正式名
  fullNameKana: string; // 正式名ﾌﾘｶﾞﾅ

  // 税設定
  debitTaxCode: string; // 借方税区分コード
  debitTaxName: string; // 借方税区分名
  creditTaxCode: string; // 貸方税区分コード
  creditTaxName: string; // 貸方税区分名
  autoTaxCalc: number; // 消費税自動計算 (0:しない、9:する)
  taxRounding: number; // 消費税端数処理 (9:切り捨て等)

  // 連絡先情報
  postalCode?: string; // 郵便番号
  address1?: string; // 住所１
  address2?: string; // 住所２
  tel?: string; // TEL
  fax?: string; // FAX

  // 取引条件
  bankInfo: string; // 振込先
  closingDay: number; // 締日
  paymentDay: number; // 支払日

  // 事業者情報
  corporateNumber?: string; // 法人番号
  businessType: number; // 事業者区分 (3:その他等)
  invoiceRegistrationNumber?: string; // 適格請求書発行事業者の登録番号
  digitalInvoiceReceive: number; // デジタルインボイス受信 (0:なし、1:あり)

  // システム用
  isActive: boolean;
}

// 税区分マスタ（PCA形式）
export interface Tax extends Omit<ActiveEntity, 'id'> {
  pcaTaxCode: string; // 税区分コード（主キー）
  shortName: string; // PCA略称
  description: string; // PCA説明
}

// カテゴリマスタ
export interface Category extends BaseEntity {
  name: string;
  defaultDebitAccountPcaCode?: string;
  defaultCreditAccountPcaCode?: string;
  taxRule?: string;
  hints?: string[];
  icon?: string;
  color?: string;
  sortOrder: number;
}

// マスタデータの一括取得用
export interface MasterData {
  accounts?: Account[];
  subAccounts?: SubAccount[];
  taxes?: Tax[];
  departments?: Department[];
  categories?: Category[];
}

// CSVインポート用
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

// タブの種類
export type SettingsTabType = 'taxes' | 'accounts' | 'subAccounts' | 'categories' | 'departments' | 'users';

// フィルターオプション
export interface MasterDataFilters {
  type?: SettingsTabType | SettingsTabType[];
  isActiveOnly?: boolean;
  search?: string;
}
