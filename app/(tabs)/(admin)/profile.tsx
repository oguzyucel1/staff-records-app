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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  department: string;
}

export default function AdminProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const headerAnim = useState(new Animated.Value(0))[0];
  const profileInfoAnim = useState(new Animated.Value(0))[0];
  const settingsAnim = useState(new Animated.Value(0))[0];
  const signOutAnim = useState(new Animated.Value(0))[0];

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

  const checkUserRole = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (!profile || profile.role !== "admin") {
        Alert.alert(
          "Erişim Engellendi",
          "Bu sayfaya erişim yetkiniz bulunmamaktadır."
        );
        router.replace("/(tabs)/(user)/home");
      }
    } catch (error) {
      console.error("Kullanıcı rolü kontrol edilirken hata oluştu:", error);
      router.replace("/auth/login");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Kullanıcı bulunamadı");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;
      setUser(profile);
    } catch (error) {
      console.error("Profil yüklenirken hata oluştu:", error);
      Alert.alert("Hata", "Profil bilgileri yüklenirken bir hata oluştu.");
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth/login");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
      Alert.alert("Hata", "Çıkış yapılırken bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a00e0" />
        <Text style={styles.loadingText}>Yönetici Profil Yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>Yönetici Profilim</Text>
        <Text style={styles.headerSubtitle}>
          Hesap bilgilerinizi ve ayarlarınızı yönetin
        </Text>
      </Animated.View>

      <View style={styles.content}>
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
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons
                name="person-circle-outline"
                size={80}
                color="#4a00e0"
              />
            </View>
            <Text style={styles.userName}>{user?.full_name || "Yönetici"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRoleBadge}>
              <Text style={styles.userRoleText}>
                {user?.role === "admin" ? "Yönetici" : "Çalışan"}
              </Text>
            </Text>
            {user?.department && (
              <Text style={styles.userDepartment}>
                <Ionicons name="business-outline" size={16} color="#777" />{" "}
                {user.department}
              </Text>
            )}
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
            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="person-outline" size={24} color="#4a00e0" />
              <Text style={styles.settingText}>Profili Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="lock-closed-outline" size={24} color="#4a00e0" />
              <Text style={styles.settingText}>Şifreyi Değiştir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#4a00e0"
              />
              <Text style={styles.settingText}>Bildirimler</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            {
              opacity: signOutAnim,
              transform: [
                {
                  translateY: signOutAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.signOutText}>Çıkış Yap</Text>
          </TouchableOpacity>
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
  profileHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 15,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#4a00e0",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#777",
    marginBottom: 10,
  },
  userRoleBadge: {
    backgroundColor: "#4a00e0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  userRoleText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  userDepartment: {
    fontSize: 15,
    color: "#555",
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  settingsContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 15,
  },
  settingText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f44336",
    marginHorizontal: 20,
    marginTop: 15,
    padding: 18,
    borderRadius: 15,
    gap: 15,
    shadowColor: "#f44336",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 100,
  },
  signOutText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});
