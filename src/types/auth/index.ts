import { BaseEntity, UserRole } from '../common';

// ユーザープロファイル
export interface UserProfile extends BaseEntity {
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
}

// 会社
export interface Company extends BaseEntity {
  name: string;
  isActive: boolean;
  settings?: {
    currency?: string;
    locale?: string;
    timezone?: string;
  };
}

// 会社登録データ
export interface CompanyRegistration {
  name: string;
  adminUser: {
    email: string;
    password: string;
    displayName: string;
  };
  settings?: {
    currency?: string;
    locale?: string;
    timezone?: string;
  };
}

// ユーザー登録データ
export interface UserRegistration {
  email: string;
  password?: string; // オプション：未指定の場合は一時パスワードを生成
  displayName: string;
  role: UserRole;
  companyId?: string;
  departmentId?: string;
}

// 登録レスポンス
export interface RegistrationResponse {
  success: boolean;
  companyId?: string;
  userId?: string;
  message?: string;
  error?: string;
  temporaryPassword?: string; // 一時パスワード（生成された場合のみ）
}

// セッションユーザー（認証後のユーザー情報）
export interface SessionUser {
  uid: string;
  email: string;
  role: UserRole;
  companyId: string;
  departmentId?: string;
}

// 会社ユーザー（管理用）
export interface CompanyUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  companyId: string;
  departmentId?: string;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: Date;
  lastSignInTime?: Date;
}
