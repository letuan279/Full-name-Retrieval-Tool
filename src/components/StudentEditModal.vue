<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h3>✏️ Sửa Thông Tin Sinh Viên</h3>
        <button @click="closeModal" class="close-btn" title="Đóng">✕</button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="edit-form">
        <div class="form-grid">
          <!-- Mã hồ sơ -->
          <div class="form-group">
            <label for="maHoXo">Mã Hồ Sơ *</label>
            <input
              id="maHoXo"
              v-model="formData.maHoXo"
              type="text"
              required
              class="form-input"
              :class="{ error: errors.maHoXo }"
              placeholder="Nhập mã hồ sơ"
            />
            <span v-if="errors.maHoXo" class="error-message">
              {{ errors.maHoXo }}
            </span>
          </div>

          <!-- Họ tên -->
          <div class="form-group">
            <label for="hoTen">Họ Tên *</label>
            <input
              id="hoTen"
              v-model="formData.hoTen"
              type="text"
              required
              class="form-input"
              :class="{ error: errors.hoTen }"
              placeholder="Nhập họ tên đầy đủ"
            />
            <span v-if="errors.hoTen" class="error-message">
              {{ errors.hoTen }}
            </span>
          </div>

          <!-- Ngày sinh -->
          <div class="form-group">
            <label for="ngaySinh">Ngày Sinh *</label>
            <input
              id="ngaySinh"
              v-model="formData.ngaySinh"
              type="date"
              required
              class="form-input"
              :class="{ error: errors.ngaySinh }"
            />
            <span v-if="errors.ngaySinh" class="error-message">
              {{ errors.ngaySinh }}
            </span>
          </div>

          <!-- Ngành -->
          <div class="form-group">
            <label for="nganh">Ngành Đào Tạo *</label>
            <input
              id="nganh"
              v-model="formData.nganh"
              type="text"
              required
              class="form-input"
              :class="{ error: errors.nganh }"
              placeholder="Nhập ngành đào tạo"
            />
            <span v-if="errors.nganh" class="error-message">
              {{ errors.nganh }}
            </span>
          </div>

          <!-- Ghi chú -->
          <div class="form-group full-width">
            <label for="ghiChu">Ghi Chú</label>
            <textarea
              id="ghiChu"
              v-model="formData.ghiChu"
              class="form-textarea"
              rows="3"
              placeholder="Nhập ghi chú (không bắt buộc)"
            ></textarea>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn btn-secondary">
            ❌ Hủy
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? "Đang lưu..." : "💾 Lưu Thay Đổi" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from "vue";
import { useNotificationStore } from "@/stores/NotificationStore";

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  student: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(["close", "save"]);

// Stores
const notificationStore = useNotificationStore();
const { showSuccess, showError } = notificationStore;

// Refs
const isSubmitting = ref(false);

// Form data
const formData = reactive({
  maHoXo: "",
  hoTen: "",
  ngaySinh: "",
  nganh: "",
  ghiChu: "",
});

// Validation errors
const errors = reactive({
  maHoXo: "",
  hoTen: "",
  ngaySinh: "",
  nganh: "",
});

// Computed
const isFormValid = computed(() => {
  return (
    formData.maHoXo.trim() &&
    formData.hoTen.trim() &&
    formData.ngaySinh &&
    formData.nganh.trim()
  );
});

// Watch for student changes to populate form
watch(
  () => props.student,
  (newStudent) => {
    if (newStudent) {
      populateForm(newStudent);
    }
  },
  { immediate: true }
);

// Methods
const populateForm = (student) => {
  formData.maHoXo = student.maHoXo || "";
  formData.hoTen = student.hoTen || "";

  // Convert date format from DD/MM/YYYY to YYYY-MM-DD for input type="date"
  if (student.ngaySinh) {
    const dateParts = student.ngaySinh.split("/");
    if (dateParts.length === 3) {
      // Format: DD/MM/YYYY -> YYYY-MM-DD
      const day = dateParts[0].padStart(2, "0");
      const month = dateParts[1].padStart(2, "0");
      const year = dateParts[2];
      formData.ngaySinh = `${year}-${month}-${day}`;
    } else {
      // If already in YYYY-MM-DD format, use as is
      formData.ngaySinh = student.ngaySinh;
    }
  } else {
    formData.ngaySinh = "";
  }

  formData.nganh = student.nganh || "";
  formData.ghiChu = student.ghiChu || "";

  // Clear previous errors
  clearErrors();
};

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
};

const validateForm = () => {
  clearErrors();
  let isValid = true;

  // Validate mã hồ sơ
  if (!formData.maHoXo.trim()) {
    errors.maHoXo = "Mã hồ sơ không được để trống";
    isValid = false;
  } else if (formData.maHoXo.trim().length < 3) {
    errors.maHoXo = "Mã hồ sơ phải có ít nhất 3 ký tự";
    isValid = false;
  }

  // Validate họ tên
  if (!formData.hoTen.trim()) {
    errors.hoTen = "Họ tên không được để trống";
    isValid = false;
  } else if (formData.hoTen.trim().length < 2) {
    errors.hoTen = "Họ tên phải có ít nhất 2 ký tự";
    isValid = false;
  }

  // Validate ngày sinh
  if (!formData.ngaySinh) {
    errors.ngaySinh = "Ngày sinh không được để trống";
    isValid = false;
  } else {
    const birthDate = new Date(formData.ngaySinh);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 15 || age > 100) {
      errors.ngaySinh = "Ngày sinh không hợp lệ (tuổi từ 15-100)";
      isValid = false;
    }
  }

  // Validate ngành
  if (!formData.nganh.trim()) {
    errors.nganh = "Ngành đào tạo không được để trống";
    isValid = false;
  } else if (formData.nganh.trim().length < 3) {
    errors.nganh = "Ngành đào tạo phải có ít nhất 3 ký tự";
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Convert date format from YYYY-MM-DD back to DD/MM/YYYY for storage
    let formattedNgaySinh = formData.ngaySinh;
    if (formData.ngaySinh && formData.ngaySinh.includes("-")) {
      const dateParts = formData.ngaySinh.split("-");
      if (dateParts.length === 3) {
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        formattedNgaySinh = `${day}/${month}/${year}`;
      }
    }

    // Create updated student object
    const updatedStudent = {
      ...props.student,
      maHoXo: formData.maHoXo.trim(),
      hoTen: formData.hoTen.trim(),
      ngaySinh: formattedNgaySinh,
      nganh: formData.nganh.trim(),
      ghiChu: formData.ghiChu.trim(),
    };

    // Emit save event
    emit("save", updatedStudent);

    showSuccess(`Đã cập nhật thông tin sinh viên "${formData.hoTen}"`);
    closeModal();
  } catch (error) {
    showError("Có lỗi xảy ra khi cập nhật thông tin sinh viên");
    console.error("Edit student error:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  emit("close");
  clearErrors();
};

const handleOverlayClick = () => {
  closeModal();
};
</script>

<style scoped>
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
  background: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-heading);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: var(--color-text-light);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.edit-form {
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-heading);
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-background);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error,
.form-textarea.error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.error-message {
  font-size: 12px;
  color: var(--color-error);
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 12px 24px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-background-soft);
  border-color: var(--color-text-light);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark theme adjustments */
[data-theme="dark"] .modal-content {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 10px 10px -5px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .form-input:focus,
[data-theme="dark"] .form-textarea:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

[data-theme="dark"] .form-input.error,
[data-theme="dark"] .form-textarea.error {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }

  .modal-content {
    max-width: 100%;
    margin: 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .edit-form {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-header {
    padding: 16px;
  }

  .edit-form {
    padding: 16px;
  }
}
</style>
