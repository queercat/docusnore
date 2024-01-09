import fs from "fs/promises";

export class Docusnore {
  private fileLocation: string = "";

  constructor(fileLocation: string) {
    this.fileLocation = fileLocation;
  }

  private async getFileHandle(mode: string): Promise<fs.FileHandle | undefined> {
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
    try {
      await fs.unlink(this.fileLocation + ".lock");
    } catch (error) {
      console.error(error);
    }
  }

  private async dropFile(): Promise<void> {
    try {
      await fs.unlink(this.fileLocation);
    } catch (error) {
      console.error(error);
    }
  }

  public async addAsync(key: string, value: string | object) {
    if (typeof value === "string") {
      value = JSON.parse(value);
    }

    const lock = await this.getLock();

    if (!lock) {
      throw new Error("Could not get lock");
    }

    const file = await this.getFileHandle("w+");

    if (!file) {
      throw new Error("Could not open file");
    }

    let content = await file.readFile({encoding: "utf-8"});

    if (!content) {
      content = "{}";
    }

    const data = JSON.parse(content);

    if (!data[key]) {
      data[key] = [];
    }

    data[key].push(value);

    await file.writeFile(JSON.stringify(data));

    console.log(JSON.stringify(data))

    await this.releaseLock();
  }

  public async deleteAsync() {

  }
}