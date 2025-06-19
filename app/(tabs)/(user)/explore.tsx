import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import LeaveRequestCard from "../../../components/LeaveRequestCard";
import { LeaveRequest } from "../../../types/leave";
import { useFocusEffect } from "expo-router";

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
          profiles:user_id (full_name, email, department)
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
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <Text style={styles.headerTitle}>Keşfet</Text>
        <Text style={styles.headerSubtitle}>
          Güncel bilgileri ve hızlı erişimleri görün
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* İzin Talebi Butonu */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/pages/user/create-leave")}
        >
          <LinearGradient
            colors={["#6dd5ed", "#2193b0"]}
            style={styles.actionCardGradient}
          >
            <Ionicons name="calendar-outline" size={30} color="#fff" />
            <Text style={styles.actionCardTitle}>Yeni İzin Talebi</Text>
            <Text style={styles.actionCardSubtitle}>Hızlıca izin alın</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Giriş/Çıkış Butonları */}
        <View style={styles.attendanceRow}>
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              { backgroundColor: "#4CAF50", marginRight: 12 },
            ]}
            onPress={() =>
              router.push("/pages/user/scan-attendance?type=giris")
            }
          >
            <Ionicons name="log-in-outline" size={36} color="#fff" />
            <Text style={styles.attendanceButtonText}>Giriş</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, { backgroundColor: "#F44336" }]}
            onPress={() =>
              router.push("/pages/user/scan-attendance?type=cikis")
            }
          >
            <Ionicons name="log-out-outline" size={36} color="#fff" />
            <Text style={styles.attendanceButtonText}>Çıkış</Text>
          </TouchableOpacity>
        </View>

        {/* Kayıtlarım Butonu */}
        <TouchableOpacity
          style={styles.logsButton}
          onPress={() => router.push("/pages/user/attendance-logs")}
        >
          <Ionicons name="list-outline" size={28} color="#fff" />
          <Text style={styles.logsButtonText}>Kayıtlarım</Text>
        </TouchableOpacity>

        {/* Bekleyen İzinlerim */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İzin Taleplerim</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6dd5ed" />
            </View>
          ) : leaveRequests.length > 0 ? (
            leaveRequests.map((request) => (
              <LeaveRequestCard key={request.id} request={request} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#bbb" />
              <Text style={styles.emptyText}>
                Henüz izin talebiniz bulunmuyor.
              </Text>
            </View>
          )}
        </View>

        {/* Hızlı Erişim */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="time-outline" size={28} color="#fff" />
              <Text style={styles.quickAccessText}>Zaman Takibi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="document-text-outline" size={28} color="#fff" />
              <Text style={styles.quickAccessText}>Raporlar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="calendar-outline" size={28} color="#fff" />
              <Text style={styles.quickAccessText}>Takvim</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="people-outline" size={28} color="#fff" />
              <Text style={styles.quickAccessText}>Ekip</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Son Raporlar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Raporlar</Text>
          <View style={styles.infoCard}>
            <Ionicons name="bar-chart-outline" size={30} color="#555" />
            <Text style={styles.infoCardText}>Henüz rapor bulunmuyor.</Text>
          </View>
        </View>

        {/* Yaklaşan Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
          <View style={styles.infoCard}>
            <Ionicons name="alarm-outline" size={30} color="#555" />
            <Text style={styles.infoCardText}>Yaklaşan bir etkinlik yok.</Text>
          </View>
        </View>

        {/* Takım Güncellemeleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Takım Güncellemeleri</Text>
          <View style={styles.infoCard}>
            <Ionicons name="chatbubbles-outline" size={30} color="#555" />
            <Text style={styles.infoCardText}>
              Henüz takım güncellemesi yok.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5", // Açık arka plan
  },
  header: {
    padding: 30,
    paddingTop: 70,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 7,
    backgroundColor: "#4a00e0",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.08)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 17,
    opacity: 0.92,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 2,
  },
  content: {
    paddingHorizontal: 20,
  },
  actionCard: {
    marginBottom: 28,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  actionCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 28,
    justifyContent: "center",
    flexWrap: "wrap",
    borderRadius: 18,
  },
  actionCardTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 16,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  actionCardSubtitle: {
    color: "#fff",
    fontSize: 15,
    marginTop: 6,
    opacity: 0.85,
    textAlign: "center",
    width: "100%",
    fontWeight: "500",
  },
  section: {
    marginBottom: 28,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#4a00e0",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 18,
    paddingVertical: 12,
  },
  quickAccessItem: {
    width: 120,
    backgroundColor: "#6dd5ed",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  quickAccessText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  emptyText: {
    marginTop: 18,
    fontSize: 17,
    color: "#888",
    textAlign: "center",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 4,
  },
  infoCardText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    fontWeight: "500",
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  attendanceButton: {
    flex: 1,
    backgroundColor: "#4a00e0",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
    elevation: 4,
  },
  attendanceButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    letterSpacing: 0.2,
  },
  logsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a00e0",
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
    elevation: 4,
    gap: 12,
  },
  logsButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
});
