# EARU経費精算アプリ（Next.js管理画面）

## 概要

PCA会計と連携する経費精算システムの管理画面（Web版）です。経理担当者が経費の承認・確認・エクスポートを行うためのインターフェースを提供します。

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

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Firebase Admin SDK Settings（Firebase Consoleから取得）
FIREBASE_ADMIN_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"

# Firebase Client SDK（Firebaseプロジェクト設定から取得）
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcd1234567890ef
```

**Firebase Admin SDKキーの取得手順：**
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択 → 「プロジェクトの設定」
3. 「サービス アカウント」タブ
4. 「新しい秘密鍵の生成」→ JSONファイルをダウンロード
5. JSONファイルの `project_id`、`client_email`、`private_key` を環境変数に設定

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

### 5. PCAマスタデータの設定

新規会社登録後は、PCAからエクスポートしたマスタデータをCSVインポートする必要があります。

#### インポート手順
1. **ログイン** → 管理者アカウントでログイン
2. **設定画面** → 右上の設定ボタンからアクセス
3. **CSVインポート** → 各タブでインポートボタンをクリック

#### 推奨インポート順序
1. **勘定科目** (`勘定科目コード一覧.csv`)
2. **補助科目** (`補助科目コード一覧.csv`) 
3. **部門** (`部門コード一覧.csv`)
4. **税区分** (`税区分コード一覧.csv`) ← **重要：PCA形式に対応**

#### PCA勘定科目データの特徴
- **コード**: 3桁の数字（111, 152, 726など）
- **属性コード**: 8桁の詳細属性（11110010など）
- **貸借区分**: 1（資産・費用）、2（負債・収益・純資産）
- **税区分**: 借方・貸方それぞれに設定（0, Q5, B5など）
- **原価区分**: 0（変動費）、1（固定費）、2（半変動費）、3（売上）
- **カナ索引**: 検索用のカタカナ表記
- **関連科目**: 対照勘定や相手科目の設定

#### PCA税区分データの特徴
- **コード**: 英数字（00, A0, B5, Q5など）
- **略称**: 短い日本語名（対象外, 売上10%, 仕入10%など）
- **説明**: 詳細説明（消費税に関係ない科目, 課税売上10%など）
- **自動判定**: 税率・カテゴリ・内外税区分を自動算出

#### PCA補助科目データの特徴
- **親科目コード**: 勘定科目への紐付け（111, 131など）
- **補助科目コード**: 1-99の数字
- **カナ索引**: 検索用のカタカナ表記
- **連絡先情報**: 郵便番号、住所、TEL、FAXなど（取引先用）
- **取引条件**: 振込先、締日、支払日など
- **事業者情報**: 法人番号、適格請求書事業者登録番号など
- **税設定**: 借方・貸方税区分（勘定科目設定を継承/上書き）

#### PCA部門データの特徴
- **部門コード**: 数字（0, 1, 2, 3など）
- **部門名**: 日本語名（共通部門、札幌支店など）
- **カナ索引**: 検索用のカタカナ表記（ｷｮｳﾂｳ、ｻｯﾎﾟﾛなど）
- **簡易課税業種**: 1-6の数字（第1種-第6種事業）
- **共通部門**: 部門コード「0」は共通部門として特別扱い

#### サンプルファイル
テスト用のサンプルファイルは `docs/format/` フォルダにあります：
- `勘定科目インポートサンプル.csv` - 基本的な勘定科目データ
- `勘定科目コード一覧.csv` - 完全なPCA勘定科目リスト
- `補助科目インポートサンプル.csv` - 基本的な補助科目データ
- `補助科目コード一覧.csv` - 完全なPCA補助科目リスト
- `部門インポートサンプル.csv` - 基本的な部門データ
- `部門コード一覧.csv` - 完全なPCA部門リスト
- `税区分インポートサンプル.csv` - 基本的な税区分データ
- `税区分コード一覧.csv` - 完全なPCA税区分リスト

### 6. ビルドと本番実行

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
