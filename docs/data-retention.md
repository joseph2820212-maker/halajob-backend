# Data Retention

Hala Job uses MongoDB TTL indexes for records that can safely expire automatically, and a scheduled cleanup for embedded user verification fields that must not delete the user document.

Default retention windows:

- Refresh sessions: deleted at their own `expiresAt`.
- Search history: 180 days.
- Email logs: 365 days.
- Analytics events: 400 days.
- Read notifications: 365 days.
- Unread notifications: 730 days through the scheduled cleanup.
- Job invitations: 730 days after `expires_at`; active expired invitations are first marked `expired`.
- OTP/passcode and new-device verification fields: cleared when their expiry timestamp passes.

Operational cleanup runs through the scheduled job key `data-retention-cleanup`. Override windows with `SEARCH_HISTORY_RETENTION_DAYS`, `EMAIL_LOG_RETENTION_DAYS`, `ANALYTICS_EVENT_RETENTION_DAYS`, `READ_NOTIFICATION_RETENTION_DAYS`, `UNREAD_NOTIFICATION_RETENTION_DAYS`, and `JOB_INVITATION_RETENTION_DAYS`. Set a window to `0` or less to disable that pruning category.
