# Syria-Safe Communication Hub

The Syria launch communication hub supports in-app notifications, email, SMS abstraction, and manual WhatsApp deep links. Official WhatsApp Business API sending is not required for launch and must stay behind a disabled provider flag unless operations approve it.

## Main Backend Surfaces

- Model: `CommunicationDeliveryLogModel`.
- Services: `services/communication/`.
- Routes: `routesUser/CommunicationRote.js`, admin communication routes under `/dash/v1/communication`.
- Existing notifications remain the in-app delivery surface.

## Operator Notes

- Use manual WhatsApp links for copy/share workflows.
- Check delivery logs before blaming users for missed messages.
- Keep SMS provider disabled until a real provider and legal/operational process exist.
- Email failures should be logged as stable errors, not crash user flows.

## Verification

Run:

```bash
npm run test:integration:communication-hub
```

This covers canonical preferences, ownership isolation, safe manual WhatsApp links, disabled SMS skip logs, in-app delivery, official WhatsApp disabled state, saved-search alert dispatch, and admin communication routes.

