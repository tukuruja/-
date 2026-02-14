**画面単位：権限による表示/非表示ルール**

凡例:
- 表示: 権限があれば表示、なければ非表示。
- 非活性: 権限がない場合に押せない（ただし現場UIは原則非表示）。

**SMS/LINEで入る/会社選択**
- SMS/LINEで入る方法: すべて表示
- 会社選択: `company.view`

**今日**
- 現場一覧カード: `project.view`
- 連絡を見る: `thread.view`
- 日報ボタン: `event.create`
- 直近の連絡一覧: `event.view`
- 右下「入れる」: `event.create` + `attachment.upload`

**連絡ノート（時系列）**
- タイムライン表示: `thread.view` + `event.view`
- 添付の閲覧: `attachment.view`
- 「入れる」: `event.create` + `attachment.upload`
- 「撮る」: `event.create` + `attachment.upload`
- 「送る」: `share_link.create` + `delivery.record`
- 訂正: `event.correct`
- 取り消し: `event.cancel`
- 共有リンク生成: `share_link.create`
- 共有リンク失効: `share_link.revoke`

**日報・写真**
- 音声入力/入力: `event.create`
- 写真撮影/選択: `attachment.upload`
- 送信: `share_link.create` + `delivery.record`

**現場/取引先管理（事務・管理向け）**
- 現場一覧: `project.view`
- 現場追加: `project.create`
- 現場編集: `project.edit`
- 現場終了: `project.archive`
- 取引先一覧: `counterparty.view`
- 取引先追加/編集: `counterparty.manage`

**出力（PDF）**
- 出力ボタン: `export.pdf`

**メンバー管理**
- メンバー一覧: `member.invite` 以上
- 招待: `member.invite`
- ロール変更: `member.role.update`
- 削除: `member.remove`

**監査ログ**
- 表示: `audit.view`

**課金/契約**
- 表示/操作: `settings.billing`

UIルール:
- 現場UIは原則「非表示」。
- 事務/管理画面は、権限なしの場合「メニューに出さない」。
- 権限不足で直接アクセスした場合は「使えません」を表示。
