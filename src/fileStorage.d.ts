export interface FileInfo {
  name: string;
  size: number;
}

export class FileStorage {
  ensurePersonFolder(personName: string): void;
  addFilesToPerson(personName: string, files: File[]): string[];
  getPersonFiles(personName: string): FileInfo[];
}
