import { BaseEntity, ExpenseStatus, ExpenseType, PcaStatus, AiEngine } from '../common';

// 経費データ
export interface Expense extends BaseEntity {
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

// エクスポートプロファイル
export interface ExportProfile extends BaseEntity {
  name: string;
  encoding: 'Shift_JIS' | 'UTF-8';
  delimiter: ',' | '\t';
  dateFormat: string;
  mappingJson: Record<string, any>;
}

// エクスポートジョブ
export interface ExportJob extends BaseEntity {
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
  finishedAt?: Date;
}
