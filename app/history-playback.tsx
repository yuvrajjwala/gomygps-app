import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const carIcon = require('@/assets/images/cars/green.png');
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const speeds = [1, 2, 3, 4, 5, 6];
const MARKER_RENDER_INTERVAL = 10; // Increased interval for fewer markers
const MAP_UPDATE_INTERVAL = 200; // Increased interval for smoother updates
const MAX_POINTS = 1000; // Maximum number of points to display

export default function HistoryPlaybackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const device = params?.device ? JSON.parse(params.device as string) : null;
  const mapRef = useRef<MapView>(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24); // Set to 24 hours ago
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<any[]>([]);
  const [deviceDetails, setDeviceDetails] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [stopLocations, setStopLocations] = useState<any[]>([]);
  const [userZoom, setUserZoom] = useState(0.01);

  // Fetch device details
  useEffect(() => {
    if (device?.deviceId) {
      fetchDeviceDetails(device.deviceId);
    }
  }, [device?.deviceId]);

  // Optimize route data processing
  const processRouteData = useCallback((data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // If data is too large, sample it
    if (data.length > MAX_POINTS) {
      const samplingRate = Math.ceil(data.length / MAX_POINTS);
      return data.filter((_, index) => index % samplingRate === 0);
    }
    return data;
  }, []);

  // Fetch initial route data with optimization
  useEffect(() => {
    if (device?.deviceId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const fromDateUTC = new Date(startDate);
          fromDateUTC.setHours(fromDateUTC.getHours() - 5, fromDateUTC.getMinutes() - 30);
          
          const toDateUTC = new Date(endDate);
          toDateUTC.setHours(toDateUTC.getHours() - 5, toDateUTC.getMinutes() - 30);

          const routeResponse = await Api.call(
            '/api/reports/route?from=' + fromDateUTC.toISOString() + '&to=' + 
            toDateUTC.toISOString() + '&deviceId=' + device.deviceId, 
            'GET', 
            {}, 
            false
          );
          
          const processedData = processRouteData(routeResponse.data || []);
          setRouteData(processedData);
          setPlaybackIndex(0);
          setIsPlaying(false);

          // Fetch stop locations
          await fetchStopLocations(device.deviceId, fromDateUTC, toDateUTC);

          const summaryResponse = await Api.call(
            '/api/reports/summary?from=' + startDate.toISOString() + '&to=' + 
            endDate.toISOString() + '&deviceId=' + device.deviceId + '&daily=false', 
            'GET', 
            {}, 
            false
          );
          setSummaryData(summaryResponse.data[0]);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [device?.deviceId, startDate, endDate, processRouteData]);

  const fetchDeviceDetails = async (deviceId: string) => {
    try {
      const response = await Api.call(`/api/devices?id=${deviceId}`, 'GET', {}, false);
      if (response.data) {
        const device = response.data.find((d: any) => d.id === deviceId);
        setDeviceDetails(device);
      }
    } catch (error) {
      console.error("Error fetching device details:", error);
    }
  };

  // Fetch stop locations
  const fetchStopLocations = async (deviceId: string, from: Date, to: Date) => {
    try {
      const response = await Api.call(
        `/api/reports/stops?deviceId=${deviceId}&from=${from.toISOString()}&to=${to.toISOString()}`,
        'GET',
        {},
        false
      );
      setStopLocations(response.data || []);
    } catch (error) {
      console.error("Error fetching stop locations:", error);
    }
  };

  // Memoize route coordinates with sampling
  const routeCoordinates = useMemo(() => {
    if (!routeData.length) return [];
    
    const samplingRate = Math.max(1, Math.floor(routeData.length / MAX_POINTS));
    return routeData
      .filter((_, index) => index % samplingRate === 0)
      .map(pos => ({
        latitude: pos.latitude,
        longitude: pos.longitude
      }));
  }, [routeData]);

  // Memoize markers with increased interval
  const markers = useMemo(() => 
    routeData
      .filter((_, idx) => idx % MARKER_RENDER_INTERVAL === 0)
      .map((point, idx) => (
        <Marker
          key={idx}
          coordinate={{
            latitude: point.latitude,
            longitude: point.longitude
          }}
          anchor={{ x: 0.23, y: 0.5 }}
          style={{ zIndex: 2 }}
        >
          <MaterialIcons 
            name="keyboard-arrow-up" 
            size={22} 
            color="orange" 
            style={{ transform: [{ rotate: `${point.course || 0}deg` }] }} 
          />
        </Marker>
      )), [routeData]);

  // Add stop markers to the map
  const stopMarkers = useMemo(() => 
    stopLocations.map((stop, idx) => {

      const isFirstOrLast = idx === 0 || idx === stopLocations.length - 1;
return(
      <Marker
        key={`stop-${idx}`}
        coordinate={{
          latitude: stop.latitude,
          longitude: stop.longitude
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ zIndex: 2 }}
      >
        <View style={{ alignItems: 'center' }}>
          <MaterialIcons 
            name="flag" 
            size={24} 
            color= {idx === 0 ? "green" : "red"} 
            style={{opacity: isFirstOrLast ? 1 : 0}}
          />
          <View style={[styles.stopCountBadge, {opacity: !isFirstOrLast ? 1 : 0}]}>
            <Text style={styles.stopCountText}>{idx}</Text>
          </View>
        </View>
      </Marker>
      )
    }), [stopLocations]);

  // Simplify updateMapRegion to only update position
  const updateMapRegion = useCallback((nextIndex: number) => {
    if (!mapRef.current || !routeData[nextIndex]) return;
    
    requestAnimationFrame(() => {
      mapRef.current?.animateToRegion({
        latitude: routeData[nextIndex].latitude,
        longitude: routeData[nextIndex].longitude,
        latitudeDelta: userZoom,
        longitudeDelta: userZoom,
      }, 500);
    });
  }, [routeData, userZoom]);

  // Optimize playback effect with better timing
  useEffect(() => {
    if (!isPlaying || routeData.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let lastUpdateTime = Date.now();
    let animationFrameId: number;

    const updatePlayback = () => {
      const currentTime = Date.now();
      if (currentTime - lastUpdateTime >= MAP_UPDATE_INTERVAL) {
        setPlaybackIndex((prev) => {
          if (prev < routeData.length - 1) {
            updateMapRegion(prev + 1);
            lastUpdateTime = currentTime;
            return prev + 1;
          }
          setIsPlaying(false);
          return prev;
        });
      }
      animationFrameId = requestAnimationFrame(updatePlayback);
    };

    animationFrameId = requestAnimationFrame(updatePlayback);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, routeData, updateMapRegion]);

  const currentPosition = routeData[playbackIndex];

  // For the summary card
  const data = {
    number: device?.name || 'N/A',
    date: currentPosition ? moment(currentPosition.deviceTime).format('DD/MM/YYYY HH:mm') : 'N/A',
    status: currentPosition?.attributes?.ignition ? 'Engine On' : 'Engine Off',
    address: currentPosition?.address || 'N/A',
    odometer: `${((currentPosition?.attributes?.totalDistance || 0) / 1000).toFixed(0)} Km`,
    altitude: `${currentPosition?.altitude || 0} m`,
    lastTransmission: moment(currentPosition?.deviceTime).fromNow(),
    battery: `${currentPosition?.attributes?.battery || 0} %`,
    speed: currentPosition?.speed || 0,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{data.number}</Text>
        <View style={{ width: 26 }} />
      </View>
      {/* Map (full page) */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD600" />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: routeData[0]?.latitude || 0,
              longitude: routeData[0]?.longitude || 0,
              latitudeDelta: userZoom,
              longitudeDelta: userZoom,
            }}
            zoomEnabled={true}
            zoomControlEnabled={true}
            onRegionChangeComplete={(region) => {
              setUserZoom(region.latitudeDelta);
            }}
          >
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#2979FF"
              strokeWidth={2}
            />
            {markers}
            {stopMarkers}
            {currentPosition && (
              <Marker 
                coordinate={{
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude
                }} 
                anchor={{ x: 0.5, y: 0.5 }} 
                style={{ zIndex: 3 }}
              >
                <Image 
                  source={carIcon} 
                  style={[
                    { width: 30, height: 30, resizeMode: 'contain' },
                    { transform: [{ rotate: `${currentPosition.course || 0}deg` }] }
                  ]} 
                />
              </Marker>
            )}
          </MapView>
        )}
        {/* Overlay: Filter Bar */}
        <View style={styles.overlayFilterBar}>
          <View style={styles.filterBar}>
            <TouchableOpacity style={styles.filterDateBtn} onPress={() => setStartPickerVisible(true)}>
              <MaterialIcons name="calendar-today" size={18} color="#FFD600" />
              <Text style={styles.filterDateText}>{moment(startDate).format('DD/MM/YYYY HH:mm')}</Text>
            </TouchableOpacity>
            <Text style={styles.filterToText}>to</Text>
            <TouchableOpacity style={styles.filterDateBtn} onPress={() => setEndPickerVisible(true)}>
              <MaterialIcons name="calendar-today" size={18} color="#FFD600" />
              <Text style={styles.filterDateText}>{moment(endDate).format('DD/MM/YYYY HH:mm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Overlay: Speed Selector Bar */}
        <View style={styles.overlaySpeedSelectorBar}>
          <View style={styles.speedSelectorBar}>
            <TouchableOpacity onPress={() => setIsPlaying((p) => !p)} style={styles.speedSelectorPlayBtn}>
              <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={26} color="#FFD600" />
            </TouchableOpacity>
            <Text style={styles.speedSelectorLabel}>Speed:</Text>
            <View style={styles.speedSelectorRow}>
              {speeds.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedBtn, speed === s && styles.speedBtnActive]}
                  onPress={() => setSpeed(s)}
                >
                  <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>{s}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        {/* Overlay: Playback Controls */}
        <View style={styles.overlayPlaybackBar}>
          <View style={styles.playbackBar}>
            <Text style={styles.timeText}>{playbackIndex + 1} / {routeData.length}</Text>
          </View>
        </View>
        {/* Overlay: Bottom Card */}
        <View style={styles.overlayBottomCard}>
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardRow}>
      
              <View style={{ flex: 1 , gap:5}}>
                <Text style={styles.bottomCardTitle}>{data.number}</Text>
                <Text style={styles.bottomCardDate}>Date: {data.date}</Text>
                <Text style={styles.bottomCardStatus}>Status: {data.status}</Text>
              </View>
              <View style={styles.speedBadge}>
                <Text style={styles.speedBadgeText}>{(Number(data.speed)).toFixed(0)} km/h</Text>
              </View>
            </View>
            {/* Stats Rows with gap and center alignment */}
            <View style={styles.statRow}><Text style={styles.statLabel}><Text style={{ color: 'black', fontWeight: 'bold' ,}}>Address:</Text> {data.address}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}><Text style={{ color: 'black', fontWeight: 'bold' }}>Distance:</Text> {(summaryData?.distance / 1000).toFixed(2)} km</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}><Text style={{ color: 'black', fontWeight: 'bold' }}>Odometer:</Text> {data.odometer}</Text></View>
          </View>
        </View>
      </View>

      {/* Date Time Pickers */}
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="datetime"
        onConfirm={(date) => {
          setStartPickerVisible(false);
          setStartDate(date);
        }}
        onCancel={() => setStartPickerVisible(false)}
        date={startDate}
        maximumDate={endDate}
      />

      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="datetime"
        onConfirm={(date) => {
          setEndPickerVisible(false);
          setEndDate(date);
        }}
        onCancel={() => setEndPickerVisible(false)}
        date={endDate}
        minimumDate={startDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.05,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    gap: width * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
  },
  filterDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: width * 0.02,
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.03,
    marginHorizontal: width * 0.005,
  },
  filterDateText: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: width * 0.035,
    marginLeft: width * 0.015,
  },
  filterToText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.035,
    marginHorizontal: width * 0.02,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  playbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.045,
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.035,
    marginLeft: width * 0.03,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width,
    backgroundColor: '#fff',
    borderTopLeftRadius: width * 0.06,
    borderTopRightRadius: width * 0.06,
    padding: width * 0.045,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 3,
    marginTop: 0,
  },
  bottomCardHandle: {
    width: width * 0.12,
    height: height * 0.006,
    borderRadius: width * 0.0075,
    backgroundColor: '#eee',
    alignSelf: 'center',
    marginBottom: height * 0.012,
  },
  bottomCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  bottomCardIconWrap: {
    backgroundColor: '#222',
    borderRadius: width * 0.06,
    width: width * 0.12,
    height: width * 0.12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: width * 0.03,
  },
  bottomCardTitle: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  bottomCardDate: {
    color: '#888',
    fontSize: width * 0.035,
    fontWeight: '600',
  },
  bottomCardStatus: {
    color: '#222',
    fontSize: width * 0.0375,
    fontWeight: 'bold',
  },
  bottomCardLabel: {
    color: '#444',
    fontSize: width * 0.0375,
    marginBottom: height * 0.0025,
  },
  speedBadge: {
    backgroundColor: '#000',
    borderRadius: width * 0.04,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.005,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: width * 0.02,
  },
  speedBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.035,
  },
  overlayFilterBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 10,
    marginTop: 0,
  },
  overlayPlaybackBar: {
    position: 'absolute',
    bottom: height * 0.15,
    left: 0,
    width: '100%',
    zIndex: 10,
  },
  overlayBottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 20,
  },
  overlaySpeedSelectorBar: {
    top: height * 0.052,
    left: 0,
    borderRadius: 0,
    width: '100%',
    zIndex: 12,
    alignItems: 'center',
  },
  speedSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: width * 0.03,
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    marginTop: height * 0.005,
    marginBottom: height * 0.005,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  speedSelectorLabel: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: width * 0.0375,
    marginRight: width * 0.025,
  },
  speedSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.015,
  },
  speedBtn: {
    backgroundColor: '#222',
    borderRadius: width * 0.02,
    paddingVertical: height * 0.007,
    paddingHorizontal: width * 0.03,
    marginHorizontal: width * 0.005,
  },
  speedBtnActive: {
    backgroundColor: '#000',
  },
  speedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.0375,
  },
  speedTextActive: {
    color: '#FFD600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.0075,
  },
  statIcon: {
    marginRight: width * 0.025,
  },
  statLabel: {
    color: '#222',
    fontSize: width * 0.0375,
    flexShrink: 1,
  },
  speedSelectorPlayBtn: {
    marginRight: width * 0.025,
    backgroundColor: 'transparent',
    borderRadius: width * 0.05,
    padding: width * 0.01,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  datePickerCancel: {
    color: '#666',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  datePickerConfirm: {
    color: '#FFD600',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  stopCountBadge: {
    position: 'absolute',
    top: 10,
    right: -8,
    backgroundColor: '#000',
    borderRadius: width * 0.04,
    minWidth: width * 0.06,
    height: width * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.01,
  },
  stopCountText: {
    color: '#fff',
    fontSize: width * 0.03,
    fontWeight: 'bold',
  },
}); 