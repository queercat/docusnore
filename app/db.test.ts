import { afterEach, beforeEach, expect, test } from "vitest";
import fs from "fs/promises";
import { Docusnore } from "./db";
import {faker} from "@faker-js/faker";

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

test("Can update on a filter", async () => {
  await db.add("people", {name: "rainbow dash"})
  await db.add("people", {name: "applejack"})
  await db.add("people", {name: "fluttershy"})

  await db.update("people", {name: "pinkie pie"}, (item) => item.name === "applejack");

  const people = await db.get("people");

  expect(people.includes({name: "applejack"})).toBe(false);
  expect(people.filter((item: any) => item.name === "pinkie pie").length).toBe(1);
});

test("Can do a complex update", async () => {
  const needle = "applejack";
  const haystack = [];

  for (let i = 0; i < 10_000; i++) {
    haystack.push({name: faker.person.firstName()});
  }

  haystack.push({name: needle});
  haystack.sort(() => Math.random() - 0.5);

  await db.addMany("people", haystack);

  await db.update("people", {name: "why y'all fryin air?"}, (item) => item.name === needle);

  const people = await db.get("people");

  expect(people.includes({name: needle})).toBe(false);
  expect(people.filter((item: any) => item.name === "why y'all fryin air?").length).toBe(1);
});

test("Can do a complex remove", async () => {
  const needle = "applejack";
  const haystack = [];

  for (let i = 0; i < 10_000; i++) {
    haystack.push({name: faker.person.firstName()});
  }

  haystack.push({name: needle});
  haystack.sort(() => Math.random() - 0.5);

  await db.addMany("people", haystack);
  await db.remove("people", (item) => item.name === needle);

  const people = await db.get("people");

  expect(people.includes({name: needle})).toBe(false);
});

test("Can do a complex remove with no filter", async () => {
  const haystack = [];

  for (let i = 0; i < 10_000; i++) {
    haystack.push({name: faker.person.firstName()});
  }

  haystack.sort(() => Math.random() - 0.5);

  await db.addMany("people", haystack);
  await db.remove("people");

  const people = await db.get("people");

  expect(people.length).toBe(0);
});

test("Can remove a key", async () => {
  await db.add("test", {value: "test"});
  await db.removeKey("test");

  const file = await fs.open("test.docusnore", "r");
  const content = await file.readFile({encoding: "utf-8"});
  const parsed = JSON.parse(content);

  expect(parsed.test).toBe(undefined);

  await file.close();
});

test("Where filter", async () => {
  await db.add("people", {name: "rainbow dash", type: "pegasus"})
  await db.add("people", {name: "applejack", type: "earth pony"})
  await db.add("people", {name: "fluttershy", type: "pegasus"})

  const pegasus = await db.where("people", (item) => item.type === "pegasus");

  expect(pegasus.length).toBe(2);
});

test("First filter", async () => {
  await db.add("people", {name: "rainbow dash", type: "pegasus"})
  await db.add("people", {name: "applejack", type: "earth pony"})
  await db.add("people", {name: "fluttershy", type: "pegasus"})

  const pegasus = await db.first("people", (item) => item.type === "pegasus");

  expect(pegasus).toMatchObject({name: "rainbow dash", type: "pegasus"});
});