import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  department: string;
}

export default function AdminHomeScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRecords: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<{
    full_name: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      await checkAdminAccess();
      await fetchUsersAndStats();
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
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        Alert.alert(
          "Erişim Engellendi",
          "Bu sayfaya erişim yetkiniz bulunmamaktadır."
        );
        router.replace("/(tabs)/(user)/home");
      } else {
        setAdminProfile(profile);
      }
    } catch (error) {
      console.error("Yönetici erişimi kontrol edilirken hata oluştu:", error);
      router.replace("/auth/login");
    }
  };

  const fetchUsersAndStats = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: leaveData, error: leaveError } = await supabase
        .from("leave_requests")
        .select("id, status");

      if (leaveError) throw leaveError;

      const totalPendingLeaves =
        leaveData?.filter((req) => req.status === "pending").length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        activeUsers: usersData?.filter((user) => user.is_active).length || 0,
        totalRecords: usersData?.length || 0,
        pendingLeaves: totalPendingLeaves,
      });
    } catch (error) {
      console.error(
        "Kullanıcılar ve istatistikler yüklenirken hata oluştu:",
        error
      );
      Alert.alert(
        "Hata",
        "Kullanıcı ve istatistik bilgileri yüklenirken bir hata oluştu."
      );
    }
  };

  const handleUserAction = async (
    userId: string,
    action: "activate" | "deactivate" | "delete"
  ) => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (userId === currentUser?.id) {
        Alert.alert("Hata", "Kendi yönetici hesabınızı değiştiremezsiniz.");
        return;
      }

      if (action === "delete") {
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (profileError) {
          console.error("Profil silme hatası:", profileError);
          Alert.alert(
            "Hata",
            "Kullanıcı profili silinemedi. Lütfen tekrar deneyin."
          );
          return;
        }

        const { error: authError } =
          await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.error("Auth kullanıcı silme hatası:", authError);
          Alert.alert(
            "Hata",
            "Auth kullanıcısı silinemedi. Lütfen tekrar deneyin."
          );
          return;
        }

        Alert.alert("Başarılı", "Kullanıcı başarıyla silindi.");
      } else {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_active: action === "activate" })
          .eq("id", userId);

        if (updateError) {
          console.error("Profil güncelleme hatası:", updateError);
          Alert.alert(
            "Hata",
            "Kullanıcı durumu güncellenemedi. Lütfen tekrar deneyin."
          );
          return;
        }
        Alert.alert(
          "Başarılı",
          `Kullanıcı durumu ${action === "activate" ? "aktif" : "pasif"} olarak güncellendi.`
        );
      }
      fetchUsersAndStats();
    } catch (error: any) {
      console.error("Kullanıcı eylem hatası:", error);
      Alert.alert(
        "Hata",
        error.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  const passwordCriteria = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+[]{}|;:,.<>?";
    let all = upper + lower + numbers + special;
    let password = "";
    password += upper[Math.floor(Math.random() * upper.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    for (let i = 3; i < 10; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsersAndStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a00e0" />
        <Text style={styles.loadingText}>Yönetici Paneli Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={["#4a00e0", "#8e2de2"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerContent}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="shield-checkmark-outline" size={60} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>
              Merhaba, {adminProfile?.full_name || "Yönetici"}!
            </Text>
            <Text style={styles.headerSubtitle}>
              Yönetici Paneline Hoş Geldiniz
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 70 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4a00e0"]}
            tintColor="#4a00e0"
          />
        }
      >
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Genel İstatistikler</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, styles.statItemPrimary]}>
              <Ionicons name="people-outline" size={30} color="#fff" />
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
            </View>
            <View style={[styles.statItem, styles.statItemSecondary]}>
              <Ionicons name="person-outline" size={30} color="#fff" />
              <Text style={styles.statValue}>{stats.activeUsers}</Text>
              <Text style={styles.statLabel}>Aktif Kullanıcı</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/pages/admin/pending-leaves")}
              style={[styles.statItem, styles.statItemAccent]}
            >
              <Ionicons name="hourglass-outline" size={30} color="#fff" />
              <Text style={styles.statValue}>{stats.pendingLeaves}</Text>
              <Text style={styles.statLabel}>Bekleyen İzinler</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Eylemler</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/pages/admin/create-leave-admin")}
            >
              <LinearGradient
                colors={["#FFD700", "#FFA000"]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="document-text-outline" size={28} color="#fff" />
                <Text style={styles.actionButtonText}>İzin Oluştur</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={["#4CAF50", "#45a049"]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="settings-outline" size={28} color="#fff" />
                <Text style={styles.actionButtonText}>Ayarlar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.sectionTitle}>Kullanıcı Yönetimi</Text>
            <TouchableOpacity
              onPress={fetchUsersAndStats}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f0f2f5",
                borderRadius: 20,
                paddingVertical: 6,
                paddingHorizontal: 14,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="refresh"
                size={18}
                color="#4a00e0"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{ color: "#4a00e0", fontWeight: "bold", fontSize: 14 }}
              >
                Yenile
              </Text>
            </TouchableOpacity>
          </View>
          {users.length > 0 ? (
            users.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#666"
                    style={styles.userAvatar}
                  />
                  <View>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userDepartment}>{user.department}</Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  {user.id !== currentUserId && user.role !== "admin" && (
                    <>
                      {user.is_active ? (
                        <TouchableOpacity
                          style={[
                            styles.actionButtonSmall,
                            styles.deactivateButton,
                          ]}
                          onPress={() =>
                            handleUserAction(user.id, "deactivate")
                          }
                        >
                          <Ionicons
                            name="pause-outline"
                            size={20}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.actionButtonSmall,
                            styles.activateButton,
                          ]}
                          onPress={() => handleUserAction(user.id, "activate")}
                        >
                          <Ionicons
                            name="play-outline"
                            size={20}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionButtonSmall, styles.deleteButton]}
                        onPress={() => handleUserAction(user.id, "delete")}
                      >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                      </TouchableOpacity>
                    </>
                  )}
                  <View
                    style={[
                      styles.userRoleBadge,
                      user.role === "admin"
                        ? styles.adminBadge
                        : styles.userBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.userRoleText,
                        user.role === "admin" && styles.adminRoleText,
                      ]}
                    >
                      {user.role === "admin" ? "Yönetici" : "Kullanıcı"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.infoCard}>
              <Ionicons name="people-outline" size={30} color="#555" />
              <Text style={styles.infoCardText}>
                Henüz kullanıcı bulunmuyor.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4a00e0",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 25,
    paddingTop: 70,
    justifyContent: "flex-start",
    flexWrap: "nowrap",
    height: "100%",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 5,
    textAlign: "left",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "left",
  },
  section: {
    marginBottom: 25,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 15,
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
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    gap: 15,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItemPrimary: {
    backgroundColor: "#4a00e0",
  },
  statItemSecondary: {
    backgroundColor: "#8e2de2",
  },
  statItemAccent: {
    backgroundColor: "#2193b0",
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 5,
  },
  statLabel: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    opacity: 0.9,
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
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.7,
    marginRight: 8,
  },
  userAvatar: {
    marginRight: 8,
    backgroundColor: "#f8f9fa",
    padding: 6,
    borderRadius: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 11,
    color: "#636e72",
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 10,
    color: "#b2bec3",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    alignSelf: "flex-start",
  },
  userActions: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    flex: 0.3,
    justifyContent: "flex-end",
  },
  actionButtonSmall: {
    padding: 5,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activateButton: {
    backgroundColor: "#00b894",
  },
  deactivateButton: {
    backgroundColor: "#fdcb6e",
  },
  deleteButton: {
    backgroundColor: "#ff7675",
  },
  userRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 4,
  },
  userRoleText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  adminBadge: {
    backgroundColor: "#6c5ce7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  adminRoleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  userBadge: {
    backgroundColor: "#0984e3",
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
  content: {
    flex: 1,
    paddingTop: 180,
  },
  statsSection: {
    marginTop: 20,
    marginBottom: 25,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
});
