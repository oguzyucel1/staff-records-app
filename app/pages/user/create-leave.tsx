import React, { useState } from "react";
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
  const [calendarMode, setCalendarMode] = useState<"start" | "end">("start");
  const [markedDates, setMarkedDates] = useState({});
  const fadeAnim = useState(new Animated.Value(0))[0];

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

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
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>İzin Talebi Oluştur</Text>
            <Text style={styles.headerSubtitle}>
              Yeni izin talebi oluşturun
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* İzin Türü Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İzin Türü</Text>
          <View style={styles.leaveTypeContainer}>
            {leaveTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.leaveTypeButton,
                  leaveType === type && styles.leaveTypeButtonActive,
                ]}
                onPress={() => setLeaveType(type)}
              >
                <Text
                  style={[
                    styles.leaveTypeText,
                    leaveType === type && styles.leaveTypeTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
                  {startDate
                    ? startDate.toLocaleDateString("tr-TR")
                    : "Başlangıç Tarihi"}
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
                <Text style={styles.dateButtonText}>
                  {endDate
                    ? endDate.toLocaleDateString("tr-TR")
                    : "Bitiş Tarihi"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* İzin Nedeni */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İzin Nedeni</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="İzin nedeninizi yazın..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Gönder Butonu */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={["#4a00e0", "#8e2de2"]}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>İzin Talebi Gönder</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

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
  section: {
    marginBottom: 25,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  leaveTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  leaveTypeButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  leaveTypeButtonActive: {
    backgroundColor: "#4a00e0",
    borderColor: "#4a00e0",
  },
  leaveTypeText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  leaveTypeTextActive: {
    color: "#fff",
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
  reasonInput: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 14,
    color: "#333",
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonGradient: {
    padding: 18,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
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
