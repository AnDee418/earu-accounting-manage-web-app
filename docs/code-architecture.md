# コードアーキテクチャガイド

EARU経理管理システムの機能別コード構造について説明します。

## 📁 プロジェクト構造

### 🏗️ **新しい機能別構造 (推奨)**

```
src/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 expenses/          # 経費管理ページ
│   ├── 📁 settings/          # 設定ページ（簡潔化済み）
│   └── 📁 api/               # APIエンドポイント
│
├── 📁 components/            # 共通コンポーネント
│   ├── 📁 ui/               # 基本UIコンポーネント
│   ├── 📁 forms/            # フォーム関連
│   ├── 📁 tables/           # テーブル関連
│   └── 📁 layout/           # レイアウトコンポーネント
│
├── 📁 features/             # 機能別モジュール
│   ├── 📁 settings/         # 設定管理機能
│   │   ├── 📁 components/   # 設定専用コンポーネント
│   │   └── 📁 hooks/        # 設定専用フック
│   ├── 📁 users/           # ユーザー管理機能
│   ├── 📁 expenses/        # 経費管理機能
│   └── 📁 auth/            # 認証機能
│
├── 📁 hooks/               # 共通カスタムフック
├── 📁 lib/                 # ライブラリ・ユーティリティ
├── 📁 contexts/            # React Context
├── 📁 theme/               # テーマ設定
└── 📁 types/               # 型定義（機能別）
    ├── 📁 common/          # 共通型
    ├── 📁 auth/            # 認証関連型
    ├── 📁 expenses/        # 経費関連型
    └── 📁 settings/        # 設定関連型
```

## 🎯 **設計原則**

### **1. 機能別分離 (Feature-based Architecture)**
- 各機能は独立したフォルダに整理
- 機能固有のコンポーネント・フック・型定義を集約
- 機能間の依存関係を最小化

### **2. 再利用性重視**
- 共通UIコンポーネントを `src/components/ui/` に配置
- カスタムフックを `src/hooks/` に配置
- 統合エクスポートで簡単にインポート可能

### **3. 型安全性**
- 機能別に型定義を分離
- 厳密な型チェックで実行時エラーを防止
- インターフェースの適切な継承関係

## 🔧 **コンポーネント設計**

### **UIコンポーネント階層**

```
📦 UI Components
├── 🧩 基本コンポーネント (src/components/ui/)
│   ├── LoadingSpinner      # ローディング表示
│   ├── ConfirmDialog       # 確認ダイアログ
│   └── ErrorBoundary       # エラー境界
│
├── 🧩 フォームコンポーネント (src/components/forms/)
│   ├── FileUpload          # ファイルアップロード
│   └── FormValidation      # フォーム検証
│
└── 🧩 機能コンポーネント (src/features/{feature}/components/)
    ├── SettingsTabs        # 設定タブ
    ├── UserManagement      # ユーザー管理
    └── UserEditDialog      # ユーザー編集
```

### **フック階層**

```
📦 Hooks
├── 🪝 共通フック (src/hooks/)
│   └── useSnackbar         # スナックバー管理
│
└── 🪝 機能別フック (src/features/{feature}/hooks/)
    └── useMasterData       # マスタデータ管理
```

## 📋 **実装例**

### **コンポーネント使用例**
```typescript
// ✅ 推奨：機能別インポート
import UserManagement from '@/features/users/components/UserManagement';
import { LoadingSpinner, ErrorBoundary } from '@/components/ui';
import { useSnackbar } from '@/hooks';

// ✅ 推奨：型定義の機能別インポート
import { CompanyUser } from '@/types/auth';
import { Department } from '@/types/settings';
```

### **フック使用例**
```typescript
// ✅ 推奨：機能専用フックの使用
import { useMasterData } from '@/features/settings/hooks/useMasterData';

function SettingsComponent() {
  const { masterData, loading, fetchMasters } = useMasterData();
  
  // コンポーネントロジック
}
```

## 🚀 **メリット**

### **👨‍💻 開発者体験**
- **明確な責任分離**: 機能ごとにコードが整理
- **再利用性向上**: 共通コンポーネント・フックの活用
- **保守性向上**: 変更影響範囲の局所化

### **📈 スケーラビリティ**
- **機能追加の容易性**: 新機能は独立フォルダに追加
- **チーム開発対応**: 機能別並行開発が可能
- **テスト容易性**: 機能単位での単体テスト

### **🔧 パフォーマンス**
- **バンドル分割**: 機能別の動的インポートに対応
- **ツリーシェイキング**: 未使用コードの自動削除
- **型チェック最適化**: 型定義の階層化で高速化

## 📝 **開発ガイドライン**

### **新機能追加時**
1. `src/features/{feature_name}/` フォルダを作成
2. `components/`, `hooks/` サブフォルダを追加
3. 型定義を `src/types/{feature_name}/` に追加
4. インデックスファイルで統合エクスポート

### **共通化判断基準**
- **3回以上使用** → `src/components/ui/` へ移動
- **特定機能専用** → `src/features/{feature}/components/` に保持
- **複数機能で使用** → `src/components/` の適切なカテゴリへ

### **命名規則**
- **コンポーネント**: PascalCase（例：`UserManagement`）
- **フック**: camelCase + `use` プレフィックス（例：`useMasterData`）
- **型定義**: PascalCase + 意味のあるサフィックス（例：`UserProfile`）

## 🔄 **マイグレーション**

### **既存コードの段階的移行**
1. **Phase 1**: 型定義の分離（完了）
2. **Phase 2**: UIコンポーネントの分離（完了）
3. **Phase 3**: 機能コンポーネントの分離（進行中）
4. **Phase 4**: 残り機能の完全分離（予定）

---

この構造により、**EARU経理管理システム**は保守しやすく、スケーラブルで、開発者フレンドリーなコードベースとなりました。
