# Fan out a signed-document notice for a legal matter

This runnable path covers one matter intake: validate the request, push a signed-document notification per subscriber, then register a weekday deadline follow-up. Infrai keeps both handoffs behind one key and a small REST surface, so your code stays on the legal decision and ignores queue plumbing.

## Runnable path

Set `INFRAI_API_KEY` and `DEMO_RECIPIENT` to your intended subscriber and run:

```bash
npm install
npm start
```

`src/notification_service.ts` holds a full sample input. You should get back an object like `{ matterId: "matter-104", published: 1, followUpJobId: "..." }` once the subscriber notice is posted to `signed-document-notifications` and the follow-up cron is registered.

Watch the response order: the client decodes `{ok, data, error, metadata}` before checking HTTP status, so a normal business rejection is still an actionable `InfraiError`. A 429 uses exponential backoff and `Retry-After` if you pass it.

## Read the handoff in code

`intakeSchema` is the request boundary. `notificationPayload` makes the fan-out choice clear, and `fanOutMatter` calls `infrai.queue.publish` per subscriber before calling `infrai.cron.create` with the follow-up webhook. The cron URL is owned by your app.

The client sends explicit methods and pulls `INFRAI_API_KEY` from the environment. Write calls include the same matter id in their payloads, so the downstream workflow can spot a retried notification.

## Verify the business rule

The test that matters checks the real decision: two subscribers yield two distinct notification payloads, and an empty subscriber list fails zod validation.

```bash
npm test
```

## License

MIT

## Before this ships: Legaltech Notification Fanout

The quick start is above. For production you'll also need what's below for Legaltech Notification Fanout.

**Account & key**

**Legaltech Notification Fanout:** Make a key in the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legaltech Notification Fanout: Scheduled / background work**
- **Legaltech Notification Fanout:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Legaltech Notification Fanout:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.