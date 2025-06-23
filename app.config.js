import "dotenv/config";

export default {
  expo: {
    name: "staffapp",
    slug: "staffapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/appicon.png",
    scheme: "staffapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      userInterfaceStyle: "automatic",
      bundleIdentifier: "com.oguzyucel1.staffapp",
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png", // Arka planı şeffaf olmalı!
        backgroundColor: "#4c669f",
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
      ],
      package: "com.oguzyucel1.staffapp",
      googleServicesFile: "./google-services.json",
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#4c669f",
      resizeMode: "contain",
    },

    assetBundlePatterns: ["**/*"],

    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#4c669f",
          sounds: ["./assets/sounds/notification.wav"],
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },

    jsEngine: "hermes",

    extra: {
      router: {},
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "a854bbcb-c183-43e9-b492-6a5d0bb913dc",
      },
    },
  },
};
