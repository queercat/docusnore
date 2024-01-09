import { expect, test } from "vitest";
import { Docusnore } from "./db";

const db = new Docusnore("test.docusnore");

test("Can get a lock", async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const lock = await db.getLock();
  expect(lock).toBe(true);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  await db.releaseLock();
});