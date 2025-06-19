import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type LeaveRequest = {
  id: string;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    department: string;
  };
};

type LeaveRequestCardProps = {
  request: LeaveRequest;
  onPress?: () => void;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

export default function LeaveRequestCard({
  request,
  showActions = false,
  onApprove,
  onReject,
}: LeaveRequestCardProps) {
  console.log("LeaveRequestCard - Request Profiles:", request.profiles);
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      default:
        return "#FFA000";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Onaylandı";
      case "rejected":
        return "Reddedildi";
      default:
        return "Beklemede";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpand} style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.name}>
              {request.profiles?.full_name || "Bilinmiyor"}
            </Text>
            <Text style={styles.email}>
              {request.profiles?.email || "Bilinmiyor"}
            </Text>
            <Text style={styles.department}>
              {request.profiles?.department || "Bilinmiyor"}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(request.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(request.status)}
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#666"
          />
        </View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.details,
          {
            maxHeight: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200],
            }),
            opacity: animation,
          },
        ]}
      >
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color="#666" />
          <Text style={styles.detailText}>
            {format(new Date(request.start_date), "d MMMM yyyy", {
              locale: tr,
            })}{" "}
            -{" "}
            {format(new Date(request.end_date), "d MMMM yyyy", { locale: tr })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="document-text" size={20} color="#666" />
          <Text style={styles.detailText}>{request.leave_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="chatbubble" size={20} color="#666" />
          <Text style={styles.detailText}>{request.reason}</Text>
        </View>

        {showActions && request.status === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => onApprove?.(request.id)}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject?.(request.id)}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  department: {
    fontSize: 14,
    color: "#666",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  details: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
