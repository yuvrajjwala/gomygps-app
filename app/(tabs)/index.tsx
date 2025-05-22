import Api from "@/config/Api";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import tw from 'twrnc';
import { startPositionUpdates, stopPositionUpdates } from "@/app/services/backgroundService";
const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const { devices: devicesData, loading } = useSelector((state: RootState) => state.devices);
  const [groupsData, setGroupsData] = React.useState([]);
  const [vehicleStats, setVehicleStats] = React.useState([
    { label: "All", count: 0, color: "black" },
    { label: "Running", count: 0, color: "#43A047" },
    { label: "Idle", count: 0, color: "orange" },
    { label: "Stop", count: 0, color: "red" },
    { label: "Inactive", count: 0, color: "#00a8d5" },
    { label: "No Data", count: 0, color: "gray" },
  ]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Start background service when entering dashboard
  useEffect(() => {
    startPositionUpdates(true);

    // Stop background service when leaving dashboard
    return () => {
      stopPositionUpdates();
    };
  }, []);

  useEffect(() => {
    getGroupsCount();
  }, []);

  useEffect(() => {
    if (devicesData?.length > 0) {
      updateVehicleStats();
      setIsInitialLoad(false);
    }
  }, [devicesData]);
  const premiumColors = {
    primary: "#1B5E20",
    secondary: "#2E7D32",
    accent: "#4CAF50",
    background: "#FFFFFF",
    textPrimary: "#2D3748",
    textSecondary: "#718096",
    chartColors: ["#1B5E20", "#4CAF50", "#FFB74D", "#EF5350", "#29B6F6"],
  };
  const updateVehicleStats = () => {
  const stats = [
  { label: "All", color: "#6366F1", count: 0 },         // Indigo 500 — Primary
  { label: "Running", color: "#22C55E", count: 0 },     // Green 500 — Positive
  { label: "Idle", color: "#FACC15", count: 0 },        // Yellow 400 — Attention
  { label: "Stop", color: "#EF4444", count: 0 },        // Red 500 — Error
  { label: "Inactive", color: "#3B82F6", count: 0 },    // Blue 500 — Neutral/Offline
  { label: "No Data", color: "#9CA3AF", count: 0 },     // Gray 400 — Unknown
];



    devicesData.forEach((device) => {
      if (!device?.lastUpdate) {
        stats[5].count++; // No Data
        return;
      }
      const lastUpdate = new Date(device.lastUpdate);
      // TODO: Need inactive time to be dynamic user wise
      const fourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 4);
      if (lastUpdate < fourHoursAgo) {
        stats[4].count++; // Inactive
        return;
      }
      if (device.attributes.ignition === true && Number(device.speed) === 0) {
        stats[2].count++; // Idle
        return;
      }
      // if(device.attributes.ignition===false && device.speed > 0){ //HR38AE4284
      //   console.log(device.name, "ignition", device.attributes.ignition)
      // }
      if (device.status === "online" && device.attributes.motion === true && Number(device.speed) > 0) {
        stats[1].count++; // Running
        return;
      }
      stats[3].count++; // Stop
    });

    stats[0].count = devicesData.length; // All

    setVehicleStats(stats);
  };


  const getGroupsCount = async () => {
    const response = await Api.call("/api/groups", "GET", {}, false);
    setGroupsData(response.data);
  };

  const pieData = vehicleStats.slice(1, 6).map((stat) => ({
    name: stat.label,
    population: stat.count,
    color: stat.color,
    legendFontColor: "#222",
    legendFontSize: 16,
  }));

  // Skeleton components
  const SkeletonStatusCard = () => (
    <View style={{ width: '31%', borderRadius: 10, alignItems: 'center', paddingVertical: 18, backgroundColor: '#e0e0e0', marginBottom: 8 }} />
  );
  const SkeletonChart = () => (
    <View style={{ margin: 8, borderRadius: 16, height: 200, backgroundColor: '#e0e0e0',paddingVertical: 18 }} />
  );
  const SkeletonListRow = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#e0e0e0', borderRadius: 10, marginBottom: 8 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#d0d0d0', marginRight: 12 }} />
      <View style={{ width: 100, height: 16, backgroundColor: '#d0d0d0', borderRadius: 8 }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.blackHeader}>
        <Text style={styles.blackHeaderText}>Dashboard</Text>
      </View>
      <ScrollView style={{ marginTop: 20 }}>
        {loading && isInitialLoad ? (
          <>
            {/* Skeleton Status Cards */}
            <View style={styles.statusRow}>
              {[...Array(6)].map((_, i) => (
                <SkeletonStatusCard key={i} />
              ))}
            </View>
            {/* Skeleton Chart */}
            <SkeletonChart />
            {/* Skeleton Recent Devices */}
            <View style={styles.listCard}>
              <View style={styles.listHeaderRow}>
                <View
                  style={{
                    width: 80,
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 8,
                  }}
                />
                <View
                  style={{
                    width: 60,
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 8,
                  }}
                />
              </View>
              {[...Array(5)].map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </View>
            {/* Skeleton Groups */}
            <View style={styles.listCard}>
              <View style={styles.listHeaderRow}>
                <View
                  style={{
                    width: 80,
                    height: 16,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 8,
                  }}
                />
              </View>
              {[...Array(4)].map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.statusRow}>
              {vehicleStats.map((filter) => (
                <View
                  key={filter.label}
                  style={[
                    styles.statusCard,
                    filter.label === "Idle"
                      ? { backgroundColor: "#FF6F00" }
                      : {
                        backgroundColor: filter.color,
                        shadowColor: filter.color,
                      },
                    filter.label === "Idle" && {
                      borderWidth: 2,
                      borderColor: "#fff",
                    },
                  ]}
                >
                  <Text style={styles.statusLabel}>{filter.label}</Text>
                  <Text style={styles.statusCount}>{filter.count}</Text>
                </View>
              ))}
            </View>
            <View style={tw`bg-gray-50 rounded-2xl p-5 mb-6 shadow-sm`}>
              <Text style={tw`font-geist-bold text-lg text-emerald-900 mb-4`}>
                Vehicle Status Distribution
              </Text>
              <PieChart
                data={pieData}
                width={screenWidth - 40}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
            {/* Recent Devices */}
            <View style={tw`bg-gray-50 rounded-2xl p-5 mb-6 shadow-sm`}>
              <Text style={tw`font-geist-bold text-lg text-emerald-900 mb-4`}>
                Recent Devices
              </Text>

              <View style={tw`flex-row justify-between mb-3 px-2`}>
                <Text style={tw`font-poppins text-xs text-emerald-800/60 uppercase tracking-wide`}>
                  Device
                </Text>
                <Text style={tw`font-poppins text-xs text-emerald-800/60 uppercase tracking-wide`}>
                  Status
                </Text>
              </View>

              {devicesData?.slice(0, 5).map((device, index) => (
                <View
                  key={index}
                  style={tw`flex-row justify-between items-center py-3 border-b border-gray-200/80`}
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`bg-emerald-700 w-10 h-10 rounded-full items-center justify-center mr-3`}>
                      <MaterialIcons name="local-shipping" size={24} color="white" />
                    </View>
                    <Text style={tw`font-geist text-gray-900`}>
                      {device.name}
                    </Text>
                  </View>

                  <View style={[
                    tw`px-3 py-1 rounded-full flex-row items-center`,
                    device.status === 'online'
                      ? tw`bg-emerald-100`
                      : tw`bg-gray-200`
                  ]}>
                    <View style={[
                      tw`w-2 h-2 rounded-full mr-2`,
                      device.status === 'online'
                        ? tw`bg-emerald-600`
                        : tw`bg-gray-500`
                    ]} />
                    <Text style={[
                      tw`font-PoppinsRegular text-xs`,
                      device.status === 'online'
                        ? tw`text-emerald-700`
                        : tw`text-gray-600`
                    ]}>
                      {device.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            {/* Groups */}

            <View style={tw`bg-gray-50 rounded-2xl p-5 shadow-sm`}>
              <Text style={tw`font-geist-bold  text-lg text-emerald-900 mb-4`}>
                Groups
              </Text>

              {groupsData?.length > 0 &&
                groupsData?.map((group: any, idx: number) => (
                  <View
                    key={idx}
                    style={tw`flex-row items-center py-3 border-b border-gray-200/80`}
                  >
                    <View style={tw`bg-emerald-600 w-9 h-9 rounded-lg items-center justify-center mr-3`}>
                      <MaterialIcons name="layers" size={20} color="white" />
                    </View>
                    <Text style={tw`font-geist text-gray-900`}>
                      {group.name}
                    </Text>
                  </View>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 16,
    alignSelf: "center",
    color: "#2E7D32", // Dark Green
  },

  // Card Layout
  cardGrid: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#E8F5E9", // Light Green
    paddingVertical: 16,
    flex: 1,
    elevation: 3,
  },

  // Pie Chart Card
  chartCard: {
    margin: 12,
    borderRadius: 20,
    elevation: 5,
    paddingBottom: 16,
    backgroundColor: "#F1F8E9", // Soft light green
  },

  // List Cards
  listCard: {
    margin: 12,
    borderRadius: 20,
    elevation: 4,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  listTitle: {
    fontFamily: "PoppinsRegular",
    fontWeight: "light",
    fontSize: 16,
    color: "#1B5E20", // Darker green for section titles
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  listHeader: {
    fontWeight: "600",
    color: "#789262",
    fontSize: 13,
    letterSpacing: 1,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 4,
    elevation: 1,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },

  // Icons
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#66BB6A", // Medium green
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  groupIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#81C784", // Light green
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#212121",
  },

  // Status Badges
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 70,
    justifyContent: "center",
  },
  online: {
    backgroundColor: "#E8F5E9", // Light green background
  },
  offline: {
    backgroundColor: "#F1F1F1",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: "#43A047", // Green
  },
  offlineDot: {
    backgroundColor: "#BDBDBD",
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  onlineText: {
    color: "#2E7D32",
  },
  offlineText: {
    color: "#9E9E9E",
  },

  // Type Badges
  typeBadge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  parent: {
    backgroundColor: "#C8E6C9",
  },
  child: {
    backgroundColor: "#DCEDC8",
  },
  typeText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  parentText: {
    color: "#2E7D32",
  },
  childText: {
    color: "#558B2F",
  },

  // Header
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
    color: "#2E7D32",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Status Row Grid
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 8,
    marginBottom: 16,
    gap: 12,
    justifyContent: "space-between",
  },
  statusCard: {
    width: "30%",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#C0CFB2", // valid pastel green
    elevation: 2,
  },

  statusLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 2,
  },
  statusCount: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
