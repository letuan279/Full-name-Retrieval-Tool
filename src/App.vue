<script setup>
import { ref, computed } from "vue";
import StudentSearch from "./pages/StudentSearch.vue";
import NotFound from "./pages/NotFound.vue";

// Global Notification System
import { useNotificationStore } from "@/stores/NotificationStore";
const notificationStore = useNotificationStore();
const { notifications, confirmModal, handleConfirmResponse } =
  notificationStore;

const routes = {
  "/": StudentSearch,
};

const currentPath = ref(window.location.pathname);

window.addEventListener("popstate", () => {
  currentPath.value = window.location.pathname;
});

const currentView = computed(() => {
  return routes[currentPath.value || "/"] || NotFound;
});
</script>

<template>
  <!-- Main Application -->
  <component :is="currentView" />

  <!-- Global Notification Container -->
  <div class="global-notification-container">
    <!-- Toast Notifications -->
    <div class="notification-container">
      <transition-group name="toast" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['toast', `toast-${notification.type}`]"
          @click="notificationStore.removeNotification(notification.id)"
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
              @click.stop="
                notificationStore.removeNotification(notification.id)
              "
            >
              ×
            </button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Global Confirm Modal -->
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
          <p>{{ confirmModal.message }}</p>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            @click="handleConfirmResponse(false)"
          >
            {{ confirmModal.cancelText }}
          </button>
          <button class="btn btn-primary" @click="handleConfirmResponse(true)">
            {{ confirmModal.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* ===========================================
   GLOBAL NOTIFICATION STYLES
   ========================================== */
.global-notification-container {
  pointer-events: none;
}

/* Notification Container */
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

/* Toast Styles */
.toast {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #e2e8f0;
  min-width: 320px;
  max-width: 400px;
  overflow: hidden;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.toast:hover {
  transform: translateX(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.toast-success {
  border-left-color: #10b981;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.toast-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: #374151;
  word-wrap: break-word;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  color: #374151;
  background-color: #f3f4f6;
}

/* Toast Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Modal Overlay & Content */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: auto;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  min-width: 320px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

.modal-footer {
  padding: 16px 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn-primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast {
    min-width: auto;
    max-width: none;
  }

  .modal-content {
    margin: 20px;
    width: calc(100% - 40px);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .toast {
    background: #1f2937;
    color: #f9fafb;
  }

  .toast-message {
    color: #f9fafb;
  }

  .modal-content {
    background: #1f2937;
    color: #f9fafb;
  }

  .modal-title {
    color: #f9fafb;
  }

  .modal-body p {
    color: #e5e7eb;
  }

  .btn-secondary {
    background-color: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
  }
}
</style>
