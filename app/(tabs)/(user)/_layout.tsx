import { Tabs } from "expo-router";
import React, { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, TouchableOpacity } from "react-native";

export default function UserLayout() {
  const homeScale = useRef(new Animated.Value(1)).current;
  const exploreScale = useRef(new Animated.Value(1)).current;
  const profileScale = useRef(new Animated.Value(1)).current;

  const animatePress = (scaleValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4a00e0",
        tabBarInactiveTintColor: "#888",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
          bottom: 0,
          paddingBottom: 5,
          paddingTop: 5,
          height: 77,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: homeScale }],
              }}
            >
              <Ionicons name="home-outline" size={24} color={color} />
            </Animated.View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={props.style}
              onPress={() => {
                animatePress(homeScale);
                props.onPress?.(props as any);
              }}
              activeOpacity={1}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: exploreScale }],
              }}
            >
              <Ionicons name="compass-outline" size={24} color={color} />
            </Animated.View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={props.style}
              onPress={() => {
                animatePress(exploreScale);
                props.onPress?.(props as any);
              }}
              activeOpacity={1}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: profileScale }],
              }}
            >
              <Ionicons name="person-outline" size={24} color={color} />
            </Animated.View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={props.style}
              onPress={() => {
                animatePress(profileScale);
                props.onPress?.(props as any);
              }}
              activeOpacity={1}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
