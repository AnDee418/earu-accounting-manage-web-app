'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box, Typography, Fade, LinearProgress } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // ログイン済みの場合は経費一覧へ
        router.push('/expenses');
      } else {
        // 未ログインの場合はログインページへ
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%)',
          animation: 'rotate 20s linear infinite',
        },
        '@keyframes rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      }}
    >
      <Fade in={true} timeout={800}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            p: 6,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'pulse 2s ease-in-out infinite alternate',
          }}
        >
          {/* ロゴアイコン */}
          <Box
            sx={{
              mb: 3,
              p: 3,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              animation: 'bounce 2s ease-in-out infinite',
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': {
                  transform: 'translateY(0)',
                },
                '40%': {
                  transform: 'translateY(-10px)',
                },
                '60%': {
                  transform: 'translateY(-5px)',
                },
              },
            }}
          >
            <BusinessIcon sx={{ fontSize: 48 }} />
          </Box>

          {/* システム名 */}
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            EARU 経理管理システム
          </Typography>

          {/* サブタイトル */}
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: 'text.secondary',
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            現代的で直感的な経理管理ソリューション
            <br />
            PCA会計システムとの完全連携
          </Typography>

          {/* プログレスバー */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress
              sx={{
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                },
              }}
            />
          </Box>

          {/* ローディングテキスト */}
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 },
              },
            }}
          >
            システムを初期化しています...
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
