import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

type SignupStep = 1 | 2 | 3;

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  password: string;
  confirmPassword: string;
}

interface PasswordValidation {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  passwordsMatch: boolean;
}

export default function SignupScreen() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidation>({
      hasMinLength: false,
      hasUpperCase: false,
      hasNumber: false,
      hasSpecialChar: false,
      passwordsMatch: false,
    });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    phone?: string;
    department?: string;
  }>({});

  const validatePassword = (password: string, confirmPassword: string) => {
    setPasswordValidation({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password !== "",
    });
  };

  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
      if (key === "password" || key === "confirmPassword") {
        validatePassword(
          key === "password" ? value : prev.password,
          key === "confirmPassword" ? value : prev.confirmPassword
        );
      }
      return newData;
    });
  };

  const isStep1Valid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      formData.fullName.trim().length > 0 &&
      emailRegex.test(formData.email.trim())
    );
  };

  const isStep2Valid = () => {
    return (
      formData.phone.trim().length > 0 && formData.department.trim().length > 0
    );
  };

  const isStep3Valid = () => {
    return (
      passwordValidation.hasMinLength &&
      passwordValidation.hasUpperCase &&
      passwordValidation.hasNumber &&
      passwordValidation.hasSpecialChar &&
      passwordValidation.passwordsMatch
    );
  };

  const validateStep = () => {
    const newErrors: any = {};

    if (currentStep === 1) {
      if (!formData.fullName) newErrors.fullName = "Please fill this area";
      if (!formData.email) newErrors.email = "Please fill this area";
    } else if (currentStep === 2) {
      if (!formData.department) newErrors.department = "Please fill this area";
      if (!formData.phone) newErrors.phone = "Please fill this area";
    } else if (currentStep === 3) {
      // Basic validation
      if (!formData.password) {
        newErrors.password = "Please fill this area";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please fill this area";
      }

      // Only proceed with other validations if both fields are filled
      if (formData.password && formData.confirmPassword) {
        // Password requirements validation
        const hasMinLength = formData.password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

        // Check password requirements
        if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
          newErrors.password = "Meet requirements";
        }

        // Only check password match if all requirements are met
        if (hasMinLength && hasUpperCase && hasNumber && hasSpecialChar) {
          if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
          } else {
            delete newErrors.confirmPassword; // 🔥 Hata mesajını sil
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    try {
      setLoading(true);

      const hasMinLength = formData.password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

      if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
        setErrors({ password: "Meet requirements" });
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match" });
        setLoading(false);
        return;
      }

      // ✅ 1. Kullanıcıyı auth'a kaydet
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (signUpError) {
        Alert.alert("Error", signUpError.message);
        setLoading(false);
        return;
      }

      // ✅ 2. authData.session veya user gelmeyebilir, ama id token içerisindedir
      const userId = authData.user?.id;

      if (!userId) {
        Alert.alert("Error", "User created, but no ID returned.");
        setLoading(false);
        return;
      }

      // ✅ 3. Supabase veritabanına yaz (auth.uid ile eşleşecek şekilde)
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user!.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          role: "user",
        },
      ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        Alert.alert("Error", "Profile creation failed.");
        setLoading(false);
        return;
      }

      Alert.alert(
        "Success",
        "Account created! Please check your email to verify your account.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Signup error:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    if (currentStep === 3) {
      await handleSignup();
    } else {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SignupStep);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor:
                currentStep >= step ? "#4c669f" : "rgba(255,255,255,0.2)",
              justifyContent: "center",
              alignItems: "center",
              marginHorizontal: 5,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>{step}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPasswordValidation = () => {
    const validations = [
      {
        text: "At least 8 characters",
        isValid: formData.password.length >= 8,
      },
      {
        text: "At least one uppercase letter",
        isValid: /[A-Z]/.test(formData.password),
      },
      {
        text: "At least one number",
        isValid: /[0-9]/.test(formData.password),
      },
      {
        text: "At least one special character",
        isValid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
      },
      {
        text: "Passwords match",
        isValid:
          formData.password === formData.confirmPassword &&
          formData.password !== "",
      },
    ];

    return (
      <View style={{ marginTop: 16, gap: 8 }}>
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={20} color="#FFD700" />
          <Text style={styles.warningText}>
            Your password must provide these rules:
          </Text>
        </View>
        {validations.map((validation, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons
              name={validation.isValid ? "checkmark-circle" : "close-circle"}
              size={16}
              color={validation.isValid ? "#4CAF50" : "#ff6b6b"}
            />
            <Text
              style={{
                color: validation.isValid ? "#4CAF50" : "#ff6b6b",
                fontSize: 14,
              }}
            >
              {validation.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPasswordInput = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    errorKey: keyof typeof errors
  ) => (
    <View>
      <View style={{ position: "relative" }}>
        <TextInput
          style={[styles.input, errors[errorKey] && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: [{ translateY: -12 }],
          }}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="rgba(255,255,255,0.5)"
          />
        </TouchableOpacity>
      </View>
      {errors[errorKey] && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
          <Text style={styles.errorText}>{errors[errorKey]}</Text>
        </View>
      )}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Full Name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.fullName}
                onChangeText={(value) => updateFormData("fullName", value)}
              />
              {errors.fullName && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                </View>
              )}
            </View>

            <View>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.email}
                onChangeText={(value) => updateFormData("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <TextInput
                style={[styles.input, errors.department && styles.inputError]}
                placeholder="Department"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.department}
                onChangeText={(value) => updateFormData("department", value)}
              />
              {errors.department && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                  <Text style={styles.errorText}>{errors.department}</Text>
                </View>
              )}
            </View>

            <View>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Phone Number"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.phone}
                onChangeText={(value) => updateFormData("phone", value)}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                  <Text style={styles.errorText}>{errors.phone}</Text>
                </View>
              )}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={{ gap: 16 }}>
            {renderPasswordInput(
              formData.password,
              (value) => updateFormData("password", value),
              "Password",
              showPassword,
              setShowPassword,
              "password"
            )}

            {renderPasswordInput(
              formData.confirmPassword,
              (value) => updateFormData("confirmPassword", value),
              "Confirm Password",
              showConfirmPassword,
              setShowConfirmPassword,
              "confirmPassword"
            )}

            {renderPasswordValidation()}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              padding: 20,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: "center" }}>
              <View style={{ marginBottom: 40 }}>
                <Text
                  style={{ color: "white", fontSize: 32, fontWeight: "bold" }}
                >
                  Create Account
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
                  Step {currentStep} of 3
                </Text>
              </View>

              {renderStepIndicator()}
              {renderStepContent()}

              <View style={{ marginTop: 40 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        padding: 16,
                        borderRadius: 12,
                        flex: 1,
                      }}
                      onPress={handleBack}
                    >
                      <Text
                        style={{
                          color: "white",
                          textAlign: "center",
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Back
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={{
                      backgroundColor: "white",
                      padding: 16,
                      borderRadius: 12,
                      flex: 1,
                    }}
                    onPress={handleNext}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#1a1a1a" />
                    ) : (
                      <Text
                        style={{
                          color: "#1a1a1a",
                          fontSize: 16,
                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >
                        {currentStep === 3 ? "Create Account" : "Next"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {currentStep === 1 && (
                  <TouchableOpacity
                    style={{ marginTop: 16 }}
                    onPress={() => router.push("/auth/login")}
                  >
                    <Text
                      style={{
                        color: "white",
                        textAlign: "center",
                        fontSize: 16,
                      }}
                    >
                      Already have an account?{" "}
                      <Text style={{ color: "#FFD700" }}>Login</Text>
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputError: {
    borderColor: "#ff6b6b",
    borderWidth: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  warningText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "500",
  },
});
