import React, { useState } from "react";
import { CheckCircle } from "lucide-react";

export function StatusUpdate({ onUpdateStatus }) {
  const [criteria, setCriteria] = useState("قائمة");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("تم استلام المعاملة");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value) {
      onUpdateStatus(criteria, value, status);
      setValue("");
    } else {
      alert("الرجاء إدخال قيمة");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex  flex-wrap gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          نوع البحث
        </label>
        <select
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="قائمة">قائمة</option>
          <option value="وصل">وصل</option>
          <option value="دفتر">دفتر</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          القيمة
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="أدخل القيمة"
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="flex items-end">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="تم استلام المعاملة">تم استلام المعاملة</option>
          <option value="تم ارسال المعاملة">تم ارسال المعاملة</option>
          <option value="تم الاستلام في الخارجية">
            تم الاستلام في الخارجية
          </option>
          <option value="تم الإرسال من الخارجية">تم الإرسال من الخارجية</option>
          <option value="جاهز">جاهز</option>
          <option value="تم استلام الجواز">تم استلام الجواز</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <CheckCircle size={20} />
          تعديل الحالة
        </button>
      </div>
    </form>
  );
}
