import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";

type IconName = keyof typeof Ionicons.glyphMap;

export default function AdminPanel() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingLeaves: 0,
    totalRecords: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([
    // Örnek aktiviteler, gerçek veritabanından çekilebilir
    {
      title: "Ahmet Yılmaz izin talebi gönderdi",
      time: "5 dk önce",
      icon: "time-outline" as IconName,
    },
    {
      title: "Yeni proje oluşturuldu: Web Sitesi Yenileme",
      time: "1 saat önce",
      icon: "create-outline" as IconName,
    },
    {
      title: "Ayşe Demir terfi aldı",
      time: "2 saat önce",
      icon: "trending-up-outline" as IconName,
    },
    {
      title: "Haftalık rapor oluşturuldu",
      time: "3 saat önce",
      icon: "document-text-outline" as IconName,
    },
  ]);
  const [loading, setLoading] = useState(true);

  // Animasyon değerleri
  const headerAnim = useState(new Animated.Value(0))[0];
  const bannerAnim = useState(new Animated.Value(0))[0];
  const statsGridAnim = useState(new Animated.Value(0))[0];
  const quickActionsAnim = useState(new Animated.Value(0))[0];
  const activitiesAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const initializePanel = async () => {
      await fetchPanelData();
      Animated.stagger(150, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bannerAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(statsGridAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(quickActionsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(activitiesAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      setLoading(false);
    };
    initializePanel();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchPanelData();
    }, [params.refresh])
  );

  const fetchPanelData = async () => {
    try {
      // Fetch total users and active users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id");

      if (usersError) throw usersError;

      const totalUsers = usersData?.length || 0;

      // Fetch pending leave requests
      const { data: leaveData, error: leaveError } = await supabase
        .from("leave_requests")
        .select("id, status");

      if (leaveError) throw leaveError;

      const pendingLeaves =
        leaveData?.filter((req) => req.status === "pending").length || 0;

      setStats({
        totalUsers,
        pendingLeaves,
        totalRecords: totalUsers,
      });
    } catch (error) {
      console.error("Admin panel verileri yüklenirken hata oluştu:", error);
      Alert.alert("Hata", "Panel verileri yüklenirken bir sorun oluştu.");
    }
  };

  const quickActionItems = [
    {
      title: "Kullanıcı Yönetimi",
      icon: "people-outline" as IconName,
      route: "/admin/user-management",
      colors: ["#6dd5ed", "#2193b0"] as const,
    },
    {
      title: "Bekleyen İzinler",
      icon: "hourglass-outline" as IconName,
      route: "/pages/admin/pending-leaves",
      colors: ["#FFD700", "#FFA000"] as const,
    },
    {
      title: "Raporlar",
      icon: "bar-chart-outline" as IconName,
      route: "/admin/reports",
      colors: ["#4CAF50", "#45a049"] as const,
    },
    {
      title: "Sistem Ayarları",
      icon: "settings-outline" as IconName,
      route: "/admin/settings",
      colors: ["#ff6b6b", "#ee5253"] as const,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a00e0" />
        <Text style={styles.loadingText}>Yönetici Paneli Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["#4a00e0", "#8e2de2"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.headerTitle}>Yönetici Paneli</Text>
        <Text style={styles.headerSubtitle}>Tüm verilere genel bakış</Text>
      </Animated.View>

      {/* Pending Leave Requests Banner */}
      <Animated.View
        style={[
          styles.pendingRequestsBannerContainer,
          {
            opacity: bannerAnim,
            transform: [
              {
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.pendingRequestsBanner}
          onPress={() => router.push("/pages/admin/pending-leaves")}
        >
          <View style={styles.pendingRequestsContent}>
            <View style={styles.pendingRequestsLeft}>
              <View style={styles.pendingRequestsIconContainer}>
                <Ionicons name="hourglass-outline" size={24} color="#4a00e0" />
              </View>
              <View>
                <Text style={styles.pendingRequestsTitle}>
                  Bekleyen İzin İstekleri
                </Text>
                <Text style={styles.pendingRequestsSubtitle}>
                  {stats.pendingLeaves} yeni istek onay bekliyor
                </Text>
              </View>
            </View>
            <View style={styles.pendingRequestsRight}>
              <Ionicons name="chevron-forward" size={24} color="#4a00e0" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* QR Code Generation Banner */}
      <Animated.View
        style={[
          styles.pendingRequestsBannerContainer,
          {
            opacity: bannerAnim,
            transform: [
              {
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.pendingRequestsBanner}
          onPress={() => router.push("/pages/admin/generate-qr" as any)}
        >
          <View style={styles.pendingRequestsContent}>
            <View style={styles.pendingRequestsLeft}>
              <View style={styles.pendingRequestsIconContainer}>
                <Ionicons name="qr-code-outline" size={24} color="#4a00e0" />
              </View>
              <View>
                <Text style={styles.pendingRequestsTitle}>QR Kod Oluştur</Text>
                <Text style={styles.pendingRequestsSubtitle}>
                  Yeni bir QR kod oluştur ve paylaş
                </Text>
              </View>
            </View>
            <View style={styles.pendingRequestsRight}>
              <Ionicons name="chevron-forward" size={24} color="#4a00e0" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: statsGridAnim,
            transform: [
              {
                translateY: statsGridAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Genel İstatistikler</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="people-outline" size={30} color="#fff" />
            <View>
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statTitle}>Toplam Çalışan</Text>
            </View>
          </View>
          <View style={[styles.statCard, styles.statCardAccent1]}>
            <Ionicons name="briefcase-outline" size={30} color="#fff" />
            <View>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statTitle}>Aktif Projeler</Text>
            </View>
          </View>
          <View style={[styles.statCard, styles.statCardAccent2]}>
            <Ionicons name="calendar-outline" size={30} color="#fff" />
            <View>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statTitle}>Bugünkü İzinler</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: quickActionsAnim,
            transform: [
              {
                translateY: quickActionsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
        <View style={styles.quickActionsContainer}>
          {quickActionItems.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => router.push(action.route as any)}
            >
              <LinearGradient
                colors={action.colors}
                style={styles.quickActionButtonGradient}
              >
                <Ionicons name={action.icon} size={28} color="#fff" />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Recent Activities */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: activitiesAnim,
            transform: [
              {
                translateY: activitiesAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
        <View style={styles.activitiesContainer}>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Ionicons name={activity.icon} size={20} color="#4a00e0" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={30} color="#555" />
              <Text style={styles.infoCardText}>
                Henüz yeni faaliyet bulunmuyor.
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5", // Açık arka plan
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    height: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.9,
  },
  pendingRequestsBannerContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pendingRequestsBanner: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  pendingRequestsContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  pendingRequestsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingRequestsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74, 0, 224, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pendingRequestsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  pendingRequestsSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  pendingRequestsRight: {
    paddingLeft: 10,
  },
  section: {
    marginTop: 15,
    marginBottom: 25,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "column",
    gap: 12,
  },
  statCard: {
    width: "100%",
    backgroundColor: "#4a00e0",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardPrimary: {
    backgroundColor: "#4a00e0",
  },
  statCardAccent1: {
    backgroundColor: "#2193b0",
  },
  statCardAccent2: {
    backgroundColor: "#FF9800",
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 15,
  },
  statTitle: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    marginLeft: 15,
  },
  quickActionsContainer: {
    flexDirection: "column",
    gap: 12,
  },
  quickActionButton: {
    width: "100%",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  quickActionText: {
    color: "#fff",
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "600",
  },
  activitiesContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  activityIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  activityTime: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  infoCardText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
});
