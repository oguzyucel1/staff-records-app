import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting login for email:", email);

      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Auth response:", { data, error });

      if (error) {
        console.error("Auth error details:", error);
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert(
            "Login Failed",
            "Invalid email or password. Would you like to try again or create a new account?",
            [
              {
                text: "Try Again",
                style: "cancel",
              },
              {
                text: "Create Account",
                onPress: () => router.push("/auth/signup"),
              },
            ]
          );
        } else {
          Alert.alert("Error", error.message);
        }
        return;
      }

      if (!data.user) {
        console.error("No user data in response");
        Alert.alert("Error", "Login failed. Please try again.");
        return;
      }

      console.log("User authenticated:", data.user.id);

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      console.log("Profile check:", { profile, profileError });

      if (profileError || !profile) {
        console.log("Creating missing profile for user");
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name:
                data.user.user_metadata?.full_name ||
                data.user.email!.split("@")[0],
              role: "user",
              created_at: new Date().toISOString(),
            },
          ]);

        if (createProfileError) {
          console.error("Profile creation error:", createProfileError);
          Alert.alert(
            "Error",
            "Failed to set up your account. Please try again."
          );
          await supabase.auth.signOut();
          return;
        }

        console.log("Profile created successfully with role: user");
      } else {
        console.log("Existing profile found with role:", profile.role);
      }

      // Set session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session?.access_token || "",
        refresh_token: data.session?.refresh_token || "",
      });

      if (sessionError) {
        console.error("Session error details:", sessionError);
        Alert.alert("Error", "Failed to set session. Please try again.");
        return;
      }

      console.log("Session set successfully");

      // Successful login
      setUserId(data.user.id);

      // Check user role and redirect accordingly
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

      // Additional check to ensure navigation
    } catch (error: any) {
      console.error("Login error details:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View style={{ marginBottom: 40, alignItems: "center" }}>
            {userId && (
              <View style={styles.profileContainer}>
                <View style={styles.profileIcon}>
                  <Ionicons name="person" size={60} color="#666" />
                </View>
              </View>
            )}
            <Text
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "bold",
                marginTop: 20,
              }}
            >
              Welcome Back
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
              Sign in to continue
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: "white", marginBottom: 8, fontSize: 16 }}>
                Email
              </Text>
              <TextInput
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: 16,
                  color: "white",
                  borderWidth: 1,
                  borderColor:
                    focusedInput === "email"
                      ? "#FFD700"
                      : "rgba(255,255,255,0.2)",
                }}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                textContentType="username"
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                autoCorrect={false}
                importantForAutofill="no"
                autoComplete="off"
                spellCheck={false}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View>
              <Text style={{ color: "white", marginBottom: 8, fontSize: 16 }}>
                Password
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 16,
                    color: "white",
                    borderWidth: 1,
                    borderColor:
                      focusedInput === "password"
                        ? "#FFD700"
                        : "rgba(255,255,255,0.2)",
                    paddingRight: 50,
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  textContentType="password"
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  autoCorrect={false}
                  importantForAutofill="no"
                  autoComplete="off"
                  spellCheck={false}
                  passwordRules="minlength: 0;"
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
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
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 40 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text
                style={{ color: "#1a1a1a", fontSize: 16, fontWeight: "600" }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
});
