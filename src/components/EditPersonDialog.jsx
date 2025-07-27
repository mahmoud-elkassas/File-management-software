import React, { useState, useEffect } from "react";
import { FileUpload } from "./FileUpload";
import { Save, X, Folder, Download } from "lucide-react";

export function EditPersonDialog({ person, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: person.id,
    name: person.name,
    phone: person.phone,
    list_number: person.list_number,
    receipt_number: person.receipt_number,
    register_number: person.register_number,
    request_name: person.request_name,
    status: person.status,
    date: person.date,
    files: person.files || "",
  });

  const [filesToUpload, setFilesToUpload] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [receiptPdf, setReceiptPdf] = useState(null);

  useEffect(() => {
    if (formData.files) {
      setExistingFiles(
        formData.files.split(";").map((fileName) => ({
          name: fileName,
          isExisting: true,
        }))
      );
    }
  }, [formData.files]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.status === "تم استلام الجواز" && !receiptPdf) {
      alert("الرجاء تحميل إيصال الاستلام");
      return;
    }
    onSave(formData, [...filesToUpload, receiptPdf].filter(Boolean));
  };

  const handleRemoveExistingFile = (fileName) => {
    const updatedFiles = existingFiles.filter((file) => file.name !== fileName);
    setExistingFiles(updatedFiles);
    setFormData((prev) => ({
      ...prev,
      files: updatedFiles.map((file) => file.name).join(";"),
    }));
  };

  const handleDownloadAll = () => {
    // Create a text file with person's data
    const personData = `
      الاسم: ${formData.name}
      رقم الهاتف: ${formData.phone}
      رقم الدفعة: ${formData.list_number}
      رقم الوصل: ${formData.receipt_number}
      رقم الدفتر: ${formData.register_number}
      اسم الطلب: ${formData.request_name}
      الحالة: ${formData.status}
      التاريخ: ${formData.date}
    `;

    const dataBlob = new Blob([personData], { type: "text/plain" });
    const dataUrl = URL.createObjectURL(dataBlob);
    const dataLink = document.createElement("a");
    dataLink.href = dataUrl;
    dataLink.download = `${formData.name}_data.txt`;
    dataLink.click();

    // Download all files
    existingFiles.forEach((file) => {
      const link = document.createElement("a");
      link.href = `/files/${formData.name}/${file.name}`;
      link.download = file.name;
      link.click();
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">تعديل بيانات الشخص</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الهاتف
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الدفعة
              </label>
              <input
                type="text"
                name="list_number"
                value={formData.list_number}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الوصل
              </label>
              <input
                type="text"
                name="receipt_number"
                value={formData.receipt_number}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الدفتر
              </label>
              <input
                type="text"
                name="register_number"
                value={formData.register_number}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الطلب
              </label>
              <select
                name="request_name"
                value={formData.request_name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="طلب جديد">طلب جديد</option>
                <option value="تجديد">تجديد</option>
                <option value="بدل ضائع">بدل ضائع</option>
                <option value="بدل تالف">بدل تالف</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="تم استلام المعاملة">تم استلام المعاملة</option>
                <option value="تم ارسال المعاملة">تم ارسال المعاملة</option>
                <option value="تم الاستلام في الخارجية">
                  تم الاستلام في الخارجية
                </option>
                <option value="تم الإرسال من الخارجية">
                  تم الإرسال من الخارجية
                </option>
                <option value="جاهز">جاهز</option>
                <option value="تم استلام الجواز">تم استلام الجواز</option>
              </select>
            </div>

            {formData.status === "تم استلام الجواز" && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  إيصال الاستلام (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setReceiptPdf(e.target.files[0])}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder size={18} />
              <label className="text-sm font-medium text-gray-700">
                إضافة/تعديل الملفات
              </label>
            </div>

            <FileUpload files={filesToUpload} setFiles={setFilesToUpload} />

            {existingFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  الملفات الحالية:
                </p>
                <div className="space-y-2">
                  {existingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-100 p-2 rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFile(file.name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2 mt-4">
            <button
              type="button"
              onClick={handleDownloadAll}
              className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              تحميل جميع الملفات والبيانات
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Save size={20} />
                حفظ التعديلات
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
