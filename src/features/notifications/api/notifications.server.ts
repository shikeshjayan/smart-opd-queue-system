import {
  listMyNotifications,
  listStaffNotifications,
  unreadCount as serverUnreadCount,
  getNotificationHistory,
  markRead as serverMarkRead,
  markAllRead as serverMarkAllRead,
  getPreferences as serverGetPreferences,
  savePreferences as serverSavePreferences,
  getNotificationHealth,
  retryNotification,
  drainQueue,
} from "@/server/actions/notification-actions";

export const notificationApi = {
  list: listMyNotifications,
  listStaff: listStaffNotifications,
  unreadCount: serverUnreadCount,
  history: getNotificationHistory,
  markRead: serverMarkRead,
  markAllRead: serverMarkAllRead,
  getPreferences: serverGetPreferences,
  savePreferences: serverSavePreferences,
  health: getNotificationHealth,
  retry: retryNotification,
  drainQueue,
};
