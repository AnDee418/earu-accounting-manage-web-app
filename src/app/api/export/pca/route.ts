import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { ExportJob, ExpenseStatus } from '@/types';

/**
 * POST /api/export/pca
 * PCA会計クラウド向けCSVエクスポートジョブを作成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 経理権限チェック
    if (user.role !== 'finance' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // リクエストボディの取得
    const body = await request.json();
    const { periodFrom, periodTo, departments, status, profileId } = body;

    // バリデーション
    if (!periodFrom || !periodTo) {
      return NextResponse.json(
        { error: 'periodFrom and periodTo are required' },
        { status: 400 }
      );
    }

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    // 日付の妥当性チェック
    const fromDate = new Date(periodFrom);
    const toDate = new Date(periodTo);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (fromDate > toDate) {
      return NextResponse.json(
        { error: 'periodFrom must be before periodTo' },
        { status: 400 }
      );
    }

    // ステータスのバリデーション（エクスポート対象は承認済みのみ）
    const validStatuses: ExpenseStatus[] = ['approved', 'exported'];
    const exportStatuses = status && Array.isArray(status) 
      ? status.filter((s: string) => validStatuses.includes(s as ExpenseStatus))
      : ['approved'];

    // エクスポートプロファイルの存在確認
    const profileRef = adminDb
      .collection('companies')
      .doc(user.companyId)
      .collection('exportProfiles')
      .doc(profileId);
    
    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 });
    }

    // エクスポートジョブの作成
    const jobData: Omit<ExportJob, 'id'> = {
      filters: {
        periodFrom: periodFrom,
        periodTo: periodTo,
        departments: departments || [],
        status: exportStatuses,
        profileId: profileId,
      },
      status: 'running',
      createdBy: user.uid,
      createdAt: new Date(),
      summary: {
        totalCount: 0,
        totalAmount: 0,
        exportedCount: 0,
      },
    };

    // Firestoreにジョブを保存
    const jobRef = await adminDb
      .collection('companies')
      .doc(user.companyId)
      .collection('exportJobs')
      .add(jobData);

    // 監査ログの記録
    await adminDb
      .collection('companies')
      .doc(user.companyId)
      .collection('auditLogs')
      .add({
        actorId: user.uid,
        action: 'export_job_created',
        targetPath: `exportJobs/${jobRef.id}`,
        after: jobData,
        at: new Date(),
      });

    // 注: 実際のCSV生成処理はCloud Functionsで非同期に実行される想定
    // ここではジョブの作成のみを行う

    return NextResponse.json({
      jobId: jobRef.id,
      status: 'running',
      message: 'Export job created successfully. CSV generation will be processed asynchronously.',
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export/pca
 * エクスポートジョブの一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 経理権限チェック
    if (user.role !== 'finance' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // エクスポートジョブの取得
    let query = adminDb
      .collection('companies')
      .doc(user.companyId)
      .collection('exportJobs')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const jobs: ExportJob[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        finishedAt: data.finishedAt?.toDate ? data.finishedAt.toDate() : data.finishedAt,
      } as ExportJob);
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}