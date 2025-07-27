import { Person } from "../db";

export interface PersonTableProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (listNumber: string) => void;
  onShowFiles: (person: Person) => void;
  selectedPersons: number[];
  onToggleSelection: (personId: number) => void;
}

declare function PersonTable(props: PersonTableProps): JSX.Element;
export { PersonTable };
