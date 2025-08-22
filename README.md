# EARU 会計アプリケーション

EARU システムの会計管理用 Web アプリケーション。PCA 会計と連携し、経費精算や仕訳データの管理を行います。

## 🚀 クイックスタート

### 前提条件
- Node.js 18.x 以上
- Firebaseプロジェクト（要作成）
- Firebase Admin SDK認証情報

### セットアップ手順

1. **依存関係のインストール**
```bash
npm install
```

2. **環境変数の設定**
```bash
cp .env.local.example .env.local
# .env.localを編集してFirebaseの認証情報を設定
```

3. **テストユーザーの作成**
```bash
node scripts/setup-test-user.js
```

4. **開発サーバーの起動**
```bash
npm run dev
```

5. **ログイン**
- URL: http://localhost:3000
- Email: test@example.com
- Password: test123456

📖 **詳細なセットアップ手順とトラブルシューティングは [SETUP.md](./SETUP.md) を参照してください。**

## 主な機能

- 経費の一覧表示・検索・フィルタリング
- 経費の詳細確認・承認・却下
- PCA会計形式でのCSVエクスポート
- マスターデータ（勘定科目・税区分・部門）の管理
- **CSVファイルからのマスターデータ一括インポート**
- ロールベースアクセス制御（RBAC）

## 技術スタック

- **フレームワーク**: Next.js 15.5 (App Router)
- **言語**: TypeScript
- **UI**: Material-UI (MUI)
- **認証**: Firebase Auth (OIDC: Azure AD/Google Workspace)
- **DB**: Firestore
- **ストレージ**: Firebase Storage
- **セキュリティ**: Firebase App Check, RBAC (Custom Claims)

## 機能一覧

### MVP (Day 1-2)
- [x] プロジェクト初期設定
- [x] Firebase SDK統合
- [ ] 認証・セッション管理
- [ ] 受信ボックス（経費一覧）
- [ ] 詳細ビュー
- [ ] CSVエクスポートAPI
- [ ] マスタデータ参照

### 今後の実装予定
- [ ] AI差分ハイライト表示
- [ ] 承認/差戻し/修正機能
- [ ] 部署別ダッシュボード
- [ ] 監査ログ表示
- [ ] マスタデータ管理UI

## セットアップ手順

### 1. 環境変数の設定

`.env.example`を`.env.local`にコピーして、必要な値を設定してください：

```bash
cp .env.example .env.local
```

必要な環境変数：
- Firebase Web SDK設定（Firebaseコンソールから取得）
- Firebase Admin SDK設定（サービスアカウントキーから取得）
- App Checkキー（reCAPTCHA v3）

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

### 4. ビルドと本番実行

```bash
npm run build
npm start
```

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIルート
│   │   └── export/       # エクスポート関連API
│   ├── expenses/         # 経費管理ページ
│   ├── settings/         # 設定ページ
│   └── login/           # ログインページ
├── components/            # 共通コンポーネント
│   ├── layout/          # レイアウト関連
│   └── expenses/        # 経費関連コンポーネント
├── contexts/             # React Context
│   └── AuthContext.tsx  # 認証コンテキスト
├── lib/                  # ライブラリ・ユーティリティ
│   ├── firebase/        # Firebase設定
│   └── auth/           # 認証関連
├── theme/               # MUIテーマ設定
└── types/              # TypeScript型定義
```

## ロールベースアクセス制御 (RBAC)

### ロール定義

| ロール | 権限 |
|--------|------|
| `staff` | 自分の経費のみ閲覧・編集（ドラフトのみ） |
| `manager` | 部署の経費閲覧 |
| `finance` | 全社経費の閲覧・承認・エクスポート |
| `admin` | 全権限＋システム管理 |

### Custom Claims設定例

```json
{
  "role": "finance",
  "companyId": "ACME",
  "departmentId": "D0101"
}
```

## Firestoreインデックス

以下のインデックスを作成してください：

### Collection Group: `expenses`
- `companyId` + `status` + `paidAt` (DESC)
- `departmentId` + `paidAt` (DESC)
- `userId` + `status`

### Collection: `expense_search`
- `status` + `paidAt` (DESC)
- `departmentId` + `paidAt` (DESC)
- `pcaStatus` + `updatedAt` (DESC)

## APIエンドポイント

### エクスポートAPI

```
POST /api/export/pca
```

リクエストボディ：
```json
{
  "periodFrom": "2025-01-01",
  "periodTo": "2025-01-31",
  "departments": ["D0101", "D0102"],
  "status": ["approved"],
  "profileId": "profile_001"
}
```

レスポンス：
```json
{
  "jobId": "job_12345",
  "status": "running"
}
```

## セキュリティ設定

### App Check
- Web環境でreCAPTCHA v3を使用
- 全てのFirestore/Storageアクセスで検証

### 認証フロー
1. Firebase Auth（OIDC）でログイン
2. IDトークンをクッキーに保存
3. サーバー側でトークン検証
4. Custom Claimsでロール・会社ID確認

## PCA会計マスターデータのインポート

### Web画面からのインポート

1. **設定ページにアクセス**
   - 管理者またはfinanceロールでログイン
   - 設定メニューを開く

2. **CSVインポート機能**
   - 「CSVインポート」ボタンをクリック
   - マスタータイプを選択（勘定科目、補助科目、部門、税区分）
   - CSVまたはExcelファイルを選択
   - インポートを実行

### 対応ファイル形式

| マスタータイプ | ファイル形式 | エンコーディング |
|---|---|---|
| 勘定科目 | CSV | Shift-JIS/UTF-8 |
| 補助科目 | CSV | Shift-JIS/UTF-8 |
| 部門 | CSV | Shift-JIS/UTF-8 |
| 税区分 | CSV/Excel (.xlsx) | Shift-JIS/UTF-8 |

### コマンドラインからのインポート

開発環境でサンプルデータをインポートする場合：

```bash
# 必要なライブラリをインストール
npm install iconv-lite xlsx

# サンプルデータをインポート
node scripts/import-sample-masters.js
```

### インポート時の注意事項

1. **インポート順序**
   - 勘定科目 → 補助科目の順でインポートしてください
   - 補助科目は対応する勘定科目が存在する必要があります

2. **データの上書き**
   - 既存のデータは上書きされます
   - インポート前にバックアップを推奨

3. **ファイル形式**
   - CSVファイルはPCA会計の標準フォーマットに準拠
   - 最初の行に`text version=`が含まれる場合は自動でスキップ

## 開発ガイドライン

### コーディング規約
- ESLint + Prettierを使用
- コンポーネントは関数型で記述
- 型定義を必須とする

### Git フロー
- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `hotfix/*`: 緊急修正

### テスト
- 単体テスト: Jest
- E2Eテスト: Cypress（予定）

## トラブルシューティング

### Firebase Admin SDKエラー
- サービスアカウントキーが正しく設定されているか確認
- 改行文字（\n）が正しくエスケープされているか確認

### App Checkエラー
- reCAPTCHAキーが正しく設定されているか確認
- ドメインがFirebaseプロジェクトに登録されているか確認

### 認証エラー
- Custom Claimsが正しく設定されているか確認
- IDトークンの有効期限を確認（10分ごとに自動更新）

## ライセンス

Private - EARU System

## お問い合わせ

技術的な質問は開発チームまでお問い合わせください。
