import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animations
  const cardAnim = useState(new Animated.Value(0))[0];
  const titleAnim = useState(new Animated.Value(0))[0];
  const inputAnim1 = useState(new Animated.Value(0))[0];
  const inputAnim2 = useState(new Animated.Value(0))[0];
  const validationAnim = useState(new Animated.Value(0))[0];
  const buttonAnim = useState(new Animated.Value(0))[0];
  const shakeAnim = useState(new Animated.Value(0))[0];

  const passwordValidation = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    passwordsMatch: password === password2 && password.length > 0,
  };

  const allValid =
    passwordValidation.hasMinLength &&
    passwordValidation.hasUpperCase &&
    passwordValidation.hasNumber &&
    passwordValidation.hasSpecialChar &&
    passwordValidation.passwordsMatch;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim1, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim2, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(validationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleChangePassword = async () => {
    setError(null);
    if (!allValid) {
      setError("Şifre kriterlerini karşılamıyor veya şifreler eşleşmiyor.");
      // Shake animation for error
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Şifre değiştiyse burada güncelle:
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ password_changed: true })
          .eq("id", user.id);
      }

      Alert.alert("Başarılı", "Şifreniz başarılı bir şekilde değiştirildi.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
      setPassword("");
      setPassword2("");
    } catch (err: any) {
      setError(err.message || "Şifre değiştirilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidation).filter(Boolean).length;
    if (validCount <= 2)
      return { strength: "Zayıf", color: "#ff6b6b", width: 0.25 };
    if (validCount <= 3)
      return { strength: "Orta", color: "#ffa726", width: 0.5 };
    if (validCount <= 4)
      return { strength: "İyi", color: "#66bb6a", width: 0.75 };
    return { strength: "Güçlü", color: "#4caf50", width: 1 };
  };

  const strengthInfo = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f0f2f5" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#4a00e0", "#8e2de2"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
                {
                  translateX: shakeAnim,
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.titleContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#4a00e0" />
              <Text style={styles.title}>Şifreyi Değiştir</Text>
            </View>
            <Text style={styles.subtitle}>
              Güvenliğiniz için güçlü bir şifre seçin
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.inputGroup,
              {
                opacity: inputAnim1,
                transform: [
                  {
                    translateX: inputAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.label}>
              <Ionicons name="lock-closed" size={16} color="#4a00e0" /> Yeni
              Şifre
            </Text>
            <View
              style={[
                styles.passwordRow,
                focusedInput === "password1" && styles.focusedInput,
              ]}
            >
              <TextInput
                placeholder="Yeni şifre"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedInput("password1")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#4a00e0"
                />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        flex: strengthInfo.width,
                        backgroundColor: strengthInfo.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.strengthText, { color: strengthInfo.color }]}
                >
                  {strengthInfo.strength}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View
            style={[
              styles.inputGroup,
              {
                opacity: inputAnim2,
                transform: [
                  {
                    translateX: inputAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.label}>
              <Ionicons name="lock-closed" size={16} color="#4a00e0" /> Yeni
              Şifre (Tekrar)
            </Text>
            <View
              style={[
                styles.passwordRow,
                focusedInput === "password2" && styles.focusedInput,
              ]}
            >
              <TextInput
                placeholder="Yeni şifre tekrar"
                value={password2}
                onChangeText={setPassword2}
                style={styles.input}
                secureTextEntry={!showPassword2}
                autoCapitalize="none"
                onFocus={() => setFocusedInput("password2")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword2((v) => !v)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword2 ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#4a00e0"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.validationContainer,
              {
                opacity: validationAnim,
                transform: [
                  {
                    translateY: validationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.validationTitle}>Şifre Gereksinimleri</Text>
            <View style={styles.validationList}>
              <ValidationItem
                valid={passwordValidation.hasMinLength}
                text="En az 8 karakter"
                icon="checkmark-circle"
              />
              <ValidationItem
                valid={passwordValidation.hasUpperCase}
                text="En az bir büyük harf"
                icon="text"
              />
              <ValidationItem
                valid={passwordValidation.hasNumber}
                text="En az bir rakam"
                icon="calculator"
              />
              <ValidationItem
                valid={passwordValidation.hasSpecialChar}
                text="En az bir özel karakter"
                icon="star"
              />
              <ValidationItem
                valid={passwordValidation.passwordsMatch}
                text="Şifreler eşleşiyor"
                icon="checkmark-done-circle"
              />
            </View>
          </Animated.View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e53935" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Animated.View
            style={{
              opacity: buttonAnim,
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={[styles.button, !allValid && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={!allValid || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  allValid ? ["#4a00e0", "#8e2de2"] : ["#bdbdbd", "#9e9e9e"]
                }
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Şifreyi Değiştir</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color="#4a00e0" />
              <Text style={styles.cancelText}>Geri Dön</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ValidationItem({
  valid,
  text,
  icon,
}: {
  valid: boolean;
  text: string;
  icon: string;
}) {
  return (
    <Animated.View
      style={[
        styles.validationItem,
        {
          backgroundColor: valid
            ? "rgba(76, 175, 80, 0.1)"
            : "rgba(229, 57, 53, 0.1)",
        },
      ]}
    >
      <Ionicons
        name={valid ? "checkmark-circle" : "close-circle"}
        size={20}
        color={valid ? "#4CAF50" : "#e53935"}
        style={styles.validationIcon}
      />
      <Ionicons
        name={icon as any}
        size={16}
        color={valid ? "#4CAF50" : "#e53935"}
      />
      <Text
        style={[
          styles.validationText,
          { color: valid ? "#4CAF50" : "#e53935" },
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 32,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "stretch",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a00e0",
    textAlign: "center",
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#4a00e0",
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 2,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  focusedInput: {
    borderColor: "#4a00e0",
    backgroundColor: "#fff",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#222",
  },
  eyeButton: {
    padding: 8,
    borderRadius: 8,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginRight: 12,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 40,
  },
  validationContainer: {
    marginBottom: 20,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  validationList: {
    gap: 8,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  validationIcon: {
    marginRight: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(229, 57, 53, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: "#e53935",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#4a00e0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: "#4a00e0",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
});
