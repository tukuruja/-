**権限キー ⇔ 画面アクセス表**

| 画面/操作 | 必要権限 | 補足 |
|---|---|---|
| 今日（一覧） | `project.view`, `thread.view`, `event.view` | 現場カードと直近連絡表示 |
| 今日→現場を開く | `thread.view` | 連絡ノートへ遷移 |
| 連絡ノート閲覧 | `thread.view`, `event.view`, `attachment.view` | タイムライン表示 |
| 連絡に入れる（メモ/写真/書類） | `event.create`, `attachment.upload` | 共有取り込みも同じ権限 |
| 連絡の訂正 | `event.correct` | 訂正イベントとして追記 |
| 連絡の取り消し | `event.cancel` | 取り消しイベントとして追記 |
| 連絡を送る（共有） | `share_link.create`, `delivery.record` | 共有リンク作成 + 履歴記録 |
| 共有リンクの失効 | `share_link.revoke` | 作成者またはAdmin以上 |
| 日報・写真 | `event.create`, `attachment.upload` | 送信は共有扱い |
| 取引先一覧 | `counterparty.view` | 参照のみ |
| 取引先の追加/編集 | `counterparty.manage` | 事務/管理向け |
| 現場一覧 | `project.view` | 参照のみ |
| 現場の追加/編集/終了 | `project.create`, `project.edit`, `project.archive` | 事務/管理向け |
| PDF出力 | `export.pdf` | 事務/管理向け |
| メンバー管理 | `member.invite`, `member.role.update`, `member.remove` | 管理者のみ |
| 請求/契約設定 | `settings.billing` | Ownerのみ |
| 監査ログ閲覧 | `audit.view` | Owner/Adminのみ |

UI動作ルール:
- 権限がない機能は非表示。
- 直接アクセスされた場合は 403 を返し、UIは「使えません」と表示。

**権限キー ⇔ APIアクセス表**

| API | 必要権限 |
|---|---|
| `GET /v1/companies` | `company.view` |
| `GET /v1/companies/{id}` | `company.view` |
| `GET /v1/companies/{id}/members` | `member.invite` 以上 |
| `PATCH /v1/companies/{id}/members/{user_id}` | `member.role.update` |
| `GET /v1/roles` | `company.view` |
| `GET /v1/projects` | `project.view` |
| `GET /v1/counterparties` | `counterparty.view` |
| `POST /v1/threads` | `thread.create` |
| `GET /v1/threads` | `thread.view` |
| `GET /v1/threads/{id}` | `thread.view` |
| `GET /v1/threads/{id}/timeline` | `thread.view`, `event.view` |
| `POST /v1/threads/{id}/events` | `event.create` (訂正/取消は `event.correct`/`event.cancel`) |
| `POST /v1/uploads` | `attachment.upload` |
| `POST /v1/uploads/{id}/complete` | `attachment.upload` |
| `POST /v1/share-links` | `share_link.create` |
| `POST /v1/share-links/{id}/revoke` | `share_link.revoke` |
| `POST /v1/deliveries` | `delivery.record` |
| `POST /v1/sync` | `sync.offline` |

補足:
- `X-Company-Id` が必須なAPIは、会社選択後にのみ有効。
- `Partner` 役割はサーバ側で `thread` フィルタを強制。
