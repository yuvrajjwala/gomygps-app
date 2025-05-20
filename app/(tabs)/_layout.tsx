import { IconSymbol } from "@/components/ui/IconSymbol";
import { MaterialIcons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  startPositionUpdates,
  stopPositionUpdates,
} from "../services/backgroundService";

export default function TabLayout() {
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );
  const devices = useSelector((state: any) => state.devices.devices);
  console.log("isAuthenticated", isAuthenticated);

  if (!isAuthenticated) {
    return router.replace("/login");
  }

  useEffect(() => {
    if (isAuthenticated) {
      startPositionUpdates(devices);
    } else {
      stopPositionUpdates();
    }
    return () => {
      stopPositionUpdates();
    };
  }, [isAuthenticated, devices]);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        headerShown: false,
        tabBarStyle: [
          {
            backgroundColor: "black",
            alignItems: "center",
            justifyContent: "center",
            height: 70,
          },
        ],
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          textAlign: "center",
        },
        tabBarIconStyle: {
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Tracking",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="gps-fixed" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="devices" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="content-paste-search"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
