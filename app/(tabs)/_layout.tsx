import React from "react";
import { useSelector } from "react-redux";
import { router, Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";

export default function TabLayout() {
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );

  if (!isAuthenticated) {
    return router.replace("/login");
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#FFFFFF80",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#4A5D23",
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Poppins",
          marginTop: 2,
          color: "#FFFFFF",
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? "#FFFFFF20" : "transparent",
              padding: 1,
              borderRadius: 4,
            }}>
              <IconSymbol size={24} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Tracking",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? "#FFFFFF20" : "transparent",
              padding: 1,
              borderRadius: 4,
            }}>
              <MaterialIcons name="gps-fixed" size={24} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? "#FFFFFF20" : "transparent",
              padding: 1,
              borderRadius: 4,
            }}>
              <MaterialIcons name="devices" size={24} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? "#FFFFFF20" : "transparent",
              padding: 1,
              borderRadius: 4,
            }}>
              <MaterialIcons name="content-paste-search" size={24} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? "#FFFFFF20" : "transparent",
              padding: 1,
              borderRadius: 4,
            }}>
              <IconSymbol size={24} name="person" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
