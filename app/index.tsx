import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setRole("unauthenticated");
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setRole(profile?.role || "user");
      } catch (error) {
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1C1C1E",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!role || role === "unauthenticated") {
    return <Redirect href="/auth/login" />;
  }

  if (role === "admin") {
    return <Redirect href="/(tabs)/(admin)/home" />;
  }

  return <Redirect href="/(tabs)/(user)/home" />;
}
