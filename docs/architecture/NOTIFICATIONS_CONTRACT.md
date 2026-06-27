# Notifications Contract

Date: 2026-06-27
Scope: in-app/push notification backend rules.

## Routes

Notification routes are mounted under `/notifications/v1` and legacy user notification/FCM routes under `/user/v1`.

| Action | Route examples |
|---|---|
| List notifications | `GET /notifications/v1/list`, `GET /user/v1/notifications` |
| Unread count | `GET /notifications/v1/unread-count` |
| Mark read/all | `POST/PATCH /notifications/v1/read`, `POST/PATCH /notifications/v1/read-all` |
| Register device token | `POST /notifications/v1/device-token`, `POST /user/v1/fcm/tokens` |
| Delete device token | `DELETE /notifications/v1/device-token`, legacy FCM delete routes |

## Rules

- Notification state belongs in backend notification records.
- Device tokens must be registered after login and removed on logout/device removal.
- Notification payloads should include route metadata that opens normal app screens.
- Mobile/web should not show webview popups for internal actions.
- Duplicate prevention should use backend dedupe keys where implemented.

## Required Triggers

- application submitted/viewed/status changed
- interview scheduled/cancelled/updated
- campus verification approved/rejected/request-info
- company received applicant
- trust report decision
- AI/export ready where asynchronous

## Verification

```bash
npm run test:notification-routes
```

## Gaps

- Live push delivery must be verified on real devices with rotated Firebase credentials.
- Tap-routing payloads need a complete mobile/web matrix.
