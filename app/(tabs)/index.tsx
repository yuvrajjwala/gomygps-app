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

  const updateVehicleStats = () => {
    const stats = [
      { label: "All", color: "#1B1F23", count: 0 },
      { label: "Running", color: "#00C48C", count: 0 },
      { label: "Idle", color: "#F4B740", count: 0 },
      { label: "Stop", color: "#FF6B6B", count: 0 },
      { label: "Inactive", color: "#4EA8DE", count: 0 },
      { label: "No Data", color: "#B0BEC5", count: 0 },
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
    <View style={{ margin: 8, borderRadius: 16, height: 200, backgroundColor: '#e0e0e0' }} />
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
            <Card style={styles.chartCard}>
              <Card.Title
                title="Vehicle Status Distribution"
                titleStyle={{ color: "#FF1744", fontWeight: "bold" }}
              />
              <PieChart
                data={pieData}
                width={screenWidth - 30}
                height={180}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255,23,68,${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </Card>
            {/* Recent Devices */}
            <Card style={styles.listCard}>
              <Card.Title
                title="Recent Devices"
                titleStyle={styles.listTitle}
              />
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeader}>NAME</Text>
                <Text style={styles.listHeader}>STATUS</Text>
              </View>
              {/* {devicesData?.length > 0 &&
                devicesData?.slice(0, 5)?.map((device: any, idx: number) => (
                  <View
                    key={device.name + idx}
                    style={[
                      styles.listRow,
                      idx !== devicesData?.length - 1 && styles.listRowBorder,
                    ]}
                  >
                    <View style={styles.listLeft}>
                      <View style={styles.deviceIconCircle}>
                        <MaterialIcons
                          name="local-shipping"
                          size={24}
                          color="#fff"
                          style={{}}
                        />
                      </View>
                      <Text style={styles.deviceName}>{device.name}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        device.status === "online" ? styles.online : styles.offline,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          device.status === "online"
                            ? styles.onlineDot
                            : styles.offlineDot,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          device.status === "online"
                            ? styles.onlineText
                            : styles.offlineText,
                        ]}
                      >
                        {device.status}
                      </Text>
                    </View>
                  </View>
                ))} */}
              {devicesData?.length > 0 &&
                devicesData.slice(0, 5).map((device, idx) => (
                  <View
                    key={device.name + idx}
                    style={[
                      tw`flex-row justify-between items-center px-4 py-3 bg-white rounded-lg `,
                      { fontFamily: "Geist-Bold" },
                      idx !== devicesData.length - 1 &&
                        tw`border-b border-gray-200`,
                      tw`shadow-sm`,
                    ]}
                  >
                    {/* Left: Icon + Device Name */}
                    <View style={tw`flex-row items-center`}>
                      <View
                        style={tw`bg-green-600 rounded-full w-10 h-10 flex items-center justify-center shadow`}
                      >
                        <MaterialIcons
                          name="local-shipping"
                          size={24}
                          color="#fff"
                        />
                      </View>
                      <Text
                        style={tw`ml-4 text-sm font-semibold text-gray-900`}
                      >
                        {device.name}
                      </Text>
                    </View>

                    {/* Right: Status Badge */}
                    <View
                      style={[
                        tw`flex-row items-center rounded-full px-3 py-1 shadow`,
                        device.status === "online"
                          ? tw`bg-green-100`
                          : tw`bg-red-100`,
                      ]}
                    >
                      <View
                        style={[
                          tw`w-3 h-3 rounded-full mr-2`,
                          device.status === "online"
                            ? tw`bg-green-600`
                            : tw`bg-red-500`,
                        ]}
                      />
                      <Text
                        style={[
                          tw`text-xs font-medium`,
                          device.status === "online"
                            ? tw`text-green-700`
                            : tw`text-red-600`,
                        ]}
                      >
                        {device.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
            </Card>
            {/* Groups */}
            <Card style={styles.listCard}>
              <Card.Title title="Groups" titleStyle={styles.listTitle} />
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeader}>NAME</Text>
              </View>
              {groupsData?.length > 0 &&
                groupsData?.map((group: any, idx: number) => (
                  <View
                    key={group.name}
                    style={[
                      styles.listRow,
                      idx !== groupsData?.length - 1 && styles.listRowBorder,
                    ]}
                  >
                    <View style={styles.listLeft}>
                      <View style={styles.groupIconCircle}>
                        <MaterialIcons name="layers" size={22} color="#fff" />
                      </View>
                      <Text style={styles.deviceName}>{group.name}</Text>
                    </View>
                  </View>
                ))}
            </Card>
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
    fontFamily: "Poppins-Regular",
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
