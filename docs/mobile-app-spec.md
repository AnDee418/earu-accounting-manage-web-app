# EARU 経理管理システム モバイルアプリ開発仕様書（提出用）

最終更新: 2025-08-22
対象: データ提出用モバイルアプリ（Android/iOS）

---

## 1. 目的/スコープ
- 本書は「現行の最新状態」に基づくデータ構成・取得/登録方法を整理したものです。
- モバイルアプリは主に「経費の提出（登録）」「提出済み一覧/詳細の閲覧」「マスタ参照（部門・勘定科目・補助科目・税区分）」を行います。
- 既存Web管理アプリと同一 Firebase プロジェクト/Firestore/Storage を共有します。

---

## 2. 認証/権限
- 認証方式: Firebase Authentication（Email/Password）
- 会社/権限は Firebase Custom Claims で付与済み
  - `companyId`: 所属会社ID（必須）
  - `role`: `admin | finance | manager | staff`
  - `departmentId`（任意）
- 開発環境: App Check 無効（本番のみ App Check 有効）。モバイル側は開発中の App Check 対応不要。
  - 本番対応時はネイティブの App Check（DeviceCheck/Play Integrity）または Debug Provider の導入を検討。

---

## 3. Firebase クライアント設定
- Web 管理アプリと同一の Firebase プロジェクトを使用
- 必要キー（モバイル側の `.env` 等に設定）
  - `apiKey`
  - `authDomain`
  - `projectId`
  - `storageBucket`
  - `messagingSenderId`
  - `appId`
  - `measurementId`（任意）

---

## 4. Firestore スキーマ（現行）
ルート: `companies/{companyId}`

```
companies/{companyId}
  ├─ users/{uid}
  │   └─ expenses/{expenseId}            # 経費の実体（明細/メタ含む）
  ├─ expense_search/{expenseId}          # 一覧表示用の投影（サマリ）
  ├─ accounts/{pcaCode}                  # 勘定科目（PCA）
  ├─ subAccounts/{accountCode}-{subCode} # 補助科目（PCA 25列対応）
  ├─ taxes/{pcaTaxCode}                  # 税区分（PCA）
  ├─ departments/{pcaDeptCode}           # 部門（PCA）
  ├─ categories/{categoryId}             # カテゴリ（任意/将来拡張）
  └─ auditLogs/{autoId}                  # 監査ログ
```

注意:
- Firestore は `undefined` を受け付けません。未設定は「フィールドを省略」または `null` を使用してください。
- モバイル提出時は `users/{uid}/expenses` と `expense_search` の両方を整合させて作成してください（現在サーバAPIは不要・未必須）。

---

## 5. データモデル定義（要約）
TypeScript 定義の要点のみ抜粋。完全定義は `src/types` を参照。

### 5.1 Department（部門）
```
{
  pcaDeptCode: string,  // 主キー
  name: string,
  kanaIndex?: string,
  businessType?: number, // 1-6
  parentCode?: string,
  isActive: boolean
}
```

### 5.2 Account（勘定科目: PCA）
```
{
  pcaCode: string,              // 主キー（3桁）
  name: string,
  debitTaxCode: string,
  debitTaxName?: string,
  creditTaxCode: string,
  creditTaxName?: string,
  autoTaxCalc?: 0 | 9,
  taxRounding?: 0 | 9,
  // ...他、PCA準拠フィールド（詳細は src/types/settings/index.ts）
  isActive: boolean
}
```

### 5.3 SubAccount（補助科目: PCA 25列）
```
{
  accountCode: string,
  accountName: string,
  pcaSubCode: string,
  name: string,
  kanaIndex: string,
  fullName: string,
  fullNameKana: string,
  debitTaxCode: string,
  debitTaxName: string,
  creditTaxCode: string,
  creditTaxName: string,
  autoTaxCalc: number,
  taxRounding: number,
  postalCode?: string,
  address1?: string,
  address2?: string,
  tel?: string,
  fax?: string,
  bankInfo: string,
  closingDay: number,
  paymentDay: number,
  corporateNumber?: string,
  businessType: number,
  invoiceRegistrationNumber?: string,
  digitalInvoiceReceive: number,
  isActive: boolean
}
```

### 5.4 Tax（税区分: PCA）
```
{
  pcaTaxCode: string,  // 主キー
  shortName: string,
  description: string,
  isActive: boolean
}
```

### 5.5 Expense（経費・詳細）
```
{
  companyId: string,
  userId: string,
  status: 'draft'|'submitted'|'approved'|'rejected'|'exported',
  type: 'receipt'|'travel'|'invoice',
  currency: string,             // 例: 'JPY'
  total: number,
  tax: number,
  subtotal: number,
  taxRate: number,              // 数値（例: 0.1）
  paidAt: Timestamp|Date|string,
  merchant: string,
  categoryId?: string,
  departmentId?: string,        // pcaDeptCode
  projectCode?: string,
  note?: string,
  ai?: { engine: string, confidence: number, rawJsonRef?: string, extractedData?: {} },
  duplicateIds: string[],
  approverId?: string,
  approvedAt?: Timestamp|Date,
  rejectedReason?: string,
  pcaStatus: 'pending'|'exported'|'error',
  pcaJournalId?: string,
  exportAt?: Timestamp|Date,
  accountSnapshot?: { pcaCode: string, name: string, taxCode: string, rate: number },
  attachmentUrls?: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 5.6 ExpenseSearch（一覧用投影）
```
{
  id: string,            // expenseId と一致
  userId: string,
  departmentId?: string,
  status: string,
  paidAt: Timestamp|Date|string,
  total: number,
  currency: string,
  merchant: string,
  categoryId?: string,
  pcaStatus: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 6. データ取得（モバイル推奨: Firestore 直接）

### 6.1 マスタ取得
- 勘定科目: `companies/{companyId}/accounts`（`isActive == true` 推奨）
- 補助科目: `companies/{companyId}/subAccounts`（`isActive == true` 推奨）
- 部門: `companies/{companyId}/departments`（`isActive == true` 推奨）
- 税区分: `companies/{companyId}/taxes`（`isActive == true` 推奨）

例: 部門一覧
```
const ref = collection(db, `companies/${companyId}/departments`);
const q = query(ref, where('isActive', '==', true), orderBy('pcaDeptCode'));
const snap = await getDocs(q);
```

### 6.2 経費一覧（提出者視点）
- パス: `companies/{companyId}/expense_search`
- フィルタ例:
  - `where('userId','==', uid)`
  - `where('status','==','submitted')`
  - `orderBy('paidAt','desc')` + `limit(50)`
  - ページング例: `startAfter(lastDoc)` を利用

例: ページング
```
let q = query(col, orderBy('paidAt','desc'), limit(50));
let snap = await getDocs(q);
let last = snap.docs[snap.docs.length - 1];

// 次ページ
q = query(col, orderBy('paidAt','desc'), startAfter(last), limit(50));
snap = await getDocs(q);
```

### 6.3 経費詳細
- パス: `companies/{companyId}/users/{uid}/expenses/{expenseId}`

---

## 7. データ登録/更新（提出フロー）
現行はサーバAPIを介さず Firestore 直書きで運用可能です。

### 7.1 新規提出（必須オブジェクト）
1) 詳細本体を作成
```
const expenseId = doc(collection(db, `companies/${companyId}/users/${uid}/expenses`)).id;
const now = serverTimestamp();
await setDoc(doc(db, `companies/${companyId}/users/${uid}/expenses/${expenseId}`), {
  companyId, userId: uid,
  status: 'submitted',           // 下書き時は 'draft'
  type: 'receipt',               // 例: 'receipt'|'travel'|'invoice'
  currency: 'JPY',
  total, tax, subtotal, taxRate,
  paidAt: Timestamp.fromDate(new Date(paidAt)),
  merchant, departmentId, categoryId,
  duplicateIds: [],
  pcaStatus: 'pending',
  attachmentUrls: uploadedUrls,  // Storage へのアップロード後に設定
  createdAt: now,
  updatedAt: now,
});
```

2) 一覧投影を作成（検索/並び替え用）
```
await setDoc(doc(db, `companies/${companyId}/expense_search/${expenseId}`), {
  id: expenseId,
  userId: uid,
  departmentId,
  status: 'submitted',
  paidAt: Timestamp.fromDate(new Date(paidAt)),
  total, currency, merchant, categoryId,
  pcaStatus: 'pending',
  createdAt: now,
  updatedAt: now,
});
```

3) 監査ログ（任意）
```
await addDoc(collection(db, `companies/${companyId}/auditLogs`), {
  actorId: uid,
  action: 'create_expense',
  targetPath: `users/${uid}/expenses/${expenseId}`,
  after: { total, currency, paidAt },
  at: new Date(),
});
```

### 7.2 添付ファイル（Storage）
- パス推奨: `companies/{companyId}/users/{uid}/expenses/{expenseId}/{fileName}`
- アップロード後に `getDownloadURL()` を取得し、`attachmentUrls` に配列で保存

---

## 8. 代替手段（HTTP API）
Web 管理アプリ用の App Router API もありますが、**Cookie セッション前提**のためモバイルには非推奨です。
- `GET /api/masters?type=subAccounts&activeOnly=true` など（社内向け/ブラウザ前提）
- モバイルは Firestore 直接の方が単純で高速です。

---

## 9. 権限制御（推奨運用）
- `staff`: 自分の経費の作成/閲覧
- `manager`: 自部門の参照範囲拡張（承認はWeb側）
- `finance`: 参照範囲広め（エクスポートはWeb）
- `admin`: すべて

※ セキュリティルールは別紙（同プロジェクトの Firestore Rules）に従います。未定義項目がある場合は運用で制御してください。

---

## 10. データ仕様の注意
- 日付: Firestore `Timestamp` を使用（モバイルでは `Date` → `Timestamp` へ変換）
- 数値: 文字列で保存しない（税率・金額は number）
- 未設定値: `undefined` は保存しない（省略または `null`）
- PCA 連携: マスタは PCA CSV と同一の列/コードを使用

---

## 10.1 インデックス推奨
`expense_search` の高速検索のために以下の複合インデックスを作成してください。

- `status ASC, paidAt DESC`
- `departmentId ASC, paidAt DESC`
- `pcaStatus ASC, updatedAt DESC`

（必要に応じて Firebase Console から定義）

---

## 11. 成功例/失敗例
### 成功（提出）
```
HTTP なし（Firestore 直書き）
書き込み: users/{uid}/expenses/{expenseId}, expense_search/{expenseId}
添付: Storage → attachmentUrls
```

### 失敗（よくある原因）
- `undefined` を含むオブジェクト保存
- `companyId/uid` の不一致
- `paidAt` を文字列保存（Timestamp未変換）
- Storage の URL を Firestore に保存し忘れ

---

## 12. 今後の拡張ポイント（参考）
- サーバAPI経由での提出（検証/正規化/監査の強化）
- Cloud Functions による `expense_search` 自動投影
- オフラインキャッシュ/再送キュー
- 画像圧縮/EXIF からの日付補完

---

## 付録 A: 主要コレクションのキー
- `accounts`: ドキュメントID = `pcaCode`
- `subAccounts`: ドキュメントID = `accountCode-pcaSubCode`
- `departments`: ドキュメントID = `pcaDeptCode`
- `taxes`: ドキュメントID = `pcaTaxCode`
- `expense_search`: ドキュメントID = `expenseId`（`users/{uid}/expenses` と同じ）

---

## 連絡先
- 仕様/データモデル: 本リポジトリ `src/types/*`
- 運用/権限: 管理アプリ管理者（admin）
