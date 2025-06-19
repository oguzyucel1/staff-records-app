import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";

export default function ScanAttendance() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(true);
  const type = params.type === "cikis" ? "cikis" : "giris";

  const scanningLockRef = useRef(false); // 👈 QR çoklu okuma engelleme

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanningLockRef.current) return; // 👈 bir kere çalıştır
    scanningLockRef.current = true;

    setScanned(true);
    setShowCamera(false);
    setLoading(true);

    try {
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        qrData = { date: data };
      }

      console.log("QR DATA:", qrData);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, department")
        .eq("id", user.id)
        .single();

      const now = new Date();
      const localTime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const { error } = await supabase.from("attendance_logs").insert([
        {
          user_id: user.id,
          full_name: profile?.full_name || null,
          email: profile?.email || null,
          department: profile?.department || null,
          qr_code_id: qrData.id || null,
          qr_date: qrData.date,
          scanned_at: localTime,
          type: type, // "giris" veya "cikis"
        },
      ]);

      if (error) throw error;

      Alert.alert(
        "Başarılı",
        `Başarıyla ${type === "giris" ? "giriş" : "çıkış"} kaydı oluşturuldu!`,
        [
          {
            text: "Tamam",
            onPress: () => router.replace("/(tabs)/(user)/explore"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Bir hata oluştu.");
      setShowCamera(true);
      setScanned(false);
    } finally {
      scanningLockRef.current = false; // 👈 tekrar tarama izni ver
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a00e0" />
        <Text style={styles.infoText}>Kamera izni isteniyor...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="close-circle" size={48} color="#F44336" />
        <Text style={styles.infoText}>Kamera izni verilmedi.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.backBtn}>
          <Text style={styles.backBtnText}>İzin Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={28}
          color="#fff"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>
          {type === "giris"
            ? "Giriş için QR Kodu Tara"
            : "Çıkış için QR Kodu Tara"}
        </Text>
      </View>
      {showCamera && (
        <CameraView
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Kayıt yapılıyor...</Text>
        </View>
      )}
      {scanned && !loading && (
        <TouchableOpacity
          style={styles.rescanBtn}
          onPress={() => {
            setScanned(false);
            setShowCamera(true);
          }}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.rescanBtnText}>Tekrar Tara</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  infoText: {
    fontSize: 17,
    color: "#333",
    marginTop: 18,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 24,
    backgroundColor: "#4a00e0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 18,
    backgroundColor: "#4a00e0",
    zIndex: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  rescanBtn: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a00e0",
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 60,
    flexDirection: "row",
    gap: 8,
  },
  rescanBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});
