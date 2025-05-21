import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useCallback, useMemo, memo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Vehicle {
  deviceId: string;
  name: string;
  address: string;
  lastUpdate: string;
  speed: number;
  status: string;
  model: string;
  protocol: string;
  category: string;
  latitude: number;
  longitude: number;
  attributes?: {
    fence_id?: string;
    parked_time?: string;
    is_parked?: boolean;
    is_mobilized?: boolean;
  };
}

interface StatItem {
  icon: string;
  label: string;
  value: string;
}

// Memoized Status Icon Component
const StatusIcon = memo(({ 
  icon, 
  isActive, 
  activeColor, 
  inactiveColor, 
  onPress 
}: { 
  icon: string; 
  isActive: boolean; 
  activeColor: string; 
  inactiveColor: string; 
  onPress: () => void;
}) => (
  <TouchableOpacity 
    style={[
      styles.iconCircle, 
      { borderColor: isActive ? activeColor : inactiveColor }
    ]}
    onPress={onPress}
  > 
    <MaterialIcons 
      name={icon as any} 
      size={24} 
      color={isActive ? activeColor : inactiveColor} 
    />
  </TouchableOpacity>
));

// Memoized Stat Card Component
const StatCard = memo(({ 
  stat, 
  backgroundColor 
}: { 
  stat: StatItem; 
  backgroundColor: string;
}) => (
  <View
    style={[
      styles.statsCardColorful,
      { 
        backgroundColor,
        shadowColor: backgroundColor
      }
    ]}
  >
    {stat.icon ? (
      <MaterialIcons 
        name={stat.icon as any} 
        size={22} 
        color="#fff" 
        style={{ marginBottom: 6 }} 
      />
    ) : null}
    <Text style={styles.statsValueColorful}>{stat.value}</Text>
    <Text style={styles.statsLabelColorful}>{stat.label}</Text>
  </View>
));

// Memoized Action Button Component
const ActionButton = memo(({ 
  icon, 
  text, 
  backgroundColor, 
  onPress 
}: { 
  icon: string; 
  text: string; 
  backgroundColor: string; 
  onPress: () => void;
}) => (
  <TouchableOpacity 
    style={[
      styles.backBtnColorful,
      { backgroundColor, shadowColor: backgroundColor }
    ]} 
    onPress={onPress}
  >
    <MaterialIcons name={icon as any} size={20} color="#fff" />
    <Text style={styles.backBtnTextColorful}>{text}</Text>
  </TouchableOpacity>
));

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isParked, setIsParked] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [carMode, setCarMode] = useState(false);
  const [autoFollow, setAutoFollow] = useState(false);

  const vehicle = useMemo(() => JSON.parse(params.device as string) as Vehicle, [params.device]);

  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const getTimeDifference = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  }, []);

  // Memoized API functions
  const fetchDeviceDetails = useCallback(async (deviceId: string) => {
    try {
      const response = await Api.call(`/api/devices?id=${deviceId}`, 'GET', {}, false);
      if (response.data) {
        return response.data.find((d: any) => d.id === deviceId);
      }
    } catch (error) {
      console.error("Error fetching device details:", error);
    }
  }, []);

  const createGeofence = useCallback(async (device: Vehicle) => {
    try {
      const geofenceData = {
        name: `High Alert ${device.name}`,
        description: `Auto-generated high alert zone for ${device.name}`,
        area: `CIRCLE (${device.latitude} ${device.longitude}, 50)`,
      };
      const response = await Api.call('/api/geofences', 'POST', geofenceData, false);
      let deviceData = await fetchDeviceDetails(device.deviceId);
      await Api.call('/api/permissions', 'POST', {
        deviceId: device.deviceId,
        geofenceId: response.data.id,
      }, false);
      let newAttributes = {
        ...deviceData.attributes,
        fence_id: response.data.id,
        parked_time: new Date().toISOString(),
        is_parked: true,
      };
      deviceData.attributes = newAttributes;
      await Api.call(`/api/devices/${device.deviceId}`, 'PUT', deviceData, false);
      setIsParked(true);
    } catch (error) {
      console.error("Error creating geofence:", error);
    }
  }, [fetchDeviceDetails]);

  const removeGeofence = useCallback(async (device: Vehicle) => {
    try {
      let deviceData = await fetchDeviceDetails(device.deviceId);
      await Api.call(`/api/geofences/${deviceData.attributes.fence_id}`, 'DELETE', {}, false);
      let newAttributes = {
        ...deviceData.attributes,
        fence_id: null,
        parked_time: null,
        is_parked: false,
      };
      deviceData.attributes = newAttributes;
      await Api.call(`/api/devices/${device.deviceId}`, 'PUT', deviceData, false);
      setIsParked(false);
    } catch (error) {
      console.error("Error removing geofence:", error);
    }
  }, [fetchDeviceDetails]);

  const mobilize = useCallback(async (protocol: string) => {
    try {
      let lockStatus = isLocked ? "RELAY,1#" : "RELAY,0#";
      await Api.call('/api/commands/send', 'POST', {
        commandId: "",
        deviceId: vehicle?.deviceId,
        description: "mobilize",
        type: "custom",
        attributes: {
          data: lockStatus,
        },
      }, false);
      let deviceData = await fetchDeviceDetails(vehicle?.deviceId);
      let newAttributes = {
        ...deviceData.attributes,
        is_mobilized: !isLocked,
      };
      deviceData.attributes = newAttributes;
      await Api.call(`/api/devices/${deviceData.id}`, 'PUT', deviceData, false);
      setIsLocked(!isLocked);
    } catch (error) {
      console.error("Error mobilizing device:", error);
    }
  }, [vehicle?.deviceId, isLocked, fetchDeviceDetails]);

  // Memoized data
  const data = useMemo(() => ({
    number: vehicle?.name || 'N/A',
    address: vehicle?.address || 'N/A',
    pingTime: formatDate(vehicle?.lastUpdate || new Date().toISOString()),
    stoppedSince: getTimeDifference(vehicle?.lastUpdate || new Date().toISOString()),
    speed: `${(Number(vehicle?.speed) * 1.852 || 0)?.toFixed(0)} km/h`,
    status: vehicle?.status || 'N/A',
    model: vehicle?.model || 'N/A',
    protocol: vehicle?.protocol || 'N/A',
    category: vehicle?.category || 'N/A',
  }), [vehicle, formatDate, getTimeDifference]);

  // Memoized stats grid
  const stats = useMemo(() => [
    [
      { icon: 'access-time', label: 'Ping Time', value: data.pingTime },
      { icon: 'timer', label: 'Stopped Since', value: data.stoppedSince },
    ],
    [
      { icon: 'speed', label: 'Current Speed', value: data.speed },
      { icon: 'power', label: 'Status', value: data.status },
    ],
    [
      { icon: 'build', label: 'Model', value: data.model },
      { icon: 'settings', label: 'Protocol', value: data.protocol },
    ],
    [
      { icon: 'category', label: 'Category', value: data.category },
      { icon: '', label: '', value: '' },
    ],
  ], [data]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#2979FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.vehicleNumber}>{data.number}</Text>
        <Text style={styles.vehicleAddress}>{data.address}</Text>
        
        <View style={styles.statusIconsRow}>
          <StatusIcon
            icon="local-parking"
            isActive={isParked}
            activeColor="#43A047"
            inactiveColor="#A5F3C7"
            onPress={() => vehicle && (isParked ? removeGeofence(vehicle) : createGeofence(vehicle))}
          />
          
          <StatusIcon
            icon="play-arrow"
            isActive={true}
            activeColor="#4285F4"
            inactiveColor="#4285F4"
            onPress={() => {
              const data = btoa(JSON.stringify({
                deviceId: vehicle?.deviceId,
                id: vehicle?.deviceId,
              }));
            }}
          />
          
          <StatusIcon
            icon="directions-car"
            isActive={carMode}
            activeColor="#4285F4"
            inactiveColor="#90CAF9"
            onPress={() => setCarMode(!carMode)}
          />
          
          <StatusIcon
            icon="lock"
            isActive={isLocked}
            activeColor="#E53935"
            inactiveColor="#FFCDD2"
            onPress={() => vehicle && mobilize(vehicle.protocol)}
          />
          
          <StatusIcon
            icon="location-on"
            isActive={autoFollow}
            activeColor="#43A047"
            inactiveColor="#A5F3C7"
            onPress={() => {
              if (!carMode) return;
              setAutoFollow(!autoFollow);
            }}
          />
        </View>

        <View style={styles.statsGridColorful}>
          {stats.map((row, i) => (
            <View style={styles.statsRowColorful} key={i}>
              {row.map((stat, j) => (
                <StatCard
                  key={j}
                  stat={stat}
                  backgroundColor={colorfulCardColors[(i * 2 + j) % colorfulCardColors.length]}
                />
              ))}
            </View>
          ))}
        </View>

        <ActionButton
          icon="map"
          text="History Playback"
          backgroundColor="#008fff"
          onPress={() => router.push({ 
            pathname: '/history-playback', 
            params: { device: JSON.stringify(vehicle) }
          })}
        />

        <ActionButton
          icon="map"
          text="Back to Map"
          backgroundColor="#FF7043"
          onPress={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const colorfulCardColors = [
  '#2979FF', // blue
  '#00B8D4', // cyan
  '#43A047', // green
  '#FFD600', // yellow
  '#FF7043', // orange
  '#AB47BC', // purple
  '#FF1744', // red
  '#00E676', // light green
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  vehicleNumber: {
    color: '#2979FF',
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 8,
    letterSpacing: 1,
  },
  vehicleAddress: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
    fontWeight: '600',
  },
  statusIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 10,
  
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  iconCircleActive: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  statusIconRowColorful: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 4,
    marginBottom: 22,
    marginTop: 2,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  statsGridColorful: {
    marginTop: 2,
    marginBottom: 18,
  },
  statsRowColorful: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statsCardColorful: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    backgroundColor: '#2979FF',
  },
  statsValueColorful: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  statsLabelColorful: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.85,
    fontWeight: '600',
  },
    backBtnColorful: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF7043',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
        marginBottom: 10,
        alignSelf: 'center',
        width: '80%',
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
        elevation: 4,
    },
    backBtnColorful1: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#008fff',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
        marginBottom: 10,
        alignSelf: 'center',
        width: '80%',
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
        elevation: 4,
    },
   
  backBtnTextColorful: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
}); 