// ユーザーロール
export type UserRole = 'staff' | 'manager' | 'finance' | 'admin';

// 経費ステータス
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'exported';

// 経費タイプ
export type ExpenseType = 'receipt' | 'travel' | 'invoice';

// PCAステータス
export type PcaStatus = 'pending' | 'exported' | 'error';

// AIエンジン
export type AiEngine = 'docai' | 'gemini';

// 税計算方法
export type TaxMethod = 'exclusive' | 'inclusive';

// 端数処理方法
export type RoundingMethod = 'round' | 'ceil' | 'floor';

// ユーザープロファイル
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  departmentId?: string;
  phone?: string;
  settings?: {
    locale?: string;
    currency?: string;
    notifications?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 経費データ
export interface Expense {
  id: string;
  companyId: string;
  userId: string;
  status: ExpenseStatus;
  type: ExpenseType;
  currency: string;
  total: number;
  tax: number;
  subtotal: number;
  taxRate: number;
  paidAt: Date | string;
  merchant: string;
  categoryId?: string;
  departmentId?: string;
  projectCode?: string;
  note?: string;
  ai?: {
    engine: AiEngine;
    confidence: number;
    rawJsonRef?: string;
    extractedData?: Record<string, any>;
  };
  duplicateIds: string[];
  approverId?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  pcaStatus: PcaStatus;
  pcaJournalId?: string;
  exportAt?: Date;
  accountSnapshot?: {
    pcaCode: string;
    name: string;
    taxCode: string;
    rate: number;
  };
  attachmentUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 経費検索ビュー
export interface ExpenseSearch {
  id: string;
  userId: string;
  departmentId?: string;
  status: ExpenseStatus;
  paidAt: Date | string;
  total: number;
  currency: string;
  merchant: string;
  categoryId?: string;
  pcaStatus: PcaStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 部門マスタ
export interface Department {
  pcaDeptCode: string;
  name: string;
  parentCode?: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

// 勘定科目マスタ
export interface Account {
  pcaCode: string;
  name: string;
  taxCode: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  aliases?: string[];
}

// 税区分マスタ
export interface Tax {
  pcaTaxCode: string;
  rate: number;
  rounding: RoundingMethod;
  method: TaxMethod;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

// カテゴリマスタ
export interface Category {
  id: string;
  name: string;
  defaultDebitAccountPcaCode?: string;
  defaultCreditAccountPcaCode?: string;
  taxRule?: string;
  hints?: string[];
  icon?: string;
  color?: string;
  sortOrder: number;
}

// エクスポートプロファイル
export interface ExportProfile {
  id: string;
  name: string;
  encoding: 'Shift_JIS' | 'UTF-8';
  delimiter: ',' | '\t';
  dateFormat: string;
  mappingJson: Record<string, any>;
}

// エクスポートジョブ
export interface ExportJob {
  id: string;
  filters: {
    periodFrom: Date | string;
    periodTo: Date | string;
    departments?: string[];
    status?: ExpenseStatus[];
    profileId: string;
  };
  status: 'running' | 'done' | 'error';
  filePath?: string;
  summary?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  finishedAt?: Date;
}

// 監査ログ
export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetPath: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  at: Date;
}