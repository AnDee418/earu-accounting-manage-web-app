import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';
import { GetServerSidePropsContext } from 'next';
import nookies from 'nookies';
import { verifyIdToken } from '../firebase/admin';
import { UserRole } from '@/types';

export interface SessionUser {
  uid: string;
  email: string;
  role: UserRole;
  companyId: string;
  departmentId?: string;
}

/**
 * リクエストからセッションユーザーを取得（Pages Router用）
 */
export async function getSessionUser(
  req: NextApiRequest | GetServerSidePropsContext['req']
): Promise<SessionUser | null> {
  try {
    const cookies = nookies.get({ req });
    const token = cookies.token;

    if (!token) {
      return null;
    }

    const decodedToken = await verifyIdToken(token);
    
    // カスタムクレームからロールと会社IDを取得
    const role = decodedToken.role as UserRole;
    const companyId = decodedToken.companyId as string;
    const departmentId = decodedToken.departmentId as string | undefined;

    if (!role || !companyId) {
      console.error('Missing required claims in token');
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
      companyId,
      departmentId,
    };
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

/**
 * リクエストからセッションユーザーを取得（App Router用）
 */
export async function getSessionUserFromAppRouter(
  req: NextRequest
): Promise<SessionUser | null> {
  try {
    // NextRequestからクッキーを取得
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return null;
    }

    const decodedToken = await verifyIdToken(token);
    
    // カスタムクレームからロールと会社IDを取得
    const role = decodedToken.role as UserRole;
    const companyId = decodedToken.companyId as string;
    const departmentId = decodedToken.departmentId as string | undefined;

    if (!role || !companyId) {
      console.error('Missing required claims in token');
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
      companyId,
      departmentId,
    };
  } catch (error) {
    console.error('Error getting session user from App Router:', error);
    return null;
  }
}

/**
 * ロールベースのアクセス制御
 */
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * 管理者権限チェック
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * 経理権限チェック
 */
export function isFinance(userRole: UserRole): boolean {
  return userRole === 'finance' || userRole === 'admin';
}

/**
 * マネージャー権限チェック
 */
export function isManager(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'finance' || userRole === 'admin';
}

/**
 * APIルートの認証保護ミドルウェア
 */
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredRoles?: UserRole[]
): Promise<SessionUser | null> {
  const user = await getSessionUser(req);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  if (requiredRoles && !hasRequiredRole(user.role, requiredRoles)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return user;
}

/**
 * SSRページの認証保護
 */
export async function requireAuth(
  context: GetServerSidePropsContext,
  requiredRoles?: UserRole[]
) {
  const user = await getSessionUser(context.req);

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if (requiredRoles && !hasRequiredRole(user.role, requiredRoles)) {
    return {
      redirect: {
        destination: '/unauthorized',
        permanent: false,
      },
    };
  }

  return { props: { user } };
}