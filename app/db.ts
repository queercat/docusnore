import fs from "fs/promises";

export class Docusnore {
  private fileLocation: string = "";
  private hasInit: boolean = false;

  constructor(fileLocation: string) {
    this.fileLocation = fileLocation;
  }

  public async initStore() {
    this.hasInit = false;

    await fs.writeFile(this.fileLocation, "{}", {flag: "wx"});

    this.hasInit = true;
  }

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

  private async getLock(): Promise<boolean> {
    let hasLock = true;

    try {
      await fs.writeFile(this.fileLocation + ".lock", "", {flag: "wx"});
    } catch (error) {
      hasLock = false;
    }

    return hasLock;
  }

  private async releaseLock(): Promise<void> {
    await fs.unlink(this.fileLocation + ".lock");
  }

  public async get(key: string): Promise<any | undefined> {
    const content = await this.read();

    const data = content || {};

    return data[key];
  }

  private async read(): Promise<any> {
    const file = await this.getFileHandle("r");

    if (file === undefined) {
      throw new Error("Could not get file handle");
    }

    let content = await file.readFile({encoding: "utf-8"});

    const data = JSON.parse(content) || {};

    await file.close();

    return data;
  }

  private async write(data: object): Promise<void> {
    const lock = await this.getLock();

    if (!lock) {
      throw new Error("Could not get lock");
    }

    const file = await this.getFileHandle("w+");

    if (file === undefined) {
      throw new Error("Could not get file handle");
    }

    await file.writeFile(JSON.stringify(data), {encoding: "utf-8"});
    await file.close();

    await this.releaseLock();
  }

  public async update(key: string, value: object | ((item: any) => object), filter: (item: any) => boolean) {
    const data = await this.read();
    const updated = data[key].map((item: any) => {
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
  
  public async addMany(key: string, values: object[]) {
    const data = await this.read();

    if (data[key] === undefined) {
      data[key] = [];
    }

    data[key].push(...values);

    await this.write(data);
  }

  public async add(key: string, value: object) {
    const data = await this.read();

    if (data[key] === undefined) {
      data[key] = [];
    }

    data[key].push(value);

    await this.write(data);
  }

  public async remove(key: string, filter?: (item: any) => boolean) {
    const data = await this.read();

    if (filter === undefined) {
      data[key] = [];
    } else {
      data[key] = data[key].filter((item: any) => !filter(item));
    }

    await this.write(data);
  }
}