import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

interface VehiclePosition {
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  status: string;
  lastUpdate: string;
}

export default function AllVehiclesMapScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const { devices } = useSelector((state: RootState) => state.devices);

  useEffect(() => {
    fetchVehiclePositions();
    const interval = setInterval(fetchVehiclePositions, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehiclePositions = async () => {
    try {
      const response = await Api.call('/api/positions', 'GET', {}, false);
      if (response.data) {
        const vehiclePositions = response.data.map((position: any) => ({
          deviceId: position.deviceId,
          name: devices.find((device: any) => device.deviceId === position.deviceId)?.name || 'Unknown',
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed,
          course: position.course,
          status: position.status,
          lastUpdate: position.deviceTime
        }));
        setVehicles(vehiclePositions);
      }
    } catch (error) {
      console.error('Error fetching vehicle positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return '#43A047'; // Green
      case 'offline':
        return '#E53935'; // Red
      case 'moving':
        return '#1E88E5'; // Blue
      default:
        return '#757575'; // Grey
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Vehicles Map</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7043" />
        </View>
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 20.5937,
            longitude: 78.9629,
            latitudeDelta: 40,
            longitudeDelta: 40,
          }}
          zoomEnabled={true}
          zoomControlEnabled={true}
          minZoomLevel={3}
          maxZoomLevel={20}
        >
          {vehicles.map((vehicle) => (
            <Marker
              key={vehicle.deviceId}
              coordinate={{
                latitude: vehicle.latitude,
                longitude: vehicle.longitude,
              }}
              title={vehicle.name}
              description={`Speed: ${vehicle.speed} km/h\nStatus: ${vehicle.status}\nLast Update: ${new Date(vehicle.lastUpdate).toLocaleString()}`}
              rotation={vehicle.course}
            >
              <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(vehicle.status) }]}>
                <Image 
                  source={require('@/assets/images/car.svg')}
                  style={styles.carIcon}
                  tintColor="white"
                />
              </View>
            </Marker>
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
    opacity: 0.9,
  },
  carIcon: {
    width: 12,
    height: 12,
  },
}); 