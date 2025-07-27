import { Person } from "../db";

export interface FileUploadProps {
  filesToUpload: File[];
  setFilesToUpload: (files: File[]) => void;
}

export interface PersonFormProps {
  onSubmit: (person: Person) => void;
  filesToUpload: File[];
  setFilesToUpload: (files: File[]) => void;
}

export interface PersonTableProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (listNumber: string) => void;
  onShowFiles: (person: Person) => void;
  selectedPersons: number[];
  onToggleSelection: (personId: number) => void;
}

export interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
}

export interface StatusUpdateProps {
  onUpdateStatus: (criteria: string, value: string, status: string) => void;
}

export interface EditPersonDialogProps {
  person: Person;
  onSave: (updatedPerson: Person, newFiles: File[]) => void;
  onCancel: () => void;
}

export class FileUpload extends React.Component<FileUploadProps> {}
export class PersonForm extends React.Component<PersonFormProps> {}
export class PersonTable extends React.Component<PersonTableProps> {}
export class SearchBar extends React.Component<SearchBarProps> {}
export class StatusUpdate extends React.Component<StatusUpdateProps> {}
export class EditPersonDialog extends React.Component<EditPersonDialogProps> {}
