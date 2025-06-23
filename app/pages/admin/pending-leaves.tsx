import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import LeaveRequestCard from "../../components/LeaveRequestCard";
import { LeaveRequest } from "../../../types/leave";
import { NotificationService } from "../../../lib/notificationService";

export default function PendingLeaves() {
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchLeaveRequests();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      console.log("Fetching pending leave requests...");
      const { data, error } = await supabase
        .from("leave_requests")
        .select(
          `
          *,
          profiles!user_id(full_name, email, department)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leave requests:", error);
        throw error;
      }

      console.log("Fetched data:", JSON.stringify(data, null, 2));
      setLeaveRequests(data || []);
    } catch (error) {
      console.error("Error in fetchLeaveRequests:", error);
      Alert.alert("Hata", "İzin talepleri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // İzin talebini onayla
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (error) throw error;

      // İzin talebini bul
      const leaveRequest = leaveRequests.find((req) => req.id === requestId);
      if (leaveRequest) {
        // Kullanıcıya bildirim gönder
        await NotificationService.createLeaveNotification(
          leaveRequest.user_id,
          requestId,
          leaveRequest.leave_type,
          leaveRequest.start_date,
          leaveRequest.end_date,
          true // approved
        );
      }

      // Listeyi güncelle
      setLeaveRequests((prev) => prev.filter((req) => req.id !== requestId));
      Alert.alert(
        "Başarılı",
        "İzin talebi onaylandı ve kullanıcıya bildirim gönderildi."
      );
    } catch (error) {
      console.error("Error approving leave request:", error);
      Alert.alert("Hata", "İzin talebi onaylanırken bir hata oluştu.");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      // İzin talebini reddet
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      // İzin talebini bul
      const leaveRequest = leaveRequests.find((req) => req.id === requestId);
      if (leaveRequest) {
        // Kullanıcıya bildirim gönder
        await NotificationService.createLeaveNotification(
          leaveRequest.user_id,
          requestId,
          leaveRequest.leave_type,
          leaveRequest.start_date,
          leaveRequest.end_date,
          false // rejected
        );
      }

      // Listeyi güncelle
      setLeaveRequests((prev) => prev.filter((req) => req.id !== requestId));
      Alert.alert(
        "Başarılı",
        "İzin talebi reddedildi ve kullanıcıya bildirim gönderildi."
      );
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      Alert.alert("Hata", "İzin talebi reddedilirken bir hata oluştu.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Bekleyen İzin Talepleri</Text>
            <Text style={styles.headerSubtitle}>İzin taleplerini yönetin</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a00e0" />
            <Text style={styles.loadingText}>İzin talepleri yükleniyor...</Text>
          </View>
        ) : leaveRequests.length > 0 ? (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={24} color="#4a00e0" />
                <Text style={styles.statNumber}>{leaveRequests.length}</Text>
                <Text style={styles.statLabel}>Bekleyen Talep</Text>
                <TouchableOpacity
                  style={styles.allLeavesButton}
                  onPress={() =>
                    router.push({ pathname: "/pages/admin/all-leaves" })
                  }
                >
                  <Text style={styles.allLeavesButtonText}>
                    Tüm İzinleri Görüntüle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {leaveRequests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                showActions={true}
                onApprove={() => handleApprove(request.id)}
                onReject={() => handleReject(request.id)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#4a00e0", "#8e2de2"]}
              style={styles.emptyIconContainer}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color="#fff"
              />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Tüm Talepler Tamamlandı!</Text>
            <Text style={styles.emptyText}>
              Şu anda bekleyen izin talebi bulunmuyor.
            </Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a00e0",
    marginLeft: 15,
    marginRight: 5,
  },
  statLabel: {
    fontSize: 16,
    color: "#666",
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
  allLeavesButton: {
    marginLeft: "auto",
    backgroundColor: "#4a00e0",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  allLeavesButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
