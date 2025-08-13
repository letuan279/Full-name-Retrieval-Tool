<script setup>
import { ref, computed, watch } from "vue";
import { useStudentSearchStore } from "@/stores/StudentSearch";
import { useNotificationStore } from "@/stores/NotificationStore";
import StudentEditModal from "./StudentEditModal.vue";

// Stores
const studentSearchStore = useStudentSearchStore();
const notificationStore = useNotificationStore();
const { showSuccess, showError, showConfirm, showInfo } = notificationStore;

// Refs
const currentPage = ref(1);
const itemsPerPage = ref(20);
const searchQuery = ref("");
const selectedStudents = ref(new Set());
const expandedRows = ref(new Set());
const sortField = ref("hoTen");
const sortDirection = ref("asc");
const isEditModalVisible = ref(false);
const editingStudent = ref(null);
const copyFormat = ref("tab");

// Computed
const filteredStudents = computed(() => {
  let students = [...studentSearchStore.studentInfo];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    students = students.filter(
      (student) =>
        student.hoTen.toLowerCase().includes(query) ||
        student.maHoXo.toLowerCase().includes(query) ||
        student.nganh.toLowerCase().includes(query) ||
        student.ngaySinh.includes(query)
    );
  }

  // Sort
  students.sort((a, b) => {
    const aValue = a[sortField.value]?.toString().toLowerCase() || "";
    const bValue = b[sortField.value]?.toString().toLowerCase() || "";

    if (sortDirection.value === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  return students;
});

const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / itemsPerPage.value);
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredStudents.value.slice(start, end);
});

const isAllSelected = computed(() => {
  return (
    paginatedStudents.value.length > 0 &&
    paginatedStudents.value.every((student) =>
      selectedStudents.value.has(student.id)
    )
  );
});

// Methods
const handleSort = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDirection.value = "asc";
  }
};

const toggleRowExpansion = (studentId) => {
  if (expandedRows.value.has(studentId)) {
    expandedRows.value.delete(studentId);
  } else {
    expandedRows.value.add(studentId);
  }
};

const toggleStudentSelection = (studentId) => {
  if (selectedStudents.value.has(studentId)) {
    selectedStudents.value.delete(studentId);
  } else {
    selectedStudents.value.add(studentId);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    paginatedStudents.value.forEach((student) => {
      selectedStudents.value.delete(student.id);
    });
  } else {
    paginatedStudents.value.forEach((student) => {
      selectedStudents.value.add(student.id);
    });
  }
};

const handleDeleteSelected = async () => {
  if (selectedStudents.value.size === 0) {
    showError("Chưa chọn sinh viên nào để xóa");
    return;
  }

  const confirmed = await showConfirm(
    `Bạn có chắc chắn muốn xóa ${selectedStudents.value.size} sinh viên đã chọn?`,
    "Xác nhận xóa sinh viên"
  );

  if (confirmed) {
    const selectedIds = Array.from(selectedStudents.value);
    studentSearchStore.studentInfo = studentSearchStore.studentInfo.filter(
      (student) => !selectedIds.includes(student.id)
    );
    selectedStudents.value.clear();
    showSuccess(`Đã xóa ${selectedIds.length} sinh viên`);
  }
};

const handleEditStudent = (student) => {
  editingStudent.value = { ...student };
  isEditModalVisible.value = true;
};

const closeEditModal = () => {
  isEditModalVisible.value = false;
  editingStudent.value = null;
};

const handleSaveStudent = (updatedStudent) => {
  const index = studentSearchStore.studentInfo.findIndex(
    (s) => s.id === updatedStudent.id
  );
  if (index !== -1) {
    // Update the student in the store
    studentSearchStore.studentInfo[index] = updatedStudent;

    // Store will automatically update due to watcher
    showSuccess(`Đã cập nhật thông tin sinh viên "${updatedStudent.hoTen}"`);
  }
};

const handleDeleteStudent = async (student) => {
  const confirmed = await showConfirm(
    `Bạn có chắc chắn muốn xóa sinh viên "${student.hoTen}"?`,
    "Xác nhận xóa sinh viên"
  );

  if (confirmed) {
    const index = studentSearchStore.studentInfo.findIndex(
      (s) => s.id === student.id
    );
    if (index !== -1) {
      studentSearchStore.studentInfo.splice(index, 1);
      // Remove from selected if was selected
      selectedStudents.value.delete(student.id);
      showSuccess(`Đã xóa sinh viên "${student.hoTen}"`);
    }
  }
};

// Copy functions
const copyStudentToClipboard = async (student, format = 'tab') => {
  try {
    let studentData = '';
    
    switch (format) {
      case 'tab':
        studentData = `${student.maHoXo}\t${student.hoTen}\t${student.ngaySinh}\t${student.nganh}\t${student.ghiChu || ''}`;
        break;
      case 'csv':
        studentData = `"${student.maHoXo}","${student.hoTen}","${student.ngaySinh}","${student.nganh}","${student.ghiChu || ''}"`;
        break;
      case 'json':
        studentData = JSON.stringify(student, null, 2);
        break;
      case 'detailed':
        studentData = `Mã Hồ Sơ: ${student.maHoXo}\nHọ Tên: ${student.hoTen}\nNgày Sinh: ${student.ngaySinh}\nNgành: ${student.nganh}\nGhi Chú: ${student.ghiChu || 'Không có'}`;
        break;
      case 'formatted':
        studentData = `┌─────────────────────────────────────┐\n│           THÔNG TIN SINH VIÊN        │\n├─────────────────────────────────────┤\n│ Mã Hồ Sơ: ${student.maHoXo.padEnd(20)} │\n│ Họ Tên:   ${student.hoTen.padEnd(20)} │\n│ Ngày Sinh: ${student.ngaySinh.padEnd(18)} │\n│ Ngành:    ${student.nganh.padEnd(20)} │\n│ Ghi Chú:  ${(student.ghiChu || 'Không có').padEnd(20)} │\n└─────────────────────────────────────┘`;
        break;
      default:
        studentData = `${student.maHoXo}\t${student.hoTen}\t${student.ngaySinh}\t${student.nganh}\t${student.ghiChu || ''}`;
    }
    
    await navigator.clipboard.writeText(studentData);
    showSuccess(`Đã copy thông tin sinh viên "${student.hoTen}" vào clipboard (${format.toUpperCase()})`);
  } catch (error) {
    showError("Không thể copy vào clipboard");
    console.error("Copy error:", error);
  }
};

const copySelectedStudentsToClipboard = async (format = 'tab') => {
  if (selectedStudents.value.size === 0) {
    showError("Chưa chọn sinh viên nào để copy");
    return;
  }

  try {
    let clipboardData = '';
    
    const selectedStudentsList = studentSearchStore.studentInfo.filter(
      (student) => selectedStudents.value.has(student.id)
    );

    switch (format) {
      case 'tab':
        clipboardData = "Mã Hồ Sơ\tHọ Tên\tNgày Sinh\tNgành\tGhi Chú\n";
        selectedStudentsList.forEach((student) => {
          clipboardData += `${student.maHoXo}\t${student.hoTen}\t${student.ngaySinh}\t${student.nganh}\t${student.ghiChu || ''}\n`;
        });
        break;
      case 'csv':
        clipboardData = "Mã Hồ Sơ,Họ Tên,Ngày Sinh,Ngành,Ghi Chú\n";
        selectedStudentsList.forEach((student) => {
          clipboardData += `"${student.maHoXo}","${student.hoTen}","${student.ngaySinh}","${student.nganh}","${student.ghiChu || ''}"\n`;
        });
        break;
      case 'json':
        clipboardData = JSON.stringify(selectedStudentsList, null, 2);
        break;
      case 'detailed':
        selectedStudentsList.forEach((student, index) => {
          clipboardData += `=== Sinh viên ${index + 1} ===\n`;
          clipboardData += `Mã Hồ Sơ: ${student.maHoXo}\n`;
          clipboardData += `Họ Tên: ${student.hoTen}\n`;
          clipboardData += `Ngày Sinh: ${student.ngaySinh}\n`;
          clipboardData += `Ngành: ${student.nganh}\n`;
          clipboardData += `Ghi Chú: ${student.ghiChu || 'Không có'}\n\n`;
        });
        break;
      case 'formatted':
        selectedStudentsList.forEach((student, index) => {
          clipboardData += `┌─────────────────────────────────────┐\n`;
          clipboardData += `│        SINH VIÊN ${(index + 1).toString().padStart(2, '0')}          │\n`;
          clipboardData += `├─────────────────────────────────────┤\n`;
          clipboardData += `│ Mã Hồ Sơ: ${student.maHoXo.padEnd(20)} │\n`;
          clipboardData += `│ Họ Tên:   ${student.hoTen.padEnd(20)} │\n`;
          clipboardData += `│ Ngày Sinh: ${student.ngaySinh.padEnd(18)} │\n`;
          clipboardData += `│ Ngành:    ${student.nganh.padEnd(20)} │\n`;
          clipboardData += `│ Ghi Chú:  ${(student.ghiChu || 'Không có').padEnd(20)} │\n`;
          clipboardData += `└─────────────────────────────────────┘\n\n`;
        });
        break;
      default:
        clipboardData = "Mã Hồ Sơ\tHọ Tên\tNgày Sinh\tNgành\tGhi Chú\n";
        selectedStudentsList.forEach((student) => {
          clipboardData += `${student.maHoXo}\t${student.hoTen}\t${student.ngaySinh}\t${student.nganh}\t${student.ghiChu || ''}\n`;
        });
    }

    await navigator.clipboard.writeText(clipboardData);
    showSuccess(`Đã copy ${selectedStudentsList.length} sinh viên đã chọn vào clipboard (${format.toUpperCase()})`);
  } catch (error) {
    showError("Không thể copy vào clipboard");
    console.error("Copy error:", error);
  }
};

const copyAllCurrentStudentsToClipboard = async (format = 'tab') => {
  if (filteredStudents.value.length === 0) {
    showError("Không có dữ liệu sinh viên để copy");
    return;
  }

  try {
    let clipboardData = '';
    
    switch (format) {
      case 'tab':
        clipboardData = "Mã Hồ Sơ\tHọ Tên\tNgày Sinh\tNgành\tGhi Chú\n";
        filteredStudents.value.forEach((student) => {
          clipboardData += `${student.maHoXo}\t${student.hoTen}\t${student.ngaySinh}\t${student.nganh}\t${student.ghiChu || ''}\n`;
        });
        break;
      case 'csv':
        clipboardData = "Mã Hồ Sơ,Họ Tên,Ngày Sinh,Ngành,Ghi Chú\n";
        filteredStudents.value.forEach((student) => {
          clipboardData += `"${student.maHoXo}","${student.hoTen}","${student.ngaySinh}","${student.nganh}","${student.ghiChu || ''}"\n`;
        });
        break;
      case 'json':
        clipboardData = JSON.stringify(filteredStudents.value, null, 2);
        break;
      case 'detailed':
        filteredStudents.value.forEach((student, index) => {
          clipboardData += `=== Sinh viên ${index + 1} ===\n`;
          clipboardData += `Mã Hồ Sơ: ${student.maHoXo}\n`;
          clipboardData += `Họ Tên: ${student.hoTen}\n`;
          clipboardData += `Ngày Sinh: ${student.ngaySinh}\n`;
          clipboardData += `Ngành: ${student.nganh}\n`;
          clipboardData += `Ghi Chú: ${student.ghiChu || 'Không có'}\n\n`;
        });
        break;
      case 'formatted':
        filteredStudents.value.forEach((student, index) => {
          clipboardData += `┌─────────────────────────────────────┐\n`;
          clipboardData += `│        SINH VIÊN ${(index + 1).toString().padStart(2, '0')}          │\n`;
          clipboardData += `├─────────────────────────────────────┤\n`;
          clipboardData += `│ Mã Hồ Sơ: ${student.maHoXo.padEnd(20)} │\n`;
          clipboardData += `│ Họ Tên:   ${student.hoTen.padEnd(20)} │\n`;
          clipboardData += `│ Ngày Sinh: ${student.ngaySinh.padEnd(18)} │\n`;
          clipboardData += `│ Ngành:    ${student.nganh.padEnd(20)} │\n`;
          clipboardData += `│ Ghi Chú:  ${(student.ghiChu || 'Không có').padEnd(20)} │\n`;
          clipboardData += `└─────────────────────────────────────┘\n\n`;
        });
        break;
      default:
        clipboardData = "Mã Hồ Sơ\tHọ Tên\tNgày Sinh\tNgành\tGhi Chú\n";
        filteredStudents.value.forEach((student) => {
          clipboardData += `${student.maHoXo}\t${student.hoTen}\t${student.ngaySinh}\t${student.nganh}\t${student.ghiChu || ''}\n`;
        });
    }

    await navigator.clipboard.writeText(clipboardData);
    showSuccess(`Đã copy ${filteredStudents.value.length} sinh viên vào clipboard (${format.toUpperCase()})`);
  } catch (error) {
    showError("Không thể copy vào clipboard");
    console.error("Copy error:", error);
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const changeItemsPerPage = (items) => {
  itemsPerPage.value = items;
  currentPage.value = 1;
};

// Watch for search query changes to reset page
watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>

<template>
  <div class="student-data-table">
    <!-- Header Controls -->
    <div class="table-header">
      <div class="header-left">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Tìm kiếm sinh viên..."
            class="search-input"
          />
        </div>
        <div class="copy-format-selector">
          <label>Định dạng copy:</label>
          <select v-model="copyFormat" class="format-select">
            <option value="tab">Tab (Excel)</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="detailed">Chi tiết</option>
            <option value="formatted">Đẹp</option>
          </select>
        </div>
        <div class="items-per-page">
          <label>Hiển thị:</label>
          <select
            @change="changeItemsPerPage($event.target.value)"
            class="page-select"
          >
            <option value="10">10</option>
            <option value="20" selected>20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div class="header-right">
        <button
          v-if="selectedStudents.size > 0"
          @click="copySelectedStudentsToClipboard(copyFormat)"
          class="action-btn copy-btn"
          title="Copy sinh viên đã chọn"
        >
          📋 Copy đã chọn ({{ selectedStudents.size }})
        </button>
        <button
          @click="copyAllCurrentStudentsToClipboard(copyFormat)"
          class="action-btn copy-btn"
          title="Copy tất cả sinh viên hiện tại"
        >
          📋 Copy tất cả
        </button>
        <button
          v-if="selectedStudents.size > 0"
          @click="handleDeleteSelected"
          class="action-btn delete-btn"
        >
          🗑️ Xóa đã chọn ({{ selectedStudents.size }})
        </button>
        <div class="total-info">{{ filteredStudents.length }} sinh viên</div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th class="expand-col"></th>
            <th @click="handleSort('maHoXo')" class="sortable">
              Mã Hồ Sơ
              <span class="sort-icon" v-if="sortField === 'maHoXo'">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="handleSort('hoTen')" class="sortable">
              Họ Tên
              <span class="sort-icon" v-if="sortField === 'hoTen'">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="handleSort('ngaySinh')" class="sortable">
              Ngày Sinh
              <span class="sort-icon" v-if="sortField === 'ngaySinh'">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="handleSort('nganh')" class="sortable">
              Ngành
              <span class="sort-icon" v-if="sortField === 'nganh'">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th class="actions-col">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="student in paginatedStudents" :key="student.id">
            <!-- Main Row -->
            <tr
              :class="[
                'student-row',
                {
                  selected: selectedStudents.has(student.id),
                  expanded: expandedRows.has(student.id),
                },
              ]"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="selectedStudents.has(student.id)"
                  @change="toggleStudentSelection(student.id)"
                />
              </td>
              <td>
                <button
                  @click="toggleRowExpansion(student.id)"
                  class="expand-btn"
                  :class="{ expanded: expandedRows.has(student.id) }"
                >
                  {{ expandedRows.has(student.id) ? "▼" : "▶" }}
                </button>
              </td>
              <td class="mono">{{ student.maHoXo }}</td>
              <td class="student-name">{{ student.hoTen }}</td>
              <td>{{ student.ngaySinh }}</td>
              <td class="student-major">{{ student.nganh }}</td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    @click="copyStudentToClipboard(student, copyFormat)"
                    class="action-btn copy-btn"
                    title="Copy sinh viên này"
                  >
                    📋
                  </button>
                  <button
                    @click="handleEditStudent(student)"
                    class="action-btn edit-btn"
                    title="Sửa sinh viên"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handleDeleteStudent(student)"
                    class="action-btn delete-btn"
                    title="Xóa sinh viên"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>

            <!-- Expanded Row -->
            <tr v-if="expandedRows.has(student.id)" class="expanded-row">
              <td colspan="8">
                <div class="expanded-content">
                  <div class="detail-grid">
                    <div class="detail-item">
                      <label>ID:</label>
                      <span>{{ student.id }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Mã hồ sơ đầy đủ:</label>
                      <span>{{ student.maHoXo }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Họ tên đầy đủ:</label>
                      <span>{{ student.hoTen }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Ngày sinh:</label>
                      <span>{{ student.ngaySinh }}</span>
                    </div>
                    <div class="detail-item full-width">
                      <label>Ngành đào tạo:</label>
                      <span>{{ student.nganh }}</span>
                    </div>
                    <div class="detail-item full-width">
                      <label>Ghi chú:</label>
                      <span class="text-muted">
                        {{
                          student.ghiChu || "Sinh viên đang theo học tại trường"
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="paginatedStudents.length === 0" class="empty-state">
        <div class="empty-content">
          <h3>
            📭
            {{
              searchQuery
                ? "Không tìm thấy kết quả"
                : "Chưa có dữ liệu sinh viên"
            }}
          </h3>
          <p v-if="searchQuery">
            Không tìm thấy sinh viên nào với từ khóa "{{ searchQuery }}"
          </p>
          <p v-else>Vui lòng nhập dữ liệu sinh viên để bắt đầu</p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        ‹ Trước
      </button>

      <div class="page-numbers">
        <button
          v-for="page in Math.min(totalPages, 7)"
          :key="page"
          @click="goToPage(page)"
          :class="['page-btn', { active: page === currentPage }]"
        >
          {{ page }}
        </button>

        <span v-if="totalPages > 7" class="page-ellipsis">...</span>

        <button
          v-if="totalPages > 7"
          @click="goToPage(totalPages)"
          :class="['page-btn', { active: totalPages === currentPage }]"
        >
          {{ totalPages }}
        </button>
      </div>

      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        Sau ›
      </button>
    </div>

    <!-- Edit Modal -->
    <StudentEditModal
      :is-visible="isEditModalVisible"
      :student="editingStudent"
      @close="closeEditModal"
      @save="handleSaveStudent"
    />
  </div>
</template>

<style scoped>
.student-data-table {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 16px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-background);
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.copy-format-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text);
}

.format-select {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text);
}

.page-select {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.copy-btn {
  background: var(--color-success, #10b981);
  border-color: var(--color-success, #10b981);
  color: white;
}

.copy-btn:hover {
  background: #059669;
  border-color: #059669;
  transform: scale(1.1);
}

.total-info {
  font-size: 14px;
  color: var(--color-text-light);
  font-weight: 500;
}

.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
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
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table th {
  background: var(--color-background-soft);
  font-weight: 600;
  color: var(--color-heading);
  position: sticky;
  top: 0;
  z-index: 10;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background: var(--color-background-mute);
}

.sort-icon {
  margin-left: 4px;
  font-size: 12px;
}

.checkbox-col {
  width: 40px;
}

.expand-col {
  width: 40px;
}

.actions-col {
  width: 160px;
  text-align: center;
}

.actions-cell {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.action-btn:hover {
  transform: scale(1.1);
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.copy-btn:hover {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success, #10b981);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-light);
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.expand-btn.expanded {
  color: var(--color-primary);
}

.student-row {
  transition: all 0.2s ease;
}

.student-row:hover {
  background: var(--color-background-soft);
}

.student-row.selected {
  background: rgba(59, 130, 246, 0.1);
}

.student-row.expanded {
  border-bottom: none;
}

.mono {
  font-family: "Courier New", monospace;
  font-size: 13px;
}

.student-name {
  font-weight: 500;
  color: var(--color-heading);
}

.student-major {
  font-size: 13px;
  color: var(--color-text);
}

.expanded-row {
  background: var(--color-background-soft);
}

.expanded-content {
  padding: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-light);
  text-transform: uppercase;
}

.detail-item span {
  font-size: 14px;
  color: var(--color-text);
}

.text-muted {
  color: var(--color-text-light) !important;
  font-style: italic;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--color-heading);
}

.empty-content p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-light);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  margin-top: auto;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-background-soft);
  border-color: var(--color-primary);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-ellipsis {
  padding: 8px 4px;
  color: var(--color-text-light);
}

/* Dark theme adjustments */
[data-theme="dark"] .search-input:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

[data-theme="dark"] .student-row.selected {
  background: rgba(59, 130, 246, 0.2);
}

[data-theme="dark"] .edit-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  color: var(--color-primary);
}

[data-theme="dark"] .copy-btn:hover {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success, #10b981);
}

[data-theme="dark"] .delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
}

/* Responsive */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-left {
    flex-direction: column;
    gap: 12px;
  }

  .copy-format-selector {
    justify-content: space-between;
  }

  .search-box {
    max-width: none;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .action-btn {
    min-width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .header-right {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
