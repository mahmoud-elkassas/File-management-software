export interface Person {
  id?: number;
  name: string;
  date: string;
  phone?: string;
  status: string;
  list_number: string;
  receipt_number?: string;
  register_number?: string;
  request_name?: string;
  files?: string;
}

export class Database {
  getAllPersons(): Promise<Person[]>;
  searchPersons(term: string): Promise<Person[]>;
  addPerson(person: Person): Promise<void>;
  updateStatus(
    criteria: string,
    value: string,
    status: string
  ): Promise<Person[]>;
  updatePerson(person: Person): Promise<void>;
  updatePersonStatus(id: number, status: string): Promise<Person | null>;
  deletePerson(listNumber: string): Promise<void>;
}
