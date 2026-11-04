import { z } from "zod";
import { infrai } from "./infrai_client.ts";

export const intakeSchema = z.object({
  matterId: z.string().min(1),
  clientName: z.string().min(1),
  signedDocumentUrl: z.string().url(),
  subscribers: z.array(z.string().min(1)).min(1),
  deadline: z.string().datetime()
});
export type MatterIntake = z.infer<typeof intakeSchema>;

export function notificationPayload(input: MatterIntake, subscriber: string) {
  return { kind: "signed-document", matterId: input.matterId, clientName: input.clientName, subscriber, signedDocumentUrl: input.signedDocumentUrl, deadline: input.deadline };
}

export async function fanOutMatter(raw: unknown) {
  const input = intakeSchema.parse(raw);
  const messages = await Promise.all(input.subscribers.map((subscriber) => infrai.queue.publish("signed-document-notifications", notificationPayload(input, subscriber))));
  const followUp = await infrai.cron.create("0 9 * * 1-5", "https://example.com/hooks/legal-deadline-follow-up");
  return { matterId: input.matterId, published: messages.length, followUpJobId: followUp.job_id };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const recipient = process.env.DEMO_RECIPIENT;
  if (!recipient) throw new Error("DEMO_RECIPIENT is required");
  const sample = { matterId: "matter-104", clientName: "Aster Legal", signedDocumentUrl: "https://files.example.test/signed/104.pdf", subscribers: [recipient], deadline: "2030-01-15T09:00:00.000Z" };
  fanOutMatter(sample).then(console.log).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
