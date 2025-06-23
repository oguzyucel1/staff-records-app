import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { PushNotificationService } from "../../lib/pushNotificationService";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert("Login Failed", "Invalid email or password.");
        return;
      }
      if (!data.user) {
        Alert.alert("Error", "Login failed. Please try again.");
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError || !profile) {
        const { error: createProfileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.email!.split("@")[0],
              role: "user",
              created_at: new Date().toISOString(),
            },
          ]);
        if (createProfileError) {
          Alert.alert(
            "Error",
            "Failed to set up your account. Please try again."
          );
          await supabase.auth.signOut();
          return;
        }
      }
      try {
        const pushToken = await PushNotificationService.getPushToken();
        if (pushToken) {
          await PushNotificationService.savePushToken(data.user.id, pushToken);
        }
      } catch (error) {}
      const { data: profileRole } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (profileRole?.role === "admin") {
        router.replace("/(tabs)/(admin)/home");
      } else {
        router.replace("/(tabs)/(user)/home");
      }
    } catch (error: any) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/login-bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark overlay for less brightness */}
        <View style={styles.overlay} />
        <View style={styles.cardWrapper}>
          <BlurView intensity={60} tint="dark" style={styles.card}>
            <View style={styles.logoBox}>
              <View style={styles.logoCircle}>
                <Ionicons name="school" size={44} color="#fff" />
              </View>
            </View>
            <Text style={styles.title}>Hoş Geldiniz</Text>
            <Text style={styles.subtitle}>Lütfen giriş yapın</Text>
            <View style={styles.formArea}>
              <View style={styles.inputGroup}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#4a00e0"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresi"
                  placeholderTextColor="#bbb"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  autoCorrect={false}
                  autoFocus={true}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#4a00e0"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor="#bbb"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                </Text>
                <Ionicons
                  name="log-in"
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181c2f",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 20, 50, 0.68)",
    zIndex: 1,
  },
  cardWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: height * 0.1,
    zIndex: 2,
  },
  card: {
    width: 320,
    borderRadius: 32,
    paddingVertical: 64,
    paddingHorizontal: 36,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 16,
    backgroundColor: "rgba(255,255,255,0.13)",
    overflow: "hidden",
  },
  logoBox: {
    marginBottom: 12,
    alignItems: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(74,0,224,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    shadowColor: "#4a00e0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 20,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 32,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  formArea: {
    width: "100%",
    alignItems: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 28,
    width: 260,
    borderWidth: 1.5,
    borderColor: "rgba(74,0,224,0.13)",
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: "#222",
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  eyeButton: {
    padding: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a00e0",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginTop: 24,
    shadowColor: "#4a00e0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
    shadowOpacity: 0.08,
  },
});
