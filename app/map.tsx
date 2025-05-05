import Api from '@/config/Api';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ImageSourcePropType, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [device, setDevice] = useState<any>(params);
  const mapRef = useRef<MapView>(null);
  const [zoomLevel, setZoomLevel] = useState(0.0922);

  const getVehicleIcon = (): ImageSourcePropType => {
    if (!device?.lastUpdate) {
      return require('@/assets/images/cars/car-gray.png');
    }
    const lastUpdate = new Date(device.lastUpdate);
    const fourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 4);
    if (lastUpdate < fourHoursAgo) {
      return require('@/assets/images/cars/car-gray.png');
    }
    if (device.status === 'online' && Number(device.speed) === 0) {
      return require('@/assets/images/cars/car-orange.png');
    }
    return device.status === 'online' ? require('@/assets/images/cars/car-green.png') : require('@/assets/images/cars/car-red.png');
  };

  useEffect(() => {
    getPosition();

    const interval = setInterval(() => {
      getPosition();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCenterMap = () => {
    if (device?.latitude && device?.longitude) {
      const newRegion: Region = {
        latitude: device.latitude,
        longitude: device.longitude,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel * 0.5,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  const getPosition = async () => {
    const response = await Api.call(`/api/positions?deviceId=${device.deviceId}`, 'GET', {}, '');
    const newDevice = { ...device, ...response.data[0] };
    setDevice(newDevice);
    if (newDevice.latitude && newDevice.longitude) {
      const isSignificantChange = 
        Math.abs(newDevice.latitude - device.latitude) > 0.0001 || 
        Math.abs(newDevice.longitude - device.longitude) > 0.0001;

      if (isSignificantChange) {
        const newRegion: Region = {
          latitude: newDevice.latitude,
          longitude: newDevice.longitude,
          latitudeDelta: zoomLevel,
          longitudeDelta: zoomLevel * 0.5,
        };
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    }
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2979FF" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{device?.name}</Text>
          <Text style={styles.headerSubtitle}>Last updated: {moment(device?.lastUpdate).format('DD/MM/YYYY HH:mm')  }</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: Number(device?.latitude) || 0,
          longitude: Number(device?.longitude) || 0,
          latitudeDelta: zoomLevel,
          longitudeDelta: zoomLevel * 0.5,
        }}
        zoomEnabled={true}
        zoomControlEnabled={true}
        minZoomLevel={0.0001}
        maxZoomLevel={50}
      >
        <Marker coordinate={{ latitude: Number(device?.latitude), longitude: Number(device?.longitude) }}>
          <Image
            source={getVehicleIcon()}
            style={[
              styles.markerImage,
              {
                transform: [
                  { rotate: `${device?.course || 0}deg` }
                ]
              }
            ]}
          />
        </Marker>
      </MapView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.bottomCardHeader}>
          <Text style={styles.vehicleNumber}>{device?.name}</Text>
          <View style={styles.speedoWrap}>
            <FontAwesome5 name="tachometer-alt" size={18} color="#43A047" />
            <Text style={styles.speedoText}>{(Number(device?.speed) || 0)?.toFixed(0)} km/h</Text>
          </View>
        </View>
        <View style={styles.bottomCardRow}>
          <MaterialIcons name="event" size={18} color="#FFD600" style={{ marginRight: 6 }} />
          <Text style={styles.bottomCardRowText}>{moment(device?.lastUpdate).format('DD/MM/YYYY HH:mm')}</Text>
        </View>
        <View style={styles.bottomCardRow}>
          <MaterialIcons name="location-on" size={18} color="#2979FF" style={{ marginRight: 6 }} />
          <Text style={styles.bottomCardRowText}>{device?.address}</Text>
        </View>
        <View style={styles.bottomCardDivider} />
        <View style={styles.statusIconsRow}>
          {/* Parking */}
          <View style={[styles.iconCircle, { borderColor: '#A5F3C7' }]}> 
            <MaterialIcons name="local-parking" size={24} color="#43A047" />
          </View>
          {/* Play (active) */}
          <View style={[styles.iconCircle, styles.iconCircleActive, { backgroundColor: '#4285F4', borderColor: '#4285F4', shadowColor: '#4285F4' }]}> 
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
          </View>
          {/* Car */}
          <View style={[styles.iconCircle, { borderColor: '#90CAF9' }]}> 
            <MaterialIcons name="directions-car" size={24} color="#4285F4" />
          </View>
          {/* Lock */}
          <View style={[styles.iconCircle, { borderColor: '#FFCDD2' }]}> 
            <MaterialIcons name="lock" size={24} color="#E53935" />
          </View>
          {/* Location */}
          <View style={[styles.iconCircle, { borderColor: '#A5F3C7' }]}> 
            <MaterialIcons name="location-on" size={24} color="#43A047" />
          </View>
        </View>
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={styles.centerMapBtn} onPress={handleCenterMap}>
            <Text style={styles.centerMapBtnText}>View Details</Text>
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
    backgroundColor: '#000',
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
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  centerMapBtn: {
    flex: 1,
    backgroundColor: '#000000',
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
    backgroundColor: '#000000',
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
  markerImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

}); 