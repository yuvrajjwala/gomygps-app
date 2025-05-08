import Api from '@/config/Api';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ImageSourcePropType, PanResponder, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = 300;
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [device, setDevice] = useState<any>(params);
  const [markerPosition] = useState(
    new AnimatedRegion({
      latitude: Number(params?.latitude) || 0,
      longitude: Number(params?.longitude) || 0,
    })
  );
  const [carPath, setCarPath] = useState([
    { latitude: Number(params?.latitude) || 0, longitude: Number(params?.longitude) || 0 }
  ]);
  const mapRef = useRef<MapView>(null);
  const [zoomLevel, setZoomLevel] = useState(0.005);
  const [isParked, setIsParked] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [carMode, setCarMode] = useState(false);
  const [autoFollow, setAutoFollow] = useState(false);
  const isFocused = useIsFocused();
  const [showDetails, setShowDetails] = useState(false);
  // Map options state
  const [showTraffic, setShowTraffic] = useState(false);
  const [showCompass, setShowCompass] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain' | 'hybrid'>('standard');

  // Bottom Sheet Animation
  const pan = useRef(new Animated.ValueXY()).current;
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Dragging down
          bottomSheetHeight.setValue(BOTTOM_SHEET_MAX_HEIGHT - gestureState.dy);
        } else {
          // Dragging up
          bottomSheetHeight.setValue(BOTTOM_SHEET_MIN_HEIGHT - gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          // Dragged down significantly
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_MIN_HEIGHT,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
          setIsBottomSheetExpanded(false);
        } else if (gestureState.dy < -50) {
          // Dragged up significantly
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_MAX_HEIGHT,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
          setIsBottomSheetExpanded(true);
        } else {
          // Return to previous position
          Animated.spring(bottomSheetHeight, {
            toValue: isBottomSheetExpanded ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const [currentMarkerPosition, setCurrentMarkerPosition] = useState({
    latitude: Number(params?.latitude) || 0,
    longitude: Number(params?.longitude) || 0,
  });

  const getVehicleIcon = (): ImageSourcePropType => {
    if (!device?.lastUpdate) {
      return require('@/assets/images/cars/white.png');
    }
    const lastUpdate = new Date(device.lastUpdate);
    const fourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 4);
    if (lastUpdate < fourHoursAgo) {
      return require('@/assets/images/cars/white.png');
    }
    if (device.status === 'online' && Number(device.speed) === 0) {
      return require('@/assets/images/cars/orange.png');
    }
    return device.status === 'online' ? require('@/assets/images/cars/green.png') : require('@/assets/images/cars/red.png');
  };

  const getPosition = async () => {
    if (!isFocused) return;
    const response = await Api.call(`/api/positions?deviceId=${device.deviceId}`, 'GET', {}, '');
    const newDevice = { ...device, ...response.data[0] };
    setDevice(newDevice);
    if (newDevice.latitude && newDevice.longitude) {
      markerPosition.timing({
        toValue: { latitude: newDevice.latitude, longitude: newDevice.longitude },
        duration: 1000,
        useNativeDriver: false,
      } as any).start(() => {
        setCarPath(prev => ([
          ...prev,
          { latitude: newDevice.latitude, longitude: newDevice.longitude }
        ]));
        setCurrentMarkerPosition({ latitude: newDevice.latitude, longitude: newDevice.longitude });
      });
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
        if (autoFollow) {
          mapRef.current?.animateToRegion(newRegion, 500);
        } else {
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      }
    }
  };

  // Reset marker position if device changes (e.g. on first load)
  useEffect(() => {
    if (device?.latitude && device?.longitude) {
      markerPosition.setValue({
        latitude: Number(device?.latitude) || 0,
        longitude: Number(device?.longitude) || 0,
      });
    }
  }, [device?.latitude, device?.longitude]);

  useEffect(() => {
    getPosition();

    const interval = setInterval(() => {
      getPosition();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoFollow && device?.latitude && device?.longitude) {
      const newRegion: Region = {
        latitude: device.latitude,
        longitude: device.longitude,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel * 0.5,
      };
      mapRef.current?.animateToRegion(newRegion, 500);
    }
  }, [device?.latitude, device?.longitude, autoFollow, zoomLevel]);

  useEffect(() => {
    if (carMode) {
      setZoomLevel(0.002);
    } else {
      setZoomLevel(0.005);
    }
  }, [carMode]);

  const createGeofence = async (device: any) => {
    try {
      const geofenceData = {
        name: `High Alert ${device.name}`,
        description: `Auto-generated high alert zone for ${device.name}`,
        area: `CIRCLE (${device.latitude} ${device.longitude}, 50)`,
      };
      const response = await Api.call('/api/geofences', 'POST', geofenceData, '');
      let deviceData = await fetchDeviceDetails(device.deviceId);
      await Api.call('/api/permissions', 'POST', {
        deviceId: device.deviceId,
        geofenceId: response.data.id,
      }, '');
      let newAttributes = {
        ...deviceData.attributes,
        fence_id: response.data.id,
        parked_time: new Date().toISOString(),
        is_parked: true,
      };
      deviceData.attributes = newAttributes;
      await Api.call(`/api/devices/${device.deviceId}`, 'PUT', deviceData, '');
      setIsParked(true);
    } catch (error) {
      console.error("Error creating geofence:", error);
    }
  };

  const removeGeofence = async (device: any) => {
    try {
      let deviceData = await fetchDeviceDetails(device.deviceId);
      await Api.call(`/api/geofences/${deviceData.attributes.fence_id}`, 'DELETE', {}, '');
      let newAttributes = {
        ...deviceData.attributes,
        fence_id: null,
        parked_time: null,
        is_parked: false,
      };
      deviceData.attributes = newAttributes;
      await Api.call(`/api/devices/${device.deviceId}`, 'PUT', deviceData, '');
      setIsParked(false);
    } catch (error) {
      console.error("Error removing geofence:", error);
    }
  };

  const fetchDeviceDetails = async (deviceId: string) => {
    try {
      const response = await Api.call(`/api/devices?id=${deviceId}`, 'GET', {}, '');
      if (response.data) {
        const device = response.data.find((d: any) => d.id === deviceId);
        return device;
      }
    } catch (error) {
      console.error("Error fetching device details:", error);
    }
  };

  const mobilize = async (protocol: string) => {
    try {
      let lockStatus = isLocked ? "RELAY,1#" : "RELAY,0#";
      await Api.call('/api/commands/send', 'POST', {
        commandId: "",
        deviceId: device?.deviceId,
        description: "mobilize",
        type: "custom",
        attributes: {
          data: lockStatus,
        },
      }, '');
      let deviceData = await fetchDeviceDetails(device?.deviceId);
      let newAttributes = {
        ...deviceData.attributes,
        is_mobilized: !isLocked,
      };
      deviceData.attributes = newAttributes;
      await Api.call(`/api/devices/${deviceData.id}`, 'PUT', deviceData, '');
      setIsLocked(!isLocked);
    } catch (error) {
      console.error("Error mobilizing device:", error);
    }
  };

  useEffect(() => {
    // Cleanup on unmount: reset carPath and marker position
    return () => {
      setCarPath([
        { latitude: Number(params?.latitude) || 0, longitude: Number(params?.longitude) || 0 }
      ]);
      setCurrentMarkerPosition({
        latitude: Number(params?.latitude) || 0,
        longitude: Number(params?.longitude) || 0,
      });
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#000"  />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{device?.name}</Text>
          <Text style={styles.headerSubtitle}>Last updated: {moment(device?.lastUpdate).format('DD/MM/YYYY HH:mm')}</Text>
        </View>
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
        zoomEnabled={!carMode}
        zoomControlEnabled={!carMode}
        minZoomLevel={carMode ? 0.002 : 0.0001}
        maxZoomLevel={carMode ? 0.005 : 50}
        showsUserLocation={true}
        followsUserLocation={carMode}
        rotateEnabled={!carMode}
        scrollEnabled={!carMode}
        showsTraffic={showTraffic}
        showsCompass={showCompass}
        mapType={mapType}
      >
        <Polyline
          coordinates={carPath}
          strokeColor="#FFD600"
          strokeWidth={4}
        />
        <Marker.Animated coordinate={markerPosition}>
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
        </Marker.Animated>
      </MapView>

      {/* Custom Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetContent}>
          {/* Vehicle Name and Speed */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.vehicleNumber}>{device?.name}</Text>
            <View style={styles.speedoWrap}>
              <FontAwesome5 name="tachometer-alt" size={18} color="#43A047" />
              <Text style={styles.speedoText}>{(Number(device?.speed)* 1.852 || 0)?.toFixed(0)} km/h</Text>
            </View>
          </View>

          <View style={styles.statusIconsRow}>
            {/* Parking */}
            <TouchableOpacity
              style={[styles.iconCircle, { borderColor: isParked ? '#43A047' : '#A5F3C7', backgroundColor: isParked ? '#43A047' : '#fff' }]}
              onPress={() => {
                if (device) {
                  isParked ? removeGeofence(device) : createGeofence(device);
                }
              }}
            >
              <MaterialIcons name="local-parking" size={24} color={isParked ? '#fff' : '#43A047'} />
            </TouchableOpacity>

            {/* Play (active) */}
            <TouchableOpacity
              style={[styles.iconCircle, styles.iconCircleActive, { backgroundColor: '#4285F4', borderColor: '#4285F4', shadowColor: '#4285F4' }]}
              onPress={() => {
                router.replace({ pathname: '/history-playback', params: { device: JSON.stringify(device) } });
              }}
            >
              <MaterialIcons name="play-arrow" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Car Mode */}
            <TouchableOpacity
              style={[styles.iconCircle, { borderColor: carMode ? '#4285F4' : '#90CAF9', backgroundColor: carMode ? '#4285F4' : '#fff' }]}
              onPress={() => setCarMode(!carMode)}
            >
              <MaterialIcons name="directions-car" size={24} color={carMode ? '#fff' : '#4285F4'} />
            </TouchableOpacity>

            {/* Lock */}
            <TouchableOpacity
              style={[styles.iconCircle, { borderColor: isLocked ? '#E53935' : '#FFCDD2', backgroundColor: isLocked ? '#E53935' : '#fff' }]}
              onPress={() => {
                if (device) {
                  mobilize(device.protocol);
                }
              }}
            >
              <MaterialIcons name={isLocked ? 'lock' : 'lock-open'} size={24} color={isLocked ? '#fff' : '#E53935'} />
            </TouchableOpacity>

            {/* Auto Follow */}
            <TouchableOpacity
              style={[styles.iconCircle, { borderColor: autoFollow ? '#43A047' : '#A5F3C7', backgroundColor: autoFollow ? '#43A047' : '#fff' }]}
              onPress={() => {
                if (!carMode) {
                  return;
                }
                setAutoFollow(!autoFollow);
              }}
            >
              <MaterialIcons name="location-on" size={24} color={autoFollow ? '#fff' : '#43A047'} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid - only show if showDetails is true */}
          {showDetails && (
            <>
              {/* <View style={{ borderTopWidth: 1, borderColor: '#eee', marginVertical: 8 }} /> */}
             
              <View style={styles.statsDivider} />
              {/* Row 2 */}
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>1084h:13m</Text>
                  <Text style={styles.statsLabel}>Total Engine</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>61 km/h</Text>
                  <Text style={styles.statsLabel}>Today Max Speed</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>{(Number(device?.speed) * 1.852 || 0)?.toFixed(0)} km/h</Text>
                  <Text style={styles.statsLabel}>Speed</Text>
                </View>
              </View>
              <View style={styles.statsDivider} />
              {/* Row 3 */}
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>14811 km</Text>
                  <Text style={styles.statsLabel}>Total Distance</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>46 km</Text>
                  <Text style={styles.statsLabel}>Today Distance</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>8 km</Text>
                  <Text style={styles.statsLabel}>Distance From Last Stop</Text>
                </View>
              </View>
              <View style={styles.statsDivider} />
              {/* Row 4 */}
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>01h:12m</Text>
                  <Text style={styles.statsLabel}>Today Stopped</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>02h:39m</Text>
                  <Text style={styles.statsLabel}>Today Running</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>15h:33m</Text>
                  <Text style={styles.statsLabel}>Today Idle</Text>
                </View>
              </View>
              <View style={styles.statsDivider} />
              {/* Row 5 */}
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>01h:15m</Text>
                  <Text style={styles.statsLabel}>Today Ignition Off</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>18h:57m</Text>
                  <Text style={styles.statsLabel}>Today Ignition On</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsValue}>01h:15m</Text>
                  <Text style={styles.statsLabel}>Ignition On Since</Text>
                </View>
              </View>
             
              
            </>
          )}

          {/* Action Buttons (keep as before) */}
          <View style={styles.bottomCardDivider} />
          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity
              style={styles.centerMapBtn}
              onPress={() => setShowDetails((prev) => !prev)}
            >
              <Text style={styles.centerMapBtnText}>{showDetails ? 'Hide Details' : 'View Details'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.viewReportsBtn} 
              onPress={() => router.replace({ pathname: '/reports', params: { deviceId: device?.deviceId } })}
            >
              <Text style={styles.viewReportsBtnText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Floating Map Options Menu */}
      <View style={styles.floatingMenu}>
        <TouchableOpacity style={styles.fab} onPress={() => setShowTraffic(t => !t)}>
          <MaterialIcons name="traffic" size={24} color={showTraffic ? "#43A047" : "#888"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setShowCompass(c => !c)}>
          <MaterialIcons name="explore" size={24} color={showCompass ? "#2979FF" : "#888"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setMapType('standard')}>
          <MaterialIcons name="map" size={24} color={mapType === 'standard' ? "#FF7043" : "#888"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setMapType('satellite')}>
          <MaterialIcons name="satellite" size={24} color={mapType === 'satellite' ? "#FFD600" : "#888"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setMapType('terrain')}>
          <MaterialIcons name="terrain" size={24} color={mapType === 'terrain' ? "#43A047" : "#888"} />
        </TouchableOpacity>
        {/* Speed Indicator as a circular orange button */}
        <View style={styles.fabSpeed}>
          <Text style={styles.fabSpeedText}>
            {(Number(device?.speed) * 1.852 || 0).toFixed(0)}
          </Text>
          <Text style={styles.fabSpeedUnit}>km/h</Text>
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 3,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 18,
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
    color: '#000000',
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
    backgroundColor: '#43A047',
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
    backgroundColor: '#FF7043',
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
  },
  statsValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  floatingMenu: {
    position: 'absolute',
    top: 130,
    left: 16,
    zIndex: 10,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  fabSpeed: {
    backgroundColor: '#FF7043',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  fabSpeedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 2,
  },
  fabSpeedUnit: {
    color: '#fff',
    fontSize: 10,
    marginTop: -2,
  },
}); 