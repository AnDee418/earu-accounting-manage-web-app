import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test/env
 * 環境変数の確認用（開発環境のみ）
 */
export async function GET(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  console.log('=== Environment Variables Check ===');
  
  const envCheck = {
    // Firebase Admin
    FIREBASE_ADMIN_PROJECT_ID: {
      exists: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      value: process.env.FIREBASE_ADMIN_PROJECT_ID || 'NOT_SET',
    },
    FIREBASE_ADMIN_CLIENT_EMAIL: {
      exists: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      value: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'NOT_SET',
    },
    FIREBASE_ADMIN_PRIVATE_KEY: {
      exists: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      hasBeginMarker: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY') || false,
      length: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
    },
    // Firebase Client
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
      exists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET',
    },
    NEXT_PUBLIC_FIREBASE_API_KEY: {
      exists: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasValue: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY.length > 10,
    },
  };

  console.log('Environment check result:', envCheck);

  return NextResponse.json({
    success: true,
    environment: envCheck,
    nodeEnv: process.env.NODE_ENV,
    message: '環境変数の確認が完了しました',
  });
}
