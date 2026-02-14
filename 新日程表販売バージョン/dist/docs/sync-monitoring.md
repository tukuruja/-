**同期の運用監視（メトリクス・アラート設計）**

**主要メトリクス**
- 同期成功率: `sync_success_rate` (成功 / 総同期)
- 同期遅延: `sync_lag_seconds` (P50/P95/P99)
- オフライン滞留: `offline_queue_size` (端末別)
- 再送回数: `sync_retry_count`
- 競合率: `sync_conflict_rate` (conflict / total events)
- 失敗理由: `sync_failure_reason` (DUPLICATE, THREAD_ARCHIVED, PERMISSION_DENIED, ...)
- アップロード失敗率: `upload_error_rate`
- 公開リンクアクセス失敗率: `share_access_error_rate` (404/410/401)

**アラート**
- 同期成功率 < 98% (10分間) → Warning
- 同期成功率 < 95% (10分間) → Critical
- P95 同期遅延 > 60秒 (15分間) → Warning
- P95 同期遅延 > 180秒 (15分間) → Critical
- `offline_queue_size` P95 > 50 (30分間) → Warning
- `upload_error_rate` > 2% (10分間) → Warning
- `share_access_error_rate` > 5% (10分間) → Warning

**ログとトレース**
- すべての同期リクエストに `X-Request-Id` を付与。
- `client_event_id` / `device_id` / `company_id` をログに残す。
- 競合は `SyncConflict` を必ず記録。

**ダッシュボード（最小構成）**
- 同期成功率（直近1時間/24時間）
- P95同期遅延（直近1時間）
- 競合率（直近1時間）
- 端末別オフライン滞留数（上位10）
- アップロード失敗率（直近1時間）

**運用ルール**
- Criticalは即時通知（SMS/電話）
- WarningはSlack/メール通知
- 連絡ノートの「送信が詰まる」は最優先で対応
