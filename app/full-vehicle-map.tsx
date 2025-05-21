// import Api from "@/config/Api";
// import { MaterialIcons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Dimensions,
//   Image,
//   Pressable,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import MapView, { Marker, PROVIDER_GOOGLE, Callout, Region } from "react-native-maps";
// import { SafeAreaView } from "react-native-safe-area-context";
// import * as Location from 'expo-location';
// import ClusteredMapView from 'react-native-maps-clustering';

// const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// const CLUSTER_THRESHOLD = 100; // Number of vehicles above which clustering is enabled

// interface Device {
//   id: string;
//   deviceId: string;
//   latitude: number;
//   longitude: number;
//   address?: string;
//   speed?: number;
//   attributes?: {
//     motion?: boolean;
//   };
//   deviceTime?: string;
//   valid?: boolean;
// }

// interface Cluster {
//   coordinate: {
//     latitude: number;
//     longitude: number;
//   };
//   bbox: {
//     latitudeDelta: number;
//     longitudeDelta: number;
//   };
// }

// export default function FullVehicleMapScreen() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard");
//   const [showTraffic, setShowTraffic] = useState(false);
//   const [is3D, setIs3D] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const mapRef = useRef<MapView | null>(null);

//   const getDevices = async () => {
//     try {
//       setError(null);
//       const response = await Api.call("/api/positions", "GET", {}, false);
//       if (response.data) {
//         // Filter out any devices without valid coordinates
//         const validDevices = response.data.filter((device: Device) => (
//           device && 
//           typeof device.latitude === 'number' && 
//           typeof device.longitude === 'number' &&
//           !isNaN(device.latitude) && 
//           !isNaN(device.longitude) &&
//           Math.abs(device.latitude) <= 90 && 
//           Math.abs(device.longitude) <= 180
//         ));
//         setDevices(validDevices);
//       }
//     } catch (error: any) {
//       console.error("Error fetching devices:", error);
//       setError(error?.message || "Failed to fetch devices");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     const setupMap = async () => {
//       try {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') {
//           setError('Location permission not granted');
//           return;
//         }
//       } catch (err: any) {
//         console.error("Error setting up location:", err);
//         setError(err?.message || "Failed to setup location");
//       }
//       getDevices();
//     };

//     setupMap();
//     const interval = setInterval(getDevices, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   const getVehicleIcon = (device: Device) => {
//     if (!device?.deviceTime) {
//       return require("@/assets/images/cars/white.png");
//     }
//     const lastUpdate = new Date(device.deviceTime);
//     const fourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 4);
//     if (lastUpdate < fourHoursAgo) {
//       return require("@/assets/images/cars/blue.png");
//     }
//     if (device.attributes?.motion === false) {
//       return require("@/assets/images/cars/orange.png");
//     }
//     return device.valid
//       ? require("@/assets/images/cars/green.png")
//       : require("@/assets/images/cars/red.png");
//   };

//   const renderMarker = (device: Device) => {
//     if (!device || !device.latitude || !device.longitude) return null;
    
//     return (
//       <Marker
//         key={device.id}
//         coordinate={{
//           latitude: Number(device.latitude),
//           longitude: Number(device.longitude),
//         }}
//         title={`Device ${device.deviceId}`}
//         description={`${device.address || 'No address'}\nSpeed: ${device.speed || 0} km/h\n${device.attributes?.motion ? 'Moving' : 'Stopped'}`}
//       >
//         <Image source={getVehicleIcon(device)} style={styles.markerImage} />
//       </Marker>
//     );
//   };

//   // Calculate the initial region based on device positions
//   const getInitialRegion = () => {
//     if (devices.length === 0) {
//       return {
//         latitude: 20.5937,
//         longitude: 78.9629,
//         latitudeDelta: 20,
//         longitudeDelta: 20,
//       };
//     }

//     let minLat = devices[0].latitude;
//     let maxLat = devices[0].latitude;
//     let minLng = devices[0].longitude;
//     let maxLng = devices[0].longitude;

//     devices.forEach(device => {
//       minLat = Math.min(minLat, device.latitude);
//       maxLat = Math.max(maxLat, device.latitude);
//       minLng = Math.min(minLng, device.longitude);
//       maxLng = Math.max(maxLng, device.longitude);
//     });

//     const centerLat = (minLat + maxLat) / 2;
//     const centerLng = (minLng + maxLng) / 2;
//     const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
//     const lngDelta = (maxLng - minLng) * 1.5;

//     return {
//       latitude: centerLat,
//       longitude: centerLng,
//       latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
//       longitudeDelta: Math.max(lngDelta, 0.01),
//     };
//   };

//   const toggleMapType = () => {
//     setMapType(current => {
//       switch (current) {
//         case "standard": return "satellite";
//         case "satellite": return "hybrid";
//         default: return "standard";
//       }
//     });
//   };

//   const getMapTypeIcon = () => {
//     switch (mapType) {
//       case "satellite": return "satellite";
//       case "hybrid": return "map";
//       default: return "layers";
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.backButton} 
//           onPress={() => router.back()}
//         >
//           <MaterialIcons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.title}>Full Vehicle Map</Text>
//       </View>

//       <View style={styles.mapContainer}>
//         {isLoading ? (
//           <View style={styles.loadingContainer}>
//             <Text style={styles.loadingText}>Loading vehicles...</Text>
//           </View>
//         ) : error ? (
//           <View style={styles.errorContainer}>
//             <Text style={styles.errorText}>{error}</Text>
//             <TouchableOpacity style={styles.retryButton} onPress={getDevices}>
//               <Text style={styles.retryText}>Retry</Text>
//             </TouchableOpacity>
//           </View>
//         ) : devices.length === 0 ? (
//           <View style={styles.loadingContainer}>
//             <Text style={styles.loadingText}>No vehicles found</Text>
//           </View>
//         ) : (
//           <>
//             {devices.length > CLUSTER_THRESHOLD ? (
//               <ClusteredMapView
//                 ref={mapRef}
//                 style={styles.map}
//                 provider={PROVIDER_GOOGLE}
//                 mapType={mapType}
//                 showsTraffic={showTraffic}
//                 initialRegion={getInitialRegion()}
//                 camera={is3D ? {
//                   center: getInitialRegion(),
//                   pitch: 45,
//                   heading: 0,
//                   altitude: 1000,
//                   zoom: 12,
//                 } : undefined}
//                 clusterColor="#007AFF"
//                 clusterTextColor="#ffffff"
//                 clusterBorderColor="#007AFF"
//                 clusterBorderWidth={4}
//                 spiralEnabled={true}
//                 onClusterPress={(cluster: Cluster) => {
//                   mapRef.current?.animateToRegion({
//                     latitude: cluster.coordinate.latitude,
//                     longitude: cluster.coordinate.longitude,
//                     latitudeDelta: Math.min(0.5, cluster.bbox.latitudeDelta * 1.5),
//                     longitudeDelta: Math.min(0.5, cluster.bbox.longitudeDelta * 1.5),
//                   });
//                 }}
//               >
//                 {devices.map((device) => renderMarker(device))}
//               </ClusteredMapView>
//             ) : (
//               <MapView
//                 ref={mapRef}
//                 style={styles.map}
//                 provider={PROVIDER_GOOGLE}
//                 mapType={mapType}
//                 showsTraffic={showTraffic}
//                 initialRegion={getInitialRegion()}
//                 camera={is3D ? {
//                   center: getInitialRegion(),
//                   pitch: 45,
//                   heading: 0,
//                   altitude: 1000,
//                   zoom: 12,
//                 } : undefined}
//               >
//                 {devices.map((device) => renderMarker(device))}
//               </MapView>
//             )}

//             <View style={styles.mapControls}>
//               <TouchableOpacity 
//                 style={styles.mapButton}
//                 onPress={toggleMapType}
//               >
//                 <MaterialIcons name={getMapTypeIcon()} size={24} color="#000" />
//               </TouchableOpacity>

//               <TouchableOpacity 
//                 style={[styles.mapButton, showTraffic && styles.activeButton]}
//                 onPress={() => setShowTraffic(!showTraffic)}
//               >
//                 <MaterialIcons name="traffic" size={24} color="#000" />
//               </TouchableOpacity>

//               <TouchableOpacity 
//                 style={[styles.mapButton, is3D && styles.activeButton]}
//                 onPress={() => setIs3D(!is3D)}
//               >
//                 <MaterialIcons name="3d-rotation" size={24} color="#000" />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.countOverlay}>
//               <Text style={styles.countText}>
//                 {devices.length} {devices.length === 1 ? 'Vehicle' : 'Vehicles'}
//               </Text>
//             </View>
//           </>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   backButton: {
//     marginRight: 16,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   mapContainer: {
//     flex: 1,
//     position: "relative",
//   },
//   map: {
//     flex: 1,
//   },
//   loadingContainer: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(255, 255, 255, 0.8)",
//     zIndex: 1,
//   },
//   loadingText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#000",
//   },
//   markerImage: {
//     width: 32,
//     height: 32,
//     resizeMode: "contain",
//   },
//   mapControls: {
//     position: 'absolute',
//     right: 16,
//     top: 16,
//     backgroundColor: 'white',
//     borderRadius: 8,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   mapButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   activeButton: {
//     backgroundColor: '#e0e0e0',
//   },
//   countOverlay: {
//     position: 'absolute',
//     left: 16,
//     top: 16,
//     backgroundColor: 'white',
//     padding: 8,
//     borderRadius: 8,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   countText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#000',
//   },
//   errorContainer: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(255, 255, 255, 0.8)",
//     zIndex: 1,
//   },
//   errorText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "red",
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   retryButton: {
//     backgroundColor: "#007AFF",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   retryText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });