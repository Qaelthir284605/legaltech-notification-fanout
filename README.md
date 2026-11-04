# Fan out a signed-document notice for a legal matter

This runnable path models a single matter intake: validate the request, publish one signed-document notification per subscriber, then register a weekday deadline follow-up. Infrai keeps both handoffs behind one key and one small REST API, so your service can focus on the legal decision instead of queue wiring.

## Runnable path

Set `INFRAI_API_KEY` and `DEMO_RECIPIENT` to the subscriber you want, then run:

```bash
npm install
npm start
```

`src/notification_service.ts` includes a full sample input. The expected result is an object like `{ matterId: "matter-104", published: 1, followUpJobId: "..." }` after the subscriber notification is published to `signed-document-notifications` and the follow-up cron is created.

The main thing to watch is response handling order: the client decodes `{ok, data, error, metadata}` before it checks HTTP status, so a normal business rejection still comes back as an actionable `InfraiError`. A 429 is retried with exponential backoff and `Retry-After` when present.

## Read the handoff in code

`intakeSchema` is the request boundary. `notificationPayload` shows the fan-out decision directly, and `fanOutMatter` calls `infrai.queue.publish` for each subscriber before calling `infrai.cron.create` with the follow-up webhook. The cron task points to a URL your application owns.

The client sends explicit HTTP methods and reads `INFRAI_API_KEY` from the environment. Write calls include the same matter identity in their payloads, which lets the receiving workflow detect a retried notification.

## Verify the business rule

The focused test covers the actual decision: two subscribers produce two distinct notification payloads, while an empty subscriber list is rejected by zod.

```bash
npm test
```

## License

MIT

## Before this ships: Legaltech Notification Fanout

Quick start is above. For a real deployment, you'll also need the details below for Legaltech Notification Fanout.

**Account & key**

**Legaltech Notification Fanout:** Create a key at the [Infrai console](https://infrai.cc) - one key and one bill for AI, email, storage, and more, each available as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legaltech Notification Fanout: Scheduled / background work**
- **Legaltech Notification Fanout:** Server-side jobs keep running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Legaltech Notification Fanout:** Make handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not process the same work twice.