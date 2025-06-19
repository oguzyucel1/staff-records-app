import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function AdminExploreScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingLeaves: 0,
  });

  const headerAnim = useState(new Animated.Value(0))[0];
  const quickAccessAnim = useState(new Animated.Value(0))[0];
  const systemStatusAnim = useState(new Animated.Value(0))[0];
  const recentActivitiesAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const initializePage = async () => {
      await checkAdminAccess();
      Animated.stagger(150, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(quickAccessAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(systemStatusAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recentActivitiesAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      setLoading(false);
    };
    initializePage();
  }, []);

  const checkAdminAccess = async () => {
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

      if (profile?.role !== "admin") {
        Alert.alert(
          "Erişim Engellendi",
          "Bu sayfaya erişim yetkiniz bulunmamaktadır."
        );
        router.replace("/(tabs)/(user)/home");
      }
    } catch (error) {
      console.error("Yönetici erişimi kontrol edilirken hata oluştu:", error);
      router.replace("/auth/login");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a00e0" />
        <Text style={styles.loadingText}>Yönetici Keşfet Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.headerTitle}>Yönetici Keşfet</Text>
        <Text style={styles.headerSubtitle}>
          Sistem genelindeki bilgilere hızlı erişim
        </Text>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.section,
            {
              opacity: quickAccessAnim,
              transform: [
                {
                  translateY: quickAccessAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="time-outline" size={32} color="#4a00e0" />
              <Text style={styles.quickAccessText}>Zaman Takibi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color="#4a00e0"
              />
              <Text style={styles.quickAccessText}>Raporlar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="calendar-outline" size={32} color="#4a00e0" />
              <Text style={styles.quickAccessText}>Takvim</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="people-outline" size={32} color="#4a00e0" />
              <Text style={styles.quickAccessText}>Ekip</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: systemStatusAnim,
              transform: [
                {
                  translateY: systemStatusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Sistem Durumu</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Ionicons name="server-outline" size={30} color="#28a745" />
              <Text style={styles.statusText}>Sunucu: Aktif</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons
                name="shield-checkmark-outline"
                size={30}
                color="#28a745"
              />
              <Text style={styles.statusText}>Güvenlik: Aktif</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="cloud-done-outline" size={30} color="#28a745" />
              <Text style={styles.statusText}>Veritabanı: Bağlı</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: recentActivitiesAnim,
              transform: [
                {
                  translateY: recentActivitiesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Son Faaliyetler</Text>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={30} color="#555" />
            <Text style={styles.infoCardText}>
              Henüz yeni faaliyet bulunmuyor.
            </Text>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  section: {
    marginBottom: 25,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
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
  quickAccessContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  quickAccessItem: {
    width: "48%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    aspectRatio: 1.2,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  quickAccessGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  quickAccessText: {
    color: "#333",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
  },
  statusItem: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
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
  pendingRequestsBanner: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
});
