# Push Notifications (Firebase Cloud Messaging) Setup

This is the end-to-end guide for enabling push notifications across the HalaJob
backend and the Flutter mobile app. Push is **optional**: if it is not
configured the backend still records in-app notification rows and the app still
works — only device push delivery is disabled.

There are two independent halves and both must be configured for a push to
reach a device:

1. **Backend** — holds a Firebase **service account** and calls the FCM Admin
   API to send messages. (This repo.)
2. **Mobile** — is built with Firebase **client** config so the app can obtain
   an FCM device token and register it with the backend. (`halajob-mobile` repo.)

## 1. Create the Firebase project (once)

1. In the [Firebase console](https://console.firebase.google.com/), create a
   project (or reuse the existing HalaJob project).
2. Add an **Android app** with package id `com.halajob.halajob_mobile` (and,
   if shipping iOS, an **iOS app** with the production bundle id). Note the
   generated values — you will need them for the mobile build defines below.
3. Under **Project settings → Cloud Messaging**, confirm the Firebase Cloud
   Messaging API (V1) is enabled.
4. Under **Project settings → Service accounts**, click **Generate new private
   key**. This downloads a service-account JSON. Treat it as a secret — never
   commit it.

## 2. Backend configuration (this repo)

The backend reads the service account from environment (see
`notification/SendNotification.js`). Provide **one** of:

| Variable | Meaning |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | The full service-account JSON, inline as a single-line string. Preferred on hosts where you paste secrets into an env manager. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Absolute path to the service-account JSON file on the host. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Standard Google credentials path; used as a fallback when the two above are unset. |

Rules:

- Keep the JSON out of Git. Only `.env.example` (with empty values) is tracked.
- If none of the three is set, the notification service no-ops for device push
  (no crash); in-app notifications are unaffected.
- `notification/serviceAccount.example.json` shows the expected shape only — it
  is not real credentials.

## 3. Mobile configuration (`halajob-mobile` repo)

The mobile app does **not** use a `google-services.json` file. Firebase is
initialized from build-time `--dart-define` values (see
`lib/src/features/notifications/firebase_notification_device_token_provider.dart`).
If any required value is empty, the app skips Firebase init and push is silently
disabled — while it may still request the `POST_NOTIFICATIONS` runtime
permission.

Pass these at build time (values come from the Firebase app you registered in
step 1):

| dart-define | Source in Firebase console |
| --- | --- |
| `HALA_FIREBASE_PROJECT_ID` | Project settings → Project ID |
| `HALA_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging → Sender ID |
| `HALA_FIREBASE_STORAGE_BUCKET` | Project settings → Storage bucket |
| `HALA_FIREBASE_ANDROID_API_KEY` | Android app → API key |
| `HALA_FIREBASE_ANDROID_APP_ID` | Android app → App ID |
| `HALA_FIREBASE_IOS_API_KEY` | iOS app → API key (iOS builds only) |
| `HALA_FIREBASE_IOS_APP_ID` | iOS app → App ID (iOS builds only) |
| `HALA_FIREBASE_IOS_BUNDLE_ID` | iOS app → Bundle ID (iOS builds only) |

See `halajob-mobile/docs/dart-defines.md` for the canonical define list and how
to wire them into `flutter build` and CI.

## 4. Verifying end-to-end

1. Build the app with the Firebase defines and run it on a device.
2. Grant the notification permission when prompted.
3. Confirm the app registers a device token with the backend (the token-device
   endpoint returns success).
4. Trigger a backend event that sends a notification and confirm the device
   receives it. If the in-app row appears but no device push arrives, re-check
   that both the backend service account (step 2) and the mobile defines
   (step 3) point at the **same** Firebase project.
