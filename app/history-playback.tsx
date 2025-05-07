import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const carIcon = require('@/assets/images/cars/green.png');
const { width, height } = Dimensions.get('window');

const speeds = [1, 2, 3, 4, 5, 6];

export default function HistoryPlaybackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const device = params?.device ? JSON.parse(params.device as string) : null;
  const mapRef = useRef<MapView>(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(0.01);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<any[]>([]);
  const [deviceDetails, setDeviceDetails] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Fetch device details
  useEffect(() => {
    if (device?.deviceId) {
      fetchDeviceDetails(device.deviceId);
    }
  }, [device?.deviceId]);

  // Fetch initial route data
  useEffect(() => {
    if (device?.deviceId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Convert local time to UTC with +5:30 offset
          const fromDateUTC = new Date(startDate);
          fromDateUTC.setHours(fromDateUTC.getHours() - 5, fromDateUTC.getMinutes() - 30);
          
          const toDateUTC = new Date(endDate);
          toDateUTC.setHours(toDateUTC.getHours() - 5, toDateUTC.getMinutes() - 30);

          // Fetch route data
          const routeResponse = await Api.call('/api/reports/route?from=' + fromDateUTC.toISOString().slice(0, 19) + 'Z&to=' + toDateUTC.toISOString().slice(0, 19) + 'Z&deviceId=' + device.deviceId, 'GET', {}, '');
          setRouteData(routeResponse.data || []);
          setPlaybackIndex(0);
          setIsPlaying(false);

          // Fetch summary data in parallel
          const summaryResponse = await Api.call('/api/reports/summary?from=' + startDate.toISOString() + '&to=' + endDate.toISOString() + '&deviceId=' + device.deviceId + '&daily=false', 'GET', {}, '');
          setSummaryData(summaryResponse.data[0]);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [device?.deviceId, startDate, endDate]);

  const fetchDeviceDetails = async (deviceId: string) => {
    try {
      const response = await Api.call(`/api/devices?id=${deviceId}`, 'GET', {}, '');
      if (response.data) {
        const device = response.data.find((d: any) => d.id === deviceId);
        setDeviceDetails(device);
      }
    } catch (error) {
      console.error("Error fetching device details:", error);
    }
  };

  // Calculate zoom level based on speed
  const getZoomLevel = (speed: number) => {
    if (speed > 80) return 0.05; // Far zoom for high speed
    if (speed > 40) return 0.02; // Medium zoom for medium speed
    return 0.01; // Close zoom for low speed
  };

  // Playback effect
  useEffect(() => {
    if (isPlaying && routeData.length > 0) {
      intervalRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev < routeData.length - 1) {
            const nextIndex = prev + 1;
            // Animate map to follow current position with dynamic zoom
            if (mapRef.current && routeData[nextIndex]) {
              const currentSpeed = routeData[nextIndex].speed || 0;
              const newZoomLevel = getZoomLevel(currentSpeed);
              setZoomLevel(newZoomLevel);
              
              mapRef.current.animateToRegion({
                latitude: routeData[nextIndex].latitude,
                longitude: routeData[nextIndex].longitude,
                latitudeDelta: newZoomLevel,
                longitudeDelta: newZoomLevel,
              }, 500);
            }
            return nextIndex;
          }
          setIsPlaying(false);
          return prev;
        });
      }, 1000 / speed) as any;
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current as any);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as any);
    };
  }, [isPlaying, speed, routeData]);

  const currentPosition = routeData[playbackIndex];

  // For the summary card
  const data = {
    number: device?.name || 'N/A',
    date: currentPosition ? moment(currentPosition.deviceTime).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
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
              latitudeDelta: zoomLevel,
              longitudeDelta: zoomLevel,
            }}
            pointerEvents="none"
          >
            <Polyline
              coordinates={routeData.map(pos => ({
                latitude: pos.latitude,
                longitude: pos.longitude
              }))}
              strokeColor="#2979FF"
              strokeWidth={5}
            />
            {routeData.map((point, idx) => (
              idx < routeData.length - 1 && (
                <Marker
                  key={idx}
                  coordinate={{
                    latitude: point.latitude,
                    longitude: point.longitude
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  style={{ zIndex: 2 }}
                >
                  <MaterialIcons name="arrow-forward" size={22} color="#2979FF" style={{ transform: [{ rotate: `${point.course || 0}deg` }] }} />
                </Marker>
              )
            ))}
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
            <TouchableOpacity style={styles.filterDateBtn} onPress={() => setShowStartPicker(true)}>
              <MaterialIcons name="calendar-today" size={18} color="#FFD600" />
              <Text style={styles.filterDateText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <Text style={styles.filterToText}>to</Text>
            <TouchableOpacity style={styles.filterDateBtn} onPress={() => setShowEndPicker(true)}>
              <MaterialIcons name="calendar-today" size={18} color="#FFD600" />
              <Text style={styles.filterDateText}>{endDate.toLocaleDateString()}</Text>
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
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
        {/* Overlay: Playback Controls */}
        <View style={styles.overlayPlaybackBar}>
          <View style={styles.playbackBar}>
            <Text style={styles.timeText}>{playbackIndex + 1} / {routeData.length}</Text>
          </View>
        </View>
        {/* Overlay: Bottom Card */}
        <View style={styles.overlayBottomCard}>
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardHandle} />
            <View style={styles.bottomCardRow}>
              <View style={styles.bottomCardIconWrap}>
                <MaterialIcons name="directions-car" size={32} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bottomCardTitle}>{data.number}</Text>
                <Text style={styles.bottomCardDate}>Date: {data.date}</Text>
                <Text style={styles.bottomCardStatus}>Status: {data.status}</Text>
              </View>
              <View style={styles.speedBadge}>
                <Text style={styles.speedBadgeText}>{(Number(data.speed)).toFixed(0)} km/h</Text>
              </View>
            </View>
            {/* Stats Rows with gap and center alignment */}
            <View style={styles.statRow}><MaterialIcons name="location-on" size={18} color="#2979FF" style={styles.statIcon} /><Text style={styles.statLabel}><Text style={{ color: '#2979FF' }}>Address:</Text> {data.address}</Text></View>
            <View style={styles.statRow}><MaterialIcons name="speed" size={18} color="#43A047" style={styles.statIcon} /><Text style={styles.statLabel}><Text style={{ color: '#43A047' }}>Odometer:</Text> {data.odometer}</Text></View>
            <View style={styles.statRow}><MaterialIcons name="height" size={18} color="#FFD600" style={styles.statIcon} /><Text style={styles.statLabel}><Text style={{ color: '#FFD600' }}>Altitude:</Text> {data.altitude}</Text></View>
            <View style={styles.statRow}><MaterialIcons name="update" size={18} color="#00B8D4" style={styles.statIcon} /><Text style={styles.statLabel}><Text style={{ color: '#00B8D4' }}>Last Transmission:</Text> {data.lastTransmission}</Text></View>
            <View style={styles.statRow}><MaterialIcons name="battery-full" size={18} color="#FF7043" style={styles.statIcon} /><Text style={styles.statLabel}><Text style={{ color: '#FF7043' }}>Battery:</Text> {data.battery}</Text></View>
          </View>
        </View>
        {/* Overlay: Zoom Controls */}
        <View style={styles.overlayZoomControls}>
          <View style={styles.zoomControls}>
            <TouchableOpacity 
              style={styles.zoomButton}
              onPress={() => {
                if (mapRef.current) {
                  const newZoom = zoomLevel * 0.5;
                  setZoomLevel(newZoom);
                  mapRef.current.animateToRegion({
                    latitude: currentPosition?.latitude || 0,
                    longitude: currentPosition?.longitude || 0,
                    latitudeDelta: newZoom,
                    longitudeDelta: newZoom,
                  }, 300);
                }
              }}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.zoomButton}
              onPress={() => {
                if (mapRef.current) {
                  const newZoom = zoomLevel * 2;
                  setZoomLevel(newZoom);
                  mapRef.current.animateToRegion({
                    latitude: currentPosition?.latitude || 0,
                    longitude: currentPosition?.longitude || 0,
                    latitudeDelta: newZoom,
                    longitudeDelta: newZoom,
                  }, 300);
                }
              }}
            >
              <MaterialIcons name="remove" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 20,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
  },
  filterDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 2,
  },
  filterDateText: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  filterToText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginHorizontal: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  playbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 12,
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
    marginTop: 0,
  },
  bottomCardHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#eee',
    alignSelf: 'center',
    marginBottom: 10,
  },
  bottomCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomCardIconWrap: {
    backgroundColor: '#222',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bottomCardTitle: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomCardDate: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomCardStatus: {
    color: '#222',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomCardLabel: {
    color: '#444',
    fontSize: 15,
    marginBottom: 2,
  },
  speedBadge: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  speedBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    bottom: 120,
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
    top: 42,
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
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  speedSelectorLabel: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 10,
  },
  speedSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 2,
  },
  speedBtnActive: {
    backgroundColor: '#000',
  },
  speedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  speedTextActive: {
    color: '#FFD600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIcon: {
    marginRight: 10,
  },
  statLabel: {
    color: '#222',
    fontSize: 15,
    flexShrink: 1,
  },
  speedSelectorPlayBtn: {
    marginRight: 10,
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayZoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    zIndex: 10,
  },
  zoomControls: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 8,
    gap: 8,
  },
  zoomButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 