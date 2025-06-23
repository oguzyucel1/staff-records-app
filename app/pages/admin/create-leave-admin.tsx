import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { LeaveRequest } from "../../../types/leave";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

export default function CreateLeaveAdminScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [replacedLecturer, setReplacedLecturer] = useState<UserProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lecturerSearchQuery, setLecturerSearchQuery] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  // Form fields
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [courseCode, setCourseCode] = useState("");
  const [reason, setReason] = useState("");

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"start" | "end">("start");
  const [markedDates, setMarkedDates] = useState({});
  const fadeAnim = useState(new Animated.Value(0))[0];

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      // Get current admin user first
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser();

      if (!adminUser) {
        Alert.alert("Hata", "Oturum bilgisi bulunamadı.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, department")
        .neq("id", adminUser.id) // Exclude current admin user
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
      setCurrentAdminId(adminUser.id);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Hata", "Kullanıcılar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    const selectedDate = new Date(date);

    if (calendarMode === "start") {
      setStartDate(selectedDate);
      setCalendarMode("end");
      updateMarkedDates(selectedDate, endDate);
    } else {
      if (startDate && selectedDate < startDate) {
        Alert.alert("Hata", "Bitiş tarihi başlangıç tarihinden önce olamaz!");
        return;
      }
      setEndDate(selectedDate);
      updateMarkedDates(startDate, selectedDate);
      setShowCalendar(false);
    }
  };

  const updateMarkedDates = (start: Date | null, end: Date | null) => {
    if (!start) return;

    const marked: any = {
      [start.toISOString().split("T")[0]]: {
        selected: true,
        startingDay: true,
        color: "#4a00e0",
      },
    };

    if (end) {
      marked[end.toISOString().split("T")[0]] = {
        selected: true,
        endingDay: true,
        color: "#4a00e0",
      };

      // Aradaki günleri işaretle
      const current = new Date(start);
      while (current < end) {
        current.setDate(current.getDate() + 1);
        const dateStr = current.toISOString().split("T")[0];
        if (dateStr !== end.toISOString().split("T")[0]) {
          marked[dateStr] = {
            selected: true,
            color: "#4a00e0",
          };
        }
      }
    }

    setMarkedDates(marked);
  };

  const selectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserModal(false);
    setSearchQuery("");
  };

  const selectLecturer = (user: UserProfile) => {
    setReplacedLecturer(user);
    setShowLecturerModal(false);
    setLecturerSearchQuery("");
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Tarih seçin";
    return date.toLocaleDateString("tr-TR");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      Alert.alert("Hata", "Lütfen bir kullanıcı seçin.");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Hata", "Lütfen başlangıç ve bitiş tarihlerini seçin.");
      return;
    }

    if (!courseCode.trim()) {
      Alert.alert("Hata", "Lütfen ders kodunu girin.");
      return;
    }

    if (!replacedLecturer) {
      Alert.alert("Hata", "Lütfen yerine gelecek hocayı seçin.");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Hata", "Lütfen izin nedenini girin.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser();

      if (!adminUser) {
        Alert.alert("Hata", "Oturum bilgisi bulunamadı.");
        return;
      }

      const { error } = await supabase.from("leave_requests").insert({
        user_id: selectedUser.id,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        start_time: startTime.toTimeString().split(" ")[0],
        end_time: endTime.toTimeString().split(" ")[0],
        course_code: courseCode.trim(),
        replaced_lecturer: replacedLecturer.id,
        reason: reason.trim(),
        status: "approved", // Admin oluşturduğu için otomatik onaylı
        is_created_by_admin: true,
        created_by: adminUser.id,
      });

      if (error) throw error;

      Alert.alert(
        "Başarılı",
        `${selectedUser.full_name} için izin talebi başarıyla oluşturuldu.`,
        [
          {
            text: "Tamam",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating leave request:", error);
      Alert.alert("Hata", "İzin talebi oluşturulurken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a00e0" />
        <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İzin Oluştur</Text>
        <Text style={styles.headerSubtitle}>
          Kullanıcı için izin talebi oluşturun
        </Text>
      </LinearGradient>

      <Animated.ScrollView style={[styles.content, { opacity: fadeAnim }]}>
        {/* Kullanıcı Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kullanıcı Seçimi</Text>
          <TouchableOpacity
            style={styles.userSelector}
            onPress={() => setShowUserModal(true)}
          >
            {selectedUser ? (
              <View style={styles.selectedUser}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#4a00e0"
                />
                <View style={styles.selectedUserInfo}>
                  <Text style={styles.selectedUserName}>
                    {selectedUser.full_name}
                  </Text>
                  <Text style={styles.selectedUserEmail}>
                    {selectedUser.email}
                  </Text>
                  <Text style={styles.selectedUserDept}>
                    {selectedUser.department}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderUser}>
                <Ionicons name="person-add-outline" size={24} color="#666" />
                <Text style={styles.placeholderText}>Kullanıcı seçin</Text>
              </View>
            )}
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Tarih Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İzin Tarihleri</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setCalendarMode("start");
                setShowCalendar(true);
              }}
            >
              <LinearGradient
                colors={["#4a00e0", "#8e2de2"]}
                style={styles.dateButtonGradient}
              >
                <Ionicons name="calendar-outline" size={24} color="#fff" />
                <Text style={styles.dateButtonText}>
                  {formatDate(startDate)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setCalendarMode("end");
                setShowCalendar(true);
              }}
            >
              <LinearGradient
                colors={["#4a00e0", "#8e2de2"]}
                style={styles.dateButtonGradient}
              >
                <Ionicons name="calendar-outline" size={24} color="#fff" />
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saat Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saat Bilgileri</Text>
          <View style={styles.timeContainer}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Başlangıç Saati</Text>
              <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Bitiş Saati</Text>
              <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
            </View>
          </View>
        </View>

        {/* Ders Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ders Bilgileri</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ders Kodu</Text>
            <TextInput
              style={styles.textInput}
              value={courseCode}
              onChangeText={setCourseCode}
              placeholder="Örn: MAT101"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Yerine Gelen Hoca</Text>
            <TouchableOpacity
              style={styles.lecturerSelector}
              onPress={() => setShowLecturerModal(true)}
            >
              {replacedLecturer ? (
                <View style={styles.selectedLecturer}>
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color="#4a00e0"
                  />
                  <Text style={styles.selectedLecturerText}>
                    {replacedLecturer.full_name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Hoca seçin</Text>
              )}
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* İzin Nedeni */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İzin Nedeni</Text>
          <TextInput
            style={[styles.textInput, styles.reasonInput]}
            value={reason}
            onChangeText={setReason}
            placeholder="İzin nedenini açıklayın..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Gönder Butonu */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#fff"
              />
              <Text style={styles.submitButtonText}>İzin Oluştur</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Kullanıcı Seçim Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Kullanıcı Seçin</Text>
            <View style={{ width: 24 }} />
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Kullanıcı adı ile arama yapın..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView style={styles.userList}>
            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userItem}
                onPress={() => selectUser(user)}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={40}
                  color="#4a00e0"
                />
                <View style={styles.userItemInfo}>
                  <Text style={styles.userItemName}>{user.full_name}</Text>
                  <Text style={styles.userItemEmail}>{user.email}</Text>
                  <Text style={styles.userItemDept}>{user.department}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Hoca Seçim Modal */}
      <Modal
        visible={showLecturerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLecturerModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Hoca Seçin</Text>
            <View style={{ width: 24 }} />
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Hoca adı ile arama yapın..."
            value={lecturerSearchQuery}
            onChangeText={setLecturerSearchQuery}
          />

          <ScrollView style={styles.userList}>
            {users
              .filter(
                (user) =>
                  user.id !== currentAdminId && // Exclude current admin
                  (lecturerSearchQuery.trim() === "" ||
                    user.full_name
                      .toLowerCase()
                      .includes(lecturerSearchQuery.toLowerCase()))
              )
              .map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.userItem}
                  onPress={() => selectLecturer(user)}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#4a00e0"
                  />
                  <View style={styles.userItemInfo}>
                    <Text style={styles.userItemName}>{user.full_name}</Text>
                    <Text style={styles.userItemEmail}>{user.email}</Text>
                    <Text style={styles.userItemDept}>{user.department}</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Takvim Modalı */}
      <Modal visible={showCalendar} transparent={true} animationType="slide">
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {calendarMode === "start"
                  ? "Başlangıç Tarihi Seçin"
                  : "Bitiş Tarihi Seçin"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Calendar
              minDate={minDate}
              markedDates={markedDates}
              onDayPress={(day) => handleDateSelect(day.dateString)}
              theme={{
                todayTextColor: "#4a00e0",
                selectedDayBackgroundColor: "#4a00e0",
                selectedDayTextColor: "#fff",
                arrowColor: "#4a00e0",
              }}
            />

            <View style={styles.calendarFooter}>
              <Text style={styles.selectedDatesText}>
                {startDate && endDate
                  ? `${startDate.toLocaleDateString("tr-TR")} - ${endDate.toLocaleDateString("tr-TR")}`
                  : "Tarih seçilmedi"}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    padding: 30,
    paddingTop: 70,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
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
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.9,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  userSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedUserEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  selectedUserDept: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  placeholderUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
    marginLeft: 12,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  dateButtonText: {
    marginLeft: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  timeInput: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  reasonInput: {
    height: 100,
    textAlignVertical: "top",
  },
  lecturerSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedLecturer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedLecturerText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a00e0",
    borderRadius: 15,
    padding: 18,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    margin: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  userList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userItemInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userItemEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userItemDept: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  calendarModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  calendarFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  selectedDatesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
