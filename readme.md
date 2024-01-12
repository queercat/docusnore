# what is docusnore? ![](https://github.com/queercat/docusnore/actions/workflows/node.js.yml/badge.svg)

docusnore is a tiny implementation (220~ lines) of a JSON store with an easy to use high level API.

---

# how do i use it?

```typescript
import { Docusnore } from "docusnore";

const store = new Docusnore("store.json");
await store.init(); // Writes the initial store.

// Add a value to the store, will create a new key if it doesn't exist.
await store.add("pony", { value: "twilight sparkle" });

// Can add many values at once!
const values = [{ value: "fluttershy" }, { value: "rainbow dash" }];

await store.addMany("pony", values);

// Get all values for a key.
const value = await store.get("pony");
// [{ value: "twilight sparkle" }, { value: "fluttershy" }, { value: "rainbow dash" }]

// Get with a filter.
const filtered = await store.get(
  "pony",
  (value) => value.value === "twilight sparkle"
);
// [{ value: "twilight sparkle" }]

// Delete a value.
await store.delete("pony", (value) => value.value === "twilight sparkle");

const postDelete = await store.get("pony");
// [{ value: "fluttershy" }, { value: "rainbow dash" }]

// First value.
const first = await store.first("pony");
// { value: "fluttershy" }

// Update a value.
await store.update(
  "pony",
  { value: "pinkie pie" },
  (value) => value.value === "fluttershy"
);

const postUpdate = await store.get("pony");
// [{ value: "pinkie pie" }, { value: "rainbow dash" }]
```
