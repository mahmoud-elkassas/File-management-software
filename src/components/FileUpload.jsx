import React from 'react';
import { Upload, X } from 'lucide-react';

export function FileUpload({ files, setFiles }) {
  const handleFileChange = (e) => {
    if (e.target.files) {
      // Convert FileList to Array and add to existing files
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md flex items-center gap-1 transition-colors">
          <Upload size={16} />
          اختر الملفات
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <span className="text-sm text-gray-500">
          {files.length > 0 ? `${files.length} ملفات مختارة` : 'لم يتم اختيار ملفات'}
        </span>
      </div>
      
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
              <span className="text-sm truncate max-w-xs">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}