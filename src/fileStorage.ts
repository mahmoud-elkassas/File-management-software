import { FileInfo } from "./types";

export class FileStorage {
  private fileSystem: { [key: string]: { files: FileInfo[] } };

  constructor() {
    this.fileSystem = JSON.parse(localStorage.getItem("fileSystem") || "{}");
  }

  ensurePersonFolder(personName: string): void {
    if (!this.fileSystem[personName]) {
      this.fileSystem[personName] = {
        files: [],
      };
      this.saveFileSystem();
    }
  }

  addFilesToPerson(personName: string, files: File[]): string[] {
    if (!personName || !files || !files.length) return [];

    this.ensurePersonFolder(personName);
    const folder = this.fileSystem[personName];
    const addedFiles: string[] = [];

    files.forEach((file) => {
      if (!folder.files.some((f) => f.name === file.name)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const fileInfo: FileInfo = {
              name: file.name,
              type: file.type,
              size: file.size,
              data: e.target.result as string,
            };
            folder.files.push(fileInfo);
            this.saveFileSystem();
          }
        };
        reader.readAsDataURL(file);
        addedFiles.push(file.name);
      }
    });

    return addedFiles;
  }

  getPersonFiles(personName: string): FileInfo[] {
    return this.fileSystem[personName]?.files || [];
  }

  deleteFile(personName: string, fileName: string): void {
    const folder = this.fileSystem[personName];
    if (folder) {
      folder.files = folder.files.filter((f) => f.name !== fileName);
      this.saveFileSystem();
    }
  }

  private saveFileSystem(): void {
    localStorage.setItem("fileSystem", JSON.stringify(this.fileSystem));
  }
}
