**初期ロールテンプレート（最小構成）**

ロールは運用が回る最小数で開始し、増やすのは後でよい。

**Owner（経営/責任者）**
- 目的: 会社全体の管理・監査・課金。
- 権限: 全権限。
- 画面: 会社設定・メンバー管理・監査ログ・全現場。

**Admin（管理者）**
- 目的: 現場運用の管理・設定。
- 権限: Owner以外の全権限（`settings.billing`以外）。
- 画面: メンバー管理、現場/取引先管理、出力、全連絡ノート。

**現場（現場監督/職長/作業員）**
- 目的: 現場の連絡・記録・共有。
- 権限:
  - `project.view`
  - `counterparty.view`
  - `thread.view`, `thread.create`
  - `event.view`, `event.create`
  - `attachment.upload`, `attachment.view`
  - `delivery.record`
  - `share_link.create`, `share_link.view`
  - `sync.offline`
- 画面: 今日、連絡ノート、日報/写真。
- 制限: 訂正/取消は不可（Supervisor以上に限定）。

**事務（事務員/経理）**
- 目的: 予定/取引先/出力/共有の管理。
- 権限:
  - `company.view`
  - `project.view`, `project.create`, `project.edit`, `project.archive`
  - `counterparty.view`, `counterparty.manage`
  - `thread.view`
  - `event.view`
  - `attachment.view`
  - `share_link.create`, `share_link.view`, `share_link.revoke`
  - `export.pdf`
- 画面: 現場/取引先管理、連絡ノート閲覧、出力。
- 制限: 現場の新規投稿は不可（現場側に寄せる運用）。

**運用ルール**
- 権限不足の機能は非表示。
- 現場ロールは「入力・送信」中心、事務ロールは「管理・出力」中心。
- ロールを増やす場合は、`現場`から分割していく（Supervisor、Foreman、Worker）。
