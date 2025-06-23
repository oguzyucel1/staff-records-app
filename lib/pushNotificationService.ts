import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Notification handler'ı ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class PushNotificationService {
  // Push token'ı al
  static async getPushToken() {
    try {
      if (!Device.isDevice) {
        console.log("Push notifications sadece fiziksel cihazlarda çalışır");
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification izni verilmedi!");
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "a854bbcb-c183-43e9-b492-6a5d0bb913dc", // EAS project ID'niz
      });

      console.log("Push token alındı:", token.data);
      return token.data;
    } catch (error) {
      console.error("Push token alınırken hata:", error);
      return null;
    }
  }

  // Token'ı veritabanına kaydet
  static async savePushToken(userId: string, token: string) {
    try {
      const { error } = await supabase.from("user_push_tokens").upsert(
        {
          user_id: userId,
          push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      console.log("Push token kaydedildi");
      return true;
    } catch (error) {
      console.error("Push token kaydedilirken hata:", error);
      return false;
    }
  }

  // Kullanıcıya push notification gönder
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      // Kullanıcının push token'ını al
      const { data: tokenData, error } = await supabase
        .from("user_push_tokens")
        .select("push_token")
        .eq("user_id", userId)
        .single();

      if (error || !tokenData?.push_token) {
        console.log("Kullanıcının push token'ı bulunamadı:", userId);
        return false;
      }

      // Expo push notification gönder
      const message = {
        to: tokenData.push_token,
        sound: "default",
        title: title,
        body: body,
        data: data || {},
        priority: "high",
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Push notification gönderildi:", result);
        return true;
      } else {
        console.error("Push notification gönderilemedi:", result);
        return false;
      }
    } catch (error) {
      console.error("Push notification gönderirken hata:", error);
      return false;
    }
  }

  // Toplu push notification gönder
  static async sendBulkPushNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: any
  ) {
    try {
      // Tüm kullanıcıların push token'larını al
      const { data: tokens, error } = await supabase
        .from("user_push_tokens")
        .select("push_token")
        .in("user_id", userIds);

      if (error || !tokens || tokens.length === 0) {
        console.log("Push token'lar bulunamadı");
        return false;
      }

      // Her token için notification gönder
      const messages = tokens.map((token: { push_token: string }) => ({
        to: token.push_token,
        sound: "default",
        title: title,
        body: body,
        data: data || {},
        priority: "high",
      }));

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Toplu push notification gönderildi:", result);
        return true;
      } else {
        console.error("Toplu push notification gönderilemedi:", result);
        return false;
      }
    } catch (error) {
      console.error("Toplu push notification gönderirken hata:", error);
      return false;
    }
  }

  // Notification listener'ları ayarla
  static setupNotificationListeners() {
    // Uygulama açıkken gelen notification'ları yakala
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification alındı:", notification);
      }
    );

    // Notification'a tıklandığında
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification'a tıklandı:", response);

        // Burada notification'a tıklandığında yapılacak işlemleri ekleyebilirsiniz
        // Örneğin: Belirli bir sayfaya yönlendirme
        const data = response.notification.request.content.data;
        if (data?.screen) {
          // Router ile sayfa yönlendirmesi yapabilirsiniz
          console.log("Yönlendirilecek sayfa:", data.screen);
        }
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }

  // Badge sayısını ayarla
  static async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("Badge sayısı ayarlanırken hata:", error);
    }
  }

  // Tüm notification'ları temizle
  static async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error("Notification'lar temizlenirken hata:", error);
    }
  }
}
