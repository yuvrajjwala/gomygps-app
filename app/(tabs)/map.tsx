import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  let params: Record<string, any> = {};
  try {
    params = useLocalSearchParams();
  } catch (e) {
    params = {};
  }
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vehicle = {
    ...fallbackVehicle,
    ...params,
    lat: params.lat ? Number(params.lat) : fallbackVehicle.lat,
    lng: params.lng ? Number(params.lng) : fallbackVehicle.lng,
    speed: params.speed ? Number(params.speed) : fallbackVehicle.speed,
  };
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);
  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />, []
  );

  // Keep bottom sheet open from start
  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

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
        initialRegion={{
          latitude: vehicle.lat,
          longitude: vehicle.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* <Marker coordinate={{ latitude: vehicle.lat, longitude: vehicle.lng }}>
          <MaterialIcons name="directions-car" size={36} color="#43A047" style={{ backgroundColor: '#fff', borderRadius: 18, padding: 2 }} />
        </Marker> */}
      </MapView>
      {/* Modern Bottom Sheet */}
      <View style={[styles.sheetModern, { paddingBottom: 18 + insets.bottom }]}> {/* Modern bottom sheet */}
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.carNumberModern}>{vehicle.number}</Text>
          <Text style={styles.carAddressModern}>{vehicle.address}</Text>
        </View>
        <View style={styles.dividerModern} />
        {/* Icon Row in Card */}
        <View style={styles.iconRowCard}>
          <MaterialIcons name="local-parking" size={26} color="#1de9b6" style={styles.iconRowIconModern} />
          <MaterialIcons name="lock" size={26} color="#ff7043" style={styles.iconRowIconModern} />
          <MaterialIcons name="ac-unit" size={26} color="#00bcd4" style={styles.iconRowIconModern} />
          <MaterialIcons name="directions-car" size={26} color="#43a047" style={styles.iconRowIconModern} />
          <MaterialIcons name="build" size={26} color="#43a047" style={styles.iconRowIconModern} />
          <MaterialIcons name="signal-cellular-alt" size={26} color="#43a047" style={styles.iconRowIconModern} />
        </View>
        <View style={styles.dividerModern} />
        {/* Stats Grid: 2 columns, stat cards */}
        <View style={styles.statsGridModern}>
          {/* Row 1 */}
          <View style={styles.statsRowModern}>
            <View style={styles.statCardModern}>
              <MaterialIcons name="access-time" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>3 Dec 21, 02:39 PM</Text>
                <Text style={styles.statLabelModern}>Ping Time</Text>
              </View>
            </View>
            <View style={styles.statCardModern}>
              <MaterialIcons name="timer" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>4h 38m</Text>
                <Text style={styles.statLabelModern}>Stopped Since</Text>
              </View>
            </View>
          </View>
          {/* Row 2 */}
          <View style={styles.statsRowModern}>
            <View style={styles.statCardModern}>
              <MaterialIcons name="speed" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>225h: 38m</Text>
                <Text style={styles.statLabelModern}>Total Engine</Text>
              </View>
            </View>
            <View style={styles.statCardModern}>
              <MaterialIcons name="speed" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>42 kmh</Text>
                <Text style={styles.statLabelModern}>Avg Speed</Text>
              </View>
            </View>
          </View>
          {/* Row 3 */}
          <View style={styles.statsRowModern}>
            <View style={styles.statCardModern}>
              <MaterialIcons name="map" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>2344.93 km</Text>
                <Text style={styles.statLabelModern}>Total Distance</Text>
              </View>
            </View>
            <View style={styles.statCardModern}>
              <MaterialIcons name="speed" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>57 kmh</Text>
                <Text style={styles.statLabelModern}>Today Max Speed</Text>
              </View>
            </View>
          </View>
          {/* Row 4 */}
          <View style={styles.statsRowModern}>
            <View style={styles.statCardModern}>
              <MaterialIcons name="stop" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>14h: 07m</Text>
                <Text style={styles.statLabelModern}>Today Stopped</Text>
              </View>
            </View>
            <View style={styles.statCardModern}>
              <MaterialIcons name="play-arrow" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>00h: 25m</Text>
                <Text style={styles.statLabelModern}>Today Running</Text>
              </View>
            </View>
          </View>
          {/* Row 5 */}
          <View style={styles.statsRowModern}>
            <View style={styles.statCardModern}>
              <MaterialIcons name="pause" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>00h: 02m</Text>
                <Text style={styles.statLabelModern}>Today Idle</Text>
              </View>
            </View>
            <View style={styles.statCardModern}>
              <MaterialIcons name="power" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>00h: 30m</Text>
                <Text style={styles.statLabelModern}>Today Ignition On</Text>
              </View>
            </View>
          </View>
          {/* Row 6 */}
          <View style={styles.statsRowModern}>
            <View style={styles.statCardModern}>
              <MaterialIcons name="speed" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>0 kmh</Text>
                <Text style={styles.statLabelModern}>Speed</Text>
              </View>
            </View>
            <View style={styles.statCardModern}>
              <MaterialIcons name="ac-unit" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>00h: 00m</Text>
                <Text style={styles.statLabelModern}>Today AC Off</Text>
              </View>
            </View>
          </View>
          {/* Row 7 */}
          <View style={styles.statsRowModern}>
            <View style={styles.statCardModern}>
              <MaterialIcons name="ac-unit" size={20} color="#1976d2" style={styles.statIconModern} />
              <View style={styles.statTextModern}>
                <Text style={styles.statValueModern}>14h: 39m</Text>
                <Text style={styles.statLabelModern}>Today AC On</Text>
              </View>
            </View>
            <View style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  map: {
    flex: 1,
    width: '100%',
    zIndex: 1,
  },
  sheetModern: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  carNumberModern: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 2,
  },
  carAddressModern: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  dividerModern: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
    width: '100%',
  },
  iconRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconRowIconModern: {
    marginHorizontal: 4,
  },
  statsGridModern: {
    marginTop: 8,
  },
  statsRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCardModern: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconModern: {
    marginRight: 8,
  },
  statTextModern: {
    flex: 1,
  },
  statValueModern: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  statLabelModern: {
    color: '#888',
    fontSize: 13,
  },
}); 