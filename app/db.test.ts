import { afterEach, expect, test } from "vitest";
import { Docusnore } from "./db";
import fs from "fs/promises";

const db = new Docusnore("test.docusnore");

afterEach(async () => {
  // iterate over directory and delete if ends in docusnore or docusnore.lock
  const files = await fs.readdir(".");
  files.forEach(async (file) => {
    if (file.endsWith(".docusnore") || file.endsWith(".docusnore.lock")) {
      await fs.unlink(file);
    }
  });
});

test("Can get a lock", async () => {
  // @ts-ignore
  const lock = await db.getLock();
  expect(lock).toBe(true);
});

test("Can't get lock when it's already locked", async () => {
  // @ts-ignore
  const lock = await db.getLock();
  expect(lock).toBe(true);

  // @ts-ignore
  const lock2 = await db.getLock();
  expect(lock2).toBe(false);
});

test("Can add a key", async () => {
  await db.addAsync("test", {value: "test"});
  await db.addAsync("test", {value: "test2"});
});