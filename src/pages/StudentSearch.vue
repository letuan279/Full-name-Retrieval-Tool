<script setup>
import "@/assets/StudentSearch.css";
import {
  ref,
  computed,
  onMounted,
  onBeforeMount,
  nextTick,
  watch,
  reactive,
} from "vue";

// Notification System - Using Global Store
import { useNotificationStore } from "@/stores/NotificationStore";
const notificationStore = useNotificationStore();
const {
  showSuccess,
  showError,
  showInfo,
  showConfirm,
  handleConfirmResponse,
  notifications,
  confirmModal,
} = notificationStore;

// Service import
import textRetrievalTool from "@/services/fullnameRetrieval";
import clientInput from "@/services/clientInput";
import { findBestMatch } from "@/services/textCompare";

// Store import
import { useStudentSearchStore } from "@/stores/StudentSearch";
const studentSearchStore = useStudentSearchStore();

// Component imports
import Sidebar from "@/components/Sidebar.vue";
import StudentInfoInputModal from "@/components/StudentInfoInputModal.vue";
import StudentSearchModal from "@/components/StudentSearchModal.vue";
import StudentDataTable from "@/components/StudentDataTable.vue";

// Modal handle
const showStudentInfoInputModal = ref(false);
const togglePopupStudentInfo = () => {
  showStudentInfoInputModal.value = !showStudentInfoInputModal.value;
};
const showStudentSearchModal = ref(false);
const togglePopupStudentSearch = () => {
  showStudentSearchModal.value = !showStudentSearchModal.value;
};
const currentSearchStudent = ref(null);
const handleSetCurrentStudent = (event) => {
  const currentStudentId = event.currentTarget.getAttribute("data-id");
  currentSearchStudent.value = tableData.value.find(
    (item) => item.id === parseInt(currentStudentId)
  );
  togglePopupStudentSearch();
};
const handleSearchChooseStudent = (student) => {
  tableData.value.forEach((item) => {
    if (item.id === currentSearchStudent.value.id) {
      item.studentInfo = [student];
    }
  });

  // Change UI
  // Get current table row by data-id
  handleChangeUI(currentSearchStudent.value.id);

  togglePopupStudentSearch();
};

// Refs
const theme = ref(
  Array.from(["dark", "light"]).includes(localStorage.getItem("theme"))
    ? localStorage.getItem("theme")
    : "light"
);
const tableData = ref(studentSearchStore.tableData);
const isExtractingName = ref(false);
const activeView = ref("student-table"); // "transaction-table" or "student-table"

// Computed
const numOfNullName = computed(() => {
  return tableData.value.filter((item) => item.name === "NULL").length || 0;
});
const numOfErrorName = computed(() => {
  return tableData.value.filter((item) => item.name === "ERROR").length || 0;
});
const numOfExtractedName = computed(() => {
  return (
    tableData.value.filter(
      (item) => item.name !== "NULL" && item.name !== "ERROR"
    ).length || 0
  );
});
const numOfManyStudentInfo = computed(() => {
  return (
    tableData.value.filter((item) => item.studentInfo.length > 1).length || 0
  );
});
const numOfOneStudentInfo = computed(() => {
  return (
    tableData.value.filter((item) => item.studentInfo.length === 1).length || 0
  );
});
const numOfNoStudentInfo = computed(() => {
  return (
    tableData.value.filter((item) => item.studentInfo.length === 0).length || 0
  );
});

// Handle main action
const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
  document.documentElement.setAttribute("data-theme", theme.value);
};

const handleMessageInput = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text.trim() === "") {
      showError("Clipboard is empty");
      return;
    }
    const preCheckData = clientInput.getMessageInputExcel(text);

    const emptyMessage = preCheckData.find((item) => item.message === "");
    if (emptyMessage) {
      showError("Có tồn tại tin nhắn trống, vui lòng kiểm tra lại");
      return;
    }

    const confirmed = await showConfirm(
      `Đã tìm thấy ${preCheckData.length} tin nhắn, bạn có muốn tiếp tục?`,
      "Xác nhận nhập tin nhắn"
    );
    if (confirmed) {
      tableData.value = preCheckData;
      showSuccess(`Đã nhập thành công ${preCheckData.length} tin nhắn`);
    }
  } catch (error) {
    showError("Có lỗi xảy ra khi đọc dữ liệu");
    console.log(error);
  }
};

const handleExtractName = async () => {
  if (isExtractingName.value) {
    return;
  }

  if (tableData.value.length === 0) {
    showError("Không có dữ liệu tin nhắn để trích xuất");
    return;
  }

  if (
    numOfExtractedName.value > 0 ||
    numOfErrorName.value > 0 ||
    numOfNullName.value > 0
  ) {
    const confirmExtract = await showConfirm(
      "Đang có các dữ liệu tên đã được trích xuất, bạn có muốn tiếp tục?",
      "Xác nhận trích xuất lại"
    );
    if (!confirmExtract) {
      return;
    }
  }

  isExtractingName.value = true;
  handleClearExtractedInfo();

  const messages = textRetrievalTool.processMessagesWithId(tableData.value);
  for (let i = 0; i < messages.length; i += 10) {
    const batch = messages.slice(i, i + 10);
    const response = await textRetrievalTool.callApiWithRetries(
      JSON.stringify(batch)
    );
    handleAddDataToTable(response.results);
    textRetrievalTool.changeAPIKeyAndModel();

    // Log progress
    console.log(
      `Processed ${Math.min(i + 10, messages.length)} out of ${
        messages.length
      } messages`
    );
  }

  isExtractingName.value = false;
  findBestMatchInWholeTable();
  showSuccess(`Đã trích xuất xong ${messages.length} tin nhắn!`);
};

const handleAddDataToTable = (data) => {
  tableData.value = tableData.value.map((item) => {
    const found = data.find((result) => result.id === item.id);
    if (found) {
      // Add to extracted name column
      item.name = found.fullName.toUpperCase();
    }
    // Add to student info column
    item.studentInfo = studentSearchStore.getStudentInfoByName(item.name);
    return item;
  });
};

const handleClearExtractedInfo = () => {
  tableData.value = tableData.value.map((item) => {
    item.studentInfo = [];
    item.name = "";
    item.bestMatchStudentIndex = null;
    return item;
  });
};

const handleChooseStudent = (event, row, chooseStudent) => {
  const tableElement = document.querySelector(".table");
  const rowElement = event.currentTarget;
  const initialScrollTop = tableElement.scrollTop;
  const initialRowOffsetTop = rowElement.offsetTop;

  tableData.value.forEach((item) => {
    if (item.id === row.id) {
      item.studentInfo = [chooseStudent];
    }
  });

  // Change UI
  // Get current table row by data-id
  handleChangeUI(row.id);

  nextTick(() => {
    const newRowOffsetTop = rowElement.offsetTop;
    const scrollDifference = newRowOffsetTop - initialRowOffsetTop;
    tableElement.scrollTop = initialScrollTop + scrollDifference;
  });
};

const handleDeleteOneStudent = (tableDataElementId) => {
  tableData.value.forEach((item) => {
    if (item.id === tableDataElementId) {
      item.studentInfo = [];
    }
  });

  handleChangeUI(tableDataElementId, "var(--color-delete-row-bg)");
};

const handleChangeUI = (
  tableDataElementId,
  backgroundColor = "var(--color-add-row-bg)"
) => {
  const currentTableRows = document.querySelector(
    `.table-row[data-id="${tableDataElementId}"]`
  );

  const oldBackgroundColor = currentTableRows.style.backgroundColor;
  const oldColor = currentTableRows.style.color;
  currentTableRows.style.backgroundColor = backgroundColor;
  currentTableRows.style.color = "var(--color-heading)";
  setTimeout(() => {
    currentTableRows.style.backgroundColor = oldBackgroundColor;
    currentTableRows.style.color = oldColor;
  }, 1000);
};

const handleExportData = () => {
  if (tableData.value.length === 0) {
    showError("Không có dữ liệu để xuất");
    return;
  }

  // if (numOfNoStudentInfo.value > 0) {
  //   alert("Có tin nhắn chưa có thông tin sinh viên, vui lòng kiểm tra lại");
  //   return;
  // }

  if (numOfManyStudentInfo.value > 0) {
    showError(
      "Có tin nhắn có nhiều thông tin sinh viên, vui lòng kiểm tra lại"
    );
    return;
  }

  try {
    let rawExcelData = "";
    tableData.value.forEach((item) => {
      rawExcelData += `${item.studentInfo[0]?.maHoXo || ""}\t${
        item.studentInfo[0]?.hoTen || ""
      }\t${item.studentInfo[0]?.ngaySinh || ""}\t${
        item.studentInfo[0]?.nganh || ""
      }\n`;
    });

    navigator.clipboard.writeText(rawExcelData).then(() => {
      showSuccess("Dữ liệu đã được sao chép vào clipboard");
    });
  } catch (error) {
    showError(`Lỗi xuất dữ liệu: ${error.message}`);
  }
};

const loadTableData = () => {
  tableData.value = localStorage.getItem("tableData")
    ? JSON.parse(localStorage.getItem("tableData"))
    : [];
};

const storeTableData = () => {
  localStorage.setItem("tableData", JSON.stringify(tableData.value));
};

const findBestMatchInWholeTable = () => {
  tableData.value.forEach((item) => {
    if (item.studentInfo.length >= 2) {
      const mainString = item.message;
      const targetStrings = item.studentInfo.map((student) => {
        return (
          student.maHoXo + student.hoTen + student.ngaySinh + student.nganh
        );
      });
      item.bestMatchStudentIndex = findBestMatch(mainString, targetStrings);
    }
  });
};

// Handle tab switching from sidebar
const handleTabChange = (tabName) => {
  if (tabName === "student-data") {
    activeView.value = "student-table";
  } else if (tabName === "name-extraction") {
    activeView.value = "transaction-table";
  }
};

// Load data from local
onMounted(() => {
  try {
    studentSearchStore.loadStudentInfo();
    () => {
      setTimeout(() => {
        findBestMatchInWholeTable();
      }, 0);
    };
  } catch (error) {
    showError(`Lỗi khi khởi động: ${error.message}`);
  }
});

onBeforeMount(() => {
  try {
    // Load theme
    document.documentElement.setAttribute("data-theme", theme.value);
    loadTableData();
  } catch (error) {
    showError(`Lỗi tải theme: ${error.message}`);
  }
});

watch(
  tableData,
  () => {
    setTimeout(() => {
      storeTableData();
    }, 0);
  },
  { deep: true }
);
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <Sidebar
      :isExtractingName="isExtractingName"
      :tableData="tableData"
      :onMessageInput="handleMessageInput"
      :onExtractName="handleExtractName"
      :onExportData="handleExportData"
      :onTabChange="handleTabChange"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <div class="main-header">
        <h1 class="main-title">
          {{
            activeView === "student-table"
              ? "👨‍🎓 Bảng Dữ Liệu Sinh Viên"
              : "📊 Bảng Dữ Liệu Giao Dịch"
          }}
        </h1>
        <button id="theme-toggle-btn" @click="toggleTheme" class="theme-toggle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor"
          >
            <path
              d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor"
          >
            <path
              d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"
            />
          </svg>
        </button>
      </div>

      <!-- Student Data Table -->
      <div v-if="activeView === 'student-table'" class="content-wrapper">
        <StudentDataTable />
      </div>

      <!-- Transaction Data Table -->
      <div v-if="activeView === 'transaction-table'" class="content-wrapper">
        <div class="table-container">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="row-stt">STT</th>
                  <th class="row-date">Ngày hiệu lực</th>
                  <th class="row-money">Ghi có</th>
                  <th class="row-message">
                    Mô tả giao dịch <br />{{ `${tableData.length} 💬` }}
                  </th>
                  <th class="row-name-retrieve">
                    Tên trích xuất<br />{{
                      `${numOfExtractedName} ✅ | ${numOfNullName} ⚠️ | ${numOfErrorName} 🚫`
                    }}
                  </th>
                  <th class="row-student">
                    Thông tin sinh viên<br />{{
                      `${numOfOneStudentInfo} 🙋🏻‍♂️ | ${numOfManyStudentInfo} 👨🏻‍👩🏻‍👦🏻‍👦🏻 | ${numOfNoStudentInfo} 👤`
                    }}
                  </th>
                  <th class="row-search">👁️‍🗨️</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  class="table-row"
                  v-for="(data, index) in tableData"
                  :key="index + 'y'"
                  :data-id="data.id"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ data.date }}</td>
                  <td>{{ data.money }}</td>
                  <td class="row-message-body">{{ data.message }}</td>
                  <td>{{ data.name }}</td>
                  <td>
                    <div class="student-box">
                      <div v-if="data.studentInfo.length === 0">
                        <div class="student-no-item">
                          <span>Bỏ trống hoặc không tìm thấy</span>
                        </div>
                      </div>

                      <div
                        class="student-one-item-box"
                        v-if="data.studentInfo.length === 1"
                      >
                        <div class="student-one-item">
                          <span>{{ data.studentInfo[0].maHoXo }}</span>
                          <span>{{ data.studentInfo[0].hoTen }}</span>
                          <span>{{ data.studentInfo[0].ngaySinh }}</span>
                          <span>{{ data.studentInfo[0].nganh }}</span>
                        </div>
                        <button
                          class="delete-one-student"
                          @click="handleDeleteOneStudent(data.id)"
                        >
                          ❌
                        </button>
                      </div>

                      <div
                        class="student-box-item"
                        v-if="data.studentInfo.length > 1"
                        v-for="(student, i) in data.studentInfo"
                        @click="handleChooseStudent($event, data, student)"
                        :class="{
                          'student-box-item--highlight':
                            data.bestMatchStudentIndex === i,
                        }"
                        :key="i + 'z'"
                      >
                        <span>{{ student.maHoXo }}</span>
                        <span>{{ student.hoTen }}</span>
                        <span>{{ student.ngaySinh }}</span>
                        <span>{{ student.nganh }}</span>
                      </div>
                    </div>
                  </td>
                  <td
                    :data-id="data.id"
                    class="student-search"
                    @click="handleSetCurrentStudent($event)"
                  >
                    🔍
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="tableData.length === 0" class="empty-state">
          <div class="empty-state-content">
            <h3>📭 Chưa có dữ liệu</h3>
            <p>Vui lòng nhập dữ liệu tin nhắn từ sidebar để bắt đầu</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <StudentSearchModal
      v-if="showStudentSearchModal"
      :TogglePopup="togglePopupStudentSearch"
      :CurrentSearchStudent="currentSearchStudent"
      :handleSearchChooseStudent="handleSearchChooseStudent"
    />

    <!-- Loading Spinner -->
    <div class="spinner-overlay" v-if="isExtractingName">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--color-background, #ffffff);
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 24px 24px;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--color-background, #ffffff);
  border-bottom: 1px solid var(--color-border, #e9ecef);
}

.main-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-heading, #1a1a1a);
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-background-soft, #f8f9fa);
  border: 1px solid var(--color-border, #e9ecef);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text, #6c757d);
}

.theme-toggle:hover {
  background: var(--color-border, #e9ecef);
  color: var(--color-heading, #1a1a1a);
}

.theme-toggle svg {
  width: 20px;
  height: 20px;
}

[data-theme="dark"] .theme-toggle svg:first-child {
  display: none;
}

[data-theme="light"] .theme-toggle svg:last-child {
  display: none;
}

.table-container {
  flex: 1;
  overflow: hidden;
}

.table-wrapper {
  height: 100%;
  overflow: auto;
  background: var(--color-background, #ffffff);
  border: 1px solid var(--color-border, #e9ecef);
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border, #e9ecef);
  vertical-align: top;
}

.data-table th {
  background: var(--color-background-soft, #f8f9fa);
  font-weight: 600;
  color: var(--color-heading, #1a1a1a);
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tbody tr:hover {
  background: var(--color-background-soft, #f8f9fa);
}

.row-stt {
  width: 60px;
  text-align: center;
}

.row-date {
  width: 120px;
}

.row-money {
  width: 120px;
}

.row-message {
  min-width: 200px;
  max-width: 300px;
}

.row-name-retrieve {
  width: 150px;
}

.row-student {
  min-width: 250px;
}

.row-search {
  width: 60px;
  text-align: center;
}

.row-message-body {
  word-wrap: break-word;
  white-space: pre-wrap;
  max-width: 300px;
}

.student-box {
  min-height: 40px;
}

.student-no-item {
  color: var(--color-text, #6c757d);
  font-style: italic;
  padding: 8px 0;
}

.student-one-item-box {
  position: relative;
  background: var(--color-background-soft, #f8f9fa);
  border: 1px solid var(--color-border, #e9ecef);
  border-radius: 4px;
  padding: 8px;
}

.student-one-item {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  font-size: 12px;
}

.student-one-item span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-one-student {
  position: absolute;
  top: 4px;
  right: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.delete-one-student:hover {
  background: rgba(239, 68, 68, 0.1);
}

.student-box-item {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
  margin: 2px 0;
  background: var(--color-background-soft, #f8f9fa);
  border: 1px solid var(--color-border, #e9ecef);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.student-box-item:hover {
  background: var(--color-primary, #3b82f6);
  color: white;
  transform: translateX(2px);
}

.student-box-item--highlight {
  background: #10b981;
  color: white;
  border-color: #059669;
}

.student-box-item span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-search {
  text-align: center;
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s ease;
}

.student-search:hover {
  transform: scale(1.2);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-state-content {
  text-align: center;
  color: var(--color-text, #6c757d);
}

.empty-state-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--color-heading, #1a1a1a);
}

.empty-state-content p {
  margin: 0;
  font-size: 14px;
}

.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-background-soft, #f8f9fa);
  border-top: 4px solid var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Scrollbar styling */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: var(--color-background-soft, #f8f9fa);
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: var(--color-border, #e9ecef);
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--color-text, #6c757d);
}

/* Dark theme adjustments */
[data-theme="dark"] .data-table tbody tr:hover {
  background: var(--color-background-mute);
}

[data-theme="dark"] .student-box-item:hover {
  background: var(--color-primary);
  color: white;
  transform: translateX(2px);
}

[data-theme="dark"] .student-box-item--highlight {
  background: var(--color-success);
  color: white;
  border-color: #059669;
}

[data-theme="dark"] .student-one-item-box {
  background: var(--color-background-mute);
  border-color: var(--color-border);
}

[data-theme="dark"] .delete-one-student:hover {
  background: rgba(239, 68, 68, 0.2);
}

[data-theme="dark"] .spinner {
  border-color: var(--color-border);
  border-top-color: var(--color-primary);
}

[data-theme="dark"] .spinner-overlay {
  background: rgba(15, 23, 42, 0.8);
}

[data-theme="dark"] .table-wrapper::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

[data-theme="dark"] .table-wrapper::-webkit-scrollbar-thumb {
  background: var(--color-border);
}

[data-theme="dark"] .table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-light);
}

/* Responsive design */
@media (max-width: 1024px) {
  .app-layout {
    flex-direction: column;
  }

  .main-header {
    padding: 16px;
  }

  .main-title {
    font-size: 20px;
  }

  .table-container {
    padding: 0 16px 16px;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
  }
}

@media (max-width: 768px) {
  .main-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .data-table {
    font-size: 11px;
  }

  .row-message {
    min-width: 150px;
    max-width: 200px;
  }

  .student-one-item,
  .student-box-item {
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }
}
</style>
