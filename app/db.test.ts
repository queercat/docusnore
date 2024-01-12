import { afterEach, beforeEach, expect, test } from "vitest";
import fs from "fs/promises";
import { Docusnore } from "./db";

let db: Docusnore;

beforeEach(async () => {
  db = new Docusnore("test.docusnore");
  await db.initStore();
});

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
  await db.add("test", {value: "test"});
  await db.add("test2", {value: "test2"});

  const file = await fs.open("test.docusnore", "r");
  const content = await file.readFile({encoding: "utf-8"});
  const parsed = JSON.parse(content);

  expect(parsed.test[0]).toMatchObject({value: "test"});
  expect(parsed.test2[0]).toMatchObject({value: "test2"});

  await file.close();
});

test("Can get a key", async () => {
  await db.add("test", {value: "test"});
  await db.add("test2", {value: "test2"});

  const value = await db.get("test");
  const value2 = await db.get("test2");

  expect(value?.at(0)).toMatchObject({value: "test"});
  expect(value2?.at(0)).toMatchObject({value: "test2"});
});
