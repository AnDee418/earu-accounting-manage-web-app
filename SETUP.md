# EARU 会計アプリケーション - セットアップガイド

## 📋 前提条件

- Node.js 18.x 以上
- npm または yarn
- Firebaseプロジェクト（作成済み）
- Firebase Admin SDKの認証情報

## 🚀 初期セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

#### 2.1. 環境変数ファイルの作成

```bash
cp .env.local.example .env.local
```

#### 2.2. Firebase Admin SDK認証情報の取得

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. プロジェクトを選択
3. プロジェクト設定 → サービスアカウント タブを開く
4. 「新しい秘密鍵を生成」をクリック
5. ダウンロードしたJSONファイルから以下の値を`.env.local`にコピー：
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

> ⚠️ **重要**: `private_key`の改行文字（\n）はそのまま保持してください

#### 2.3. Firebase Client SDK設定の取得

1. Firebase Console のプロジェクト設定 → 全般タブ
2. 「マイアプリ」セクションでWebアプリを選択（なければ作成）
3. SDK設定から以下の値を`.env.local`にコピー：
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3. Firebase認証の有効化

1. Firebase Console → Authentication
2. 「始める」をクリック
3. Sign-in method タブで「メール/パスワード」を有効化

### 4. Firestoreデータベースの作成

1. Firebase Console → Firestore Database
2. 「データベースを作成」をクリック
3. 「本番モード」を選択
4. ロケーションを選択（例：asia-northeast1）

### 5. テストユーザーの作成

```bash
node scripts/setup-test-user.js
```

このスクリプトは以下を実行します：
- テストユーザーの作成（メール: test@example.com）
- 必要なカスタムクレーム（role, companyId）の設定
- 初期データ（会社、部門、勘定科目など）の作成

### 6. マスターデータのインポート（オプション）

PCA会計のマスターデータをインポートする場合：

```bash
# 必要なパッケージのインストール
npm install --save-dev iconv-lite xlsx

# インポートスクリプトの実行
node scripts/import-sample-masters.js
```

## 🏃 アプリケーションの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 🔐 ログイン

セットアップスクリプトで作成したテストユーザーでログイン：
- Email: `test@example.com`
- Password: `test123456`

## 📝 CSVインポート機能の使用

1. ログイン後、「設定」ページにアクセス
2. 「CSVインポート」ボタンをクリック
3. マスタータイプを選択：
   - 勘定科目
   - 補助科目
   - 部門
   - 税区分
4. CSVまたはExcelファイルを選択
5. 「インポート」をクリック

### 対応ファイル形式

- **CSV**: Shift-JIS/UTF-8 エンコーディング
- **Excel**: .xlsx, .xls 形式
- サンプルファイルは `docs/format/` ディレクトリにあります

## 🐛 トラブルシューティング

### 401 Unauthorized エラー

**原因**: Firebase認証トークンが無効または環境変数が未設定

**解決方法**:
1. `.env.local`ファイルが正しく設定されているか確認
2. 環境変数を変更した場合は、開発サーバーを再起動
3. ブラウザのクッキーをクリアして再ログイン

### "No token found in cookies" エラー

**原因**: 認証トークンがクッキーに保存されていない

**解決方法**:
1. ログアウトして再ログイン
2. ブラウザのクッキー設定を確認（サードパーティクッキーが有効か）
3. シークレットモードで試す

### CSVインポートエラー

**原因**: ファイル形式またはエンコーディングの問題

**解決方法**:
1. CSVファイルがShift-JISまたはUTF-8で保存されているか確認
2. ヘッダー行が正しい形式か確認
3. サンプルファイル（`docs/format/`）と形式を比較

### Firebase Admin SDK初期化エラー

**原因**: 環境変数の`FIREBASE_ADMIN_PRIVATE_KEY`が正しくない

**解決方法**:
1. 秘密鍵の前後のダブルクォーテーションを確認
2. 改行文字（\n）が保持されているか確認
3. 新しい秘密鍵を生成して再設定

## 📚 参考リソース

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [PCA会計連携仕様書](docs/format/『PCA 会計シリーズ』汎用データレイアウト.pdf)

## 🆘 サポート

問題が解決しない場合は、以下の情報を含めてissueを作成してください：
- エラーメッセージの全文
- 実行した手順
- 環境情報（Node.jsバージョン、ブラウザなど）