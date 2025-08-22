// 共通の基本型定義

// ユーザーロール
export type UserRole = 'staff' | 'manager' | 'finance' | 'admin';

// ステータス関連
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'exported';
export type PcaStatus = 'pending' | 'exported' | 'error';

// 計算方法
export type TaxMethod = 'exclusive' | 'inclusive';
export type RoundingMethod = 'round' | 'ceil' | 'floor';

// AIエンジン
export type AiEngine = 'docai' | 'gemini';

// 経費タイプ
export type ExpenseType = 'receipt' | 'travel' | 'invoice';

// 共通のエンティティインターフェース
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

// アクティブエンティティ
export interface ActiveEntity extends BaseEntity {
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
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

// API レスポンス型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ページネーション
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}
