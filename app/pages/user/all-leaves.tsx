import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import LeaveRequestCard from "../../../components/LeaveRequestCard";
import { LeaveRequest } from "../../../types/leave";
import { useFocusEffect } from "expo-router";

export default function AllLeavesScreen() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchAllLeaveRequests();
    }, [])
  );

  const fetchAllLeaveRequests = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        setLoading(false);
        return;
      }

      console.log("Fetching all leave requests for user:", user.id);
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

      console.log("Fetched all leave requests:", data);
      setLeaveRequests(data || []);
    } catch (error) {
      console.error("Error fetching all leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tüm İzin Taleplerim</Text>
        <Text style={styles.headerSubtitle}>
          Geçmiş tüm izin kayıtlarınızı görüntüleyin
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6dd5ed" />
            <Text style={styles.loadingText}>İzin talepleri yükleniyor...</Text>
          </View>
        ) : leaveRequests.length > 0 ? (
          <View style={styles.leaveList}>
            {leaveRequests.map((request) => (
              <LeaveRequestCard key={request.id} request={request} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color="#bbb" />
            <Text style={styles.emptyTitle}>Henüz İzin Talebiniz Yok</Text>
            <Text style={styles.emptyText}>
              İzin talebi oluşturarak başlayabilirsiniz.
            </Text>
            <TouchableOpacity
              style={styles.createLeaveButton}
              onPress={() => router.push("/pages/user/create-leave")}
            >
              <Text style={styles.createLeaveButtonText}>
                İzin Talebi Oluştur
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    padding: 30,
    paddingTop: 70,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 7,
  },
  backButton: {
    position: "absolute",
    top: 70,
    left: 30,
    zIndex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.92,
    textAlign: "center",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  leaveList: {
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  createLeaveButton: {
    backgroundColor: "#4a00e0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createLeaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
