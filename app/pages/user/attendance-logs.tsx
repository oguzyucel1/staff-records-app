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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";

export default function AttendanceLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("scanned_at", { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    giris: "#4CAF50",
    cikis: "#F44336",
  };
  const statusLabels: Record<string, string> = {
    giris: "Giriş",
    cikis: "Çıkış",
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kayıtlarım</Text>
      </LinearGradient>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a00e0" />
            <Text style={styles.loadingText}>Kayıtlar yükleniyor...</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#aaa" />
            <Text style={styles.emptyText}>
              Henüz giriş/çıkış kaydınız yok.
            </Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logCardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors[log.type] || "#888" },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {statusLabels[log.type] || log.type}
                  </Text>
                </View>
                <Text style={styles.logDate}>
                  {log.scanned_at
                    ? new Date(log.scanned_at).toLocaleDateString("tr-TR")
                    : "-"}
                </Text>
                <Text style={styles.logTime}>
                  {log.scanned_at
                    ? new Date(log.scanned_at).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </Text>
              </View>
              <View style={styles.logCardBody}>
                <Ionicons name="calendar-outline" size={18} color="#4a00e0" />
                <Text style={styles.logCardText}>
                  {log.qr_date
                    ? new Date(log.qr_date).toLocaleDateString("tr-TR")
                    : "-"}
                </Text>
              </View>
            </View>
          ))
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
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  logCard: {
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
  logCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  logDate: {
    fontSize: 15,
    color: "#333",
    fontWeight: "bold",
  },
  logTime: {
    fontSize: 15,
    color: "#4a00e0",
    fontWeight: "bold",
  },
  logCardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logCardText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#444",
  },
});
