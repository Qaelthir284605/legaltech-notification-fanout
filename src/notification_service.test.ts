import assert from "node:assert/strict";
import { intakeSchema, notificationPayload } from "./notification_service.ts";

const input = { matterId: "m-1", clientName: "Northwind", signedDocumentUrl: "https://example.test/doc.pdf", subscribers: ["a@example.test", "b@example.test"], deadline: "2030-01-15T09:00:00.000Z" };
const parsed = intakeSchema.parse(input);
assert.equal(parsed.subscribers.length, 2);
assert.deepEqual(notificationPayload(parsed, parsed.subscribers[0]), { kind: "signed-document", matterId: "m-1", clientName: "Northwind", subscriber: "a@example.test", signedDocumentUrl: "https://example.test/doc.pdf", deadline: "2030-01-15T09:00:00.000Z" });
assert.throws(() => intakeSchema.parse({ ...input, subscribers: [] }));
console.log("notification decision test passed");
