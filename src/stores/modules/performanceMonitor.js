/**
 * Notification Store - Global notification management with Pinia
 * Centralized toast notifications, confirmation modals, and loading states
 * Replaces native alert() and confirm() across the entire application
 */

import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { MESSAGE_TYPES } from '@/config/constants';

export const useNotificationStore = defineStore('notification', () => {
    // ===========================================
    // STATE MANAGEMENT
    // ===========================================

    // Toast notifications array
    const notifications = ref([]);

    // Confirmation modal state
    const confirmModal = reactive({
        show: false,
        title: '',
        message: '',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        type: 'info',
        resolve: null,
        reject: null
    });

    // Loading modal state
    const loadingModal = reactive({
        show: false,
        message: 'Đang xử lý...',
        progress: 0,
        showProgress: false
    });

    // Notification ID counter for unique identification
    let notificationId = 0;

    // ===========================================
    // TOAST NOTIFICATION METHODS
    // ===========================================

    /**
     * Show toast notification with auto-dismiss
     * @param {string} message - Notification message
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds (0 = no auto-dismiss)
     */
    const showToast = (message, type = MESSAGE_TYPES.INFO, duration = 5000) => {
        const id = ++notificationId;
        const notification = {
            id,
            message,
            type,
            timestamp: Date.now(),
            show: true
        };

        notifications.value.push(notification);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    };

    /**
     * Show success notification (green, 5 seconds)
     */
    const showSuccess = (message, duration = 5000) => {
        return showToast(message, MESSAGE_TYPES.SUCCESS, duration);
    };

    /**
     * Show error notification (red, 8 seconds)
     */
    const showError = (message, duration = 8000) => {
        return showToast(message, MESSAGE_TYPES.ERROR, duration);
    };

    /**
     * Show warning notification (orange, 6 seconds)
     */
    const showWarning = (message, duration = 6000) => {
        return showToast(message, MESSAGE_TYPES.WARNING, duration);
    };

    /**
     * Show info notification (blue, 5 seconds)
     */
    const showInfo = (message, duration = 5000) => {
        return showToast(message, MESSAGE_TYPES.INFO, duration);
    };

    /**
     * Remove specific notification by ID
     */
    const removeNotification = (id) => {
        const index = notifications.value.findIndex(n => n.id === id);
        if (index > -1) {
            notifications.value.splice(index, 1);
        }
    };

    /**
     * Clear all notifications
     */
    const clearAllNotifications = () => {
        notifications.value = [];
    };

    // ===========================================
    // CONFIRMATION MODAL METHODS
    // ===========================================

    /**
     * Show confirmation modal (replaces native confirm())
     * @param {string} message - Confirmation message
     * @param {object} options - Configuration options
     * @returns {Promise<boolean>} - True if confirmed, false if cancelled
     */
    const showConfirm = (message, options = {}) => {
        return new Promise((resolve) => {
            confirmModal.show = true;
            confirmModal.title = options.title || 'Xác nhận';
            confirmModal.message = message;
            confirmModal.confirmText = options.confirmText || 'Xác nhận';
            confirmModal.cancelText = options.cancelText || 'Hủy';
            confirmModal.type = options.type || 'info';
            confirmModal.resolve = resolve;
        });
    };

    /**
     * Handle confirm modal response
     */
    const handleConfirmResponse = (confirmed) => {
        if (confirmModal.resolve) {
            confirmModal.resolve(confirmed);
        }
        confirmModal.show = false;
        confirmModal.resolve = null;
        confirmModal.reject = null;
    };

    // ===========================================
    // LOADING MODAL METHODS
    // ===========================================

    /**
     * Show loading modal
     */
    const showLoading = (message = 'Đang xử lý...', showProgress = false) => {
        loadingModal.show = true;
        loadingModal.message = message;
        loadingModal.progress = 0;
        loadingModal.showProgress = showProgress;
    };

    /**
     * Update loading progress (0-100)
     */
    const updateLoadingProgress = (progress, message = null) => {
        loadingModal.progress = Math.min(100, Math.max(0, progress));
        if (message) {
            loadingModal.message = message;
        }
    };

    /**
     * Hide loading modal
     */
    const hideLoading = () => {
        loadingModal.show = false;
        loadingModal.progress = 0;
    };

    /**
     * Execute async operation with progress tracking
     * @param {string} initialMessage - Initial loading message
     * @param {Function} processor - Async function that receives updateProgress callback
     */
    const withProgress = async (initialMessage, processor) => {
        showLoading(initialMessage, true);

        try {
            const updateProgress = (progress, message) => {
                updateLoadingProgress(progress, message);
            };

            const result = await processor(updateProgress);
            hideLoading();
            return result;
        } catch (error) {
            hideLoading();
            showError(`Lỗi xử lý: ${error.message}`);
            throw error;
        }
    };

    // ===========================================
    // UTILITY METHODS
    // ===========================================

    /**
     * Get notifications count by type
     */
    const getNotificationCount = (type = null) => {
        if (!type) return notifications.value.length;
        return notifications.value.filter(n => n.type === type).length;
    };

    /**
     * Check if any modal is open
     */
    const hasActiveModal = () => {
        return confirmModal.show || loadingModal.show;
    };

    // ===========================================
    // STORE RETURN
    // ===========================================

    return {
        // State
        notifications,
        confirmModal,
        loadingModal,

        // Toast notifications
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        clearAllNotifications,

        // Confirmation modal
        showConfirm,
        handleConfirmResponse,

        // Loading modal
        showLoading,
        updateLoadingProgress,
        hideLoading,
        withProgress,

        // Utilities
        getNotificationCount,
        hasActiveModal
    };
});