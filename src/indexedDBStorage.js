export class IndexedDBStorage {
  constructor() {
    this.dbName = "FileManagerDB";
    this.dbVersion = 1;
    this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject("Error opening database");
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for files
        if (!db.objectStoreNames.contains("files")) {
          const fileStore = db.createObjectStore("files", {
            keyPath: "id",
            autoIncrement: true,
          });
          fileStore.createIndex("personName", "personName", { unique: false });
          fileStore.createIndex("fileName", "fileName", { unique: false });
        }
      };
    });
  }

  async ensurePersonFolder(personName) {
    if (!personName) return null;
    return personName;
  }

  async addFilesToPerson(personName, files) {
    if (!personName || !files || files.length === 0) return [];

    const fileNames = [];
    const db = await this.getDB();

    for (const file of files) {
      const fileName = file.name;
      fileNames.push(fileName);

      // Read file as ArrayBuffer
      const fileData = await this.readFileAsArrayBuffer(file);

      // Store file in IndexedDB
      const transaction = db.transaction(["files"], "readwrite");
      const store = transaction.objectStore("files");

      await store.add({
        personName,
        fileName,
        fileType: file.type,
        fileSize: file.size,
        lastModified: file.lastModified,
        data: fileData,
      });
    }

    return fileNames;
  }

  async getPersonFiles(personName) {
    if (!personName) return [];

    const db = await this.getDB();
    const transaction = db.transaction(["files"], "readonly");
    const store = transaction.objectStore("files");
    const index = store.index("personName");

    const files = await new Promise((resolve, reject) => {
      const request = index.getAll(personName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return files.map((file) => ({
      name: file.fileName,
      size: file.fileSize,
      type: file.fileType,
      data: file.data,
    }));
  }

  async deleteFile(personName, fileName) {
    if (!personName || !fileName) return false;

    const db = await this.getDB();
    const transaction = db.transaction(["files"], "readwrite");
    const store = transaction.objectStore("files");
    const index = store.index("personName");

    const files = await new Promise((resolve, reject) => {
      const request = index.getAll(personName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const fileToDelete = files.find((f) => f.fileName === fileName);
    if (fileToDelete) {
      await store.delete(fileToDelete.id);
      return true;
    }

    return false;
  }

  async getAllPeople() {
    const db = await this.getDB();
    const transaction = db.transaction(["files"], "readonly");
    const store = transaction.objectStore("files");
    const index = store.index("personName");

    const files = await new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return [...new Set(files.map((file) => file.personName))];
  }

  getDB() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
      } else {
        this.initDB()
          .then(() => resolve(this.db))
          .catch(reject);
      }
    });
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }
}
