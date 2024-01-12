import fs from "fs/promises";

export class Docusnore {
  private fileLocation: string = "";
  private hasInit: boolean = false;

  constructor(fileLocation: string) {
    this.fileLocation = fileLocation;
  }

  public async initStore() {
    this.hasInit = false;

    await fs.writeFile(this.fileLocation, "{}", {flag: "w+"});

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

  public async get(key: string): Promise<string | undefined> {
    let file = await this.getFileHandle("r");

    if (file === undefined) {
      throw new Error("Could not get file handle");
    }

    let content = await file.readFile({encoding: "utf-8"});

    const data = JSON.parse(content) || {};

    return data[key];
  }

  public async add(key: string, value: string | object) {
    if (typeof value === "string") {
      value = JSON.parse(value);
    }

    const lock = await this.getLock();

    if (!lock) {
      throw new Error("Could not get lock");
    }

    let readHandle = await this.getFileHandle("r");

    if (readHandle === undefined) {
      throw new Error("Could not get file handle");
    }

    let content = await readHandle.readFile({encoding: "utf-8"});

    const data = JSON.parse(content) || {};

    if (data[key] === undefined) {
      data[key] = [];
    }

    data[key].push(value);

    const file = await this.getFileHandle("w+");

    if (file === undefined) {
      throw new Error("Could not get file handle");
    }

    await file.writeFile(JSON.stringify(data), {encoding: "utf-8"});

    await file.close();
    await readHandle.close();

    await this.releaseLock();
  }

  public async deleteAsync() {

  }
}