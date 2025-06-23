import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function UserHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    full_name: string;
    email: string;
    role: string;
  } | null>(null);

  const headerAnim = useState(new Animated.Value(0))[0];
  const statsAnim = useState(new Animated.Value(0))[0];
  const actionsAnim = useState(new Animated.Value(0))[0];
  const activityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const initializePage = async () => {
      await checkUserRole();
      await fetchUserProfile();
      Animated.stagger(150, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(statsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(actionsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(activityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      setLoading(false);
    };
    initializePage();
  }, []);

  const checkUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .single();

      if (userProfile?.role === "admin") {
        router.replace("/(tabs)/(admin)/home");
      } else {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      router.replace("/auth/login");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, email, role")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e2de2" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
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
        <View style={styles.headerContent}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-circle-outline" size={60} color="#fff" />
          </View>
          <View style={{ flex: 1, flexShrink: 1 }}>
            <Text style={styles.welcomeText}>
              Merhaba, {profile?.full_name || "Kullanıcı"}!
            </Text>
            <Text style={styles.headerSubtitle}>Gününüz nasıl gidiyor?</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.section,
          {
            opacity: statsAnim,
            transform: [
              {
                translateY: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Hızlı İstatistikler</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={30} color="#2193b0" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Bugün Saat</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={30} color="#2193b0" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Bu Hafta Gün</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={30}
              color="#2193b0"
            />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Tamamlanan Görev</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.section,
          {
            opacity: actionsAnim,
            transform: [
              {
                translateY: actionsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Hızlı Eylemler</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#6dd5ed", "#2193b0"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="timer-outline" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Giriş/Çıkış</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#FFD700", "#FFA000"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="document-text-outline" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Rapor Gönder</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#4CAF50", "#45a049"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="calendar-outline" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Takvimi Görüntüle</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.section,
          {
            opacity: activityAnim,
            transform: [
              {
                translateY: activityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Son Etkinlikler</Text>
        <View style={styles.infoCard}>
          <Ionicons name="hourglass-outline" size={30} color="#555" />
          <Text style={styles.infoCardText}>Henüz bir etkinlik yok.</Text>
        </View>
      </Animated.View>
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
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 25,
    paddingTop: 70,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  welcomeText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.9,
  },
  section: {
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
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#eee",
  },
  statValue: {
    color: "#333",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 5,
  },
  statLabel: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 15,
  },
  actionButton: {
    flex: 1,
    minWidth: "30%",
    aspectRatio: 1,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  actionButtonText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
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
});
