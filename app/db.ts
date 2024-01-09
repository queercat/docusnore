import fs from "fs/promises";

export class Docusnore {
  private fileLocation: string = "";

  constructor(fileLocation: string) {
    this.fileLocation = fileLocation;
  }

  private async getFileHandle(mode: Parameters<typeof fs.open>[2]): Promise<fs.FileHandle | undefined> {
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

  public async addAsync() {
  }

  public async deleteAsync() {

  }
}