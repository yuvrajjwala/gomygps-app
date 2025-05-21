import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useMemo, useState, useCallback, memo, useEffect } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { startPositionUpdates, stopPositionUpdates } from "@/app/services/backgroundService";
import { Marker } from "react-native-maps";

// Move constants outside component to prevent recreation
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

// Memoized Vehicle Card Component
const VehicleCard = memo(({ 
  device, 
  onPress,
  getDeviceStatus 
}: { 
  device: any; 
  onPress: () => void;
  getDeviceStatus: (device: any) => string;
}) => {
  const vehicleNumberColor = "#2EAD4B";
  const iconColors = [
    device.attributes.ignition ? "#66BB6A" : "#EF5350",
    device.attributes.is_mobilized ? "red" : "green",
    "#EF5350",
    "#29B6F6",
    device?.attributes?.batteryLevel ? (device?.attributes?.batteryLevel > 0 ? "#66BB6A" : "red") :"#66BB6A"
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
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.vehicleCardNew}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "stretch" }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <View style={styles.vehicleIconWrap}>
              <Image
                source={carImages[getDeviceStatus(device) as keyof typeof carImages] || carImages.Default}
                style={{
                  width: 72,
                  height: 72,
                  marginRight: 20,
                  resizeMode: "contain",
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.vehicleNumberNew, { color: vehicleNumberColor }]}>
                {device?.name}
              </Text>
              <View style={{ height: 8 }} />
              <Text style={styles.vehicleAddressNew}>{device?.address}</Text>
              <Text style={styles.vehicleDateNew}>
                {moment(device?.lastUpdate).format("D MMM YY, hh:mm A")}
              </Text>
            </View>
          </View>
          <View style={styles.statsColNew}>
            <View style={styles.statRowCompact}>
              <Text style={styles.statValueNew}>
                {(Number(device?.speed) * 1.852 || 0).toFixed(0)}
              </Text>
              <Text style={styles.statUnitNew}> km/h</Text>
            </View>
            <Text style={styles.statLabelNew}>Speed</Text>
            {/* <View style={styles.statRowCompact}>
              <Text style={styles.statValueNew}>
                {((device?.attributes?.totalDistance || 0) / 1000).toFixed(0)}
              </Text>
              <Text style={styles.statUnitNew}> km</Text>
            </View> */}
          </View>
        </View>
        <View style={styles.iconRowNew}>
          {iconNames.map((icon, i) => (
            <MaterialIcons
              key={Object.keys(icon)[0] + i}
              name={Object.keys(icon)[0] as any}
              size={22}
              color={iconColors[i]}
              style={{
                marginHorizontal: 4,
                opacity: Object.keys(icon)[0] === "vpn-key"
                  ? device.attributes.ignition ? 1 : 0.5
                  : Object.values(icon)[0] ? 1 : 0.5,
              }}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Memoized Skeleton Card Component
const SkeletonCard = memo(() => (
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
));

// Memoized Status Filter Component
const StatusFilter = memo(({ 
  filter, 
  isSelected, 
  count, 
  onPress 
}: { 
  filter: typeof statusFilters[0]; 
  isSelected: boolean; 
  count: number; 
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.statusCard,
      filter.label === "Idle"
        ? { backgroundColor: "#FF6F00" }
        : { backgroundColor: filter.color, shadowColor: filter.color },
      isSelected && {
        borderWidth: 2,
        borderColor: "#fff",
      },
    ]}
  >
    <Text style={styles.statusLabel}>{filter.label}</Text>
    <Text style={styles.statusCount}>{count}</Text>
  </TouchableOpacity>
));

export default function VehiclesScreen() {
  const router = useRouter();
  const { devices: devicesData, loading } = useSelector((state: RootState) => state.devices);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedStop, setSelectedStop] = useState(null);
  const [stopLocations, setStopLocations] = useState([]);

  // Start background service when entering vehicles page
  useEffect(() => {
    startPositionUpdates(true);
    
    // Stop background service when leaving vehicles page
    return () => {
      stopPositionUpdates();
    };
  }, []);

  // Memoized device status function
  const getDeviceStatus = useCallback((device: any) => {
    if (!device?.lastUpdate) return "No Data";
    const lastUpdate = new Date(device.lastUpdate);
    const fourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 4);
    if (lastUpdate < fourHoursAgo) return "In Active";
    if (device.attributes.ignition===true && Number(device.speed) === 0) return "Idle";
    return (device.status === "online" &&  device.attributes.motion===true && Number(device.speed) > 0) ? "Running" : "Stop";
  }, []);

  // Memoized filtered devices
  const filteredDevices = useMemo(() => {
    // First, search across all devices
    const searchResults = devicesData.filter((device: any) => {
      return device?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // If there's a search query, show all matching results regardless of filter
    if (searchQuery.trim() !== "") {
      return searchResults;
    }
    
    // If no search query, apply the status filter
    if (selectedFilter === "All") {
      return searchResults;
    }
    
    return searchResults.filter((device: any) => 
      getDeviceStatus(device) === selectedFilter
    );
  }, [devicesData, searchQuery, selectedFilter, getDeviceStatus]);

  // Memoized filter counts
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
  }, [devicesData, getDeviceStatus]);

  // Memoized render item function
  const renderItem: ListRenderItem<any> = useCallback(({ item }) => (
    <VehicleCard
      device={item}
      onPress={() => router.push({ pathname: "/map", params: { ...item } })}
      getDeviceStatus={getDeviceStatus}
    />
  ), [router, getDeviceStatus]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  // Memoized list header component
  const ListHeaderComponent = useMemo(() => (
    <>
      <View style={styles.statusRow}>
        {statusFilters.map((filter) => (
          <StatusFilter
            key={filter.label}
            filter={filter}
            isSelected={selectedFilter === filter.label}
            count={filterCounts[filter.label]}
            onPress={() => setSelectedFilter(filter.label)}
          />
        ))}
      </View>
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
    </>
  ), [selectedFilter, filterCounts, searchQuery]);

  // Modify stop markers to maintain highest z-index
  const stopMarkers = useMemo(
    () =>
      stopLocations.map((stop, idx) => {
        const isFirstOrLast = idx === 0 || idx === stopLocations.length - 1;
        const startTime = moment(stop.startTime).format('HH:mm');
        const endTime = moment(stop.endTime).format('HH:mm');
        const duration = moment.duration(moment(stop.endTime).diff(moment(stop.startTime)));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        return (
          <Marker
            key={`stop-${idx}`}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={3}
            onPress={() => setSelectedStop(idx)}
          >
            <View style={{ backgroundColor: 'transparent' }}>
              <MaterialIcons
                name="flag"
                size={24}
                color={idx === 0 ? "green" : "red"}
                style={{ opacity: isFirstOrLast ? 1 : 0 }}
              />
              <TouchableOpacity
                style={[
                  styles.stopCountBadge,
                  { opacity: !isFirstOrLast ? 1 : 0 },
                  selectedStop === idx && styles.stopCountBadgeSelected
                ]}
                onPress={() => setSelectedStop(idx)}
              >
                <Text style={[
                  styles.stopCountText,
                  selectedStop === idx && styles.stopCountTextSelected
                ]}>{idx}</Text>
              </TouchableOpacity>
            </View>
          </Marker>
        );
      }),
    [stopLocations, selectedStop]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.blackHeader}>
        <Text style={styles.blackHeaderText}>Tracking</Text>
      </View>
      
      {loading && devicesData.length === 0 ? (
        <View style={{ paddingHorizontal: 6, paddingTop: 8 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 150, // Approximate height of each item
            offset: 150 * index,
            index,
          })}
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
    marginTop: 20,
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
  stopCountBadgeSelected: {
    backgroundColor: '#43A047',
  },
  stopCountTextSelected: {
    color: '#fff',
  },
});
