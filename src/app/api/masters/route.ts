import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUserFromAppRouter } from '@/lib/auth/session';
import { Account, SubAccount, Tax, Department, Category } from '@/types';

/**
 * GET /api/masters
 * マスタデータの一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUserFromAppRouter(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActiveOnly = searchParams.get('activeOnly') !== 'false';

    const companyRef = adminDb.collection('companies').doc(user.companyId);
    let result: any = {};

    // タイプに応じてマスタデータを取得
    if (!type || type === 'accounts') {
      const accountsQuery = isActiveOnly
        ? companyRef.collection('accounts').where('isActive', '==', true)
        : companyRef.collection('accounts');
      
      const accountsSnapshot = await accountsQuery.get();
      const accounts: Account[] = [];
      
      accountsSnapshot.forEach((doc) => {
        const data = doc.data();
        accounts.push({
          pcaCode: doc.id,
          ...data,
          effectiveFrom: data.effectiveFrom?.toDate ? data.effectiveFrom.toDate() : data.effectiveFrom,
          effectiveTo: data.effectiveTo?.toDate ? data.effectiveTo.toDate() : data.effectiveTo,
        } as Account);
      });
      
      result.accounts = accounts;
    }

    if (!type || type === 'taxes') {
      const taxesQuery = isActiveOnly
        ? companyRef.collection('taxes').where('isActive', '==', true)
        : companyRef.collection('taxes');
      
      const taxesSnapshot = await taxesQuery.get();
      const taxes: Tax[] = [];
      
      taxesSnapshot.forEach((doc) => {
        const data = doc.data();
        taxes.push({
          pcaTaxCode: doc.id,
          ...data,
          effectiveFrom: data.effectiveFrom?.toDate ? data.effectiveFrom.toDate() : data.effectiveFrom,
          effectiveTo: data.effectiveTo?.toDate ? data.effectiveTo.toDate() : data.effectiveTo,
        } as Tax);
      });
      
      result.taxes = taxes;
    }

    if (!type || type === 'departments') {
      const departmentsQuery = isActiveOnly
        ? companyRef.collection('departments').where('isActive', '==', true)
        : companyRef.collection('departments');
      
      const departmentsSnapshot = await departmentsQuery.get();
      const departments: Department[] = [];
      
      departmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        departments.push({
          pcaDeptCode: doc.id,
          ...data,
          effectiveFrom: data.effectiveFrom?.toDate ? data.effectiveFrom.toDate() : data.effectiveFrom,
          effectiveTo: data.effectiveTo?.toDate ? data.effectiveTo.toDate() : data.effectiveTo,
        } as Department);
      });
      
      result.departments = departments;
    }

    if (!type || type === 'subAccounts') {
      const subAccountsQuery = isActiveOnly
        ? companyRef.collection('subAccounts').where('isActive', '==', true)
        : companyRef.collection('subAccounts');
      
      const subAccountsSnapshot = await subAccountsQuery.get();
      const subAccounts: SubAccount[] = [];
      
      subAccountsSnapshot.forEach((doc) => {
        const data = doc.data();
        subAccounts.push({
          pcaSubCode: doc.id.split('-')[1], // ドキュメントIDから補助科目コードを抽出
          accountCode: doc.id.split('-')[0], // ドキュメントIDから勘定科目コードを抽出
          ...data,
        } as SubAccount);
      });
      
      result.subAccounts = subAccounts;
    }

    if (!type || type === 'categories') {
      const categoriesSnapshot = await companyRef.collection('categories').get();
      const categories: Category[] = [];
      
      categoriesSnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          ...data,
        } as Category);
      });
      
      result.categories = categories;
    }

    // 単一タイプが指定されている場合はそのデータのみ返す
    if (type && result[type]) {
      return NextResponse.json(result[type]);
    }

    // 全タイプを返す
    return NextResponse.json(result);
  } catch (error) {
    console.error('Masters API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}