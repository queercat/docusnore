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
  await db.initStore();
  await db.addAsync("test", {value: "test"});

  let file = await fs.open("test.docusnore", "r");
  let content = await file.readFile({encoding: "utf-8"});
  let parsed = JSON.parse(content);

  expect(parsed.test).toBeDefined();

  await db.addAsync("test2", {value: "test2"});

  file = await fs.open("test.docusnore", "r");
  content = await file.readFile({encoding: "utf-8"});
  parsed = JSON.parse(content);

  expect(parsed.test[0]).toMatchObject({value: "test"});
  expect(parsed.test2[0]).toMatchObject({value: "test2"});
});