<script setup>
defineProps(["TogglePopup"]);

import "@/assets/StudentInfoInputModal.css";

import { useStudentSearchStore } from "@/stores/StudentSearch";
import { ref, reactive } from "vue";
import { MESSAGE_TYPES } from "@/config/constants";

const studentSearchStore = useStudentSearchStore();

// Notification System - Using Global Store
import { useNotificationStore } from "@/stores/NotificationStore";
const notificationStore = useNotificationStore();
const {
  showSuccess,
  showError,
  showConfirm,
  handleConfirmResponse,
  notifications,
  confirmModal,
} = notificationStore;

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
/* Component specific styles */
</style>
