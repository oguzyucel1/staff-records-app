import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import LeaveRequestCard from "../../../components/LeaveRequestCard";
import { LeaveRequest } from "../../../types/leave";
import { useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");

export default function UserExploreScreen() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams();

  useEffect(() => {
    checkUserRole();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchLeaveRequests();
    }, [params.refresh])
  );

  const checkUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        router.replace("/(tabs)/(admin)/home");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      router.replace("/auth/login");
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        setLoading(false);
        return;
      }

      console.log("Fetching leave requests for user:", user.id);
      const { data, error } = await supabase
        .from("leave_requests")
        .select(
          `
          *,
          profiles:user_id (full_name, email, department),
          replaced_lecturer_profile:replaced_lecturer (full_name, email, department)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Fetched leave requests:", data);
      setLeaveRequests(data || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Keşfet</Text>
          <Text style={styles.headerSubtitle}>
            Hızlı erişim ve güncel bilgiler
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Ana Aksiyon Kartı */}
          <TouchableOpacity
            style={styles.mainActionCard}
            onPress={() => router.push("/pages/user/create-leave")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#ff6b6b", "#ee5a24"]}
              style={styles.mainActionGradient}
            >
              <View style={styles.mainActionContent}>
                <View style={styles.mainActionIconContainer}>
                  <Ionicons name="calendar-outline" size={32} color="#fff" />
                </View>
                <View style={styles.mainActionTextContainer}>
                  <Text style={styles.mainActionTitle}>Yeni İzin Talebi</Text>
                  <Text style={styles.mainActionSubtitle}>
                    Hızlıca izin talebinizi oluşturun
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Giriş/Çıkış Kartları */}
          <View style={styles.attendanceContainer}>
            <TouchableOpacity
              style={styles.attendanceCard}
              onPress={() =>
                router.push("/pages/user/scan-attendance?type=giris")
              }
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#4CAF50", "#45a049"]}
                style={styles.attendanceGradient}
              >
                <Ionicons name="log-in-outline" size={28} color="#fff" />
                <Text style={styles.attendanceText}>Giriş Yap</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attendanceCard}
              onPress={() =>
                router.push("/pages/user/scan-attendance?type=cikis")
              }
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#F44336", "#d32f2f"]}
                style={styles.attendanceGradient}
              >
                <Ionicons name="log-out-outline" size={28} color="#fff" />
                <Text style={styles.attendanceText}>Çıkış Yap</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Kayıtlarım Butonu */}
          <TouchableOpacity
            style={styles.logsCard}
            onPress={() => router.push("/pages/user/attendance-logs")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#2196F3", "#1976D2"]}
              style={styles.logsGradient}
            >
              <View style={styles.logsContent}>
                <Ionicons name="list-outline" size={24} color="#fff" />
                <Text style={styles.logsText}>Kayıtlarım</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* İzin Taleplerim Bölümü */}
          <View style={styles.leaveSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>İzin Taleplerim</Text>
              <TouchableOpacity
                onPress={() => router.push("/pages/user/all-leaves")}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>Tümünü Gör</Text>
                <Ionicons name="arrow-forward" size={16} color="#667eea" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : leaveRequests.length > 0 ? (
              <View style={styles.leaveList}>
                {leaveRequests.slice(0, 3).map((request) => (
                  <LeaveRequestCard key={request.id} request={request} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>Henüz İzin Talebiniz Yok</Text>
                <Text style={styles.emptySubtitle}>
                  İzin talebi oluşturmak için yukarıdaki butonu kullanın
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  mainActionCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  mainActionGradient: {
    padding: 24,
  },
  mainActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mainActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  mainActionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  mainActionSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  attendanceContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  attendanceCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  attendanceGradient: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  attendanceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  logsCard: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logsGradient: {
    padding: 20,
  },
  logsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
  },
  leaveSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  leaveList: {
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7f8c8d",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    lineHeight: 20,
  },
});
