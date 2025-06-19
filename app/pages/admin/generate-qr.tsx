import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../../lib/supabase";

const CALENDAR_HEIGHT = 370;

export default function GenerateQR() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarAnimating, setCalendarAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayQr, setTodayQr] = useState<{ date: string; id?: string } | null>(
    null
  );
  const [showQr, setShowQr] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch today's QR code on mount
  useEffect(() => {
    const fetchTodayQr = async () => {
      setLoading(true);
      setFetchError(null);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("qr_codes")
        .select("id, date")
        .eq("date", todayStr)
        .limit(1)
        .maybeSingle();
      console.log(
        "Supabase todayStr:",
        todayStr,
        "Fetched data:",
        data,
        "Error:",
        error
      );
      setLoading(false);
      if (error) {
        setFetchError(error.message);
      }
      if (data && data.date) {
        setTodayQr({ date: data.date, id: data.id });
        setShowQr(true);
      } else {
        setTodayQr(null);
        setShowQr(false);
      }
    };
    fetchTodayQr();
  }, []);

  const handleDayPress = (day: any) => {
    setSelectedDate(new Date(day.dateString));
    toggleCalendar();
  };

  const handleGenerateQR = async () => {
    if (!selectedDate) return;
    setLoading(true);
    const now = selectedDate || new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD format

    const dateStr = localTime;
    const { data, error } = await supabase
      .from("qr_codes")
      .insert([
        {
          date: dateStr,
        },
      ])
      .select()
      .single();
    setLoading(false);
    if (error) {
      Alert.alert("Hata", "QR kod kaydedilemedi: " + error.message);
      return;
    }
    setTodayQr({ date: dateStr, id: data.id });
    setShowQr(true);
    setQrGenerated(true);
  };

  const handleShare = async () => {
    const qrDate = todayQr?.date || selectedDate?.toISOString().split("T")[0];
    if (!qrDate) return;
    try {
      const formattedDate = new Date(qrDate).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await Share.share({
        message: `QR Kod Tarihi: ${formattedDate}`,
      });
    } catch (error) {
      Alert.alert("Hata", "Paylaşım sırasında bir hata oluştu");
    }
  };

  const handleDeleteQr = () => {
    Alert.alert(
      "QR Kodunu Sil",
      "Bu QR kodunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      [
        {
          text: "Vazgeç",
          style: "cancel",
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            setDeleteLoading(true);
            const todayStr = todayQr?.date;
            if (!todayStr) return;
            const { error } = await supabase
              .from("qr_codes")
              .delete()
              .eq("date", todayStr);
            setDeleteLoading(false);
            if (error) {
              Alert.alert("Hata", "QR kod silinemedi: " + error.message);
              return;
            }
            setShowQr(false);
            setTodayQr(null);
            setQrGenerated(false);
            setSelectedDate(null);
            Alert.alert("Başarılı", "QR kod başarıyla silindi.");
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formattedDate =
    todayQr && showQr
      ? new Date(todayQr.date).toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : selectedDate
        ? selectedDate.toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "";

  // Calendar marking
  const markedDates = selectedDate
    ? {
        [selectedDate.toISOString().split("T")[0]]: {
          selected: true,
          selectedColor: "#4a00e0",
          selectedTextColor: "#fff",
        },
      }
    : {};

  const toggleCalendar = () => {
    if (calendarVisible) {
      setCalendarAnimating(true);
      Animated.timing(calendarAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        setCalendarVisible(false);
        setCalendarAnimating(false);
      });
    } else {
      setCalendarVisible(true);
      setCalendarAnimating(true);
      Animated.timing(calendarAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start(() => setCalendarAnimating(false));
    }
  };

  // Animate only height
  const calendarHeight = calendarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CALENDAR_HEIGHT],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Kod Oluştur</Text>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>QR Kod Tarihi</Text>
          <TouchableOpacity
            style={styles.dateBox}
            onPress={toggleCalendar}
            activeOpacity={0.8}
            disabled={!!(todayQr && showQr)}
          >
            <Ionicons name="calendar-outline" size={24} color="#4a00e0" />
            <Text style={styles.dateText}>
              {formattedDate || "Tarih seçiniz"}
            </Text>
          </TouchableOpacity>
          <Animated.View
            style={[styles.animatedCalendar, { height: calendarHeight }]}
            pointerEvents={calendarVisible ? "auto" : "none"}
          >
            {calendarVisible || calendarAnimating ? (
              <Calendar
                style={styles.calendar}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                minDate={new Date().toISOString().split("T")[0]}
                theme={{
                  selectedDayBackgroundColor: "#4a00e0",
                  todayTextColor: "#4a00e0",
                  arrowColor: "#4a00e0",
                  textSectionTitleColor: "#4a00e0",
                }}
              />
            ) : null}
          </Animated.View>
          {loading && (
            <ActivityIndicator color="#4a00e0" style={{ marginBottom: 10 }} />
          )}
          <TouchableOpacity
            style={[
              styles.generateButton,
              (!selectedDate || (todayQr && showQr)) &&
                styles.generateButtonDisabled,
            ]}
            onPress={handleGenerateQR}
            disabled={!selectedDate || !!(todayQr && showQr) || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>QR Kod Oluştur</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* QR KOD GÖSTERİMİ */}
        {loading && (
          <Text style={{ color: "#4a00e0", marginTop: 20 }}>Yükleniyor...</Text>
        )}
        {fetchError && (
          <Text style={{ color: "red", marginTop: 20 }}>
            Hata: {fetchError}
          </Text>
        )}
        {showQr && todayQr && !loading && !fetchError && (
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={JSON.stringify({ id: todayQr.id, date: todayQr.date })}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            <Text style={styles.qrDateText}>Tarih: {formattedDate}</Text>
            <View style={styles.qrActionsRow}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="#fff" />
                <Text style={styles.shareButtonText}>Paylaş</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteQr}
                disabled={deleteLoading}
              >
                <Ionicons name="trash-outline" size={24} color="#fff" />
                <Text style={styles.deleteButtonText}>
                  {deleteLoading ? "Siliniyor..." : "Sil"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!loading && !fetchError && !todayQr && (
          <Text style={{ color: "#888", marginTop: 20 }}>
            Bugün için oluşturulmuş bir QR kodu bulunamadı.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#f8f8f8",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  animatedCalendar: {
    overflow: "hidden",
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  calendar: {
    borderRadius: 10,
    overflow: "hidden",
  },
  generateButton: {
    backgroundColor: "#4a00e0",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  generateButtonDisabled: {
    backgroundColor: "#bdbdbd",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  qrContainer: {
    marginTop: 30,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrWrapper: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrDateText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4a00e0",
    fontWeight: "bold",
  },
  qrActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 16,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a00e0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
