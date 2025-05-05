import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { MapView, Marker } from 'expo-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const fallbackVehicle = {
  number: 'UP15CX3953',
  lastUpdate: '24-04-2025 02:51:58 PM',
  speed: 48,
  lat: 28.6928,
  lng: 77.1206,
  address: 'Global International Academy, Dhana-Buxer, Road, Simbhali, Uttar Pradesh (SW)',
  power: true,
  ignition: true,
  gps: true,
  battery: '50%',
  na: false,
};

export default function MapScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const vehicle = {
    ...fallbackVehicle,
    ...params,
    lat: params.lat ? Number(params.lat) : fallbackVehicle.lat,
    lng: params.lng ? Number(params.lng) : fallbackVehicle.lng,
    speed: params.speed ? Number(params.speed) : fallbackVehicle.speed,
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{vehicle.number}</Text>
          <Text style={styles.headerSubtitle}>Last updated: 10:42 AM</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Map */}
      <MapView
        style={styles.map}
        initialCamera={{
          center: { latitude: vehicle.lat, longitude: vehicle.lng },
          zoom: 15,
        }}
      >
        <Marker coordinate={{ latitude: vehicle.lat, longitude: vehicle.lng }}>
          <MaterialIcons name="directions-car" size={36} color="#43A047" style={{ backgroundColor: '#fff', borderRadius: 18, padding: 2 }} />
        </Marker>
      </MapView>
      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.bottomCardHeader}>
          <Text style={styles.vehicleNumber}>{vehicle.number}</Text>
          <View style={styles.speedoWrap}>
            <FontAwesome5 name="tachometer-alt" size={18} color="#43A047" />
            <Text style={styles.speedoText}>{vehicle.speed}</Text>
          </View>
        </View>
        <View style={styles.bottomCardRow}>
          <MaterialIcons name="event" size={18} color="#FFD600" style={{ marginRight: 6 }} />
          <Text style={styles.bottomCardRowText}>{vehicle.lastUpdate}</Text>
        </View>
        <View style={styles.bottomCardRow}>
          <MaterialIcons name="location-on" size={18} color="#2979FF" style={{ marginRight: 6 }} />
          <Text style={styles.bottomCardRowText}>{vehicle.address}</Text>
        </View>
        <View style={styles.bottomCardDivider} />
        <View style={styles.statusIconsRow}>
          <View style={styles.statusIconItem}>
            <MaterialIcons name="call" size={20} color="#43A047" />
            <Text style={styles.statusIconText}>Power</Text>
          </View>
          <View style={styles.statusIconItem}>
            <MaterialIcons name="waves" size={20} color="#42A5F5" />
            <Text style={styles.statusIconText}>Ignition</Text>
          </View>
          <View style={styles.statusIconItem}>
            <MaterialIcons name="gps-fixed" size={20} color="#FFA000" />
            <Text style={styles.statusIconText}>GPS</Text>
          </View>
          <View style={styles.statusIconItem}>
            <MaterialIcons name="battery-charging-full" size={20} color="#7C4DFF" />
            <Text style={styles.statusIconText}>{vehicle.battery}</Text>
          </View>
          <View style={styles.statusIconItem}>
            <MaterialIcons name="flash-off" size={20} color="#B0BEC5" />
            <Text style={styles.statusIconText}>NA</Text>
          </View>
        </View>
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={styles.centerMapBtn}>
            <Text style={styles.centerMapBtnText}>Center Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewReportsBtn}>
            <Text style={styles.viewReportsBtnText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2979FF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 2,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#BBDEFB',
    fontSize: 13,
    fontWeight: '600',
  },
  map: {
    flex: 1,
    width: '100%',
    zIndex: 1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 3,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vehicleNumber: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#2979FF',
  },
  speedoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  speedoText: {
    fontWeight: 'bold',
    color: '#43A047',
    marginLeft: 4,
    fontSize: 16,
  },
  bottomCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  bottomCardRowText: {
    color: '#444',
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  bottomCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  statusIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  statusIconItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIconText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '600',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  centerMapBtn: {
    flex: 1,
    backgroundColor: '#2979FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  centerMapBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  viewReportsBtn: {
    flex: 1,
    backgroundColor: '#43A047',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  viewReportsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 