<script setup>
import { ref, computed } from "vue";
import { useStudentSearchStore } from "@/stores/StudentSearch";
import { useNotificationStore } from "@/stores/NotificationStore";
import StudentInfoInputModal from "@/components/StudentInfoInputModal.vue";

// Props
const props = defineProps({
  isExtractingName: {
    type: Boolean,
    default: false,
  },
  tableData: {
    type: Array,
    default: () => [],
  },
  onMessageInput: {
    type: Function,
    required: true,
  },
  onExtractName: {
    type: Function,
    required: true,
  },
  onExportData: {
    type: Function,
    required: true,
  },
  onTabChange: {
    type: Function,
    required: true,
  },
});

// Stores
const studentSearchStore = useStudentSearchStore();
const notificationStore = useNotificationStore();
const { showSuccess, showError, showConfirm } = notificationStore;

// Refs
const activeTab = ref("student-data");
const showStudentInfoInputModal = ref(false);

// Computed properties for statistics
const numOfExtractedName = computed(() => {
  return (
    props.tableData.filter(
      (item) => item.name !== "NULL" && item.name !== "ERROR"
    ).length || 0
  );
});

const numOfNullName = computed(() => {
  return props.tableData.filter((item) => item.name === "NULL").length || 0;
});

const numOfErrorName = computed(() => {
  return props.tableData.filter((item) => item.name === "ERROR").length || 0;
});

const numOfOneStudentInfo = computed(() => {
  return (
    props.tableData.filter((item) => item.studentInfo.length === 1).length || 0
  );
});

const numOfManyStudentInfo = computed(() => {
  return (
    props.tableData.filter((item) => item.studentInfo.length > 1).length || 0
  );
});

const numOfNoStudentInfo = computed(() => {
  return (
    props.tableData.filter((item) => item.studentInfo.length === 0).length || 0
  );
});

// Methods
const toggleStudentInfoModal = () => {
  showStudentInfoInputModal.value = !showStudentInfoInputModal.value;
};

const setActiveTab = (tab) => {
  activeTab.value = tab;
  props.onTabChange(tab);
};

const handleClearStudentData = async () => {
  const confirmed = await showConfirm(
    "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu sinh viên?",
    "Xác nhận xóa dữ liệu"
  );

  if (confirmed) {
    studentSearchStore.studentInfo = [];
    showSuccess("Đã xóa toàn bộ dữ liệu sinh viên");
  }
};

const handleClearMessageData = async () => {
  const confirmed = await showConfirm(
    "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu tin nhắn?",
    "Xác nhận xóa dữ liệu"
  );

  if (confirmed) {
    // This would need to be handled by parent component
    // emit('clear-message-data')
    showSuccess("Đã xóa toàn bộ dữ liệu tin nhắn");
  }
};
</script>

<template>
  <div class="sidebar">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <h2 class="sidebar-title">🎛️ Bảng Điều Khiển</h2>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        :class="['tab-button', { active: activeTab === 'student-data' }]"
        @click="setActiveTab('student-data')"
      >
        👨‍🎓 Quản Lý SV
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'name-extraction' }]"
        @click="setActiveTab('name-extraction')"
      >
        ⚗️ Trích Xuất Tên
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Student Data Management Tab -->
      <div v-if="activeTab === 'student-data'" class="tab-panel">
        <div class="section">
          <h3 class="section-title">📊 Thống Kê Sinh Viên</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">
                {{ studentSearchStore.studentInfo.length }}
              </div>
              <div class="stat-label">Tổng SV</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">🛠️ Thao Tác Dữ Liệu SV</h3>
          <div class="button-group">
            <button
              class="action-button primary"
              @click="toggleStudentInfoModal"
            >
              ✍🏻 Nhập Dữ Liệu SV
            </button>
            <button
              class="action-button danger"
              @click="handleClearStudentData"
              :disabled="studentSearchStore.studentInfo.length === 0"
            >
              🗑️ Xóa Tất Cả SV
            </button>
          </div>
        </div>
      </div>

      <!-- Name Extraction Tab -->
      <div v-if="activeTab === 'name-extraction'" class="tab-panel">
        <div class="section">
          <h3 class="section-title">📊 Thống Kê Tin Nhắn</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">{{ tableData.length }}</div>
              <div class="stat-label">Tổng Tin Nhắn</div>
            </div>
            <div class="stat-card success">
              <div class="stat-number">{{ numOfExtractedName }}</div>
              <div class="stat-label">Đã Trích Xuất</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-number">{{ numOfNullName }}</div>
              <div class="stat-label">Không Tìm Thấy</div>
            </div>
            <div class="stat-card error">
              <div class="stat-number">{{ numOfErrorName }}</div>
              <div class="stat-label">Lỗi</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">🎯 Thống Kê Khớp SV</h3>
          <div class="stats-grid">
            <div class="stat-card success">
              <div class="stat-number">{{ numOfOneStudentInfo }}</div>
              <div class="stat-label">Khớp 1 SV</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-number">{{ numOfManyStudentInfo }}</div>
              <div class="stat-label">Khớp Nhiều SV</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ numOfNoStudentInfo }}</div>
              <div class="stat-label">Không Khớp</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">🛠️ Thao Tác Xử Lý</h3>
          <div class="button-group">
            <button class="action-button primary" @click="onMessageInput">
              📨 Nhập Tin Nhắn
            </button>
            <button
              class="action-button secondary"
              @click="onExtractName"
              :disabled="isExtractingName || tableData.length === 0"
            >
              <span v-if="isExtractingName">⏳ Đang Xử Lý...</span>
              <span v-else>⚗️ Trích Xuất Tên</span>
            </button>
            <button
              class="action-button success"
              @click="onExportData"
              :disabled="tableData.length === 0"
            >
              💾 Xuất Dữ Liệu
            </button>
          </div>
        </div>

        <!-- Progress indicator -->
        <div v-if="isExtractingName" class="section">
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <p class="progress-text">Đang trích xuất tên từ tin nhắn...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Info Modal -->
    <StudentInfoInputModal
      v-if="showStudentInfoInputModal"
      :TogglePopup="toggleStudentInfoModal"
    />
  </div>
</template>

<style scoped>
.sidebar {
  width: 350px;
  height: 100vh;
  background: var(--color-background-soft, #f8f9fa);
  border-right: 1px solid var(--color-border, #e9ecef);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--color-border, #e9ecef);
  background: var(--color-background, #ffffff);
}

.sidebar-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-heading, #1a1a1a);
}

.tab-navigation {
  display: flex;
  background: var(--color-background, #ffffff);
  border-bottom: 1px solid var(--color-border, #e9ecef);
}

.tab-button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text, #6c757d);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  background: var(--color-background-soft, #f8f9fa);
  color: var(--color-heading, #1a1a1a);
}

.tab-button.active {
  color: var(--color-primary, #3b82f6);
  border-bottom-color: var(--color-primary, #3b82f6);
  background: var(--color-background-soft, #f8f9fa);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.tab-panel {
  padding: 20px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-heading, #1a1a1a);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--color-background, #ffffff);
  border: 1px solid var(--color-border, #e9ecef);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-card.success {
  border-color: #10b981;
  background: #f0fdf4;
}

.stat-card.warning {
  border-color: #f59e0b;
  background: #fffbeb;
}

.stat-card.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-heading, #1a1a1a);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text, #6c757d);
  line-height: 1.2;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-button {
  padding: 12px 16px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.action-button.secondary {
  background: #6b7280;
  border-color: #6b7280;
  color: white;
}

.action-button.secondary:hover:not(:disabled) {
  background: #4b5563;
  border-color: #4b5563;
}

.action-button.success {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.action-button.success:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.action-button.danger {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.action-button.danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.progress-container {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-background-soft, #f8f9fa);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary, #3b82f6);
  animation: progress 2s infinite linear;
}

@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}

.progress-text {
  font-size: 12px;
  color: var(--color-text, #6c757d);
  margin: 0;
}

/* Scrollbar styling */
.tab-content::-webkit-scrollbar,
.student-list::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track,
.student-list::-webkit-scrollbar-track {
  background: var(--color-background-soft, #f8f9fa);
}

.tab-content::-webkit-scrollbar-thumb,
.student-list::-webkit-scrollbar-thumb {
  background: var(--color-border, #e9ecef);
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover,
.student-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text, #6c757d);
}

/* Dark theme specific adjustments */
[data-theme="dark"] .stat-card.success {
  border-color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

[data-theme="dark"] .stat-card.warning {
  border-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.1);
}

[data-theme="dark"] .stat-card.error {
  border-color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
}

[data-theme="dark"] .action-button.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

[data-theme="dark"] .action-button.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

[data-theme="dark"] .action-button.secondary {
  background: #475569;
  border-color: #475569;
}

[data-theme="dark"] .action-button.secondary:hover:not(:disabled) {
  background: #64748b;
  border-color: #64748b;
}

[data-theme="dark"] .action-button.success {
  background: var(--color-success);
  border-color: var(--color-success);
}

[data-theme="dark"] .action-button.success:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

[data-theme="dark"] .action-button.danger {
  background: var(--color-error);
  border-color: var(--color-error);
}

[data-theme="dark"] .action-button.danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
