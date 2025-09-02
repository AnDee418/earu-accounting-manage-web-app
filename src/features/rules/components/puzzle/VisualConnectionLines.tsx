'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { ConditionBlock, LogicalOperator } from '@/types/rules';

interface VisualConnectionLinesProps {
  conditions: ConditionBlock[];
  containerRef: React.RefObject<HTMLElement | null>;
}

interface ConnectionLine {
  id: string;
  operator: LogicalOperator;
  startY: number;
  endY: number;
  centerX: number;
}

/**
 * 視覚的接続線コンポーネント
 * 
 * Requirements: 7.1, 7.2, 7.3
 * - 条件ブロック間を繋ぐ視覚的な線を実装
 * - AND演算子用の緑色実線を実装
 * - OR演算子用のオレンジ色破線を実装
 * - 条件ブロックの配置に応じた動的な線の描画を実装
 */
export default function VisualConnectionLines({
  conditions,
  containerRef,
}: VisualConnectionLinesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([]);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // 接続線のスタイル定義
  const getLineStyle = (operator: LogicalOperator) => {
    switch (operator) {
      case 'AND':
        return {
          stroke: '#4CAF50',
          strokeWidth: 4,
          strokeDasharray: 'none',
          opacity: 0.8,
        };
      case 'OR':
        return {
          stroke: '#FF9800',
          strokeWidth: 4,
          strokeDasharray: '8,4',
          opacity: 0.8,
        };
      default:
        return {
          stroke: '#666',
          strokeWidth: 2,
          strokeDasharray: 'none',
          opacity: 0.5,
        };
    }
  };

  // 条件ブロックの位置を計算して接続線を生成
  const calculateConnectionLines = () => {
    if (!containerRef.current || conditions.length < 2) {
      setConnectionLines([]);
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const conditionElements = container.querySelectorAll('[data-condition-block]');
    
    if (conditionElements.length < 2) {
      setConnectionLines([]);
      return;
    }

    const lines: ConnectionLine[] = [];
    const centerX = containerRect.width / 2;

    // 各条件ブロック間の接続線を計算
    for (let i = 0; i < conditions.length - 1; i++) {
      const currentElement = conditionElements[i] as HTMLElement;
      const nextElement = conditionElements[i + 1] as HTMLElement;
      
      if (!currentElement || !nextElement) continue;

      const currentRect = currentElement.getBoundingClientRect();
      const nextRect = nextElement.getBoundingClientRect();
      
      // コンテナ相対位置に変換
      const startY = currentRect.bottom - containerRect.top;
      const endY = nextRect.top - containerRect.top;
      
      // 接続線が必要な場合のみ追加（ブロック間に十分な間隔がある場合）
      if (endY - startY > 10) {
        lines.push({
          id: `connection-${conditions[i].id}-${conditions[i + 1].id}`,
          operator: conditions[i].operator,
          startY,
          endY,
          centerX,
        });
      }
    }

    setConnectionLines(lines);
    setContainerDimensions({
      width: containerRect.width,
      height: containerRect.height,
    });
  };

  // ResizeObserver を使用してコンテナサイズの変更を監視
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateConnectionLines();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // 条件の変更時に接続線を再計算
  useEffect(() => {
    // 少し遅延させてDOM更新を待つ
    const timer = setTimeout(() => {
      calculateConnectionLines();
    }, 100);

    return () => clearTimeout(timer);
  }, [conditions]);

  // ウィンドウリサイズ時の再計算
  useEffect(() => {
    const handleResize = () => {
      calculateConnectionLines();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 接続線が存在しない場合は何も表示しない
  if (connectionLines.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <svg
        ref={svgRef}
        width={containerDimensions.width}
        height={containerDimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          {/* グラデーション定義 */}
          <linearGradient id="andGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#4CAF50" stopOpacity="1" />
            <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="orGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9800" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FF9800" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF9800" stopOpacity="0.8" />
          </linearGradient>
          
          {/* ドロップシャドウフィルター */}
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {connectionLines.map((line) => {
          const style = getLineStyle(line.operator);
          const gradientId = line.operator === 'AND' ? 'andGradient' : 'orGradient';
          
          return (
            <g key={line.id}>
              {/* メインの接続線 */}
              <line
                x1={line.centerX}
                y1={line.startY}
                x2={line.centerX}
                y2={line.endY}
                stroke={`url(#${gradientId})`}
                strokeWidth={style.strokeWidth}
                strokeDasharray={style.strokeDasharray}
                opacity={style.opacity}
                filter="url(#dropShadow)"
                style={{
                  transition: 'all 0.3s ease-in-out',
                }}
              />
              
              {/* 接続点（開始点） */}
              <circle
                cx={line.centerX}
                cy={line.startY}
                r={style.strokeWidth / 2 + 1}
                fill={style.stroke}
                opacity={style.opacity}
                filter="url(#dropShadow)"
              />
              
              {/* 接続点（終了点） */}
              <circle
                cx={line.centerX}
                cy={line.endY}
                r={style.strokeWidth / 2 + 1}
                fill={style.stroke}
                opacity={style.opacity}
                filter="url(#dropShadow)"
              />
              
              {/* 演算子ラベル（中央） */}
              <g transform={`translate(${line.centerX + 12}, ${(line.startY + line.endY) / 2})`}>
                <rect
                  x="-8"
                  y="-8"
                  width="16"
                  height="16"
                  rx="8"
                  fill={style.stroke}
                  opacity="0.9"
                  filter="url(#dropShadow)"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                >
                  {line.operator}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}