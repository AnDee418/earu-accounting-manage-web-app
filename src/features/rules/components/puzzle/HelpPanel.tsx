'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Collapse,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface HelpPanelProps {
  /** ヘルプパネルの表示状態 */
  show: boolean;
  /** ヘルプパネルを閉じるコールバック */
  onClose: () => void;
  /** 現在の条件ブロック数（段階的ガイダンス用） */
  conditionCount?: number;
  /** 段階的ガイダンスを有効にするか */
  enableStepByStep?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * パズル型ルールビルダーのヘルプパネルコンポーネント
 * 
 * Requirements: 5.1, 5.2
 * - 使い方説明の表示・非表示切り替え
 * - 段階的なガイダンス機能
 */
export default function HelpPanel({
  show,
  onClose,
  conditionCount = 0,
  enableStepByStep = true,
  className,
}: HelpPanelProps) {
  const [activeStep, setActiveStep] = useState(0);

  // 段階的ガイダンスのステップ定義
  const guidanceSteps = [
    {
      label: '条件ブロックを追加',
      description: '下のパレットから条件の種類を選んでクリックしてください',
      icon: '🧩',
      completed: conditionCount > 0,
      details: [
        '💰 経費種別: 駐車場代、交通費など',
        '🏪 取引先: JR東日本、セブンイレブンなど',
        '🔍 摘要キーワード: 電車代、駐車場など',
        '💴 金額範囲: 1000円以上、5000円以下など',
        '📄 領収書内容: 正規表現パターン',
      ],
    },
    {
      label: '条件を設定',
      description: '追加したブロックで具体的な条件を入力してください',
      icon: '✏️',
      completed: conditionCount > 0,
      details: [
        'タグ入力: カンマ区切りで複数入力可能',
        '金額範囲: 最小・最大金額を設定',
        'オートコンプリート: 過去の入力履歴から候補表示',
        'プレースホルダー: 具体例を参考に入力',
      ],
    },
    {
      label: '論理演算子を選択',
      description: 'ブロック間の関係（AND/OR）を設定してください',
      icon: '🔗',
      completed: conditionCount > 1,
      details: [
        'AND (緑色): すべての条件を満たす',
        'OR (オレンジ色): どれかの条件を満たす',
        '視覚的な線: 条件間の関係が色で表示',
        '優先順位: 上から下の順序で評価',
      ],
    },
    {
      label: '順序を調整',
      description: 'ドラッグ&ドロップで条件の優先順位を変更できます',
      icon: '↕️',
      completed: false, // 実際のドラッグ操作は検出困難なため常にfalse
      details: [
        'ドラッグ: ブロックをつかんで移動',
        'ドロップ: 挿入したい位置で離す',
        'ハイライト: 挿入可能位置が表示',
        '削除: 各ブロックの削除ボタンで削除',
      ],
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Collapse in={show}>
      <Alert
        severity="info"
        className={className}
        sx={{
          mb: 3,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        action={
          <IconButton
            aria-label="ヘルプを閉じる"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <Box>
          {/* ヘルプヘッダー */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🧩 パズル型ルール作成の使い方
            </Typography>
          </Box>

          {/* 基本的な使い方説明 */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" gutterBottom>
              📋 基本的な使い方
            </Typography>
            <Typography variant="body2" component="div" sx={{ mb: 2 }}>
              パズルのピースを組み合わせるように、条件ブロックを追加・設定してルールを作成します。
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <Typography component="li" variant="body2">
                <strong>条件ブロック追加:</strong> 下のパレットから条件の種類を選択
              </Typography>
              <Typography component="li" variant="body2">
                <strong>条件設定:</strong> 各ブロックで具体的な条件を入力
              </Typography>
              <Typography component="li" variant="body2">
                <strong>論理演算子:</strong> ブロック間の関係（AND/OR）を設定
              </Typography>
              <Typography component="li" variant="body2">
                <strong>順序調整:</strong> ドラッグ&ドロップで優先順位を変更
              </Typography>
            </Box>
          </Paper>

          {/* 段階的ガイダンス */}
          {enableStepByStep && (
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                🎯 段階的ガイダンス
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                {guidanceSteps.map((step, index) => (
                  <Step key={step.label} completed={step.completed}>
                    <StepLabel
                      optional={
                        step.completed ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                            <CheckCircleIcon fontSize="small" />
                            <Typography variant="caption">完了</Typography>
                          </Box>
                        ) : null
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{step.icon}</span>
                        <span>{step.label}</span>
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {step.description}
                      </Typography>
                      
                      {/* ステップの詳細情報 */}
                      <Box sx={{ mb: 2 }}>
                        {step.details.map((detail, detailIndex) => (
                          <Typography
                            key={detailIndex}
                            variant="body2"
                            sx={{
                              fontSize: '0.875rem',
                              color: 'text.secondary',
                              ml: 1,
                              mb: 0.5,
                            }}
                          >
                            • {detail}
                          </Typography>
                        ))}
                      </Box>

                      {/* ナビゲーションボタン */}
                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                          size="small"
                          disabled={index === guidanceSteps.length - 1}
                          startIcon={<PlayArrowIcon />}
                        >
                          {index === guidanceSteps.length - 1 ? '完了' : '次へ'}
                        </Button>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                          size="small"
                        >
                          戻る
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              {/* ガイダンス完了時のアクション */}
              {activeStep === guidanceSteps.length && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    🎉 ガイダンス完了！これでパズル型ルール作成をマスターしました。
                  </Typography>
                  <Button onClick={handleReset} size="small" variant="outlined">
                    ガイダンスを最初から見る
                  </Button>
                </Paper>
              )}
            </Paper>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 追加のヒント */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              💡 便利な機能
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                <strong>ツールチップ:</strong> 条件タイプボタンにマウスを合わせると具体例が表示
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                <strong>自然言語プレビュー:</strong> 作成したルールが日本語で確認可能
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                <strong>リアルタイム検証:</strong> 入力エラーは即座に表示・修正案を提示
              </Typography>
              <Typography component="li" variant="body2">
                <strong>キーボード操作:</strong> Tab/Enter/矢印キーでの操作にも対応
              </Typography>
            </Box>
          </Box>
        </Box>
      </Alert>
    </Collapse>
  );
}