<script setup>
defineProps(["TogglePopup"]);

import "@/assets/StudentInfoInputModal.css";

import { useStudentSearchStore } from "@/stores/StudentSearch";
import { ref, reactive } from "vue";
import { MESSAGE_TYPES } from "@/config/constants";

const studentSearchStore = useStudentSearchStore();

// Notification System (temporary inline implementation)
const notifications = ref([]);
const confirmModal = reactive({
  show: false,
  title: "",
  message: "",
  confirmText: "Xác nhận",
  cancelText: "Hủy",
  resolve: null,
});

let notificationId = 0;

const showSuccess = (message) => {
  const id = ++notificationId;
  const notification = {
    id,
    message,
    type: "success",
    show: true,
  };
  notifications.value.push(notification);
  setTimeout(() => removeNotification(id), 5000);
};

const showError = (message) => {
  const id = ++notificationId;
  const notification = {
    id,
    message,
    type: "error",
    show: true,
  };
  notifications.value.push(notification);
  setTimeout(() => removeNotification(id), 8000);
};

const removeNotification = (id) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index > -1) notifications.value.splice(index, 1);
};

const showConfirm = (message, title = "Xác nhận") => {
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

const handleInfoInput = async () => {
  try {
    const text = await navigator.clipboard.readText();
    const studentCount = text.split("\n").length - 1;

    const confirmed = await showConfirm(
      `Bạn có chắc chắn muốn nhập ${studentCount} sinh viên?`,
      "Xác nhận nhập sinh viên"
    );

    if (!confirmed) return;

    studentSearchStore.setStudentInfo(text);
    showSuccess(
      `Đã nhập thành công ${studentSearchStore.studentInfo.length} sinh viên`
    );
  } catch (error) {
    showError(`Lỗi đọc dữ liệu: ${error.message}`);
    console.log(error.message);
  }
};

const handleAddStudent = async () => {
  try {
    const text = await navigator.clipboard.readText();
    const studentCount = text.split("\n").length - 1;

    const confirmed = await showConfirm(
      `Bạn có chắc chắn muốn thêm ${studentCount} sinh viên?`,
      "Xác nhận thêm sinh viên"
    );

    if (!confirmed) return;

    studentSearchStore.addMoreStudentInfo(text);
    showSuccess(
      `Đã thêm thành công, hiện đang có ${studentSearchStore.studentInfo.length} sinh viên`
    );
  } catch (error) {
    showError(`Lỗi đọc dữ liệu: ${error.message}`);
    console.log(error.message);
  }
};
</script>

<template>
  <!-- Notification Container -->
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
        <button
          class="toast-close"
          @click.stop="removeNotification(notification.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>

  <!-- Confirm Modal -->
  <div
    v-if="confirmModal.show"
    class="modal-overlay"
    @click="handleConfirmResponse(false)"
  >
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

  <div class="popup">
    <div class="popup-inner">
      <button class="popup-close" @click="TogglePopup()">❌</button>
      <h2 class="popup-heading">
        Thông tin sinh viên ({{ studentSearchStore.studentInfo.length }})
      </h2>
      <div class="student-table">
        <table>
          <tr>
            <th>STT</th>
            <th>Mã hồ sơ</th>
            <th>Họ tên</th>
            <th>Ngày sinh</th>
            <th>Ngành tuyển sinh</th>
          </tr>
          <tr
            v-for="(student, index) in studentSearchStore.studentInfo"
            :key="index + 'x'"
          >
            <td>{{ index + 1 }}</td>
            <td>{{ student.maHoXo }}</td>
            <td>{{ student.hoTen }}</td>
            <td>{{ student.ngaySinh }}</td>
            <td>{{ student.nganh }}</td>
          </tr>
        </table>
      </div>
      <div class="action">
        <button class="btn" @click="handleInfoInput">
          👨‍🎓 Nhập lại toàn bộ sv
        </button>
        <button class="btn" @click="handleAddStudent">✨ Thêm sv mới</button>
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
