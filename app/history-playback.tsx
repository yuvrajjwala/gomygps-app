import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const carIcon = require('@/assets/images/cars/car-green.png'); // Use the green car icon as in map.tsx
const { width, height } = Dimensions.get('window');

const mockRoute = [
  { latitude: -12.158, longitude: -76.998 },
  { latitude: -12.157, longitude: -76.997 },
  { latitude: -12.156, longitude: -76.996 },
  { latitude: -12.155, longitude: -76.995 },
  { latitude: -12.154, longitude: -76.994 },
  { latitude: -12.153, longitude: -76.993 },
  { latitude: -12.152, longitude: -76.992 },
];

const speeds = [1, 2, 3, 4, 5, 6];

export default function HistoryPlaybackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Simulate playback
  React.useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev < mockRoute.length - 1) return prev + 1;
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
  }, [isPlaying, speed]);

  const carPosition = mockRoute[playbackIndex];

  // For the summary card (mock data)
  const data = {
    number: params?.name || 'ABC-123 Auto',
    date: '11/01/2022 20:00:37',
    status: 'Engine Off',
    address: 'Mariano Pastor Sevilla Avenue, Villa El Salvador',
    odometer: '71753 Km',
    altitude: '0 m',
    lastTransmission: '5 minutes ago',
    battery: '100 %',
    speed: '0 km/h',
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
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: mockRoute[0].latitude,
            longitude: mockRoute[0].longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          pointerEvents="none"
        >
          <Polyline
            coordinates={mockRoute}
            strokeColor="#2979FF"
            strokeWidth={5}
          />
          {mockRoute.map((point, idx) => (
            idx < mockRoute.length - 1 && (
              <Marker
                key={idx}
                coordinate={point}
                anchor={{ x: 0.5, y: 0.5 }}
                style={{ zIndex: 2 }}
              >
                <MaterialIcons name="arrow-forward" size={22} color="#2979FF" style={{ transform: [{ rotate: `${45 * idx}deg` }] }} />
              </Marker>
            )
          ))}
          <Marker coordinate={carPosition} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 3 }}>
            <Image source={carIcon} style={{ width: 36, height: 36 }} />
          </Marker>
        </MapView>
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
            <Text style={styles.timeText}>{playbackIndex + 1} / {mockRoute.length}</Text>
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
                <Text style={styles.speedBadgeText}>{data.speed}</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginTop: 0, // header height
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
    // position: 'absolute',
    top: 42, // header + filterBar height
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
}); 