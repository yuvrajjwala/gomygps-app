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
import { LinearGradient } from 'expo-linear-gradient';
const screenWidth = Dimensions.get("window").width;

interface VehicleStat {
  label: string;
  color: string;
  count: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  bgColor: string;
  textColor: string;
}

const statusCardGradients = [
  ["#8e54e9", "#4776e6"], // All - purple/blue
  ["#11998e", "#38ef7d"], // Running - green
  ["#f7971e", "#ffd200"], // Idle - orange/yellow
  ["#f953c6", "#b91d73"], // Stop - red/pink
  ["#396afc", "#2948ff"], // Inactive - blue
  ["#232526", "#414345"], // No Data - dark
];
const statusCardIcons = [
  "local-shipping", // All
  "speed",          // Running
  "schedule",       // Idle
  "block",          // Stop
  "power-settings-new", // Inactive
  "help",           // No Data
];

export default function DashboardScreen() {
  const { devices: devicesData, loading } = useSelector((state: RootState) => state.devices);
  const [groupsData, setGroupsData] = React.useState([]);
  const [vehicleStats, setVehicleStats] = React.useState<VehicleStat[]>([
    {
      label: "All",
      color: "#4A5D23",
      count: 0,
      icon: "local-shipping",
      bgColor: "#4A5D23",
      textColor: "#FFFFFF"
    },
    {
      label: "Running",
      color: "#6B8E23",
      count: 0,
      icon: "speed",
      bgColor: "#6B8E23",
      textColor: "#FFFFFF"
    },
    {
      label: "Idle",
      color: "#808000",
      count: 0,
      icon: "schedule",
      bgColor: "#808000",
      textColor: "#FFFFFF"
    },
    {
      label: "Stop",
      color: "#556B2F",
      count: 0,
      icon: "block",
      bgColor: "#556B2F",
      textColor: "#FFFFFF"
    },
    {
      label: "Inactive",
      color: "#8B8B00",
      count: 0,
      icon: "power-settings-new",
      bgColor: "#8B8B00",
      textColor: "#FFFFFF"
    },
    {
      label: "No Data",
      color: "#9CA3AF",
      count: 0,
      icon: "help",
      bgColor: "#9CA3AF",
      textColor: "#FFFFFF"
    },
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
    primary: "#4A5D23", // Olive green
    secondary: "#6B8E23", // Olive drab
    accent: "#808000", // Olive
    background: "#FFFFFF",
    textPrimary: "#2D3748",
    textSecondary: "#718096",
    chartColors: ["#4A5D23", "#6B8E23", "#808000", "#556B2F", "#8B8B00"],
  };
  const updateVehicleStats = () => {
    const stats: VehicleStat[] = [
      {
        label: "All",
        color: "#4A5D23",
        count: 0,
        icon: "local-shipping",
        bgColor: "#4A5D23",
        textColor: "#FFFFFF"
      },
      {
        label: "Running",
        color: "#6B8E23",
        count: 0,
        icon: "speed",
        bgColor: "#6B8E23",
        textColor: "#FFFFFF"
      },
      {
        label: "Idle",
        color: "#808000",
        count: 0,
        icon: "schedule",
        bgColor: "#808000",
        textColor: "#FFFFFF"
      },
      {
        label: "Stop",
        color: "#556B2F",
        count: 0,
        icon: "block",
        bgColor: "#556B2F",
        textColor: "#FFFFFF"
      },
      {
        label: "Inactive",
        color: "#8B8B00",
        count: 0,
        icon: "power-settings-new",
        bgColor: "#8B8B00",
        textColor: "#FFFFFF"
      },
      {
        label: "No Data",
        color: "#9CA3AF",
        count: 0,
        icon: "help",
        bgColor: "#9CA3AF",
        textColor: "#FFFFFF"
      },
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
    legendFontColor: "#fafafa",
    legendFontSize: 16,
  }));

  // Skeleton components
  const SkeletonStatusCard = () => (
    <View style={{ width: '31%', borderRadius: 10, alignItems: 'center', paddingVertical: 18, backgroundColor: '#e0e0e0', marginBottom: 8 }} />
  );
  const SkeletonChart = () => (
    <View style={{ margin: 8, borderRadius: 16, height: 200, backgroundColor: '#e0e0e0', paddingVertical: 18 }} />
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
      <View style={tw`bg-white border-b border-gray-100 py-4 px-4`}>
        <Text style={tw`font-[GeistBold] text-2xl text-[#4A5D23] text-center`}>Dashboard</Text>
      </View>
      <ScrollView style={tw`bg-white`}>
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
            <View style={tw`px-4 py-2`}>
              <View style={tw`flex-row flex-wrap justify-between gap-3`}>
                {vehicleStats.map((stat, index) => (
                  <LinearGradient
                    key={stat.label}
                    colors={statusCardGradients[index % statusCardGradients.length] as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={tw`w-[48%] rounded-2xl p-4 mb-3 shadow-md`}
                  >
                    <View style={tw`flex-row items-center justify-between mb-2`}>
                      <View style={tw`flex-row items-center`}>
                        <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-2`, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                          <MaterialIcons name={statusCardIcons[index % statusCardIcons.length] as keyof typeof MaterialIcons.glyphMap} size={18} color={stat.textColor} />
                        </View>
                        <Text style={tw`font-[Poppins] text-sm text-white`}>
                          {stat.label}
                        </Text>
                      </View>
                      <View style={[tw`px-2 py-1 rounded-full`, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                        <Text style={[tw`font-[GeistBold] text-sm`, { color: '#fff' }]}>
                          {stat.count}
                        </Text>
                      </View>
                    </View>
                    <View style={tw`h-1 w-full bg-white/30 rounded-full overflow-hidden`}>
                      <View
                        style={[
                          tw`h-full rounded-full`,
                          {
                            width: `${(stat.count / vehicleStats[0].count) * 100}%`,
                            backgroundColor: '#fff',
                            opacity: 0.7
                          }
                        ]}
                      />
                    </View>
                  </LinearGradient>
                ))}
              </View>
            </View>

            <View style={tw`bg-black rounded-2xl p-5 mx-4 mb-6 shadow-sm`}>
              <Text style={tw`font-[Poppins] text-lg text-[#fff] border-b border-gray-200 pb-2 mb-4`}>
                Vehicle Status Distribution
              </Text>
              <PieChart
                data={pieData}
                width={screenWidth - 48}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(74, 93, 35, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>

            <View style={tw`bg-white rounded-2xl p-5 mx-4 mb-6 shadow-md`}>
              <Text style={tw`font-[Poppins] text-lg text-[#2250a2] font-bold mb-4`}>Recent Devices</Text>
              {devicesData?.slice(0, 5).map((device, index) => {
                const isOnline = device.status === 'online';
                return (
                  <View
                    key={index}
                    style={[
                      tw`flex-row items-center justify-between mb-4`,
                      { paddingBottom: index === 4 ? 0 : 12, borderBottomWidth: index === 4 ? 0 : 1, borderColor: '#F0F0F0' }
                    ]}
                  >
                    {/* Device Icon */}
                    <LinearGradient
                      colors={isOnline ? ["#11998e", "#38ef7d"] : ["#636e72", "#b2bec3"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={tw`w-12 h-12 rounded-full items-center justify-center mr-4`}
                    >
                      <MaterialIcons name="local-shipping" size={26} color="#fff" />
                    </LinearGradient>
                    {/* Device Name */}
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-[Poppins] text-base text-[#222] font-semibold`} numberOfLines={1}>
                        {device.name}
                      </Text>
                      <Text style={tw`font-[Poppins] text-xs text-[#7b8ca5] mt-0.5`} numberOfLines={1}>
                        {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'No update'}
                      </Text>
                    </View>
                    {/* Status Badge */}
                    <View style={[
                      tw`flex-row items-center px-3 py-1.5 rounded-full ml-2`,
                      { backgroundColor: isOnline ? '#e0f9f4' : '#f5f6fa', minWidth: 70, justifyContent: 'center' }
                    ]}>
                      <View style={[
                        tw`w-2 h-2 rounded-full mr-2`,
                        { backgroundColor: isOnline ? '#00b894' : '#636e72' }
                      ]} />
                      <Text style={[
                        tw`font-[Poppins] text-xs font-semibold`,
                        { color: isOnline ? '#00b894' : '#636e72' }
                      ]}>
                        {device.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={tw`bg-gray-50 rounded-2xl p-5 mx-4 mb-6 shadow-sm`}>
              <Text style={tw`font-[GeistBold] text-lg border-b border-gray-200 pb-2 text-[#4A5D23] mb-4`}>
                Groups
              </Text>

              {groupsData?.length > 0 &&
                groupsData?.map((group: any, idx: number) => (
                  <View
                    key={idx}
                    style={tw`flex-row items-center py-3 border-b border-gray-200/80`}
                  >
                    <View style={tw`bg-[#4A5D23] w-9 h-9 rounded-lg items-center justify-center mr-3`}>
                      <MaterialIcons name="layers" size={20} color="white" />
                    </View>
                    <Text style={tw`font-[Geist] text-gray-900`}>
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
