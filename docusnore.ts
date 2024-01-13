import fs from "fs/promises";

export class Docusnore {
  private fileLocation: string = "";
  private hasInit: boolean = false;

  constructor(fileLocation: string) {
    this.fileLocation = fileLocation;
  }

  /**
   * @desc Creates the initial file. This should only be called once and will throw an error if the file already exists.
   */
  public async initStore() {
    this.hasInit = false;

    try {
      await fs.writeFile(this.fileLocation, "{}", {flag: "wx"});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }

    this.hasInit = true;
  }

  /**
   * 
   * @param mode - The mode to open the file in. See https://nodejs.org/api/fs.html#fs_file_system_flags for more information.
   * @returns A file handle or undefined if the file could not be opened.
   */
  private async getFileHandle(mode: string): Promise<fs.FileHandle | undefined> {
    if (!this.hasInit) {
      throw new Error("Docusnore has not been initialized");
    }

    let file = undefined;

    try {
      file = await fs.open(this.fileLocation, mode);
    } catch (error) {
      console.error(error);
    }

    return file;
  }

  /**
   * @desc Attempts to get a lock on the file. If the lock is already taken, this will return false.
   * @returns True if the lock was acquired, false if it was not.
   */
  private async getLock(): Promise<boolean> {
    let hasLock = true;

    try {
      await fs.writeFile(this.fileLocation + ".lock", "", {flag: "wx"});
    } catch (error) {
      hasLock = false;
    }

    return hasLock;
  }

  /**
   * @desc Releases the lock on the file by deleting the lock file.
   */
  private async releaseLock(): Promise<void> {
    await fs.unlink(this.fileLocation + ".lock");
  }

  /**
   * @desc Gets the entire contents of the store.
   * @returns the entire contents of the store as an object.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async read(): Promise<any> {
    const file = await this.getFileHandle("r");

    if (file === undefined) {
      throw new Error("Could not get file handle");
    }

    const content = await file.readFile({encoding: "utf-8"});
    const data = JSON.parse(content) || {};

    await file.close();

    return data;
  }

  /**
   * @desc Writes data to the store.
   * @param data the data to write to the store.
   */
  private async write(data: object): Promise<void> {
    const lock = await this.getLock();

    if (!lock) {
      throw new Error("Cgould not get lock");
    }

    const file = await this.getFileHandle("w+");

    if (file === undefined) {
      throw new Error("Could not get file handle");
    }

    await file.writeFile(JSON.stringify(data, undefined, 2), {encoding: "utf-8"});
    await file.close();

    await this.releaseLock();
  }

  /**
   * This will get a key from the store. If a filter is provided, it will return an array of items that match the filter.
   * @param key the key to get from the store.
   * @param filter the filter to apply to the key, if any.
   * @returns the value of the key or an array of values if a filter is provided.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async get<T extends object = any>(key: string, filter?: (item: T) => boolean): Promise<Array<T> | undefined> {
    const data = await this.read();

    if (filter === undefined) {
      return data[key];
    }

    return data[key].filter(filter);
  }

  /**
   * 
   * @param key the key to get from the store.
   * @param filter the filter to apply to the key, if any.
   * @returns the first value of the key or the first value that matches the filter.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async first<T extends object = any>(key: string, filter?: (item: T) => boolean): Promise<T | undefined> {
    const data = await this.read();

    if (filter === undefined) {
      return data[key]?.[0];
    }

    return data[key].find(filter);
  }

  /**
   * @desc Updates a key in the store. If a filter is provided, it will only update the items that match the filter.
   * @param key the key to update.
   * @param value the value to update the key with. This can be a function that takes the current value and returns the new value.
   * @param filter the filter to apply to the key, if any.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async update<T extends object = any>(key: string, value: T | ((item: T) => T), filter?: (item: T) => boolean) {
    const data = await this.read();
    const updated = data[key].map((item: T) => {
      if (filter === undefined) {
        if (typeof value !== "function") {
          return value;
        }

        return value(item);
      }

      if (filter(item)) {
        if (typeof value !== "function") {
          return value;
        }

        return value(item);
      }

      return item;
    });

    data[key] = updated;

    await this.write(data);
  }
 
  /**
   * @desc Adds a key to the store.
   * @param key the key to add to the store.
   * @param values the values to add to the store.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async addMany<T extends object = any>(key: string, values: T[]) {
    const data = await this.read();

    if (data[key] === undefined) {
      data[key] = [];
    }

    data[key].push(...values);

    await this.write(data);
  }

  /**
   * @desc Adds a key to the store. 
   * @param key the key to add to the store.
   * @param value the value to add to the store.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async add<T extends object = any>(key: string, value: T) {
    const data = await this.read();

    if (data[key] === undefined) {
      data[key] = [];
    }

    data[key].push(value);

    await this.write(data);
  }

  /**
   * @desc Removes a key from the store. If a filter is provided, it will only remove the items that match the filter.
   * @param key the key to remove from the store.
   * @param filter the filter to apply to the key, if any.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async remove<T extends object = any>(key: string, filter?: (item: T) => boolean) {
    const data = await this.read();

    if (filter === undefined) {
      data[key] = [];
    } else {
      data[key] = data[key].filter((item: T) => !filter(item));
    }

    await this.write(data);
  }

  /**
   * @desc Removes a key from the store and all of its contents.
   * @param key the key to remove from the store.
   */
  public async removeKey(key: string) {
    const data = await this.read();

    delete data[key];

    await this.write(data);
  }
}