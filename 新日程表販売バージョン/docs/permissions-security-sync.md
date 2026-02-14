**Permissions (Roles + Permission Keys)**

Roles are company-scoped. Each role is a named bundle of permission keys.

Roles:
- Owner (all permissions)
- Admin (all except billing)
- Manager (projects + threads + exports)
- SiteSupervisor (threads + events + uploads + share)
- Foreman (threads + events + uploads)
- Worker (events + uploads + view only)
- OfficeStaff (projects + counterparties + exports + share)
- Partner (view + upload + share within assigned threads)

Permission keys:
- company.view
- company.manage
- member.invite
- member.role.update
- member.remove
- project.view
- project.create
- project.edit
- project.archive
- counterparty.view
- counterparty.manage
- thread.view
- thread.create
- event.view
- event.create
- event.correct
- event.cancel
- attachment.upload
- attachment.view
- delivery.record
- share_link.view
- share_link.create
- share_link.revoke
- export.pdf
- audit.view
- settings.billing
- sync.offline

Role mapping:
- Owner: all keys
- Admin: all except `settings.billing`
- Manager: company.view, member.invite, project.*, counterparty.view, thread.*, event.*, attachment.*, delivery.record, share_link.*, export.pdf, sync.offline
- SiteSupervisor: company.view, project.view, counterparty.view, thread.*, event.*, attachment.*, delivery.record, share_link.create, share_link.view, sync.offline
- Foreman: project.view, counterparty.view, thread.view, thread.create, event.view, event.create, attachment.upload, attachment.view, delivery.record, sync.offline
- Worker: project.view, counterparty.view, thread.view, event.view, event.create, attachment.upload, attachment.view, sync.offline
- OfficeStaff: company.view, project.*, counterparty.*, thread.view, event.view, attachment.view, share_link.*, export.pdf
- Partner: project.view, thread.view, event.view, event.create, attachment.upload, attachment.view, share_link.view

Notes:
- `Partner` is restricted to assigned threads (server-side filter).
- `event.correct` and `event.cancel` are limited to Supervisor+ by policy.

**Share Link Security (PIN / Expiration / Revocation / Logs)**

PIN:
- Optional 4-8 digit numeric PIN.
- Stored as salted hash (never stored plaintext).
- 5 failed attempts within 10 minutes locks the token for 10 minutes.
- Unlock creates `X-Share-Session` (15-minute TTL, refresh on activity).

Expiration:
- Default 7 days, configurable 1-365 days.
- Expired links return `SHARE_LINK_EXPIRED`.
- Files inherit link expiration.

Revocation:
- Manual revoke at any time by creator or Admin+.
- Revoked links return `SHARE_LINK_REVOKED`.
- Revoke invalidates all active `X-Share-Session` tokens.

Logs:
- Record on every view and file access.
- Fields: `accessed_at`, `ip_hash`, `ua`, `referrer`, `path`, `share_link_id`.
- Show in UI as `見た記録` (use only "見た記録" wording).
- Retention: 400 days (configurable).

**Offline Sync Conflict Rules**

Core rule: server is source of truth, events are append-only.

Client event identity:
- Client must send `client_event_id` and `device_id` for offline events.
- Server stores `client_event_id` per event to de-duplicate.

Conflict outcomes:
- DUPLICATE: same `client_event_id` already exists -> return existing event id with resolution `ACCEPTED_AS_EXISTING`.
- THREAD_ARCHIVED: thread is archived -> resolution `REJECTED`.
- PERMISSION_DENIED: role lacks permission -> resolution `REJECTED`.
- RELATED_EVENT_NOT_FOUND: correction references missing event -> resolution `REJECTED`.
- ATTACHMENT_NOT_FOUND: attachment id missing -> resolution `NEEDS_RETRY`.

Ordering:
- Timeline order is by server `created_at`.
- Client `client_created_at` is stored for audit only.

Retry policy:
- If `NEEDS_RETRY`, client retries after attachment upload completes.
- If `REJECTED`, client shows a single non-blocking error and keeps local note for manual re-send.
