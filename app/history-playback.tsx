import Api from "@/config/Api";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const carIcon = require("@/assets/images/cars/green.png");
const carStoppedIcon = require("@/assets/images/cars/red.png");
const { width, height } = Dimensions.get("window");

const speeds = [1, 2, 3, 4, 5, 6];
const MARKER_RENDER_INTERVAL = 10;
const MAP_UPDATE_INTERVAL = 5000;
const SPEED_MULTIPLIERS = {
  1: 0.5,
  2: 1,
  3: 1.5,
  4: 2,
  5: 2.5,
  6: 3,
};
const MAX_POINTS = 5000;
const PINGS_BEFORE_AFTER = 2; // Number of pings to show before start and after stop

// Define styles before the component
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.05,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    gap: width * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#181818",
  },
  filterDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: width * 0.02,
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.03,
    marginHorizontal: width * 0.005,
  },
  filterDateText: {
    color: "#FFD600",
    fontWeight: "bold",
    fontSize: width * 0.035,
    marginLeft: width * 0.015,
  },
  filterToText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.035,
    marginHorizontal: width * 0.02,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  playbackBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.045,
    justifyContent: "space-between",
  },
  timeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.035,
    marginLeft: width * 0.03,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    backgroundColor: "#fff",
    borderTopLeftRadius: width * 0.06,
    borderTopRightRadius: width * 0.06,
    padding: width * 0.045,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 3,
    marginTop: 0,
  },
  bottomCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  bottomCardTitle: {
    color: "#000",
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  bottomCardDate: {
    color: "#888",
    fontSize: width * 0.035,
    fontWeight: "600",
  },
  bottomCardStatus: {
    color: "#222",
    fontSize: width * 0.0375,
    fontWeight: "bold",
  },
  speedBadge: {
    backgroundColor: "#000",
    borderRadius: width * 0.04,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.005,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: width * 0.02,
  },
  speedBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.035,
  },
  overlayFilterBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 10,
    marginTop: 0,
  },
  overlayPlaybackBar: {
    position: "absolute",
    bottom: height * 0.15,
    left: 0,
    width: "100%",
    zIndex: 10,
  },
  overlayBottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    zIndex: 20,
  },
  overlaySpeedSelectorBar: {
    top: height * 0.052,
    left: 0,
    borderRadius: 0,
    width: "100%",
    zIndex: 12,
    alignItems: "center",
  },
  speedSelectorBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: width * 0.03,
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    marginTop: height * 0.005,
    marginBottom: height * 0.005,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  speedSelectorLabel: {
    color: "#FFD600",
    fontWeight: "bold",
    fontSize: width * 0.0375,
    marginRight: width * 0.025,
  },
  speedSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.015,
  },
  speedBtn: {
    backgroundColor: "#222",
    borderRadius: width * 0.02,
    paddingVertical: height * 0.007,
    paddingHorizontal: width * 0.03,
    marginHorizontal: width * 0.005,
  },
  speedBtnActive: {
    backgroundColor: "#000",
  },
  speedText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.0375,
  },
  speedTextActive: {
    color: "#FFD600",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.0075,
  },
  statLabel: {
    color: "#222",
    fontSize: width * 0.0375,
    flexShrink: 1,
  },
  speedSelectorPlayBtn: {
    marginRight: width * 0.025,
    backgroundColor: "transparent",
    borderRadius: width * 0.05,
    padding: width * 0.01,
    alignItems: "center",
    justifyContent: "center",
  },
  stopCountBadge: {
    position: "absolute",
    top: 10,
    right: -8,
    backgroundColor: "#000",
    borderRadius: width * 0.04,
    minWidth: width * 0.06,
    height: width * 0.06,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.01,
  },
  stopCountText: {
    color: "#fff",
    fontSize: width * 0.03,
    fontWeight: "bold",
  },
  stopTimeBadge: {
    position: 'absolute',
    top: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: width * 0.02,
    padding: width * 0.015,
    alignItems: 'center',
    minWidth: width * 0.2,
  },
  stopTimeText: {
    color: '#FFD600',
    fontSize: width * 0.03,
    fontWeight: 'bold',
  },
  stopDurationText: {
    color: '#fff',
    fontSize: width * 0.028,
    marginTop: 2,
  },
  timeInfoContainer: {
    marginTop: height * 0.015,
    paddingTop: height * 0.015,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timeInfoText: {
    color: '#444',
    fontSize: width * 0.0375,
  },
  timeInfoLabel: {
    color: '#000',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: '#1E1E1E',
    padding: width * 0.06,
    borderRadius: width * 0.03,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD600',
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
});

// Add this function to find start and stop indices
const findStartStopIndices = (data: any[]) => {
  if (!data || data.length === 0) return { startIndex: 0, stopIndex: 0 };
  
  let startIndex = 0;
  let stopIndex = data.length - 1;
  
  // Find first movement
  for (let i = 1; i < data.length; i++) {
    if (data[i].speed > 0) {
      startIndex = Math.max(0, i - PINGS_BEFORE_AFTER);
      break;
    }
  }
  
  // Find last movement
  for (let i = data.length - 2; i >= 0; i--) {
    if (data[i].speed > 0) {
      stopIndex = Math.min(data.length - 1, i + PINGS_BEFORE_AFTER);
      break;
    }
  }
  
  return { startIndex, stopIndex };
};

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
  const [startIndex, setStartIndex] = useState(0);
  const [stopIndex, setStopIndex] = useState(0);

  // Fetch device details
  useEffect(() => {
    if (device?.deviceId) {
      fetchDeviceDetails(device.deviceId);
    }
  }, [device?.deviceId]);

  // Modify the processRouteData function
  const processRouteData = useCallback((data: any[]) => {
    if (!data || data.length === 0) return [];

    // Find start and stop indices
    const { startIndex, stopIndex } = findStartStopIndices(data);
    setStartIndex(startIndex);
    setStopIndex(stopIndex);

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
          fromDateUTC.setHours(
            fromDateUTC.getHours() - 5,
            fromDateUTC.getMinutes() - 30
          );

          const toDateUTC = new Date(endDate);
          toDateUTC.setHours(
            toDateUTC.getHours() - 5,
            toDateUTC.getMinutes() - 30
          );

          const routeResponse = await Api.call(
            "/api/reports/route?from=" +
              fromDateUTC.toISOString() +
              "&to=" +
              toDateUTC.toISOString() +
              "&deviceId=" +
              device.deviceId,
            "GET",
            {},
            false
          );

          const processedData = processRouteData(routeResponse.data || []);
          setRouteData(processedData);
          setPlaybackIndex(startIndex);
          setIsPlaying(false);

          // Fetch stop locations
          await fetchStopLocations(device.deviceId, fromDateUTC, toDateUTC);

          const summaryResponse = await Api.call(
            "/api/reports/summary?from=" +
              startDate.toISOString() +
              "&to=" +
              endDate.toISOString() +
              "&deviceId=" +
              device.deviceId +
              "&daily=false",
            "GET",
            {},
            false
          );
          setSummaryData(summaryResponse.data[0]);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [device?.deviceId, startDate, endDate, processRouteData]);

  const fetchDeviceDetails = async (deviceId: string) => {
    try {
      const response = await Api.call(
        `/api/devices?id=${deviceId}`,
        "GET",
        {},
        false
      );
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
        "GET",
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
      .map((pos) => ({
        latitude: pos.latitude,
        longitude: pos.longitude,
      }));
  }, [routeData]);

  // Memoize markers with increased interval
  const markers = useMemo(
    () =>
      routeData
        .filter((_, idx) => idx % MARKER_RENDER_INTERVAL === 0)
        .map((point, idx) => (
          <Marker
            key={idx}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
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
        )),
    [routeData]
  );

  // Add stop markers to the map
  const stopMarkers = useMemo(
    () =>
      stopLocations.map((stop, idx) => {
        const isFirstOrLast = idx === 0 || idx === stopLocations.length - 1;
        const startTime = moment(stop.startTime).format('HH:mm');
        const endTime = moment(stop.endTime).format('HH:mm');
        const duration = moment.duration(moment(stop.endTime).diff(moment(stop.startTime)));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        return (
          <Marker
            key={`stop-${idx}`}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            style={{ zIndex: 2 }}
          >
            <View style={{ alignItems: "center" }}>
              <MaterialIcons
                name="flag"
                size={24}
                color={idx === 0 ? "green" : "red"}
                style={{ opacity: isFirstOrLast ? 1 : 0 }}
              />
              <View
                style={[
                  styles.stopCountBadge,
                  { opacity: !isFirstOrLast ? 1 : 0 },
                ]}
              >
                <Text style={styles.stopCountText}>{idx}</Text>
              </View>
              {!isFirstOrLast && (
                <View style={styles.stopTimeBadge}>
                  <Text style={styles.stopTimeText}>{startTime} - {endTime}</Text>
                  <Text style={styles.stopDurationText}>{durationText}</Text>
                </View>
              )}
            </View>
          </Marker>
        );
      }),
    [stopLocations]
  );

  // Modify the playback effect to keep car centered
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
    let accumulatedTime = 0;

    const updatePlayback = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime;
      accumulatedTime += deltaTime;

      const speedMultiplier = SPEED_MULTIPLIERS[speed as keyof typeof SPEED_MULTIPLIERS];
      const updateInterval = MAP_UPDATE_INTERVAL / speedMultiplier;

      if (accumulatedTime >= updateInterval) {
        setPlaybackIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex <= stopIndex) {
            // Keep car centered without changing zoom
            if (mapRef.current && routeData[nextIndex]) {
              mapRef.current.animateCamera({
                center: {
                  latitude: routeData[nextIndex].latitude,
                  longitude: routeData[nextIndex].longitude,
                },
                heading: routeData[nextIndex].course || 0,
                pitch: 0,
                altitude: 0,
              });
            }
            accumulatedTime = 0;
            lastUpdateTime = currentTime;
            return nextIndex;
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
  }, [isPlaying, routeData, speed, stopIndex]);


  const currentPosition = routeData[playbackIndex];

  // For the summary card
  const data = {
    number: device?.name || "N/A",
    date: currentPosition
      ? moment(currentPosition.deviceTime).format("DD/MM/YYYY HH:mm")
      : "N/A",
    status: currentPosition?.attributes?.ignition ? "Engine On" : "Engine Off",
    address: currentPosition?.address || "N/A",
    odometer: `${(
      (currentPosition?.attributes?.totalDistance || 0) / 1000
    ).toFixed(0)} Km`,
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
            followsUserLocation={false}
            showsUserLocation={false}
            rotateEnabled={true}
            pitchEnabled={true}
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
                  longitude: currentPosition.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                style={{ zIndex: 3 }}
              >
                <Image
                  source={currentPosition.speed === 0 ? carStoppedIcon : carIcon}
                  style={[
                    { width: 30, height: 30, resizeMode: "contain" },
                    {
                      transform: [
                        { rotate: `${currentPosition.course || 0}deg` },
                      ],
                    },
                  ]}
                />
              </Marker>
            )}
          </MapView>
        )}
        {/* Overlay: Filter Bar */}
        <View style={styles.overlayFilterBar}>
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={styles.filterDateBtn}
              onPress={() => setStartPickerVisible(true)}
            >
              <MaterialIcons name="calendar-today" size={18} color="#FFD600" />
              <Text style={styles.filterDateText}>
                {moment(startDate).format("DD/MM/YYYY HH:mm")}
              </Text>
            </TouchableOpacity>
            <Text style={styles.filterToText}>to</Text>
            <TouchableOpacity
              style={styles.filterDateBtn}
              onPress={() => setEndPickerVisible(true)}
            >
              <MaterialIcons name="calendar-today" size={18} color="#FFD600" />
              <Text style={styles.filterDateText}>
                {moment(endDate).format("DD/MM/YYYY HH:mm")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Overlay: Speed Selector Bar */}
        <View style={styles.overlaySpeedSelectorBar}>
          <View style={styles.speedSelectorBar}>
            <TouchableOpacity
              onPress={() => setIsPlaying((p) => !p)}
              style={styles.speedSelectorPlayBtn}
            >
              <MaterialIcons
                name={isPlaying ? "pause" : "play-arrow"}
                size={26}
                color="#FFD600"
              />
            </TouchableOpacity>
            <Text style={styles.speedSelectorLabel}>Speed:</Text>
            <View style={styles.speedSelectorRow}>
              {speeds.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.speedBtn,
                    speed === s && styles.speedBtnActive,
                  ]}
                  onPress={() => setSpeed(s)}
                >
                  <Text
                    style={[
                      styles.speedText,
                      speed === s && styles.speedTextActive,
                    ]}
                  >
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        {/* Overlay: Playback Controls */}
        <View style={styles.overlayPlaybackBar}>
          <View style={styles.playbackBar}>
            <Text style={styles.timeText}>
              {playbackIndex + 1} / {routeData.length}
            </Text>
          </View>
        </View>
        {/* Overlay: Bottom Card */}
        <View style={styles.overlayBottomCard}>
          <View style={styles.bottomCard}>
            <View style={styles.bottomCardRow}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.bottomCardTitle}>{data.number}</Text>
                <Text style={styles.bottomCardDate}>Date: {data.date}</Text>
                <Text style={styles.bottomCardStatus}>
                  Status: {data.status}
                </Text>
              </View>
              <View style={styles.speedBadge}>
                <Text style={styles.speedBadgeText}>
                  {Number(data.speed).toFixed(0)} km/h
                </Text>
              </View>
            </View>
            {/* Stats Rows with gap and center alignment */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>
                <Text style={{ color: "black", fontWeight: "bold" }}>
                  Address:
                </Text>{" "}
                {data.address}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>
                <Text style={{ color: "black", fontWeight: "bold" }}>
                  Distance:
                </Text>{" "}
                {(summaryData?.distance / 1000).toFixed(2)} km
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>
                <Text style={{ color: "black", fontWeight: "bold" }}>
                  Odometer:
                </Text>{" "}
                {data.odometer}
              </Text>
            </View>
            {/* Show Start and End Time in single line */}
            {stopLocations.length > 0 && (
              <View style={styles.timeInfoContainer}>
                <Text style={styles.timeInfoText}>
                  <Text style={styles.timeInfoLabel}>Time: </Text>
                  {moment(stopLocations[0].startTime).format('hh:mm A   ')} - {moment(stopLocations[stopLocations.length - 1].endTime).format('hh:mm A')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Date Time Pickers */}
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="datetime"
        onConfirm={(date) => {
          if (date > endDate) {
            // If selected start date is after end date, update both dates
            setStartDate(date);
            setEndDate(date);
          } else {
            setStartDate(date);
          }
          setStartPickerVisible(false);
          setLoading(true); // Show loading when date changes
        }}
        onCancel={() => setStartPickerVisible(false)}
        date={startDate}
        maximumDate={endDate}
      />

      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="datetime"
        onConfirm={(date) => {
          if (date < startDate) {
            // If selected end date is before start date, update both dates
            setEndDate(date);
            setStartDate(date);
          } else {
            setEndDate(date);
          }
          setEndPickerVisible(false);
          setLoading(true); // Show loading when date changes
        }}
        onCancel={() => setEndPickerVisible(false)}
        date={endDate}
        minimumDate={startDate}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#FFD600" />
            <Text style={styles.loadingText}>Loading route data...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}


