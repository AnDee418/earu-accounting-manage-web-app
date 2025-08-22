## 経理管理者向け Web（Next.js）共有仕様書 v1.0

本書は、Flutterモバイルと共通のドメイン設計に基づき、Next.js 製 経理管理者向けWebアプリが実装時に参照すべき共有仕様を定義する。開発計画書・rule・ER/フロー図・データ設計の合意点を反映し、差異が生じないようにする。

### 1. 役割/RBAC と認証
- ロール: `staff | manager | finance | admin`（Custom Claims）
- 必須条件:
  - Firebase Auth（OIDC: Azure AD/Google Workspace 推奨）
  - App Check 有効化（Web）
  - Firestore/Storage Rules で `companyId` 一致かつロール別権限制御

### 2. Firestore 論理データモデル（会社分離）
- ルート: `companies/{companyId}` を基点に配下へ正規データ、横断検索は `expense_search` に非正規化
- 個人データは `users/{userId}` 配下、マスタは会社配下

#### 2.1 コレクション定義（必須フィールド・型）
1) users（個人配下）: `companies/{companyId}/users/{userId}`
```
profile: { displayName, phone, settings: { locale, currency, notifications } }
expenses/{expenseId}: {
  companyId: string, userId: string,
  status: 'draft'|'submitted'|'approved'|'rejected'|'exported',
  type: 'receipt'|'travel'|'invoice',
  currency: string (ISO-4217),
  total: number, tax: number, subtotal: number, taxRate: number,
  paidAt: timestamp,
  merchant: string,
  categoryId?: string,
  departmentId?: string,
  projectCode?: string,
  note?: string,
  ai?: { engine: 'docai'|'gemini', confidence: number, rawJsonRef?: string, extractedData?: {} },
  duplicateIds: string[],
  approverId?: string, approvedAt?: timestamp, rejectedReason?: string,
  pcaStatus: 'pending'|'exported'|'error', pcaJournalId?: string, exportAt?: timestamp,
  accountSnapshot?: { pcaCode: string, name: string, taxCode: string, rate: number },
  createdAt: timestamp, updatedAt: timestamp,
  attachmentUrls?: string[]
}
expense_files/{expenseId}/{fileId}: { gcsPath, page, pageCount, ocrStatus, uploadedAt }
notifications/{notificationId}: { type: 'submit'|'reject'|'approve'|'exported', payload, readAt?, createdAt }
```

2) masters（会社配下・PCA準拠）
```
departments/{deptCode}: {
  pcaDeptCode(=docId), name, parentCode?, isActive, effectiveFrom, effectiveTo?
}
accounts/{pcaCode}: {
  pcaCode(=docId), name, taxCode, isActive, effectiveFrom, effectiveTo?, aliases: string[]
}
taxes/{pcaTaxCode}: {
  pcaTaxCode(=docId), rate: number, rounding: 'round'|'ceil'|'floor',
  method: 'exclusive'|'inclusive', isActive, effectiveFrom, effectiveTo?
}
categories/{categoryId}: {
  name, defaultDebitAccountPcaCode?, defaultCreditAccountPcaCode?, taxRule?,
  hints: string[], icon?, color?, sortOrder: number
}
// 予定（将来拡張）: 補助科目
subAccounts/{pcaSubCode}: {
  pcaSubCode(=docId), name, parentAccountPcaCode, isActive, effectiveFrom, effectiveTo?
}

exportProfiles/{profileId}: {
  name: 'PCA', encoding: 'Shift_JIS'|'UTF-8', delimiter: ','|'\t', dateFormat: 'YYYY/MM/DD', mappingJson: {}
}
exportJobs/{jobId}: {
  filters: { periodFrom, periodTo, departments: string[], status: string[] },
  status: 'running'|'done'|'error', filePath?, summary?,
  createdBy, createdAt, finishedAt?
}
auditLogs/{logId}: { actorId, action, targetPath, before?, after?, at }
```

3) 検索ビュー（会社配下・非正規化）
```
expense_search/{expenseId}: {
  userId, departmentId, status, paidAt, total, currency,
  merchant, categoryId, pcaStatus, createdAt, updatedAt
}
```

#### 2.2 インデックス（推奨）
- Collection Group `expenses`: `companyId+status+paidAt(desc)`, `departmentId+paidAt`, `userId+status`
- `expense_search`: `status+paidAt(desc)`, `departmentId+paidAt`, `pcaStatus+updatedAt`

### 3. 権限（概念ルール）
抜粋。実装は Custom Claims に `role, companyId, departmentId` を付与した前提。
```
// 個人データ（本人のみ編集、ドラフトのみ更新可）
match /companies/{companyId}/users/{userId}/expenses/{expenseId} {
  allow read, create: if isCompanyMember(companyId) && request.auth.uid == userId;
  allow update: if isCompanyMember(companyId) && request.auth.uid == userId && resource.data.status == 'draft';
}
// 集約ビュー: manager/finance/admin 読み取り可、書込はFunctionsのみ
match /companies/{companyId}/expense_search/{expenseId} {
  allow read: if isCompanyMember(companyId) && (hasRole('manager') || hasRole('finance') || hasRole('admin'));
  allow write: if false;
}
// マスタ: 全員 read、finance/admin のみ write
```

### 4. 列挙・ドメイン値
- ExpenseStatus: `draft|submitted|approved|rejected|exported`
- ExpenseType: `receipt|travel|invoice`
- PcaStatus: `pending|exported|error`
- AiEngine: `docai|gemini`
- RoundingMethod: `round|ceil|floor`
- TaxMethod: `exclusive|inclusive`
- PaymentMethod（UI用）: `cash|creditCard|debitCard|electronicMoney|bankTransfer|other`

### 5. 業務フロー（Next.js 視点）
1) 受信ボックス/検索
   - 対象: `companies/{companyId}/expense_search`
   - フィルタ: status, departmentId, paidAt range, pcaStatus, text(merchant)
2) 詳細/差分ハイライト
   - 参照: `users/{userId}/expenses/{expenseId}` と添付 `expense_files`
   - 表示: 画像ビューア、AI抽出 vs ユーザー入力の差分
3) 承認/差戻し/修正
   - 更新: 本人領域 or Functions 経由（監査ログ付与）。承認時は `approved` 設定
4) エクスポート
   - `exportJobs` を作成 → Functions が `exports/pca/YYYYMM/...csv` を Storage へ保存 → `pcaStatus` 更新

補足: AI信頼度しきい値（MVP）
- `confidence >= 0.85` 自動確定
- `0.6–0.85` ユーザー確認（差分ハイライトで提示）
- `< 0.6` 入力必須（未確定項目のガイド表示）

### 6. CSVエクスポート（PCA）
- 入力対象: `approved` のみ
- 出力先: `gs://.../exports/pca/YYYYMM/pca_export_YYYYMMDD_HHmm.csv`
- 文字コード: 運用に合わせ `Shift_JIS` または `UTF-8`（`exportProfiles` で切替）
- 区切り: `,` または `\t`
- 日付: `YYYY/MM/DD`
- マッピング例:
| CSV列 | 出所 | 例 |
| --- | --- | --- |
| 伝票日付 | `expenses.paidAt` | 2025/08/20 |
| 借方科目 | `categories.defaultDebitAccountPcaCode -> accounts.pcaCode` | 6001 |
| 借方補助 | 任意（プロジェクト/社員） | 1001 |
| 貸方科目 | 立替/現金/未払経費 等 | 現金 |
| 金額 | `expenses.total` | 15000 |
| 税 | `accounts.taxCode -> taxes.*` | 課税10 |
| 摘要 | `template('${merchant} ${note}')` | 出張：東京→大阪 |

HTTPエンドポイント契約（参考）
```
POST /export/pca
Body: {
  periodFrom: 'YYYY-MM-DD',
  periodTo: 'YYYY-MM-DD',
  departments?: string[],
  status?: ('approved'|'exported')[],
  profileId: string // exportProfiles/{profileId}
}
Response: { jobId: string, status: 'running' }
```

### 7. マスタデータ管理
- 真マスタ: PCA（一覧CSV/Excel）
- 取込: `docs/format/*` を起点に Web から CSV/Excel をアップロード → Functions が Dry-run 検証 → 適用
- 型・キー:
  - departments: `deptCode`（docId）
  - accounts: `pcaCode`（docId）
  - taxes: `pcaTaxCode`（docId）
  - subAccounts: `pcaSubCode`（docId, 任意）
- 有効期間: `effectiveFrom/effectiveTo`、`isActive` で運用上の切替

### 8. クエリ契約（Next.js 実装想定）
- 一覧（受信箱）: `expense_search` を `where(status in [...])`, `where(departmentId == ...)`, `where(paidAt between ...)`, `orderBy(paidAt desc)`
- 詳細: `users/{userId}/expenses/{expenseId}` 同期取得 + 添付 `expense_files` 一覧
- マスタ参照: `accounts`, `taxes`, `departments`, `categories`（`isActive == true`）
- 承認バッチ: Cloud Functions 経由で `approved` に更新（監査ログ付与）
- エクスポート作成: `POST /export/pca` に相当（Functions HTTP） or `exportJobs` ドキュメント作成

### 9. Cloud Functions（エンドポイント/トリガ）
- Storage finalize: 画像アップロード → DocAI抽出 → 正規化 → Gemini構造化 → Firestore 反映
- HTTP: `POST /export/pca`（期間/部署/承認状態 → CSV生成）、`POST /expenses/:id/retry-ai`、`POST /expenses/:id/recalculate`
- 同期: `users/*/expenses/*` → `expense_search` 非正規化同期

### 10. セキュリティ/運用
- App Check 必須、Rules は会社境界とロールで制御
- 監査ログ: `auditLogs` に重要操作（承認/修正/エクスポート）を冪等記録
- 監視: Functions 遅延・失敗率、Storage 使用量、費用アラート
- データ保持: ドラフト90日削除、差戻し180日アーカイブ、承認済み7年、CSVも同期間

### 11. UI要件（主要画面）
- 受信ボックス: 高機能データグリッド、フィルタ/検索、無限スクロール/ページング
- 詳細ビュー: 画像ビューア、AI vs 入力差分、修正/承認/差戻し、監査表示
- 部署/全社ダッシュボード: 期間・部門・科目・メンバー別集計
- エクスポート履歴: プロファイル選択、テスト出力、再出力、差分出力
- 管理: マスタ（勘定科目/税/部署/カテゴリ/補助科目）、エクスポートプロファイル

### 12. データ整合性/バリデーション
- `accounts.taxCode` は `taxes/{pcaTaxCode}` と整合
- `categories.default*AccountPcaCode` は `accounts/{pcaCode}` と整合
- 承認時の不整合（非活性/失効）はエラー表示/修正誘導
- 重複検知: `(merchant, paidAt±15min, total, last4digits)` 指紋 + 画像近似

### 13. 既知の前提/決定事項
- Web（Next.js）で実装（SSO/App Check/配布性の観点）
- Firebase リージョン: asia-northeast1 優先
- エンコーディングと区切りは `exportProfiles` で切替可能

### 付録A: サンプルドキュメント（expense）
```json
{
  "companyId": "ACME",
  "userId": "u_123",
  "status": "submitted",
  "type": "receipt",
  "currency": "JPY",
  "total": 15000,
  "tax": 1364,
  "subtotal": 13636,
  "taxRate": 0.1,
  "paidAt": "2025-08-20",
  "merchant": "JR東日本",
  "categoryId": "travel",
  "departmentId": "D0101",
  "ai": { "engine": "docai", "confidence": 0.92, "rawJsonRef": "gs://.../raw.json" },
  "duplicateIds": [],
  "pcaStatus": "pending",
  "accountSnapshot": { "pcaCode": "6001", "name": "旅費交通費", "taxCode": "課税10", "rate": 0.1 },
  "createdAt": "2025-08-20T12:34:56.000Z",
  "updatedAt": "2025-08-20T12:34:56.000Z"
}
```

### 付録B: 用語
- PCA: PCA会計クラウド。CSV取り込み仕様に準拠
- DocAI: Google Document AI（Expense/Invoice Parser）
- Gemini: 構造化/補完/カテゴリ推定


