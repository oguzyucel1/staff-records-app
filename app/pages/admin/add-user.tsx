import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import emailjs from "emailjs-com";
import Constants from "expo-constants";

export default function AddUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    department: "",
    phone: "",
    email: "",
    role: "user",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateUser = async () => {
    setError(null);
    if (
      !form.full_name ||
      !form.department ||
      !form.phone ||
      !form.email ||
      !form.role ||
      !form.password
    ) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    if (!passwordCriteria(form.password)) {
      setError("Şifre kriterlerini karşılamıyor.");
      return;
    }
    setLoading(true);
    try {
      // Supabase'de kullanıcı oluştur
      const response = await fetch(
        "https://cgunvvpzlsnxywbbmfsk.supabase.co/functions/v1/swift-task",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Kullanıcı oluşturulamadı.");

      // ✅ EmailJS ile şifre gönderimi
      const serviceId = Constants.expoConfig?.extra?.emailjsServiceId;
      const templateId = Constants.expoConfig?.extra?.emailjsTemplateId;
      const publicKey = Constants.expoConfig?.extra?.emailjsPublicKey;

      const emailResponse = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              to_email: form.email,
              full_name: form.full_name,
              password: form.password,
            },
          }),
        }
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.warn("Mail gönderilemedi:", errorText);
        throw new Error("Kullanıcı oluşturuldu ama mail gönderilemedi.");
      }

      Alert.alert("Başarılı", "Kullanıcı oluşturuldu ve şifre gönderildi.");
      setForm({
        full_name: "",
        department: "",
        phone: "",
        email: "",
        role: "user",
        password: "",
      });
      router.back();
    } catch (err: any) {
      setError(err.message || "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f2f5" }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          <LinearGradient colors={["#4a00e0", "#8e2de2"]} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Kullanıcı Oluştur</Text>
          </LinearGradient>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: "center",
              paddingTop: 0,
              marginTop: 0,
            }}
          >
            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>İsim Soyisim</Text>
                <View style={styles.inputGroup}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#4a00e0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Adınızı ve soyadınızı girin"
                    value={form.full_name}
                    onChangeText={(v) => handleChange("full_name", v)}
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Departman</Text>
                <View style={styles.inputGroup}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color="#4a00e0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Departman girin"
                    value={form.department}
                    onChangeText={(v) => handleChange("department", v)}
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Telefon</Text>
                <View style={styles.inputGroup}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#4a00e0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Telefon numarası girin"
                    value={form.phone}
                    onChangeText={(v) => handleChange("phone", v)}
                    style={styles.input}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>E-posta</Text>
                <View style={styles.inputGroup}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#4a00e0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="E-posta adresi girin"
                    value={form.email}
                    onChangeText={(v) => handleChange("email", v)}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Rol</Text>
                <View style={styles.inputGroup}>
                  <Ionicons
                    name="shield-outline"
                    size={20}
                    color="#4a00e0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="user veya admin"
                    value={form.role}
                    onChangeText={(v) => handleChange("role", v)}
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Şifre</Text>
                <View style={[styles.inputGroup, { alignItems: "center" }]}>
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color="#4a00e0"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Şifre belirleyin veya üretin"
                    value={form.password}
                    onChangeText={(v) => handleChange("password", v)}
                    style={[styles.input, { flex: 1 }]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#4a00e0"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => handleChange("password", generatePassword())}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      Şifre Üret
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>
                  Şifre en az 8 karakter, bir büyük harf, bir rakam ve bir özel
                  karakter içermelidir.
                </Text>
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Kullanıcı Oluştur</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingTop: 0,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  backButton: {
    marginRight: 10,
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
  },
  card: {
    marginTop: 110,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "stretch",
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: "#4a00e0",
    fontWeight: "bold",
    marginBottom: 6,
    marginLeft: 2,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5fa",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: "#222",
  },
  generateButton: {
    marginLeft: 8,
    backgroundColor: "#4a00e0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    color: "red",
    marginBottom: 8,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#4a00e0",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
