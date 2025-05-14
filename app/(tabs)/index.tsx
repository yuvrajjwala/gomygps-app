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
import { Card, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const theme = useTheme();
  const [devicesData, setDevicesData] = useState<any[]>([]);
  const [groupsData, setGroupsData] = useState([]);
  const [vehicleStats, setVehicleStats] = useState([
    { label: "All", count: 0, color: "black" },
    { label: "Running", count: 0, color: "#43A047" },
    { label: "Idle", count: 0, color: "orange" },
    { label: "Stop", count: 0, color: "red" },
    { label: "Inactive", count: 0, color: "#00a8d5" },
    { label: "No Data", count: 0, color: "gray" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDevicesCount();
    getGroupsCount();
  }, []);

  useEffect(() => {
    if (devicesData?.length > 0) {
      updateVehicleStats();
    }
  }, [devicesData]);

  const updateVehicleStats = () => {
    const stats = [
      { label: "All", color: "black", count: 0 },
      { label: "Running", color: "#43A047", count: 0 },
      { label: "Idle", color: "orange", count: 0 },
      { label: "Stop", color: "red", count: 0 },
      { label: "Inactive", color: "#00a8d5", count: 0 },
      { label: "No Data", color: "gray", count: 0 },
    ];

    devicesData.forEach((device) => {
      if (!device?.lastUpdate) {
        stats[5].count++; // No Data
        return;
      }
      const lastUpdate = new Date(device.lastUpdate);
      const twelveHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 12);
      if (lastUpdate < twelveHoursAgo) {
        stats[4].count++; // Inactive
        return;
      }
      if (device.status === "online" && Number(device.speed) === 0) {
        stats[2].count++; // Idle
        return;
      }
      if (device.status === "online") {
        stats[1].count++; // Running
        return;
      }
      stats[3].count++; // Stop
    });

    stats[0].count = devicesData.length; // All

    setVehicleStats(stats);
  };

  const getDevicesCount = async () => {
    setLoading(true);
    const [responseDevices, responsePositions] = await Promise.all([
      Api.call("/api/devices", "GET", {}, false),
      Api.call("/api/positions", "GET", {}, false),
    ]);
    setDevicesData(
      responseDevices.data.map((device: any) => ({
        ...device,
        ...responsePositions.data.find(
          (position: any) => position.deviceId === device.id
        ),
      }))
    );
    setLoading(false);
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
    <View style={{ width: '31%', borderRadius: 16, alignItems: 'center', paddingVertical: 18, backgroundColor: '#e0e0e0', marginBottom: 8 }} />
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
        {loading ? (
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
                <View style={{ width: 80, height: 16, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
                <View style={{ width: 60, height: 16, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
              </View>
              {[...Array(5)].map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </View>
            {/* Skeleton Groups */}
            <View style={styles.listCard}>
              <View style={styles.listHeaderRow}>
                <View style={{ width: 80, height: 16, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
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
                width={screenWidth - 32}
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
              <Card.Title title="Recent Devices" titleStyle={styles.listTitle} />
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeader}>NAME</Text>
                <Text style={styles.listHeader}>STATUS</Text>
              </View>
              {devicesData?.length > 0 &&
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
    color: "#00B8D4",
  },
  cardGrid: {
    marginHorizontal: 8,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: "center",
  },
  chartCard: {
    margin: 8,
    borderRadius: 16,
    elevation: 4,
    paddingBottom: 8,
  },
  listCard: {
    margin: 8,
    borderRadius: 16,
    elevation: 4,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  listTitle: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#222",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  listHeader: {
    fontWeight: "600",
    color: "#888",
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
    borderRadius: 10,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2979FF", // fallback for RN
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  groupIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#536DFE",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111",
  },
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
    backgroundColor: "#E6F9ED",
  },
  offline: {
    backgroundColor: "#F2F3F5",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: "#00C853",
  },
  offlineDot: {
    backgroundColor: "#B0BEC5",
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  onlineText: {
    color: "#00C853",
  },
  offlineText: {
    color: "#888",
  },
  typeBadge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  parent: {
    backgroundColor: "#E3E8FF",
  },
  child: {
    backgroundColor: "#F3E8FF",
  },
  typeText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  parentText: {
    color: "#3D5AFE",
  },
  childText: {
    color: "#A259FF",
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
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusCard: {
    width: "31%",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 5,
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
    fontSize: 16,
  },
});
