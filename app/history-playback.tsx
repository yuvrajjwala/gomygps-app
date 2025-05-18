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
    justifyContent: "space-between",
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
  },
  searchButton: {
    backgroundColor: "#FF7043",
    borderRadius: width * 0.02,
    padding: width * 0.025,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDateText: {
    color: "#FF7043",
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
    color: "#FF7043",
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
    color: "#FF7043",
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
    color: '#FF7043',
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
    color: '#FF7043',
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  stopMarkerContainer: {
    alignItems: 'center',
  },
  stopMarker: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#43A047',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopMarkerSelected: {
    backgroundColor: '#43A047',
    borderColor: '#fff',
  },
  stopMarkerText: {
    color: '#43A047',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopMarkerTextSelected: {
    color: '#fff',
  },
  stopTimeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 8,
  },
  stopTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 6,
  },
  stopTimeTitle: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stopTimeContent: {
    gap: 2,
  },
  stopTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopTimeLabel: {
    color: '#666',
    fontSize: 12,
  },
  stopTimeValue: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  stopDetailsContainer: {
    marginTop: 15,
  },
  stopDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center',
    paddingHorizontal: width * 0.02,
  },
  stopDetailItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.02,
  },
  stopDetailLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  stopDetailValue: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addressText: {
    color: '#000',
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  filterPopup: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -width * 0.4 }, { translateY: -height * 0.25 }],
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    padding: width * 0.04,
    width: width * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  filterPopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  filterTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: height * 0.02,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  dateLabel: {
    width: width * 0.15,
    fontSize: width * 0.035,
    color: '#666',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: width * 0.03,
    borderRadius: width * 0.02,
    marginLeft: width * 0.02,
  },
  dateButtonText: {
    fontSize: width * 0.035,
    color: '#000',
    marginLeft: width * 0.02,
  },
  submitButton: {
    backgroundColor: '#FF7043',
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    padding: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.02,
  },
  playButton: {
    padding: 5,
  },
  speedSection: {
    marginTop: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: height * 0.02,
  },
  speedLabel: {
    fontSize: width * 0.035,
    color: '#666',
    marginBottom: height * 0.01,
  },
  speedButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width * 0.02,
  },
  speedButton: {
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    borderRadius: width * 0.02,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonActive: {
    backgroundColor: '#43A047',
  },
  speedButtonText: {
    fontSize: width * 0.035,
    color: '#000',
  },
  
  speedButtonTextActive: {
    fontWeight: 'bold',
    color: '#ffffff',
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
  
  // Set default dates - today 00:00 to now
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Set to beginning of day (00:00:00)
    return today;
  });
  const [endDate, setEndDate] = useState(new Date());  // Current time
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
  const [selectedStop, setSelectedStop] = useState<number | null>(null);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [initialStartDate, setInitialStartDate] = useState<Date | null>(null);
  const [initialEndDate, setInitialEndDate] = useState<Date | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);

  // Fetch device details
  useEffect(() => {
    if (device?.deviceId) {
      fetchDeviceDetails(device.deviceId);
    }
  }, [device?.deviceId]);

  // Store initial dates when opening filter
  useEffect(() => {
    if (isFilterVisible) {
      setInitialStartDate(startDate);
      setInitialEndDate(endDate);
    }
  }, [isFilterVisible]);

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

  // Modify the fetchData function to handle GMT +5:30 properly
  const fetchData = async () => {
    try {
      // Convert dates to UTC by subtracting 5:30 hours
      const fromDateUTC = new Date(startDate);
      fromDateUTC.setHours(fromDateUTC.getHours() );
      fromDateUTC.setMinutes(fromDateUTC.getMinutes());

      const toDateUTC = new Date(endDate);
      toDateUTC.setHours(toDateUTC.getHours());
      toDateUTC.setMinutes(toDateUTC.getMinutes());

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

      // Fetch stop locations with UTC adjusted times
      await fetchStopLocations(device.deviceId, fromDateUTC, toDateUTC);

      const summaryResponse = await Api.call(
        "/api/reports/summary?from=" +
          fromDateUTC.toISOString() +
          "&to=" +
          toDateUTC.toISOString() +
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

  // Initial data fetch
  useEffect(() => {
    if (device?.deviceId) {
      setLoading(true);
      fetchData();
    }
  }, [device?.deviceId]);

  // Modify the search button press handler
  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      if (device?.deviceId) {
        fetchData();
      }
    }, 100);
  };

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
    console.log("hello",from.toISOString(), to.toISOString());
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

  // Modify markers with lower z-index and prevent updates
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
            style={{ zIndex: 1 }}
            tracksViewChanges={false}
            zIndex={1}
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

  // Modify stop markers to maintain highest z-index
  const stopMarkers = useMemo(
    () =>
      stopLocations.map((stop, idx) => {
        const isFirstOrLast = idx === 0 || idx === stopLocations.length - 1;
        const isSelected = selectedStop === idx;

        return (
          <Marker
            key={`stop-${idx}`}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            onPress={() => setSelectedStop(isSelected ? null : idx)}
            anchor={{ x: 2.8, y: 1.5 }}
            style={{ zIndex: 3 }}
            tracksViewChanges={false}
            zIndex={3}
          >
            <View style={[
              styles.stopMarkerContainer,
              { zIndex: 3 }
            ]}>
              {isFirstOrLast ? (
                <MaterialIcons
                  name="flag"
                  size={30}
                  color={idx === 0 ? "green" : "red"}
                />
              ) : (
                <View style={[
                  styles.stopMarker,
                  isSelected && styles.stopMarkerSelected,
                  { zIndex: 3 }
                ]}>
                  <Text style={[
                    styles.stopMarkerText,
                    isSelected && styles.stopMarkerTextSelected
                  ]}>{idx}</Text>
                </View>
              )}
            </View>
          </Marker>
        );
      }),
    [stopLocations, selectedStop]
  );

  // Update the selectedStopDetails to include full date and time
  const selectedStopDetails = useMemo(() => {
    if (selectedStop === null) return null;
    const stop = stopLocations[selectedStop];
    if (!stop) return null;

    const startTime = moment(stop.startTime).format('DD/MM/YYYY hh:mm A');
    const endTime = moment(stop.endTime).format('DD/MM/YYYY hh:mm A');
    const duration = moment.duration(moment(stop.endTime).diff(moment(stop.startTime)));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    return {
      stopNumber: selectedStop,
      startTime,
      endTime,
      durationText,
      address: stop.address || 'Address not available'
    };
  }, [selectedStop, stopLocations]);

  // Add this function to find next moving point
  const findNextMovingPoint = useCallback((currentIndex: number) => {
    for (let i = currentIndex + 1; i < routeData.length; i++) {
      if (routeData[i].speed > 0) {
        return i;
      }
    }
    return stopIndex; // If no moving point found, return stop index
  }, [routeData, stopIndex]);

  // Modify the playback effect to maintain correct car angle while making the map follow the vehicle.
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
          let nextIndex = prev + 1;
          
          // If current position is stopped, find next moving point
          if (routeData[prev] && routeData[prev].speed === 0) {
            nextIndex = findNextMovingPoint(prev);
          }

          if (nextIndex <= stopIndex) {
            // Update map position without affecting car rotation
            if (mapRef.current && routeData[nextIndex]) {
              mapRef.current.animateCamera({
                center: {
                  latitude: routeData[nextIndex].latitude,
                  longitude: routeData[nextIndex].longitude,
                },
                zoom: mapRegion?.zoom || Math.log2(360 / userZoom),
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
  }, [isPlaying, routeData, speed, stopIndex, findNextMovingPoint, mapRegion, userZoom]);

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
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>{data.number}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setFilterVisible(true)}
            >
              <MaterialIcons name="calendar-today" size={24} color="#FF7043" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => setIsPlaying(prev => !prev)}
            >
              <MaterialIcons 
                name={isPlaying ? "pause" : "play-arrow"} 
                size={24} 
                color="#FF7043" 
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ width: 26 }} />
      </View>
      {/* Map (full page) */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF7043" />
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
              // Only update if user has manually changed the region
              if (!isPlaying) {
                setUserZoom(region.latitudeDelta);
                setMapRegion(region);
              }
            }}
            moveOnMarkerPress={false}
            followsUserLocation={false}
            showsUserLocation={false}
            rotateEnabled={true}
            pitchEnabled={true}
          >
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#2979FF"
              strokeWidth={2}
              zIndex={1}
            />
            {markers}
            {currentPosition && (
              <Marker
                coordinate={{
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                style={{ zIndex: 2 }}
                tracksViewChanges={false}
                zIndex={2}
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
            {stopMarkers}
          </MapView>
        )}
        {/* Overlay: Speed Selector Bar */}
        {/* <View style={styles.overlaySpeedSelectorBar}>
          <View style={styles.speedSelectorBar}>
            <TouchableOpacity
              onPress={() => setIsPlaying((p) => !p)}
              style={styles.speedSelectorPlayBtn}
            >
              <MaterialIcons
                name={isPlaying ? "pause" : "play-arrow"}
                size={26}
                color="#FF7043"
              />
            </TouchableOpacity>
            <Text style={styles.speedSelectorLabel}>Spdddeed:</Text>
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
        </View> */}
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
            {selectedStopDetails ? (
              // Show Stop Details when a stop is selected
              <>
                <View style={styles.bottomCardRow}>
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => setSelectedStop(null)}
                  >
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.bottomCardTitle}>Stop {selectedStopDetails.stopNumber} Details</Text>
                </View>
                <View style={styles.stopDetailsContainer}>
                  <View style={styles.stopDetailRow}>
                    <View style={styles.stopDetailItem}>
                      <MaterialIcons name="access-time" size={20} color="#43A047" />
                      <Text style={styles.stopDetailLabel}>Start Time</Text>
                      <Text style={styles.stopDetailValue}>{selectedStopDetails.startTime}</Text>
                    </View>
                    <View style={styles.stopDetailItem}>
                      <MaterialIcons name="update" size={20} color="#43A047" />
                      <Text style={styles.stopDetailLabel}>End Time</Text>
                      <Text style={styles.stopDetailValue}>{selectedStopDetails.endTime}</Text>
                    </View>
                    <View style={styles.stopDetailItem}>
                      <MaterialIcons name="timer" size={20} color="#43A047" />
                      <Text style={styles.stopDetailLabel}>Duration</Text>
                      <Text style={styles.stopDetailValue}>{selectedStopDetails.durationText}</Text>
                    </View>
                  </View>
                  <View style={styles.addressContainer}>
                    <MaterialIcons name="location-on" size={20} color="#43A047" />
                    <Text style={styles.addressText}>{selectedStopDetails.address}</Text>
                  </View>
                </View>
              </>
            ) : (
              // Show normal vehicle details when no stop is selected
              <>
                <View style={styles.bottomCardRow}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={styles.bottomCardTitle}>{data.number}</Text>
                    <Text style={styles.bottomCardDate}>Date: {data.date}</Text>
                    <Text style={styles.bottomCardStatus}>Status: {data.status}</Text>
                  </View>
                  <View style={styles.speedBadge}>
                    <Text style={styles.speedBadgeText}>{Number(data.speed).toFixed(0)} km/h</Text>
                  </View>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>
                    <Text style={{ color: "black", fontWeight: "bold" }}>Address:</Text>{" "}
                    {data.address}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>
                    <Text style={{ color: "black", fontWeight: "bold" }}>Distance:</Text>{" "}
                    {(summaryData?.distance / 1000).toFixed(2)} km
                  </Text>
                </View>
                
                {stopLocations.length > 0 && (
                  <View style={styles.timeInfoContainer}>
                    <Text style={styles.timeInfoText}>
                      <Text style={styles.timeInfoLabel}>Time: </Text>
                  {moment(stopLocations[0].startTime).format('hh:mm A   ')} - {moment(stopLocations[stopLocations.length - 1].endTime).format('hh:mm A')}
                    </Text>
                  </View>
                )}
              </>
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
            setStartDate(date);
            setEndDate(date);
          } else {
            setStartDate(date);
          }
          setStartPickerVisible(false);
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
            setEndDate(date);
            setStartDate(date);
          } else {
            setEndDate(date);
          }
          setEndPickerVisible(false);
        }}
        onCancel={() => setEndPickerVisible(false)}
        date={endDate}
        minimumDate={startDate}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#FF7043" />
            <Text style={styles.loadingText}>Loading route data...</Text>
          </View>
        </View>
      )}

      {/* Add Filter Popup */}
      {isFilterVisible && (
        <>
          <View style={styles.filterPopupOverlay}>
            <TouchableOpacity 
              style={{ flex: 1 }}
              onPress={() => setFilterVisible(false)}
            />
          </View>
          <View style={styles.filterPopup}>
            <Text style={styles.filterTitle}>Playback Settings</Text>
            
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>From:</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setStartPickerVisible(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {moment(startDate).format("DD/MM/YYYY hh:mm A")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>To:</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setEndPickerVisible(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {moment(endDate).format("DD/MM/YYYY hh:mm A")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.speedSection}>
              <Text style={styles.speedLabel}>Playback Speed:</Text>
              <View style={styles.speedButtonsRow}>
                {speeds.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.speedButton,
                      speed === s && styles.speedButtonActive,
                    ]}
                    onPress={() => {
                      setSpeed(s);
                      // Don't close popup or reload data when changing speed
                    }}
                  >
                    <Text
                      style={[
                        styles.speedButtonText,
                        speed === s && styles.speedButtonTextActive,
                      ]}
                    >
                      {s}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => {
                setFilterVisible(false);
                // Only reload data if dates have changed
                if (initialStartDate?.getTime() !== startDate.getTime() || 
                    initialEndDate?.getTime() !== endDate.getTime()) {
                  handleSearch();
                }
              }}
            >
              <Text style={styles.submitButtonText}>Apply Date Filter</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}


