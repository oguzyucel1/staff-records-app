import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";

export default function AllLeaves() {
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchAllLeaves();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchAllLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from("leave_requests")
        .select(`*, profiles!user_id(full_name, email, department)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error("Error fetching all leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "#FFD600",
    approved: "#4CAF50",
    rejected: "#F44336",
  };
  const statusLabels: Record<string, string> = {
    pending: "Beklemede",
    approved: "Onaylandı",
    rejected: "Reddedildi",
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons
            name="arrow-back"
            size={28}
            color="#fff"
            style={styles.backButton}
            onPress={() => router.back()}
          />
          <View>
            <Text style={styles.headerTitle}>Tüm İzin Talepleri</Text>
            <Text style={styles.headerSubtitle}>
              Tüm izin taleplerinin detaylı listesi
            </Text>
          </View>
        </View>
      </LinearGradient>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a00e0" />
            <Text style={styles.loadingText}>Tüm izinler yükleniyor...</Text>
          </View>
        ) : leaveRequests.length > 0 ? (
          leaveRequests.map((req) => (
            <View key={req.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle" size={36} color="#4a00e0" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>
                    {req.profiles?.full_name || "-"}
                  </Text>
                  <Text style={styles.email}>{req.profiles?.email || "-"}</Text>
                  <Text style={styles.department}>
                    {req.profiles?.department || "-"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors[req.status] || "#ccc" },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {statusLabels[req.status] || req.status}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <Ionicons name="calendar-outline" size={18} color="#8e2de2" />
                  <Text style={styles.bodyText}>
                    {new Date(req.start_date).toLocaleDateString("tr-TR")} -{" "}
                    {new Date(req.end_date).toLocaleDateString("tr-TR")}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#8e2de2"
                  />
                  <Text style={styles.bodyText}>{req.leave_type}</Text>
                </View>
                <View style={styles.row}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color="#8e2de2"
                  />
                  <Text style={styles.bodyText}>{req.reason}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#aaa" />
            <Text style={styles.emptyText}>Hiç izin talebi bulunamadı.</Text>
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
    marginTop: 2,
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 13,
    color: "#666",
  },
  department: {
    fontSize: 13,
    color: "#8e2de2",
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  statusBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  cardBody: {
    marginTop: 6,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  bodyText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#444",
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
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
});
