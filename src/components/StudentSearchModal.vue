<script setup>
defineProps([
  "TogglePopup",
  "CurrentSearchStudent",
  "handleSearchChooseStudent",
]);

import "@/assets/StudentSearchModal.css";
import khongDau from "@/utils/khongDau";

import { ref, watch, computed } from "vue";

import { useStudentSearchStore } from "@/stores/StudentSearch";
const studentSearchStore = useStudentSearchStore();

// Ref
const studentSearchData = ref(studentSearchStore.studentInfo);
const searchText = ref("");
const searchDataFilter = ref(studentSearchData.value);
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Computed
const totalPages = computed(() => {
  return Math.ceil(searchDataFilter.value.length / itemsPerPage.value);
});
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return searchDataFilter.value.slice(start, end);
});

// Handle action
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
  currentPage.value = 1;
};

// Implement search realtime each 200ms
let timer = null;
watch(searchText, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    handleFilter();
  }, 200);
});
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
      <div class="student-result">
        <table>
          <tr>
            <th>STT</th>
            <th>Mã</th>
            <th>Họ tên</th>
            <th>Ngày sinh</th>
            <th>Ngành</th>
          </tr>

          <tr
            v-for="(student, i) in paginatedData"
            class="student-box-item"
            :key="i + 'h'"
            @click="handleSearchChooseStudent(student)"
          >
            <td>{{ i + 1 + (currentPage - 1) * itemsPerPage }}</td>
            <td>{{ student.maHoXo }}</td>
            <td>{{ student.hoTen }}</td>
            <td>{{ student.ngaySinh }}</td>
            <td>{{ student.nganh }}</td>
          </tr>
        </table>
      </div>
      <div class="pagination">
        <button
          class="pagination-btn"
          @click="currentPage--"
          :disabled="currentPage === 1"
        >
          ◀
        </button>
        <span class="pagination-text"
          >Trang thứ {{ currentPage }} / {{ totalPages }}</span
        >
        <button
          class="pagination-btn"
          @click="currentPage++"
          :disabled="currentPage === totalPages"
        >
          ▶
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
