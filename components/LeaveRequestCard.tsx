import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LeaveRequest } from "../types/leave";

const statusColors: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#4CAF50", text: "#fff" },
  pending: { bg: "#FFD600", text: "#333" },
  rejected: { bg: "#E53935", text: "#fff" },
};

export default function LeaveRequestCard({
  request,
}: {
  request: LeaveRequest;
}) {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [showDetails, setShowDetails] = useState(false);
  const status = request.status || "pending";
  const statusColor = statusColors[status] || statusColors["pending"];

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    if (!expanded) setShowDetails(true);
    Animated.timing(animation, {
      toValue,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      if (expanded) setShowDetails(false);
    });
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      {/* Status badge absolute */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
        <Text style={[styles.statusText, { color: statusColor.text }]}>
          {status === "approved"
            ? "Onaylandı"
            : status === "pending"
              ? "Bekliyor"
              : "Reddedildi"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.summaryRow}
        onPress={toggleExpand}
        activeOpacity={0.85}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color="#888" />
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.name}>{request.profiles.full_name}</Text>
          <Text style={styles.email}>{request.profiles.email}</Text>
          <Text style={styles.department}>{request.profiles.department}</Text>
        </View>
        <View style={styles.chevronWrapper}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={28}
            color="#4a00e0"
          />
        </View>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.details,
          {
            maxHeight: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 160],
            }),
            opacity: animation,
            paddingVertical: expanded ? 14 : 0,
          },
        ]}
      >
        {showDetails && (
          <>
            <View style={styles.detailRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#4a00e0"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>
                {format(new Date(request.start_date), "d MMMM yyyy", {
                  locale: tr,
                })}{" "}
                -{" "}
                {format(new Date(request.end_date), "d MMMM yyyy", {
                  locale: tr,
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#4a00e0"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{request.leave_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="#4a00e0"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{request.reason}</Text>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: "relative",
    paddingTop: 8,
    paddingBottom: 0,
    overflow: "visible",
  },
  statusBadge: {
    position: "absolute",
    top: 14,
    right: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
    minWidth: 0,
    maxWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    flexWrap: "wrap",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 1,
  },
  email: {
    fontSize: 13,
    color: "#666",
    marginBottom: 1,
  },
  department: {
    fontSize: 13,
    color: "#888",
  },
  chevronWrapper: {
    marginTop: 16,
    marginLeft: 0,
    alignSelf: "flex-end",
  },
  details: {
    paddingHorizontal: 22,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    overflow: "hidden",
    backgroundColor: "#fafbff",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    flexWrap: "wrap",
  },
});
