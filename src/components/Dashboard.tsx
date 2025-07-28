import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Person } from "../db";
import { FileStorage } from "../fileStorage";
import { SMSService } from "../smsService";
import { PersonForm } from "./PersonForm";
import { PersonTable } from "./PersonTable.tsx";
import { SearchBar } from "./SearchBar";
import { StatusUpdate } from "./StatusUpdate";
import { EditPersonDialog } from "./EditPersonDialog";
import {
  Download,
  FileText,
  CheckCircle,
  Folder,
  MessageSquare,
  BarChart,
  LogOut,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import * as XLSX from "xlsx";
import { FileInfo } from "../types";

interface Notification {
  type: "success" | "error" | "warning";
  message: string;
}

interface SMSMessage {
  to: string;
  from: string;
  message: string;
  status: "sent" | "failed" | "duplicate";
  deliveryStatus: "delivered" | "failed";
  sentAt: string;
  error?: string;
}

export function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [db] = useState(new Database());
  const [fileStorage] = useState(new FileStorage());
  const [smsService] = useState(new SMSService());
  const [persons, setPersons] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [selectedPersons, setSelectedPersons] = useState<number[]>([]);
  const [bulkStatusUpdateOpen, setBulkStatusUpdateOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("تم الاستلام");
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [currentPersonFiles, setCurrentPersonFiles] = useState<FileInfo[]>([]);
  const [currentPersonName, setCurrentPersonName] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showSmsReportDialog, setShowSmsReportDialog] = useState(false);
  const [smsHistory, setSmsHistory] = useState<SMSMessage[]>([]);
  const [filteredSmsHistory, setFilteredSmsHistory] = useState<SMSMessage[]>(
    []
  );
  const [smsFilters, setSmsFilters] = useState({
    phoneNumber: "",
    date: "",
    status: "",
    deliveryStatus: "",
  });

  useEffect(() => {
    loadPersons();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const loadPersons = async (forceRefresh = false) => {
    try {
      console.log('🔧 loadPersons: Starting to load persons...', { forceRefresh });
      
      // Clear any cached data if force refresh is requested
      if (forceRefresh) {
        console.log('🔧 loadPersons: Force refresh requested, clearing cache...');
        setPersons([]);
        // Add a small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const loadedPersons = await db.getAllPersons();
      console.log('🔧 loadPersons: Received persons:', loadedPersons.length, loadedPersons);
      
      // Double-check that we're not getting stale data
      if (forceRefresh && loadedPersons.length === persons.length) {
        console.warn('🔧 loadPersons: Warning - same number of persons after force refresh');
      }
      
      setPersons(loadedPersons);
      console.log('🔧 loadPersons: State updated with', loadedPersons.length, 'persons');
    } catch (error) {
      console.error('🔧 loadPersons: Error loading persons:', error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ غير معروف";
      setNotification({
        type: "error",
        message: `فشل تحميل البيانات: ${errorMessage}`,
      });
    }
  };

  const handleSearch = async () => {
    try {
      if (searchTerm) {
        const results = await db.searchPersons(searchTerm);
        setPersons(results);
        if (results.length === 0) {
          setNotification({
            type: "warning",
            message: "لم يتم العثور على نتائج للبحث",
          });
        }
      } else {
        loadPersons();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ غير معروف";
      setNotification({
        type: "error",
        message: `فشل البحث: ${errorMessage}`,
      });
    }
  };

  const handleAddPerson = async (personData: Person) => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const status = "تم الاستلام";

      fileStorage.ensurePersonFolder(personData.name);
      const fileNames = fileStorage.addFilesToPerson(
        personData.name,
        filesToUpload
      );

      const newPerson = {
        ...personData,
        date,
        status,
        files: fileNames.join(";"),
      };

      await db.addPerson(newPerson);
      setFilesToUpload([]);
      loadPersons();

      setNotification({
        type: "success",
        message: "تمت إضافة الشخص بنجاح",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ غير معروف";
      setNotification({
        type: "error",
        message: `فشل إضافة الشخص: ${errorMessage}`,
      });
    }
  };

  const handleUpdateStatus = async (
    criteria: string,
    value: string,
    status: string
  ) => {
    const updatedPersons = await db.updateStatus(criteria, value, status);
    loadPersons();

    if (status === "جاهز" && updatedPersons.length > 0) {
      for (const person of updatedPersons) {
        const result = await smsService.sendStatusNotification(person);
        if (result.success) {
          setNotification({
            type: "success",
            message: `تم إرسال رسالة نصية إلى ${person.name} على الرقم ${person.phone}`,
          });
        } else {
          setNotification({
            type: "error",
            message: `فشل إرسال رسالة نصية إلى ${person.name}: ${result.error}`,
          });
        }
      }
    }
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedPerson: Person, newFiles: File[]) => {
    try {
      let filesList = updatedPerson.files ? updatedPerson.files.split(";") : [];

      if (newFiles && newFiles.length > 0) {
        fileStorage.ensurePersonFolder(updatedPerson.name);
        const newFileNames = fileStorage.addFilesToPerson(
          updatedPerson.name,
          newFiles
        );
        filesList = [...filesList, ...newFileNames];
      }

      const personToUpdate = {
        ...updatedPerson,
        files: filesList.join(";"),
      };

      await db.updatePerson(personToUpdate);
      setIsEditDialogOpen(false);
      loadPersons();

      if (personToUpdate.status === "جاهز") {
        const result = await smsService.sendStatusNotification(personToUpdate);
        if (result.success) {
          setNotification({
            type: "success",
            message:
              result.error ||
              `تم إرسال رسالة نصية إلى ${personToUpdate.name} على الرقم ${personToUpdate.phone}`,
          });
        } else {
          setNotification({
            type: "warning",
            message:
              result.error || `فشل إرسال رسالة نصية إلى ${personToUpdate.name}`,
          });
        }
      }
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `حدث خطأ أثناء تحديث البيانات: ${error.message}`,
      });
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الشخص؟")) {
      try {
        console.log('🔧 Starting delete operation for ID:', id);
        console.log('🔧 Current persons count before delete:', persons.length);
        console.log('🔧 Environment:', import.meta.env.MODE);
        console.log('🔧 API URL:', import.meta.env.VITE_API_URL);
        
        // Find the person to be deleted for verification
        const personToDelete = persons.find(p => p.id?.toString() === id);
        console.log('🔧 Person to delete:', personToDelete);
        
        await db.deletePerson(id);
        console.log('🔧 Delete operation completed successfully');
        
        // Show success notification
        setNotification({
          type: "success",
          message: "تم حذف الشخص بنجاح",
        });
        
        console.log('🔧 About to reload persons...');
        // Add a longer delay in production to ensure database commit
        const delay = import.meta.env.MODE === 'production' ? 1000 : 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Force refresh after delete
        await loadPersons(true);
        console.log('🔧 loadPersons completed');
        
        // Verify the person was actually deleted
        const remainingPersons = persons.filter(p => p.id?.toString() === id);
        if (remainingPersons.length > 0) {
          console.warn('🔧 Warning: Person still appears in UI after delete');
          // Removed the warning notification
        }
        
      } catch (error: any) {
        console.error('🔧 Delete operation failed:', error);
        setNotification({
          type: "error",
          message: `حدث خطأ أثناء حذف الشخص: ${error.message}`,
        });
      }
    }
  };

  const handleExportToExcel = () => {
    if (persons.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheetData = persons.map((person: Person) => ({
      الاسم: person.name,
      التاريخ: person.date,
      "رقم الهاتف": person.phone,
      الحالة: person.status,
      "رقم الدفعة": person.list_number,
      "رقم الوصل": person.receipt_number,
      "رقم الدفتر": person.register_number,
      "اسم الطلب": person.request_name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: Object.keys(worksheetData[0]),
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, "قائمة الأشخاص");
    XLSX.writeFile(workbook, "file_manager_export.xlsx");
  };

  const handleShowFiles = (person: Person) => {
    if (person.name) {
      const files = fileStorage.getPersonFiles(person.name);
      setCurrentPersonFiles(files);
      setCurrentPersonName(person.name);
      setShowFilesDialog(true);
    } else {
      alert("لا توجد ملفات لهذا الشخص");
    }
  };

  const handleTogglePersonSelection = (personId: number) => {
    setSelectedPersons((prev) => {
      if (prev.includes(personId)) {
        return prev.filter((id) => id !== personId);
      } else {
        return [...prev, personId];
      }
    });
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedPersons.length === 0) {
      alert("الرجاء تحديد شخص واحد على الأقل");
      return;
    }

    const updatedPersons = [];
    for (const personId of selectedPersons) {
      const person = persons.find((p) => p.id === personId);
      if (person) {
        const updatedPerson = await db.updatePersonStatus(personId, bulkStatus);
        if (updatedPerson) {
          updatedPersons.push(updatedPerson);
        }
      }
    }

    setSelectedPersons([]);
    setBulkStatusUpdateOpen(false);
    loadPersons();

    if (bulkStatus === "جاهز" && updatedPersons.length > 0) {
      let successCount = 0;
      let failCount = 0;
      for (const person of updatedPersons) {
        const result = await smsService.sendStatusNotification(person);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0 || failCount > 0) {
        let message = "";
        if (successCount > 0) {
          message += `تم إرسال ${successCount} رسائل نصية بنجاح. `;
        }
        if (failCount > 0) {
          message += `فشل إرسال ${failCount} رسائل نصية.`;
        }

        setNotification({
          type: successCount > 0 ? "success" : "error",
          message,
        });
      }
    }
  };

  const handleShowSmsReport = () => {
    const history = smsService.getMessageHistory();
    const formattedHistory = history.map((msg) => {
      // Find the person by phone number
      const person = persons.find((p) => p.phone === msg.to);
      return {
        ...msg,
        from: person ? person.name : "Mission of Palestine",
      };
    });
    setSmsHistory(formattedHistory);
    setFilteredSmsHistory(formattedHistory);
    setShowSmsReportDialog(true);
  };

  const handleFilterSms = () => {
    let filtered = [...smsHistory];

    if (smsFilters.phoneNumber) {
      filtered = filtered.filter((msg) =>
        msg.to.includes(smsFilters.phoneNumber)
      );
    }

    if (smsFilters.date) {
      const filterDate = new Date(smsFilters.date).toLocaleDateString();
      filtered = filtered.filter(
        (msg) => new Date(msg.sentAt).toLocaleDateString() === filterDate
      );
    }

    if (smsFilters.status) {
      filtered = filtered.filter((msg) => msg.status === smsFilters.status);
    }

    if (smsFilters.deliveryStatus) {
      filtered = filtered.filter(
        (msg) => msg.deliveryStatus === smsFilters.deliveryStatus
      );
    }

    setFilteredSmsHistory(filtered);
  };

  const handleResetFilters = () => {
    setSmsFilters({
      phoneNumber: "",
      date: "",
      status: "",
      deliveryStatus: "",
    });
    setFilteredSmsHistory(smsHistory);
  };

  const handleExportSmsReport = () => {
    const workbook = XLSX.utils.book_new();

    const worksheetData = filteredSmsHistory.map((message) => ({
      المرسل: message.from,
      "رقم الهاتف": message.to,
      الرسالة: message.message,
      الحالة:
        message.status === "sent"
          ? "تم الإرسال"
          : message.status === "failed"
          ? "فشل الإرسال"
          : message.status === "duplicate"
          ? "مكررة"
          : "خطأ",
      "حالة التسليم":
        message.deliveryStatus === "delivered"
          ? "تم التسليم"
          : "لم يتم التسليم",
      التاريخ: new Date(message.sentAt).toLocaleString("ar-SA"),
      الخطأ: message.error || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: Object.keys(worksheetData[0]),
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الرسائل النصية");
    XLSX.writeFile(workbook, "sms_report.xlsx");
  };

  const handleDeleteSmsMessage = (index: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الرسالة من السجل؟")) {
      const updatedHistory = [...filteredSmsHistory];
      updatedHistory.splice(index, 1);
      setFilteredSmsHistory(updatedHistory);
      // Update the service's history
      const serviceHistory = smsService.getMessageHistory();
      serviceHistory.splice(index, 1);
      localStorage.setItem("smsMessageHistory", JSON.stringify(serviceHistory));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 rtl">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            برنامج إدارة الملفات
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-700 transition-colors"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>

        {notification && (
          <div
            className={`mb-4 p-3 rounded-md ${
              notification.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <MessageSquare size={20} className="text-red-600" />
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              إضافة شخص جديد
            </h2>
            <div className="flex flex-wrap gap-4">
              <PersonForm
                onSubmit={handleAddPerson}
                filesToUpload={filesToUpload}
                setFilesToUpload={setFilesToUpload}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex gap-4">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
                onRefresh={loadPersons}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <PersonTable
              persons={persons}
              onEdit={handleEditPerson}
              onDelete={handleDeletePerson}
              onShowFiles={handleShowFiles}
              selectedPersons={selectedPersons}
              onToggleSelection={handleTogglePersonSelection}
            />
          </div>

          {selectedPersons.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setBulkStatusUpdateOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              >
                <CheckCircle size={20} />
                تحديث حالة الأشخاص المحددين ({selectedPersons.length})
              </button>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              تحديث الحالة
            </h2>
            <StatusUpdate onUpdateStatus={handleUpdateStatus} />
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
              onClick={handleExportToExcel}
            >
              <Download size={20} />
              تصدير إلى Excel
            </button>

            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition-colors"
              onClick={() => {
                const selectedPerson = persons.find(
                  (p) =>
                    typeof p.id === "number" && selectedPersons.includes(p.id)
                );
                if (selectedPerson) {
                  handleShowFiles(selectedPerson);
                } else {
                  alert("الرجاء تحديد شخص أولاً");
                }
              }}
            >
              <FileText size={20} />
              عرض ملفات الشخص المحدد
            </button>

            <button
              className="bg-purple-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-purple-700 transition-colors"
              onClick={handleShowSmsReport}
            >
              <BarChart size={20} />
              تقرير الرسائل النصية
            </button>
          </div>
        </div>
      </div>

      {isEditDialogOpen && selectedPerson && (
        <EditPersonDialog
          person={selectedPerson}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditDialogOpen(false)}
        />
      )}

      {bulkStatusUpdateOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">
                تحديث حالة الأشخاص المحددين
              </h2>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة الجديدة
                </label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="تم الاستلام">تم الاستلام</option>
                  <option value="تم الإرسال">تم الإرسال</option>
                  <option value="تم الاستلام في الخارجية">
                    تم الاستلام في الخارجية
                  </option>
                  <option value="تم الإرسال من الخارجية">
                    تم الإرسال من الخارجية
                  </option>
                  <option value="جاهز">جاهز</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setBulkStatusUpdateOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBulkStatusUpdate}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  تحديث الحالة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFilesDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">
                <span className="flex items-center gap-2">
                  <Folder size={20} />
                  ملفات: {currentPersonName}
                </span>
              </h2>
              <button
                onClick={() => setShowFilesDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {currentPersonFiles.length > 0 ? (
                <div className="space-y-2">
                  {currentPersonFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const files = await fileStorage.getPersonFiles(
                                currentPersonName
                              );
                              const fileData = files.find(
                                (f: FileInfo) => f.name === file.name
                              );

                              if (fileData) {
                                // Convert base64 to blob
                                const byteString = atob(
                                  fileData.data.split(",")[1]
                                );
                                const mimeString = fileData.data
                                  .split(",")[0]
                                  .split(":")[1]
                                  .split(";")[0];
                                const ab = new ArrayBuffer(byteString.length);
                                const ia = new Uint8Array(ab);

                                for (let i = 0; i < byteString.length; i++) {
                                  ia[i] = byteString.charCodeAt(i);
                                }

                                const blob = new Blob([ab], {
                                  type: mimeString,
                                });
                                const url = URL.createObjectURL(blob);

                                const link = document.createElement("a");
                                link.href = url;
                                link.download = file.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);

                                URL.revokeObjectURL(url);
                              } else {
                                setNotification({
                                  type: "error",
                                  message: "لم يتم العثور على الملف",
                                });
                              }
                            } catch (error) {
                              setNotification({
                                type: "error",
                                message: "حدث خطأ أثناء تحميل الملف",
                              });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد ملفات لهذا الشخص
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setShowFilesDialog(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {showSmsReportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">
                <span className="flex items-center gap-2">
                  <BarChart size={20} />
                  تقرير الرسائل النصية
                </span>
              </h2>
              <button
                onClick={() => setShowSmsReportDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={smsFilters.phoneNumber}
                    onChange={(e) =>
                      setSmsFilters((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="ابحث برقم الهاتف"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={smsFilters.date}
                    onChange={(e) =>
                      setSmsFilters((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    حالة الإرسال
                  </label>
                  <select
                    value={smsFilters.status}
                    onChange={(e) =>
                      setSmsFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">الكل</option>
                    <option value="sent">تم الإرسال</option>
                    <option value="failed">فشل الإرسال</option>
                    <option value="duplicate">مكررة</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    حالة التسليم
                  </label>
                  <select
                    value={smsFilters.deliveryStatus}
                    onChange={(e) =>
                      setSmsFilters((prev) => ({
                        ...prev,
                        deliveryStatus: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">الكل</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="failed">لم يتم التسليم</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleFilterSms}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    تصفية
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </div>

              {filteredSmsHistory.length > 0 ? (
                <div
                  className="overflow-x-auto"
                  style={{ maxHeight: "60vh", overflowY: "auto" }}
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          المرسل
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          رقم الهاتف
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          الرسالة
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          الحالة
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          حالة التسليم
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          التاريخ
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSmsHistory.map((message, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {message.from}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {message.to}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {message.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                message.status === "sent"
                                  ? "bg-green-100 text-green-800"
                                  : message.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : message.status === "duplicate"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {message.status === "sent"
                                ? "تم الإرسال"
                                : message.status === "failed"
                                ? "فشل الإرسال"
                                : message.status === "duplicate"
                                ? "مكررة"
                                : "خطأ"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                message.deliveryStatus === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {message.deliveryStatus === "delivered"
                                ? "تم التسليم"
                                : "لم يتم التسليم"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(message.sentAt).toLocaleString("ar-SA")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleDeleteSmsMessage(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد رسائل نصية تطابق معايير البحث
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-500">
                إجمالي الرسائل: {filteredSmsHistory.length}
              </div>
              <button
                onClick={handleExportSmsReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
                disabled={filteredSmsHistory.length === 0}
              >
                <Download size={20} />
                تصدير التقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
