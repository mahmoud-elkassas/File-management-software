import { useState } from "react";
import { Edit, Trash2, FileText, Download } from "lucide-react";
import { Person } from "../db";

interface PersonTableProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
  onShowFiles: (person: Person) => void;
  selectedPersons: number[];
  onToggleSelection: (personId: number) => void;
}

export function PersonTable({
  persons,
  onEdit,
  onDelete,
  onShowFiles,
  selectedPersons = [],
  onToggleSelection,
}: PersonTableProps) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleDownloadAll = (person: Person) => {
    // Create a text file with person's data
    const personData = `
      الاسم: ${person.name}
      رقم الهاتف: ${person.phone}
      رقم القائمة: ${person.list_number}
      رقم الوصل: ${person.receipt_number}
      رقم الدفتر: ${person.register_number}
      اسم الطلب: ${person.request_name}
      الحالة: ${person.status}
      التاريخ: ${person.date}
    `;

    const dataBlob = new Blob([personData], { type: "text/plain" });
    const dataUrl = URL.createObjectURL(dataBlob);
    const dataLink = document.createElement("a");
    dataLink.href = dataUrl;
    dataLink.download = `${person.name}_data.txt`;
    dataLink.click();

    // Download all files
    if (person.files) {
      person.files.split(";").forEach((fileName) => {
        const link = document.createElement("a");
        link.href = `/files/${person.name}/${fileName}`;
        link.download = fileName;
        link.click();
      });
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                تحديد
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                الاسم
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                التاريخ
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                رقم الهاتف
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                الحالة
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                رقم الدفعة
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                رقم الوصل
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                رقم الدفتر
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                اسم الطلب
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {persons.length > 0 ? (
              persons.map((person, index) => (
                <tr
                  key={person.id}
                  className={`${
                    selectedRow === index ? "bg-blue-50" : ""
                  } hover:bg-gray-50 cursor-pointer`}
                  onClick={() => setSelectedRow(index)}
                >
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={
                        person.id !== undefined &&
                        selectedPersons.includes(person.id)
                      }
                      onChange={(e) => {
                        e.stopPropagation();
                        if (person.id !== undefined) {
                          onToggleSelection(person.id);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {person.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        person.status === "تم استلام المعاملة"
                          ? "bg-green-100 text-green-800"
                          : person.status === "تم ارسال المعاملة"
                          ? "bg-blue-100 text-blue-800"
                          : person.status === "جاهز"
                          ? "bg-purple-100 text-purple-800"
                          : person.status === "تم استلام الجواز"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {person.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.list_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.receipt_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.register_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.request_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(person);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (person.id) {
                            onDelete(person.id.toString());
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowFiles(person);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FileText size={18} />
                      </button>
                      {person.status === "تم استلام الجواز" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAll(person);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Download size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  لا توجد بيانات متاحة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
