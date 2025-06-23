import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useNotifications } from "../../../hooks/useNotifications";
import { Notification } from "../../../types/notification";

export default function NotificationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications,
    count,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications(userId || "");

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error getting current user:", error);
      router.replace("/auth/login");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      "Tümünü Okundu İşaretle",
      "Tüm bildirimleri okundu olarak işaretlemek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Evet",
          onPress: async () => {
            await markAllAsRead();
            Alert.alert(
              "Başarılı",
              "Tüm bildirimler okundu olarak işaretlendi."
            );
          },
        },
      ]
    );
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      "Bildirimi Sil",
      "Bu bildirimi silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deleteNotification(notificationId);
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave_approved":
        return { name: "checkmark-circle", color: "#4CAF50" };
      case "leave_rejected":
        return { name: "close-circle", color: "#F44336" };
      case "attendance_reminder":
        return { name: "time", color: "#FF9800" };
      case "course_assignment":
        return { name: "school", color: "#6c5ce7" };
      default:
        return { name: "notifications", color: "#2196F3" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Az önce";
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4a00e0", "#8e2de2"]}
          tintColor="#4a00e0"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Ionicons name="notifications" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Bildirimlerim</Text>
          <Text style={styles.headerSubtitle}>
            {count.unread > 0
              ? `${count.unread} okunmamış bildirim`
              : "Okunmamış bildirim yok"}
          </Text>
        </View>
      </LinearGradient>

      {/* Buton artık header'ın dışında, ayrı bir alanda */}
      {count.unread > 0 && (
        <View style={styles.markAllContainer}>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={16} color="#4a00e0" />
            <Text style={styles.markAllButtonText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a00e0" />
            <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
          </View>
        ) : notifications.length > 0 ? (
          notifications.map((notification: Notification, index: number) => {
            const icon = getNotificationIcon(notification.type);
            return (
              <Animated.View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  {
                    opacity: !notification.is_read ? 1 : 0.7,
                    backgroundColor: !notification.is_read ? "#fff" : "#f8f9fa",
                  },
                ]}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIconContainer}>
                    <Ionicons
                      name={icon.name as any}
                      size={24}
                      color={icon.color}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                  <View style={styles.notificationActions}>
                    {!notification.is_read && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => markAsRead(notification.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark" size={16} color="#4a00e0" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteNotification(notification.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#F44336"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {!notification.is_read && (
                  <View style={styles.unreadIndicator} />
                )}
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#4a00e0", "#8e2de2"]}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="notifications-off" size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Bildirim Yok</Text>
            <Text style={styles.emptyText}>
              Henüz bildiriminiz bulunmuyor. Yeni bildirimler geldiğinde burada
              görünecek.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 70,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  headerTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginTop: 3,
    fontWeight: "500",
    textAlign: "center",
  },
  markAllContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 0,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  markAllButtonText: {
    color: "#4a00e0",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  content: {
    padding: 20,
    paddingTop: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  notificationActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#ffebee",
  },
  unreadIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#4a00e0",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
