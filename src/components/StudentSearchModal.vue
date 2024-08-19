<script setup>
defineProps([
  "TogglePopup",
  "CurrentSearchStudent",
  "handleSearchChooseStudent",
]);

import khongDau from "khong-dau";
import { ref } from "vue";

import { useStudentSearchStore } from "@/stores/StudentSearch";
const studentSearchStore = useStudentSearchStore();

const studentSearchData = ref(studentSearchStore.studentInfo);
const searchText = ref("");
const searchDataFilter = ref(studentSearchData.value);

const handleFilter = () => {
  const searchValue = searchText.value.trim();
  searchDataFilter.value = studentSearchData.value.filter((student) => {
    return (
      student.maHoXo.includes(searchValue) ||
      student.hoTen.includes(searchValue) ||
      student.ngaySinh.includes(searchValue) ||
      student.nganh.includes(searchValue) ||
      khongDau(student.hoTen)
        .toUpperCase()
        .includes(khongDau(searchValue).toUpperCase())
    );
  });
};
</script>

<template>
  <div class="popup">
    <div class="popup-inner">
      <button class="popup-close" @click="TogglePopup()">❌</button>
      <h2 class="popup-heading">🔍Tìm kiếm sinh viên🔍</h2>
      <div class="current-message">
        {{ CurrentSearchStudent.message }}
      </div>
      <input
        type="text"
        class="student-search-bar"
        placeholder="Tìm kiếm bằng bất cứ trường thông tin nào, kể cả không dấu, viết thường"
        v-model="searchText"
        @keyup.enter="handleFilter"
      />
      <table class="student-result">
        <tr>
          <th>Mã</th>
          <th>Họ tên</th>
          <th>Ngày sinh</th>
          <th>Ngành</th>
        </tr>

        <tr
          v-for="(student, i) in searchDataFilter"
          class="student-box-item"
          :key="i + 'h'"
          @click="handleSearchChooseStudent(student)"
        >
          <td>{{ student.maHoXo }}</td>
          <td>{{ student.hoTen }}</td>
          <td>{{ student.ngaySinh }}</td>
          <td>{{ student.nganh }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style scoped>
.popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  background-color: rgba(0, 0, 0, 0.2);
  height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-inner {
  position: relative;
  background: #fff;
  width: 60%;
  height: fit-content;
  padding: 12px 32px;
  border-radius: 10px;
}

.popup-heading {
  font-weight: bold;
  text-align: center;
  font-size: 40px;
}

.popup-close {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0;
  background: transparent;
  color: #fff;
  font-size: 20px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.popup-close:hover {
  transform: scale(1.2);
}

.current-message {
  border: 1px solid #000;
  padding: 2px 3px;
  margin-top: 5px;
  font-weight: 500;
}

.student-search-bar {
  display: block;
  width: 80%;
  margin: 12px auto;
  padding: 5px 10px;
  border-radius: 10px;
}

.student-result {
  display: ruby-text;
  width: 100%;
  height: 450px;
  overflow-y: auto;
  border-collapse: collapse;
  margin-top: 10px;
}

.student-result th {
  background-color: #f2f2f2;
  font-weight: bold;
  position: sticky;
  top: 0;
}

.student-result th,
.student-result td {
  border: 1px solid #000;
  padding: 8px;
  text-align: center;
}

.student-box-item:hover {
  cursor: pointer;
  background: #f7fee7;
  text-decoration: underline;
}
</style>
