import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../../lib/supabase";

type LeaveType =
  | "Yıllık İzin"
  | "Hastalık İzni"
  | "Mazeret İzni"
  | "Ücretsiz İzin";

const leaveTypes: LeaveType[] = [
  "Yıllık İzin",
  "Hastalık İzni",
  "Mazeret İzni",
  "Ücretsiz İzin",
];

export default function CreateLeave() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType>("Yıllık İzin");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"start" | "end">("start");
  const [markedDates, setMarkedDates] = useState({});
  const fadeAnim = useState(new Animated.Value(0))[0];
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  React.useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [showDropdown]);

  const handleDateSelect = (date: string) => {
    const selectedDate = new Date(date);

    if (calendarMode === "start") {
      setStartDate(selectedDate);
      setCalendarMode("end");
      updateMarkedDates(selectedDate, endDate);
    } else {
      if (startDate && selectedDate < startDate) {
        alert("Bitiş tarihi başlangıç tarihinden önce olamaz!");
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
        color: "#6366f1",
      },
    };

    if (end) {
      marked[end.toISOString().split("T")[0]] = {
        selected: true,
        endingDay: true,
        color: "#6366f1",
      };

      // Aradaki günleri işaretle
      const current = new Date(start);
      while (current < end) {
        current.setDate(current.getDate() + 1);
        const dateStr = current.toISOString().split("T")[0];
        if (dateStr !== end.toISOString().split("T")[0]) {
          marked[dateStr] = {
            selected: true,
            color: "#6366f1",
          };
        }
      }
    }

    setMarkedDates(marked);
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason) {
      alert("Lütfen tüm alanları doldurun!");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Oturum açmanız gerekiyor!");
        return;
      }

      const { error } = await supabase.from("leave_requests").insert([
        {
          user_id: user.id,
          leave_type: leaveType,
          reason: reason,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "pending",
        },
      ]);

      if (error) throw error;

      alert("İzin talebiniz başarıyla gönderildi!");
      router.replace({
        pathname: "/(tabs)/(user)/explore",
        params: { refresh: "1" },
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>İzin Talebi Oluştur</Text>
            <Text style={styles.headerSubtitle}>
              Yeni izin talebi oluşturun
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* İzin Türü Dropdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={20} color="#6366f1" />
              <Text style={styles.sectionTitle}>İzin Türü</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(!showDropdown)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#f1f5f9", "#e2e8f0"]}
                style={styles.dropdownGradient}
              >
                <Text style={styles.dropdownText}>{leaveType}</Text>
                <Ionicons
                  name={showDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6366f1"
                />
              </LinearGradient>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  height: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, leaveTypes.length * 48],
                  }),
                  opacity: dropdownAnim,
                  overflow: "hidden",
                },
              ]}
            >
              {showDropdown &&
                leaveTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownItem,
                      leaveType === type && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setLeaveType(type);
                      setShowDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        leaveType === type && styles.dropdownItemTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
            </Animated.View>
          </View>

          {/* Tarih Seçimi */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#6366f1" />
              <Text style={styles.sectionTitle}>İzin Tarihleri</Text>
            </View>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setCalendarMode("start");
                  setShowCalendar(true);
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#6366f1", "#8b5cf6"]}
                  style={styles.dateButtonGradient}
                >
                  <View style={styles.dateButtonContent}>
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.dateButtonText}>
                      {startDate
                        ? startDate.toLocaleDateString("tr-TR")
                        : "Başlangıç Tarihi"}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setCalendarMode("end");
                  setShowCalendar(true);
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#8b5cf6", "#a855f7"]}
                  style={styles.dateButtonGradient}
                >
                  <View style={styles.dateButtonContent}>
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.dateButtonText}>
                      {endDate
                        ? endDate.toLocaleDateString("tr-TR")
                        : "Bitiş Tarihi"}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* İzin Nedeni */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#6366f1"
              />
              <Text style={styles.sectionTitle}>İzin Nedeni</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.reasonInput}
                placeholder="İzin nedeninizi detaylı bir şekilde yazın..."
                placeholderTextColor="#94a3b8"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Gönder Butonu */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#6366f1", "#8b5cf6"]}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>İzin Talebi Gönder</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Takvim Modalı */}
      <Modal visible={showCalendar} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
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
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>

            <Calendar
              minDate={minDate}
              markedDates={markedDates}
              onDayPress={(day) => handleDateSelect(day.dateString)}
              theme={{
                todayTextColor: "#6366f1",
                selectedDayBackgroundColor: "#6366f1",
                selectedDayTextColor: "#fff",
                arrowColor: "#6366f1",
                monthTextColor: "#1e293b",
                textMonthFontWeight: "700",
                textDayFontSize: 16,
                textDayHeaderFontSize: 14,
                textDayHeaderFontWeight: "600",
                dayTextColor: "#475569",
                textDisabledColor: "#cbd5e1",
              }}
            />

            <View style={styles.calendarFooter}>
              <Text style={styles.selectedDatesText}>
                {startDate && endDate
                  ? `${startDate.toLocaleDateString("tr-TR")} - ${endDate.toLocaleDateString("tr-TR")}`
                  : startDate
                    ? `${startDate.toLocaleDateString("tr-TR")} - Bitiş tarihi seçin`
                    : "Tarih seçilmedi"}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 12,
  },
  dropdownButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dropdownGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemActive: {
    backgroundColor: "#f1f5f9",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: "#6366f1",
    fontWeight: "600",
  },
  dateContainer: {
    flexDirection: "row",
    gap: 16,
  },
  dateButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dateButtonGradient: {
    padding: 20,
  },
  dateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dateButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  reasonInput: {
    padding: 20,
    fontSize: 16,
    color: "#1e293b",
    minHeight: 120,
    textAlignVertical: "top",
    fontWeight: "500",
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 32,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  selectedDatesText: {
    fontSize: 16,
    color: "#6366f1",
    textAlign: "center",
    fontWeight: "600",
  },
});
