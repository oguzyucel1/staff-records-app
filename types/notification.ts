export type NotificationType =
  | "leave_approved"
  | "leave_rejected"
  | "attendance_reminder"
  | "system_notification";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any; // Additional data like leave_request_id
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
}
