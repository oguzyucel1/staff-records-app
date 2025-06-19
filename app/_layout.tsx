import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { Animated, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import "./globals.css"; // Ensure global styles are imported

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsReady(true);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["#21469e", "#19357a", "#142a5f"]}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              flex: 1,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={require("../assets/splash.png")}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
                position: "absolute",
              }}
            />
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}
