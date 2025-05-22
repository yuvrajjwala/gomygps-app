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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { startPositionUpdates, stopPositionUpdates } from "@/app/services/backgroundService";
import { Marker } from "react-native-maps";
import tw from 'twrnc';

// Move constants outside component to prevent recreation
const statusFilters = [
  { label: "All", color: "#424242", icon: "apps" },            // Neutral dark gray for 'All'
  { label: "Running", color: "#4CAF50", icon: "autorenew" },   // Standard green
  { label: "Idle", color: "#FFC107", icon: "show-chart" },     // Amber for idle
  { label: "Stop", color: "#F44336", icon: "stop-circle" },    // Standard red
  { label: "In Active", color: "#29B6F6", icon: "show-chart" },// Light blue
  { label: "No Data", color: "#9E9E9E", icon: "stop-circle" }, // Medium gray
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
  const status = getDeviceStatus(device);
  const statusColors = {
    Running: '#4A5D23',
    Idle: '#6B8E23',
    Stop: '#556B2F',
    'In Active': '#808000',
    'No Data': '#9CA3AF'
  };

  const iconColors = [
    device.attributes.ignition ? "#66BB6A" : "#EF5350",
    device.attributes.is_mobilized ? "red" : "green",
    "#EF5350",
    "#29B6F6",
    device?.attributes?.batteryLevel ? (device?.attributes?.batteryLevel > 0 ? "#66BB6A" : "red") : "#66BB6A"
  ];

  const iconNames = [
    { "vpn-key": device.attributes.ignition },
    { lock: device.attributes.is_mobilized },
    { "ac-unit": device.attributes.is_parked },
    { "motion-photos-on": device.attributes.motion },
    { "battery-full": device?.attributes?.batteryLevel },
  ];

  const speed = (Number(device?.speed) * 1.852 || 0).toFixed(0);
  const lastUpdate = moment(device?.lastUpdate).format("D MMM YY, hh:mm A");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={tw`mx-4 mb-3`}
    >
      <View style={tw`bg-white rounded-2xl overflow-hidden border border-gray-100`}>
        {/* Card Header with Status Bar */}
        <View
          style={[
            tw`h-1.5 w-full`,
            { backgroundColor: statusColors[status as keyof typeof statusColors] }
          ]}
        />

        <View style={tw`p-4`}>
          {/* Top Row: Vehicle Info and Speed */}
          <View style={tw`flex-row justify-between items-start mb-3`}>
            {/* Left: Vehicle Info */}
            <View style={tw`flex-1 mr-3`}>
              <View style={tw`flex-row items-center mb-1`}>
                <Image
                  source={carImages[status as keyof typeof carImages] || carImages.Default}
                  style={{ width: 32, height: 32, resizeMode: "contain" }}
                />
                <View style={tw`ml-2 flex-1`}>
                  <Text
                    style={[tw`text-base`, { fontFamily: 'GeistBold', color: '#1F2937' }]}
                    numberOfLines={1}
                  >
                    {device?.name}
                  </Text>
                  <Text
                    style={[tw`text-xs`, { fontFamily: 'Geist', color: '#6B7280' }]}
                    numberOfLines={1}
                  >
                    {lastUpdate}
                  </Text>
                </View>
              </View>
              <Text
                style={[tw`text-xs mt-1`, { fontFamily: 'Poppins', color: '#4B5563' }]}
                numberOfLines={2}
              >
                {device?.address}
              </Text>
            </View>

            {/* Right: Speed Display */}
            <View style={[
              tw`items-center justify-center px-3 py-2 rounded-xl`,
              { backgroundColor: `${statusColors[status as keyof typeof statusColors]}10` }
            ]}>
              <Text style={[tw`text-2xl`, { fontFamily: 'GeistBold', color: statusColors[status as keyof typeof statusColors] }]}>
                {speed}
              </Text>
              <Text style={[tw`text-xs mt-0.5`, { fontFamily: 'Geist', color: '#6B7280' }]}>
                KM/H
              </Text>
            </View>
          </View>

          {/* Bottom Row: Status Icons */}
          <View style={tw`flex-row justify-between items-center border-t border-gray-100 pt-3`}>
            {/* Status Badge */}
            <View style={[
              tw`px-3 py-1 rounded-full`,
              { backgroundColor: `${statusColors[status as keyof typeof statusColors]}15` }
            ]}>
              <Text style={[
                tw`text-xs`,
                {
                  fontFamily: 'Poppins',
                  color: statusColors[status as keyof typeof statusColors]
                }
              ]}>
                {status.toUpperCase()}
              </Text>
            </View>

            {/* Status Icons */}
            <View style={tw`flex-row`}>
              {iconNames.map((icon, i) => {
                const key = Object.keys(icon)[0];
                const isActive = key === "vpn-key" ? device.attributes.ignition : Object.values(icon)[0];
                return (
                  <View
                    key={key + i}
                    style={[
                      tw`w-7 h-7 rounded-full items-center justify-center mx-1`,
                      {
                        backgroundColor: isActive ? `${iconColors[i]}15` : '#F3F4F6',
                        borderWidth: 1,
                        borderColor: isActive ? `${iconColors[i]}30` : '#E5E7EB'
                      }
                    ]}
                  >
                    <MaterialIcons
                      name={key as any}
                      size={14}
                      color={isActive ? iconColors[i] : '#9CA3AF'}
                    />
                  </View>
                );
              })}
            </View>
          </View>
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
}) => {
  const backgroundColor = isSelected ? '#4A5D23' : '#F5F5F5';
  const textColor = isSelected ? '#FFFFFF' : '#4A5D23';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`px-4 py-2 rounded-xl items-center justify-center mx-1.5`,
        {
          backgroundColor,
          borderWidth: 1,
          borderColor: isSelected ? '#4A5D23' : '#E5E7EB',
          minWidth: 110,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }
      ]}
    >
      <View style={tw`flex-row items-center`}>
        <MaterialIcons
          name={filter.icon as any}
          size={18}
          color={textColor}
          style={tw`mr-2`}
        />
        <View>
          <Text
            style={[
              tw`text-sm`,
              {
                color: textColor,
                fontFamily: 'GeistBold',
              }
            ]}
          >
            {filter.label}
          </Text>
          {typeof count === 'number' && (
            <Text
              style={[
                tw`text-xs mt-0.5`,
                {
                  color: isSelected ? '#FFFFFF' : '#6B7280',
                  fontFamily: 'Geist',
                }
              ]}
            >
              {count} vehicles
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});


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
    if (device.attributes.ignition === true && Number(device.speed) === 0) return "Idle";
    return (device.status === "online" && device.attributes.motion === true && Number(device.speed) > 0) ? "Running" : "Stop";
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

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={tw`bg-white border-b border-gray-100 py-3 px-4 flex-row items-center justify-between`}>
        <Text style={[tw`text-xl`, { fontFamily: 'GeistBold', color: '#4A5D23' }]}>
          Vehicle Tracking
        </Text>
        <TouchableOpacity
          style={tw`bg-[#4A5D23]/10 p-2 rounded-full`}
          onPress={() => {/* Add refresh handler */ }}
        >
          <MaterialIcons name="refresh" size={22} color="#4A5D23" />
        </TouchableOpacity>
      </View>

      {/* Fixed Search and Filters Section */}
      <View style={tw`bg-white border-b border-gray-100 pb-3 shadow-sm`}>
        {/* Search Bar */}
        <View style={tw`px-4 pt-3 mb-3`}>
          <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200`}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search vehicles by name or location..."
              placeholderTextColor="#9CA3AF"
              style={[tw`flex-1 ml-2 text-sm`, { fontFamily: 'Geist' }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={tw`bg-gray-200 rounded-full p-1`}
              >
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`px-3`}
        >
          {statusFilters.map((filter) => (
            <StatusFilter
              key={filter.label}
              filter={filter}
              isSelected={selectedFilter === filter.label}
              count={filterCounts[filter.label]}
              onPress={() => setSelectedFilter(filter.label)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Vehicle List */}
      {loading && devicesData.length === 0 ? (
        <View style={tw`px-4 pt-4`}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={tw`pt-3 pb-6`}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={tw`items-center justify-center py-12 px-4`}>
              <MaterialIcons name="search-off" size={48} color="#9CA3AF" />
              <Text style={[tw`text-lg mt-3 text-center`, { fontFamily: 'GeistBold', color: '#4A5D23' }]}>
                No vehicles found
              </Text>
              <Text style={[tw`text-sm mt-1 text-center text-gray-500`, { fontFamily: 'Geist' }]}>
                Try adjusting your search or filter criteria
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 4,
    marginBottom: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    marginLeft: 8,
    fontFamily: "Geist",
  },
  blackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  blackHeaderText: {
    color: "#4A5D23",
    fontSize: 20,
    fontFamily: "GeistBold",
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
  stopCountBadgeSelected: {
    backgroundColor: '#43A047',
  },
  stopCountTextSelected: {
    color: '#fff',
  },
});
