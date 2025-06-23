import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useNotifications } from "../../../hooks/useNotifications";
import { useFocusEffect } from "@react-navigation/native";

export default function UserProfileScreen() {
  const [profile, setProfile] = useState<{
    full_name: string;
    email: string;
    role: string;
    department?: string;
    password_changed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const headerAnim = useState(new Animated.Value(0))[0];
  const profileInfoAnim = useState(new Animated.Value(0))[0];
  const settingsAnim = useState(new Animated.Value(0))[0];
  const signOutAnim = useState(new Animated.Value(0))[0];

  const { count: notificationCount } = useNotifications(userId || "");

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
        Animated.timing(profileInfoAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(settingsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(signOutAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      setLoading(false);
    };
    initializePage();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
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

      setUserId(user.id);

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role, full_name, email, department, password_changed")
        .eq("id", user.id)
        .single();

      if (userProfile?.role === "admin") {
        router.replace("/(tabs)/(admin)/home");
      }
      setProfile(userProfile);
    } catch (error) {
      console.error("Error checking user role:", error);
      router.replace("/auth/login");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("No user found");

      const { data: userProfile, error } = await supabase
        .from("profiles")
        .select("full_name, email, role, department, password_changed")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;
      setProfile(userProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Hata", "Profil yüklenirken bir hata oluştu.");
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Hata", "Çıkış yapılırken bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e2de2" />
        <Text style={styles.loadingText}>Profil Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 70 }}
    >
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
            <Ionicons name="person-circle-outline" size={80} color="#fff" />
          </View>
          <View style={{ flex: 1, flexShrink: 1 }}>
            <Text
              style={[
                styles.welcomeText,
                { flexWrap: "wrap", textAlign: "left", width: "100%" },
              ]}
              ellipsizeMode="tail"
            >
              Hoş Geldin, {profile?.full_name || "Kullanıcı"}!
            </Text>
            <Text style={styles.headerSubtitle}>Profil Bilgilerin</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.section,
          {
            opacity: profileInfoAnim,
            transform: [
              {
                translateY: profileInfoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={22} color="#666" />
          <Text style={styles.infoText}>{profile?.email || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={22} color="#666" />
          <Text style={styles.infoText}>
            Departman: {profile?.department || "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={22} color="#666" />
          <Text style={styles.infoText}>
            Rol: {profile?.role === "user" ? "Çalışan" : "Yönetici"}
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.section,
          {
            opacity: settingsAnim,
            transform: [
              {
                translateY: settingsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Hesap Ayarları</Text>
        <View style={styles.settingsContainer}>
          <View style={{ marginBottom: 2 }}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push("/pages/user/change-password")}
            >
              <Ionicons name="key-outline" size={24} color="#2193b0" />
              <Text style={styles.settingText}>Şifreyi Değiştir</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
                style={styles.settingArrow}
              />
            </TouchableOpacity>
            {profile && profile.password_changed === false && (
              <View
                style={{
                  backgroundColor: "#fff3cd",
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderTopWidth: 0,
                  borderColor: "#ffeeba",
                  borderTopColor: "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: -2,
                }}
              >
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#856404"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#856404",
                    fontWeight: "bold",
                    fontSize: 13,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  Lütfen güvenliğiniz için şifrenizi değiştirin!
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/pages/user/notifications" as any)}
          >
            <Ionicons name="notifications-outline" size={24} color="#2193b0" />
            <Text style={styles.settingText}>Bildirimlerim</Text>
            {notificationCount.unread > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount.unread > 99
                    ? "99+"
                    : notificationCount.unread}
                </Text>
              </View>
            )}
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#999"
              style={styles.settingArrow}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="timer-outline" size={24} color="#2193b0" />
            <Text style={styles.settingText}>Zaman Takibi Ayarları</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#999"
              style={styles.settingArrow}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.signOutButtonContainer,
          {
            opacity: signOutAnim,
            transform: [
              {
                translateY: signOutAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LinearGradient
            colors={["#ff6b6b", "#ee5253"]}
            style={styles.signOutButtonGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.signOutText}>Çıkış Yap</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    height: 200,
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
    paddingTop: 80,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 3,
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
    fontSize: 18,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 15,
  },
  settingsContainer: {
    // No specific container style needed as items will define their own padding
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  settingText: {
    fontSize: 17,
    color: "#333",
    marginLeft: 15,
    flex: 1,
  },
  settingArrow: {
    marginLeft: "auto",
  },
  notificationBadge: {
    backgroundColor: "#ff4757",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  signOutButtonContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  signOutButton: {
    width: "100%",
  },
  signOutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  signOutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
