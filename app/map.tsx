import Api from "@/config/Api";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  AnimatedRegion,
  Marker,
  Polyline
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
    {
      latitude: Number(params?.latitude) || 0,
      longitude: Number(params?.longitude) || 0,
    },
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
  const [showTraffic, setShowTraffic] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [mapType, setMapType] = useState<
    "standard" | "satellite" | "terrain" | "hybrid"
  >("standard");

  const [currentMarkerPosition, setCurrentMarkerPosition] = useState({
    latitude: Number(params?.latitude) || 0,
    longitude: Number(params?.longitude) || 0,
  });

  const [summaryData, setSummaryData] = useState<any>(null);
  const [todaySummary, setTodaySummary] = useState({
    distance: 0,
    maxSpeed: 0,
    averageSpeed: 0,
    engineHours: "0h:00m",
    movingDuration: "00h:00m",
    stoppedDuration: "00h:00m",
    idleDuration: "00h:00m",
    ignitionOnDuration: "00h:00m",
    ignitionOffDuration: "00h:00m",
  });

  // Animation ref for details section
  const detailsAnimHeight = useRef(new Animated.Value(0)).current;


  

  // Add new state for 3D view
  const [is3DView, setIs3DView] = useState(false);

  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Add state to track current map region
  const [currentMapRegion, setCurrentMapRegion] = useState({
    latitudeDelta: zoomLevel,
    longitudeDelta: zoomLevel * 0.5
  });

  const getVehicleIcon = (): ImageSourcePropType => {
    if (!device?.deviceTime) {
      return require("@/assets/images/cars/white.png");
    }
    const lastUpdate = new Date(device.deviceTime);
    const fourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 4);
    if (lastUpdate < fourHoursAgo) {
      return require("@/assets/images/cars/blue.png");
    }
    if (device.status === "online" && Number(device.speed) === 0) {
      return require("@/assets/images/cars/orange.png");
    }
    return device.status === "online"
      ? require("@/assets/images/cars/green.png")
      : require("@/assets/images/cars/red.png");
  };

  const getPosition = async () => {
    if (!isFocused) return;
    const response = await Api.call(
      `/api/positions?deviceId=${device.deviceId}`,
      "GET",
      {},
      false
    );

    const newDevice = { ...device, ...response.data[0] };
    setDevice(newDevice);
    
    if (newDevice.latitude && newDevice.longitude) {
      const newPosition = {
        latitude: Number(newDevice.latitude) || 0,
        longitude: Number(newDevice.longitude) || 0,
      };

      // Update marker position and path
      setCurrentMarkerPosition(newPosition);
      setCarPath(prev => [...prev, newPosition]);
      
      markerPosition.timing({
        toValue: newPosition,
        duration: 1000,
        useNativeDriver: false,
      } as any).start();

      // If car mode is enabled, follow car but keep current zoom
      if (carMode && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: newPosition.latitude,
          longitude: newPosition.longitude,
          latitudeDelta: currentMapRegion.latitudeDelta,
          longitudeDelta: currentMapRegion.longitudeDelta,
        }, 1000);
      }
    }
  };

  // Remove the marker position reset effect
  useEffect(() => {
    if (device?.latitude && device?.longitude) {
      setCurrentMarkerPosition({
        latitude: Number(device?.latitude) || 0,
        longitude: Number(device?.longitude) || 0,
      });
    }
  }, [device?.latitude, device?.longitude]);

  useEffect(() => {
    if (isFocused) {
      getPosition();
      const interval = setInterval(() => {
        getPosition();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isFocused]);

  // Modify car mode effect to only update state
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
      const response = await Api.call(
        "/api/geofences",
        "POST",
        geofenceData,
        false
      );
      let deviceData = await fetchDeviceDetails(device.deviceId);
      await Api.call(
        "/api/permissions",
        "POST",
        {
          deviceId: device.deviceId,
          geofenceId: response.data.id,
        },
        false
      );
      let newAttributes = {
        ...deviceData.attributes,
        fence_id: response.data.id,
        parked_time: new Date().toISOString(),
        is_parked: true,
      };
      deviceData.attributes = newAttributes;
      await Api.call(
        `/api/devices/${device.deviceId}`,
        "PUT",
        deviceData,
        false
      );
      setIsParked(true);
    } catch (error) {
      console.error("Error creating geofence:", error);
    }
  };

  const removeGeofence = async (device: any) => {
    try {
      let deviceData = await fetchDeviceDetails(device.deviceId);
      await Api.call(
        `/api/geofences/${deviceData.attributes.fence_id}`,
        "DELETE",
        {},
        false
      );
      let newAttributes = {
        ...deviceData.attributes,
        fence_id: null,
        parked_time: null,
        is_parked: false,
      };
      deviceData.attributes = newAttributes;
      await Api.call(
        `/api/devices/${device.deviceId}`,
        "PUT",
        deviceData,
        false
      );
      setIsParked(false);
    } catch (error) {
      console.error("Error removing geofence:", error);
    }
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
        return device;
      }
    } catch (error) {
      console.error("Error fetching device details:", error);
    }
  };

  const mobilize = async (protocol: string) => {
    try {
      let lockStatus = isLocked ? "RELAY,1#" : "RELAY,0#";
      await Api.call(
        "/api/commands/send",
        "POST",
        {
          commandId: "",
          deviceId: device?.deviceId,
          description: "mobilize",
          type: "custom",
          attributes: {
            data: lockStatus,
          },
        },
        false
      );
      let deviceData = await fetchDeviceDetails(device?.deviceId);
      let newAttributes = {
        ...deviceData.attributes,
        is_mobilized: !isLocked,
      };
      deviceData.attributes = newAttributes;
      await Api.call(`/api/devices/${deviceData.id}`, "PUT", deviceData, false);
      setIsLocked(!isLocked);
    } catch (error) {
      console.error("Error mobilizing device:", error);
    }
  };

  useEffect(() => {
    // Cleanup on unmount: reset carPath and marker position
    return () => {
      setCarPath([
        {
          latitude: Number(params?.latitude) || 0,
          longitude: Number(params?.longitude) || 0,
        },
      ]);
      setCurrentMarkerPosition({
        latitude: Number(params?.latitude) || 0,
        longitude: Number(params?.longitude) || 0,
      });
    };
  }, []);

  // Fetch summary data for today
  const fetchTodaySummary = async (deviceId: string | number) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      // First get route data for positions
      const routeResponse = await Api.call(
        `/api/reports/route?deviceId=${deviceId}&from=${startOfDay.toISOString()}&to=${today.toISOString()}&daily=false`,
        "GET",
        {},
        false
      );

      // Get summary report for distance and average speed
      const summaryResponse = await Api.call(
        `/api/reports/summary?deviceId=${deviceId}&from=${startOfDay.toISOString()}&to=${today.toISOString()}&daily=false`,
        "GET",
        {},
        false
      );

      if (routeResponse.data && routeResponse.data.length > 0) {
        let totalIgnitionTime = 0;
        let totalRunningTime = 0;
        let lastIgnitionState = false;
        let lastRunningState = false;
        let lastTimestamp = new Date(routeResponse.data[0].deviceTime).getTime();
        let idleStartTime = 0;
        const TWO_MINUTES = 360000; // 6 minutes in milliseconds

        // Get distance and average speed from summary report
        const summaryData = summaryResponse.data[0] || {};
        const distance = summaryData.distance || 0;
        const averageSpeed = summaryData.averageSpeed || 0;

        // Iterate through all positions to calculate times
        routeResponse.data.forEach((position: any) => {
          const currentTime = new Date(position.deviceTime).getTime();
          const timeDiff = currentTime - lastTimestamp;
          
          // Check states
          const isIgnitionOn = position.attributes?.ignition === true;
          const isMoving = position.speed > 0;

          // Add to total ignition time if ignition was on
          if (isIgnitionOn) {
            totalIgnitionTime += timeDiff;

            // Track idle periods
            if (!isMoving) {
              if (lastRunningState) {
                // Vehicle just stopped, start idle timer
                idleStartTime = currentTime;
              } else if (idleStartTime > 0) {
                // Vehicle was already idle, check duration
                const idleDuration = currentTime - idleStartTime;
                if (idleDuration < TWO_MINUTES) {
                  // If idle less than 6 minutes, count as running
                  totalRunningTime += timeDiff;
                }
              }
            } else {
              // Vehicle is moving
              totalRunningTime += timeDiff;
              idleStartTime = 0;
            }
          } else {
            // Ignition is off, reset idle tracking
            idleStartTime = 0;
          }

          // Update states for next iteration
          lastIgnitionState = isIgnitionOn;
          lastRunningState = isMoving;
          lastTimestamp = currentTime;
        });

        // Format durations
        const formatDuration = (milliseconds: number | undefined) => {
          if (!milliseconds) return "00h:00m";
          const totalMinutes = Math.floor(milliseconds / (1000 * 60));
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return `${hours.toString().padStart(2, "0")}h:${minutes.toString().padStart(2, "0")}m`;
        };

        setTodaySummary({
          distance: distance,
          maxSpeed: Math.max(...routeResponse.data.map((pos: any) => pos.speed || 0)),
          averageSpeed: averageSpeed,
          engineHours: formatDuration(totalIgnitionTime),
          movingDuration: formatDuration(totalRunningTime),
          stoppedDuration: formatDuration(totalIgnitionTime - totalRunningTime),
          idleDuration: formatDuration(totalIgnitionTime - totalRunningTime),
          ignitionOnDuration: formatDuration(totalIgnitionTime),
          ignitionOffDuration: formatDuration(24 * 60 * 60 * 1000 - totalIgnitionTime),
        });

        console.log('xxxxxxx',todaySummary);

        setSummaryData({
          ...routeResponse.data[0],
          engineHours: totalIgnitionTime,
          movingDuration: totalRunningTime,
          distance: distance,
          averageSpeed: averageSpeed
        });
      }
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  // Format distance for display
  const formatDistance = (meters: number | undefined) => {
    if (!meters) return "0 km";
    return `${(meters / 1000).toFixed(0)} km`;
  };

  // Format speed for display
  const formatSpeed = (knots: number | undefined) => {
    if (!knots) return "0 km/h";
    return `${(knots * 1.852).toFixed(0)} km/h`;
  };

  // Add new useEffect to fetch summary when device changes
  useEffect(() => {
    if (device?.deviceId) {
      fetchTodaySummary(device.deviceId);
    }
  }, [device?.deviceId]);

  // Animate the details section when showDetails changes
  useEffect(() => {
    Animated.timing(detailsAnimHeight, {
      toValue: showDetails ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showDetails]);

  const engineHoursCalculation = () => {
    if (!summaryData) return "0 hrs 0 min";

    // Get running hours (when ignition is on AND speed > 0)
    const runningHours = summaryData.movingDuration || 0;
    
    // Get total ignition hours
    const ignitionHours = summaryData.engineHours || 0;
    
    // Calculate idle hours (ignition on but not moving)
    const idleHours = ignitionHours - runningHours;

    // Convert to hours and minutes
    const totalMinutes = Math.floor(runningHours / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours} hrs ${minutes} min`;
  };

  // Helper to get current coordinates as string
  const getCurrentCoordsString = () => {
    const lat = device?.latitude || 0;
    const lng = device?.longitude || 0;
    return `https://maps.google.com/?q=${lat},${lng}`;
  };

  // Share current location
  const handleShareCurrentLocation = async () => {
    try {
      const coordsUrl = getCurrentCoordsString();
      await Share.share({
        message: `Here is my current location: ${coordsUrl}`,
        url: coordsUrl,
        title: 'Share Current Location',
      });
    } catch (error) {
      console.error('Error sharing location:', error);
    }
    setShareModalVisible(false);
  };

  // Placeholder for live location sharing
  const handleShareLiveLocation = async () => {
    // You would generate a live location link here
    // For now, just share the current location as a placeholder
    try {
      const coordsUrl = getCurrentCoordsString();
      await Share.share({
        message: `Track my live location here: ${coordsUrl} (Live location coming soon!)`,
        url: coordsUrl,
        title: 'Share Live Location',
      });
    } catch (error) {
      console.error('Error sharing live location:', error);
    }
    setShareModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>{device?.name}</Text>
          <Text style={styles.headerSubtitle}>
            Last updated:{" "}
            {moment(device?.deviceTime).format("DD/MM/YYYY HH:mm")}
          </Text>
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
        zoomEnabled={true}
        zoomControlEnabled={true}
        showsUserLocation={true}
        followsUserLocation={false}
        rotateEnabled={is3DView}
        scrollEnabled={true}
        showsTraffic={showTraffic}
        showsCompass={showCompass}
        mapType={mapType}
        pitchEnabled={true}
        showsBuildings={is3DView}
        showsIndoors={is3DView}
        onRegionChangeComplete={(region) => {
          setZoomLevel(region.latitudeDelta);
          setCurrentMapRegion({
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta
          });
        }}
      >
        <Polyline coordinates={carPath} strokeColor="#000000" strokeWidth={4} />
        <Marker.Animated coordinate={currentMarkerPosition} anchor={{ x: 0.5, y: 0.5 }}>
          <Image
            source={getVehicleIcon()}
            style={[
              styles.markerImage,
              { transform: [{ rotate: `${device?.course || 0}deg` }] },
            ]}
          />
        </Marker.Animated>
      </MapView>

      {/* Custom Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetContent}>
          {/* Vehicle Name and Speed */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View>
              <Text style={styles.vehicleNumber}>{device?.name}</Text>
              <Text
                style={[
                  styles.vehicleNumber,
                  { fontSize: 12, color: "#666", fontWeight: "400" },
                ]}
              >
                {device?.address}
              </Text>
            </View>
          </View>

          <View style={styles.statusIconsRow}>
            {/* Parking */}
            <TouchableOpacity
              style={[
                styles.iconCircle,
                {
                  borderColor: isParked ? "#43A047" : "#A5F3C7",
                  backgroundColor: isParked ? "#43A047" : "#fff",
                },
              ]}
              onPress={() => {
                if (device) {
                  isParked ? removeGeofence(device) : createGeofence(device);
                }
              }}
            >
              <MaterialIcons
                name="local-parking"
                size={24}
                color={isParked ? "#fff" : "#43A047"}
              />
            </TouchableOpacity>

            {/* Play (active) */}
            <TouchableOpacity
              style={[
                styles.iconCircle,
                styles.iconCircleActive,
                {
                  backgroundColor: "#4285F4",
                  borderColor: "#4285F4",
                  shadowColor: "#4285F4",
                },
              ]}
              onPress={() => {
                router.push({
                  pathname: "/history-playback",
                  params: { device: JSON.stringify(device) },
                });
              }}
            >
              <MaterialIcons name="play-arrow" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Car Mode */}
            <TouchableOpacity
              style={[
                styles.iconCircle,
                {
                  borderColor: carMode ? "#4285F4" : "#90CAF9",
                  backgroundColor: carMode ? "#4285F4" : "#fff",
                },
              ]}
              onPress={() => {
              setCarMode(true);
                const wasCarModeOff = carMode;
                
                // Only reset zoom when first enabling car mode
                if ( mapRef.current && device?.latitude && device?.longitude) {
                  mapRef.current.animateToRegion({
                    latitude: Number(device.latitude),
                    longitude: Number(device.longitude),
                    latitudeDelta: 0.002, // Default zoom level only on initial enable
                    longitudeDelta: 0.001,
                  }, 1000);
                }
              }}
            >
              <MaterialIcons
                name="directions-car"
                size={24}
                color={carMode ? "#fff" : "#4285F4"}
              />
            </TouchableOpacity>

            {/* Lock */}
            <TouchableOpacity
              style={[
                styles.iconCircle,
                {
                  borderColor: isLocked ? "#E53935" : "#FFCDD2",
                  backgroundColor: isLocked ? "#E53935" : "#fff",
                },
              ]}
              onPress={() => {
                if (device) {
                  mobilize(device.protocol);
                }
              }}
            >
              <MaterialIcons
                name={isLocked ? "lock" : "lock-open"}
                size={24}
                color={isLocked ? "#fff" : "#E53935"}
              />
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={[
                styles.iconCircle,
                {
                  borderColor: '#43A047',
                  backgroundColor: '#fff',
                },
              ]}
              onPress={() => setShareModalVisible(true)}
            >
              <MaterialIcons
                name="share"
                size={24}
                color="#43A047"
              />
            </TouchableOpacity>
          </View>

          {/* Stats Grid - only show if showDetails is true */}
          <Animated.View
            style={{
              maxHeight: detailsAnimHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500],
              }),
              opacity: detailsAnimHeight,
              overflow: "hidden",
            }}
          >
            <View style={styles.statsDivider} />

            {/* Second row */}
            <View style={styles.statsRow}>
              <View style={[styles.statsCol, styles.statsColHighlight1]}>
                <FontAwesome5
                  name="clock"
                  size={14}
                  color="#2196F3"
                  style={styles.statsIcon}
                />
                <Text style={styles.statsLabel}>Fix Time</Text>
                <Text style={styles.statsValue}>
                  {device?.deviceTime
                    ? moment(device.deviceTime).format("DD/MM, HH:mm")
                    : moment().format("DD/MM, HH:mm")}
                </Text>
              </View>
              <View style={[styles.statsCol, styles.statsColHighlight3]}>
                <FontAwesome5
                  name="road"
                  size={14}
                  color="#43A047"
                  style={styles.statsIcon}
                />
                <Text style={styles.statsLabel}>Distance</Text>
                <Text style={styles.statsValue}>
                  {formatDistance(todaySummary.distance)}
                </Text>
              </View>
              <View style={[styles.statsCol, styles.statsColHighlight4]}>
                <FontAwesome5
                  name="cogs"
                  size={14}
                  color="#9C27B0"
                  style={styles.statsIcon}
                />
                <Text style={styles.statsLabel}>Engine</Text>
                <Text style={styles.statsValue}>
                  {todaySummary.engineHours}
                </Text>
              </View>
            </View>

            <View style={styles.statsDivider} />

            {/* Third row */}
            <View style={styles.statsRow}>
              <View style={[styles.statsCol, styles.statsColHighlight5]}>
                <FontAwesome5
                  name="running"
                  size={14}
                  color="#009688"
                  style={styles.statsIcon}
                />
                <Text style={styles.statsLabel}>Running</Text>
                <Text style={styles.statsValue}>
                  {(() => {
                    const runHours = engineHoursCalculation();
                    // Convert "X hrs Y min" to "Xh Ym"
                    return runHours.replace(/ hrs /, "h ").replace(/ min/, "m");
                  })()}
                </Text>
              </View>
              <View style={[styles.statsCol, styles.statsColHighlight6]}>
                <FontAwesome5
                  name="gas-pump"
                  size={14}
                  color="#E53935"
                  style={styles.statsIcon}
                />
                <Text style={styles.statsLabel}>Fuel</Text>
                <Text style={styles.statsValue}>{device?.fuel || "0"} L</Text>
              </View>
              <View style={[styles.statsCol, styles.statsColHighlight7]}>
                <FontAwesome5
                  name="bolt"
                  size={14}
                  color="#FFC107"
                  style={styles.statsIcon}
                />
                <Text style={styles.statsLabel}>Max Speed</Text>
                <Text style={styles.statsValue}>
                  {formatSpeed(todaySummary.maxSpeed)}
                </Text>
              </View>

              <View style={[styles.statsCol, styles.statsColHighlight8]}>
                <FontAwesome5
                  name="chart-line"
                  size={14}
                  color="#03A9F4"
                  style={styles.statsIcon}
                />
                <Text style={styles.statsLabel}>Avg Speed</Text>
                <Text style={styles.statsValue}>
                  {(() => {
                    const distanceKm = (summaryData?.distance || 0) / 1000;
                    const runningHoursText = engineHoursCalculation();
                    const hoursMatch =
                      runningHoursText.match(/(\d+) hrs (\d+) min/);
                    if (hoursMatch) {
                      const hours = parseInt(hoursMatch[1]);
                      const minutes = parseInt(hoursMatch[2]);
                      const totalHours = hours + minutes / 60;
                      if (totalHours > 0) {
                        const calculatedAvgSpeed = distanceKm / totalHours;
                        return `${calculatedAvgSpeed.toFixed(1)} km/h`;
                      }
                    }
                    return `${(
                      (summaryData?.averageSpeed || 0) * 1.852 || 0
                    ).toFixed(1)} km/h`;
                  })()}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons (keep as before) */}
          <View style={styles.bottomCardDivider} />
          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity
              style={styles.centerMapBtn}
              onPress={() => setShowDetails((prev) => !prev)}
            >
              <Text style={styles.centerMapBtnText}>
                {showDetails ? "Hide Details" : "View Details"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewReportsBtn}
              onPress={() =>
                router.push({
                  pathname: "/reports",
                  params: { deviceId: device?.deviceId },
                })
              }
            >
              <Text style={styles.viewReportsBtnText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Floating Map Options Menu - Left */}
      <View style={styles.floatingMenuLeft}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowTraffic((t) => !t)}
        >
          <MaterialIcons
            name="traffic"
            size={24}
            color={showTraffic ? "#43A047" : "#888"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCompass((c) => !c)}
        >
          <MaterialIcons
            name="explore"
            size={24}
            color={showCompass ? "#2979FF" : "#888"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setMapType("standard")}
        >
          <MaterialIcons
            name="map"
            size={24}
            color={mapType === "standard" ? "#FF7043" : "#888"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setMapType("satellite")}
        >
          <MaterialIcons
            name="satellite"
            size={24}
            color={mapType === "satellite" ? "#FFD600" : "#888"}
          />
        </TouchableOpacity>
      </View>

      {/* Floating Map Options Menu - Right */}
      <View style={styles.floatingMenuRight}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setMapType("terrain")}
        >
          <MaterialIcons
            name="terrain"
            size={24}
            color={mapType === "terrain" ? "#43A047" : "#888"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIs3DView(!is3DView)}
        >
          <MaterialIcons
            name="view-in-ar"
            size={24}
            color={is3DView ? "#9C27B0" : "#888"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            getPosition();
            fetchTodaySummary(device?.deviceId);
          }}
        >
          <MaterialIcons
            name="refresh"
            size={24}
            color="#2196F3"
          />
        </TouchableOpacity>
        {/* Speed Indicator */}
        <View style={styles.fabSpeed}>
          <Text style={styles.fabSpeedText}>
            {(Number(device?.speed) * 1.852 || 0).toFixed(0)}
          </Text>
          <Text style={styles.fabSpeedUnit}>km/h</Text>
        </View>
      </View>
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setShareModalVisible(false)}
        >
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 24,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 18, color: '#222' }}>Share Location</Text>
            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: '#43A047',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
              }}
              onPress={handleShareCurrentLocation}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Share Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: '#2979FF',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
              }}
              onPress={handleShareLiveLocation}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Share Live Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 18 }}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={{ color: '#2979FF', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 2,
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: "#BBDEFB",
    fontSize: 13,
    fontWeight: "600",
  },
  map: {
    flex: 1,
    width: "100%",
    zIndex: 1,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 30,
    zIndex: 100,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 18,
  },
  bottomCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  vehicleNumber: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#000000",
  },
  speedoWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  speedoText: {
    fontWeight: "bold",
    color: "#43A047",
    marginLeft: 4,
    fontSize: 16,
  },
  bottomCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    marginTop: 2,
  },
  bottomCardRowText: {
    color: "#444",
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  bottomCardDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 10,
  },
  statusIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  iconCircleActive: {
    backgroundColor: "#4285F4",
    borderColor: "#4285F4",
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  centerMapBtn: {
    flex: 1,
    backgroundColor: "#43A047",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
    shadowColor: "#43A047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  centerMapBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  viewReportsBtn: {
    flex: 1,
    backgroundColor: "#FF7043",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#FF7043",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  viewReportsBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  markerImage: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  statsCol: {
    flex: 1,
    alignItems: "center",
    padding: 5,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  statsValue: {
    fontWeight: "bold",
    fontSize: 10,
    color: "#000",
    marginTop: 2,
  },
  statsLabel: {
    fontSize: 9,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  statsDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 6,
  },
  floatingMenuLeft: {
    position: "absolute",
    top: 120,
    left: 16,
    zIndex: 5,
    alignItems: "center",
  },
  floatingMenuRight: {
    position: "absolute",
    top: 120,
    right: 16,
    zIndex: 5,
    alignItems: "center",
  },
  fab: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  fabSpeed: {
    backgroundColor: "#FF7043",
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  fabSpeedText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 2,
  },
  fabSpeedUnit: {
    color: "#fff",
    fontSize: 10,
    marginTop: -2,
  },
  statsColHighlight1: {
    backgroundColor: "#EBF5FB",
    borderColor: "#BBDEFB",
  },
  statsColHighlight2: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFECB3",
  },
  statsColHighlight3: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
  },
  statsColHighlight4: {
    backgroundColor: "#F3E5F5",
    borderColor: "#E1BEE7",
  },
  statsColHighlight5: {
    backgroundColor: "#E0F2F1",
    borderColor: "#B2DFDB",
  },
  statsColHighlight6: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  statsColHighlight7: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFE082",
  },
  statsColHighlight8: {
    backgroundColor: "#E1F5FE",
    borderColor: "#B3E5FC",
  },
  statsColHighlight9: {
    backgroundColor: "#F1F8E9",
    borderColor: "#DCEDC8",
  },
  statsIcon: {
    marginBottom: 2,
  },
});
