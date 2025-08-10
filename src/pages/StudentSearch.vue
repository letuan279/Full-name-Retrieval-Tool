<script setup>
import "@/assets/StudentSearch.css";
import { ref, computed, onMounted, onBeforeMount, nextTick, watch, reactive } from "vue";

// Notification System (will be extracted to composable later)
const notifications = ref([]);
const confirmModal = reactive({
  show: false,
  title: '',
  message: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  resolve: null
});

let notificationId = 0;

const showSuccess = (message) => {
  const id = ++notificationId;
  notifications.value.push({
    id, message, type: 'success', show: true
  });
  setTimeout(() => removeNotification(id), 5000);
};

const showError = (message) => {
  const id = ++notificationId;
  notifications.value.push({
    id, message, type: 'error', show: true
  });
  setTimeout(() => removeNotification(id), 8000);
};

const showInfo = (message) => {
  const id = ++notificationId;
  notifications.value.push({
    id, message, type: 'info', show: true
  });
  setTimeout(() => removeNotification(id), 5000);
};

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) notifications.value.splice(index, 1);
};

const showConfirm = (message, title = 'Xác nhận') => {
  return new Promise((resolve) => {
    confirmModal.show = true;
    confirmModal.title = title;
    confirmModal.message = message;
    confirmModal.resolve = resolve;
  });
};

const handleConfirmResponse = (confirmed) => {
  if (confirmModal.resolve) {
    confirmModal.resolve(confirmed);
  }
  confirmModal.show = false;
  confirmModal.resolve = null;
};

// Service import
import textRetrievalTool from "@/services/fullnameRetrieval";
import clientInput from "@/services/clientInput";
import { findBestMatch } from "@/services/textCompare";

// Store import
import { useStudentSearchStore } from "@/stores/StudentSearch";
const studentSearchStore = useStudentSearchStore();

// Modal handle
import StudentInfoInputModal from "@/components/StudentInfoInputModal.vue";
const showStudentInfoInputModal = ref(false);
const togglePopupStudentInfo = () => {
  showStudentInfoInputModal.value = !showStudentInfoInputModal.value;
};
import StudentSearchModal from "@/components/StudentSearchModal.vue";
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
      'Xác nhận nhập tin nhắn'
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
    showError("Có tin nhắn có nhiều thông tin sinh viên, vui lòng kiểm tra lại");
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
  <div class="container">
    <div class="panel">
      <h2 class="panel-heading">⚙️ Bảng điều khiển ⚙️</h2>
      <div class="panel-btn">
        <button @click="togglePopupStudentInfo">
          ✍🏻 Nhập dữ liệu sinh viên
        </button>
        <button @click="handleMessageInput">📨 Nhập dữ liệu tin nhắn</button>
        <button @click="handleExtractName">⚗️ Trích xuất tên</button>
        <button @click="handleExportData">💾 Xuất dữ liệu</button>
        <button id="theme-toggle-btn" @click="toggleTheme">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#000000"
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
            fill="#000000"
          >
            <path
              d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"
            />
          </svg>
        </button>
      </div>
    </div>
    <div class="content">
      <div class="table">
        <table>
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
                    <td>Bỏ trống hoặc không tìm thấy</td>
                  </div>
                </div>

                <div
                  class="student-one-item-box"
                  v-if="data.studentInfo.length === 1"
                >
                  <div class="student-one-item">
                    <td>{{ data.studentInfo[0].maHoXo }}</td>
                    <td>{{ data.studentInfo[0].hoTen }}</td>
                    <td>{{ data.studentInfo[0].ngaySinh }}</td>
                    <td>{{ data.studentInfo[0].nganh }}</td>
                  </div>
                  <button
                    class="delete-one-student"
                    @click="handleDeleteOneStudent(data.id)"
                  >
                    ❌
                  </button>
                </div>

                <tr
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
                  <td>{{ student.maHoXo }}</td>
                  <td>{{ student.hoTen }}</td>
                  <td>{{ student.ngaySinh }}</td>
                  <td>{{ student.nganh }}</td>
                </tr>
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
        </table>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <StudentInfoInputModal
    v-if="showStudentInfoInputModal"
    :TogglePopup="togglePopupStudentInfo"
  >
  </StudentInfoInputModal>
  <StudentSearchModal
    v-if="showStudentSearchModal"
    :TogglePopup="togglePopupStudentSearch"
    :CurrentSearchStudent="currentSearchStudent"
    :handleSearchChooseStudent="handleSearchChooseStudent"
  >
  </StudentSearchModal>

  <!-- Spinner -->
  <div class="spinner" v-if="isExtractingName"></div>

  <!-- Notification System -->
  <div class="notification-container">
    <div 
      v-for="notification in notifications" 
      :key="notification.id"
      :class="['toast', `toast--${notification.type}`]"
      @click="removeNotification(notification.id)"
    >
      <div class="toast-content">
        <div class="toast-icon">
          <span v-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'error'">❌</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-message">{{ notification.message }}</div>
        <button class="toast-close" @click.stop="removeNotification(notification.id)">×</button>
      </div>
    </div>
  </div>

  <!-- Confirm Modal -->
  <div v-if="confirmModal.show" class="modal-overlay" @click="handleConfirmResponse(false)">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ confirmModal.title }}</h3>
      </div>
      <div class="modal-body">
        <p class="modal-message">{{ confirmModal.message }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleConfirmResponse(false)">
          {{ confirmModal.cancelText }}
        </button>
        <button class="btn btn-primary" @click="handleConfirmResponse(true)">
          {{ confirmModal.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Notification System Styles */
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  pointer-events: none;
}

.toast {
  min-width: 300px;
  max-width: 500px;
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.toast--success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.toast--error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.toast--warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.toast--info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.toast-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
  font-weight: 500;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  padding: 24px 24px 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-body {
  padding: 16px 24px 24px;
}

.modal-message {
  font-size: 16px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0;
}

.modal-footer {
  padding: 20px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

/* Dark theme support */
[data-theme="dark"] .toast {
  background: #1f2937;
  color: #f3f4f6;
}

[data-theme="dark"] .toast--success {
  background: #064e3b;
}

[data-theme="dark"] .toast--error {
  background: #7f1d1d;
}

[data-theme="dark"] .toast--warning {
  background: #78350f;
}

[data-theme="dark"] .toast--info {
  background: #1e3a8a;
}

[data-theme="dark"] .toast-message {
  color: #f3f4f6;
}

[data-theme="dark"] .modal-content {
  background: #1f2937;
  border: 1px solid #374151;
}

[data-theme="dark"] .modal-title {
  color: #f3f4f6;
}

[data-theme="dark"] .modal-message {
  color: #d1d5db;
}

[data-theme="dark"] .btn-secondary {
  background: #374151;
  color: #d1d5db;
}

[data-theme="dark"] .btn-secondary:hover {
  background: #4b5563;
}
</style>
