import { supabase } from "./supabase";
import { NotificationType } from "../types/notification";

export class NotificationService {
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) {
    try {
      const { error } = await supabase.from("notifications").insert([
        {
          user_id: userId,
          type,
          title,
          message,
          data,
          is_read: false,
        },
      ]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error creating notification:", error);
      return false;
    }
  }

  static async createLeaveNotification(
    userId: string,
    leaveRequestId: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    isApproved: boolean
  ) {
    const type: NotificationType = isApproved
      ? "leave_approved"
      : "leave_rejected";
    const title = isApproved
      ? "İzin Talebiniz Onaylandı"
      : "İzin Talebiniz Reddedildi";
    const message = isApproved
      ? `${leaveType} talebiniz onaylandı. Tarih: ${new Date(startDate).toLocaleDateString("tr-TR")} - ${new Date(endDate).toLocaleDateString("tr-TR")}`
      : `${leaveType} talebiniz reddedildi. Tarih: ${new Date(startDate).toLocaleDateString("tr-TR")} - ${new Date(endDate).toLocaleDateString("tr-TR")}`;

    return this.createNotification(userId, type, title, message, {
      leave_request_id: leaveRequestId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      status: isApproved ? "approved" : "rejected",
    });
  }

  static async createCourseAssignmentNotification(
    replacedLecturerId: string,
    leaveRequestId: string,
    courseCode: string,
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string
  ) {
    const type: NotificationType = "course_assignment";
    const title = "Derse Atandınız";
    const message = `${courseCode} dersi için ${startDate} - ${endDate} tarihleri arası ${startTime}-${endTime} saatlerinde görevlendirildiniz.`;

    return this.createNotification(replacedLecturerId, type, title, message, {
      leave_request_id: leaveRequestId,
      course_code: courseCode,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
    });
  }

  static async getNotificationCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting notification count:", error);
      return 0;
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }
}
