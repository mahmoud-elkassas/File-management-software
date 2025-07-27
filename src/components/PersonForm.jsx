import React, { useState } from "react";
import { FileUpload } from "./FileUpload";
import { Upload } from "lucide-react";

export function PersonForm({ onSubmit, filesToUpload, setFilesToUpload }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    list_number: "",
    receipt_number: "",
    register_number: "",
    request_name: "طلب جديد",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);

    // Reset form
    setFormData({
      name: "",
      phone: "",
      list_number: "",
      receipt_number: "",
      register_number: "",
      request_name: "طلب جديد",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الاسم
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="أدخل اسم الشخص"
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
            placeholder="أدخل رقم الهاتف"
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
            placeholder="أدخل رقم الدفعة"
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
            placeholder="أدخل رقم الوصل"
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
            placeholder="أدخل رقم الدفتر"
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
            الملفات
          </label>
          <FileUpload files={filesToUpload} setFiles={setFilesToUpload} />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Upload size={20} />
            إضافة
          </button>
        </div>
      </div>
    </form>
  );
}
