import Api from "@/config/Api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const statusFilters = [
  { label: "All", color: "black", icon: "apps" },
  { label: "Running", color: "#43A047", icon: "autorenew" },
  { label: "Idle", color: "#FFD600", icon: "show-chart" },
  { label: "Stop", color: "red", icon: "stop-circle" },
  { label: "In Active", color: "#00a8d5", icon: "show-chart" },
  { label: "No Data", color: "gray", icon: "stop-circle" },
];

// Car images
const carImages = {
  Running: require("@/assets/images/cars/car-green.png"),
  Idle: require("@/assets/images/cars/car-orange.png"),
  Stop: require("@/assets/images/cars/car-red.png"),
  Default: require("@/assets/images/cars/car-blue.png"),
  "In Active": require("@/assets/images/cars/car-blue.png"),
  "No Data": require("@/assets/images/cars/car-gray.png"),
};

export default function VehiclesScreen() {
  const router = useRouter();
  const [devicesData, setDevicesData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isFocused) {
      getDevices();
      interval = setInterval(() => {
        getDevices();
      }, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isFocused]);

  const getDevices = async () => {
    if (!isFocused) return;
    setLoading(true);
    try {
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
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const getDeviceStatus = (device: any) => {
    if (!device?.lastUpdate) {
      return "No Data";
    }
    const lastUpdate = new Date(device.lastUpdate);
    const fourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 4);
    if (lastUpdate < fourHoursAgo) {
      return "In Active";
    }
    if (device.status === "online" && Number(device.speed) === 0) {
      return "Idle";
    }
    return device.status === "online" ? "Running" : "Stop";
  };

  const filteredDevices = useMemo(() => {
    return devicesData.filter((device: any) => {
      const matchesSearch =
        device?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device?.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "All" || getDeviceStatus(device) === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [devicesData, searchQuery, selectedFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: devicesData.length,
      Running: 0,
      Stop: 0,
      Idle: 0,
      "In Active": 0,
      "No Data": 0,
    };

    devicesData.forEach((device: any) => {
      const status = getDeviceStatus(device);
      counts[status]++;
    });

    return counts;
  }, [devicesData]);

  const renderVehicleCard = ({
    item: device,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const vehicleNumberColor = "#2EAD4B";
    const iconColors = [
      device.attributes.ignition ? "#66BB6A" : "#EF5350",
      "#EF5350",
      "#EF5350",
      "#29B6F6",
      device?.attributes?.batteryLevel ? "#66BB6A" : "#EF5350",
    ];
    const iconNames = [
      { "vpn-key": device.attributes.ignition },
      { lock: device.attributes.is_mobilized },
      { "ac-unit": device.attributes.is_parked },
      { "motion-photos-on": device.attributes.motion },
      { "battery-full": device?.attributes?.batteryLevel },
    ];
    return (
      <TouchableOpacity
        key={device.id + index}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/map", params: { ...device } })}
      >
        <View style={styles.vehicleCardNew}>
          <View
            style={{ flex: 1, flexDirection: "row", alignItems: "stretch" }}
          >
            <View
              style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
            >
              <View style={styles.vehicleIconWrap}>
                <Image
                  source={
                    carImages[
                      getDeviceStatus(device) as keyof typeof carImages
                    ] || carImages.Default
                  }
                  style={{
                    width: 72,
                    height: 72,
                    marginRight: 20,
                    resizeMode: "contain",
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.vehicleNumberNew,
                    { color: vehicleNumberColor },
                  ]}
                >
                  {device?.name}
                </Text>
                <View style={{ height: 8 }} />
                <Text style={styles.vehicleAddressNew}>{device?.address}</Text>
                <Text style={styles.vehicleDateNew}>
                  {moment(device?.lastUpdate).format("D MMM YY, hh:mm A")}
                </Text>
              </View>
            </View>
            {/* Right: Stats */}
            <View style={styles.statsColNew}>
              <View style={styles.statRowCompact}>
                <Text style={styles.statValueNew}>
                  {(Number(device?.speed) * 1.852 || 0).toFixed(0)}
                </Text>
                <Text style={styles.statUnitNew}> km/h</Text>
              </View>
              <Text style={styles.statLabelNew}>Speed</Text>
              <View style={styles.statRowCompact}>
                <Text style={styles.statValueNew}>
                  {((device?.attributes?.totalDistance || 0) / 1000).toFixed(0)}
                </Text>
                <Text style={styles.statUnitNew}> km</Text>
              </View>
              <Text style={styles.statLabelNew}>Distance</Text>
            </View>
          </View>
          {/* Bottom Icon Row */}
          <View style={styles.iconRowNew}>
            {iconNames.map((icon, i) => (
              <MaterialIcons
                key={Object.keys(icon)[0] + i}
                name={Object.keys(icon)[0] as any}
                size={22}
                color={iconColors[i]}
                style={{
                  marginHorizontal: 4,
                  opacity:
                    Object.keys(icon)[0] === "vpn-key"
                      ? device.attributes.ignition
                        ? 1
                        : 0.5
                      : Object.values(icon)[0]
                      ? 1
                      : 0.5,
                }}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // SkeletonCard component
  const SkeletonCard = () => (
    <View style={[styles.vehicleCardNew, { overflow: "hidden" }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            backgroundColor: "#e0e0e0",
            marginRight: 20,
          }}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              width: "60%",
              height: 16,
              backgroundColor: "#e0e0e0",
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
          <View
            style={{
              width: "80%",
              height: 12,
              backgroundColor: "#e0e0e0",
              borderRadius: 8,
              marginBottom: 6,
            }}
          />
          <View
            style={{
              width: "40%",
              height: 10,
              backgroundColor: "#e0e0e0",
              borderRadius: 8,
            }}
          />
        </View>
        <View style={styles.statsColNew}>
          <View
            style={{
              width: 38,
              height: 15,
              backgroundColor: "#e0e0e0",
              borderRadius: 8,
              marginBottom: 6,
            }}
          />
          <View
            style={{
              width: 38,
              height: 10,
              backgroundColor: "#e0e0e0",
              borderRadius: 8,
              marginBottom: 6,
            }}
          />
        </View>
      </View>
      <View style={{ flexDirection: "row", marginTop: 10, paddingLeft: 100 }}>
        {[...Array(4)].map((_, i) => (
          <View
            key={i}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: "#e0e0e0",
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.blackHeader}>
        <Text style={styles.blackHeaderText}>Tracking</Text>
      </View>
      {/* Status Filters */}
      <View style={styles.statusRow}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            onPress={() => setSelectedFilter(filter.label)}
            style={[
              styles.statusCard,
              filter.label === "Idle"
                ? { backgroundColor: "#FF6F00" }
                : { backgroundColor: filter.color, shadowColor: filter.color },
              selectedFilter === filter.label && {
                borderWidth: 2,
                borderColor: "#fff",
              },
            ]}
          >
            <Text style={styles.statusLabel}>{filter.label}</Text>
            <Text style={styles.statusCount}>{filterCounts[filter.label]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={22}
          color="#888"
          style={{ marginLeft: 8 }}
        />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons
            name="close-circle"
            size={22}
            color="#888"
            style={{ marginRight: 8 }}
          />
        </TouchableOpacity>
      </View>
      {/* Vehicle Cards or Skeletons */}
      {loading && devicesData.length === 0 ? (
        <View style={{ paddingHorizontal: 6, paddingTop: 8 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderVehicleCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 8,
    marginBottom: 16,
    gap: 8,
    marginTop: 20,
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 16,
    elevation: 1,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    marginLeft: 8,
  },
  vehicleCardNew: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 6,
    marginBottom: 6,
    padding: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  vehicleNumberNew: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 1,
  },
  vehicleAddressNew: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 1,
  },
  vehicleDateNew: {
    color: "#888",
    fontSize: 10,
    fontWeight: "400",
    marginBottom: 1,
  },
  statsColNew: {
    alignItems: "flex-end",
    minWidth: 38,
    marginLeft: 4,
    marginTop: 0,
  },
  statRowCompact: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 0,
  },
  statValueNew: {
    color: "#2EAD4B",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "right",
    marginBottom: 0,
  },
  statUnitNew: {
    color: "#2EAD4B",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 0,
  },
  statLabelNew: {
    color: "#888",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "right",
    marginBottom: 0,
  },
  iconRowNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 0,
    marginLeft: 0,
    paddingLeft: 100,
  },
  vehicleIconWrap: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    marginRight: 10,
    marginTop: 30,
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
