'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import GoogleIcon from '@mui/icons-material/Google';
import BusinessIcon from '@mui/icons-material/Business';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/expenses');
    } catch (error: any) {
      console.error('Login error:', error);
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      await signInWithPopup(auth, provider);
      router.push('/expenses');
    } catch (error: any) {
      console.error('Google login error:', error);
      setError('Googleログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleAzureLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      await signInWithPopup(auth, provider);
      router.push('/expenses');
    } catch (error: any) {
      console.error('Azure login error:', error);
      setError('Azure ADログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              EARU 経理管理システム
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
              経理管理者向けWebアプリケーション
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleEmailLogin}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'ログイン'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>または</Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Google Workspaceでログイン
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<BusinessIcon />}
              onClick={handleAzureLogin}
              disabled={loading}
            >
              Azure ADでログイン
            </Button>

            <Typography variant="caption" display="block" align="center" sx={{ mt: 3 }}>
              ※ 事前に管理者による権限設定が必要です
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}