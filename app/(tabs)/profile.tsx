import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { removeNotificationToken } from "../utils/notificationToken";
import { isNotificationsEnabled, setNotificationsEnabled } from "../utils/notifications";

export default function DriversScreen() {
  const dispatch = useDispatch();
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  useEffect(() => {
    // Load initial notification state and ensure notifications are enabled by default
    const loadNotificationState = async () => {
      const enabled = await isNotificationsEnabled();
      setNotificationsEnabledState(enabled);
      
      // If notifications are not enabled, enable them by default
      if (!enabled) {
        await setNotificationsEnabled(true);
        setNotificationsEnabledState(true);
      }
    };
    loadNotificationState();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabledState(value);
    await setNotificationsEnabled(value);
  };

  const options = [
    {
      label: "Notifications",
      icon: "notifications",
      color: "#000000",
      isToggle: true,
      value: notificationsEnabled,
      onToggle: handleNotificationToggle,
    },
    {
      label: "All Vehicle Map",
      icon: "map",
      color: "#000000",
      onPress: () => router.push("/all-vehicles-map"),
    },
    {
      label: "Geofencing",
      icon: "my-location",
      color: "#000000",
      onPress: () => router.push("/geofencing"),
    },
    {
      label: "User Management",
      icon: "person",
      color: "#000000",
      onPress: () => router.push("/userManagement"),
    },
    {
      label: "Group Management",
      icon: "group",
      color: "#000000",
      onPress: () => router.push("/group-management"),
    },
    {
      label: "Logout",
      icon: "logout",
      color: "red",
      onPress: async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => {
              await removeNotificationToken();
              dispatch(logout());
              router.replace("/login");
            },
          },
        ]);
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.blackHeader}>
        <Text style={styles.blackHeaderText}>Profile</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={opt.label}
            style={styles.optionCard}
            activeOpacity={0.7}
            onPress={opt.onPress}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#F5F5F5" }]}>
              <MaterialIcons
                name={opt.icon as any}
                size={28}
                color={opt.color}
              />
            </View>
            <Text style={[styles.optionLabel, { color: opt.color }]}>
              {opt.label}
            </Text>
            {opt.isToggle ? (
              <Switch
                value={opt.value}
                onValueChange={opt.onToggle}
                trackColor={{ false: "#E0E0E0", true: "#000000" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E0E0E0"
                style={{ marginLeft: "auto" }}
              />
            ) : (
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={opt.color}
                style={{ marginLeft: "auto" }}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerBar: {
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "gray",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.5,
    paddingTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    marginTop: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.3,
  },

  addBtn: {
    backgroundColor: "#43A047",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    marginTop: 16,
  },
  addBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  map: {
    flex: 1,
    marginTop: 0,
  },

  geoAddLabel: {
    color: "#222",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
    marginTop: 10,
  },
  geoAddInput: {
    backgroundColor: "#F7F8FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: "#222",
    marginBottom: 8,
  },
  geoAddBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  geoAddSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#43A047",
    borderRadius: 10,
    paddingVertical: 12,
    flex: 1,
  },
  geoAddSaveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  geoAddCancelBtn: {
    backgroundColor: "#FF7043",
    borderRadius: 10,
    paddingVertical: 12,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  geoAddCancelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  groupInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupDetails: {
    marginLeft: 16,
    flex: 1,
  },
  groupName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  parentGroupName: {
    fontSize: 14,
    color: "#666",
  },
  addGroupPanel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  parentGroupSelector: {
    backgroundColor: "#F7F8FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    marginBottom: 16,
  },
  blackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  blackHeaderText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
});
