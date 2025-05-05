import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicle = params;

  // Example fallback data for demo
  const data = {
    number: vehicle?.name || 'UP15CX3953',
    address: vehicle?.address || 'Global International Academy, Dhana-Buxer, Road, Simbhali, Uttar Pradesh (SW)',
    pingTime: vehicle?.lastUpdate || '3 Dec 21, 02:39 PM',
    stoppedSince: '4h 38m',
    totalEngine: '225h: 38m',
    avgSpeed: '42 kmh',
    totalDistance: '2344.93 km',
    todayMaxSpeed: '57 kmh',
    todayStopped: '14h: 07m',
    todayRunning: '00h: 25m',
    todayIdle: '00h: 02m',
    todayIgnitionOn: '00h: 30m',
    speed: '0 kmh',
    todayACOff: '00h: 00m',
    todayACOn: '14h: 39m',
  };

  const stats = [
    [
      { icon: 'access-time', label: 'Ping Time', value: data.pingTime },
      { icon: 'timer', label: 'Stopped Since', value: data.stoppedSince },
    ],
    [
      { icon: 'av-timer', label: 'Total Engine', value: data.totalEngine },
      { icon: 'speed', label: 'Avg Speed', value: data.avgSpeed },
    ],
    [
      { icon: 'map', label: 'Total Distance', value: data.totalDistance },
      { icon: 'speed', label: 'Today Max Speed', value: data.todayMaxSpeed },
    ],
    [
      { icon: 'stop', label: 'Today Stopped', value: data.todayStopped },
      { icon: 'play-arrow', label: 'Today Running', value: data.todayRunning },
    ],
    [
      { icon: 'pause', label: 'Today Idle', value: data.todayIdle },
      { icon: 'power', label: 'Today Ignition On', value: data.todayIgnitionOn },
    ],
    [
      { icon: 'speed', label: 'Speed', value: data.speed },
      { icon: 'ac-unit', label: 'Today AC Off', value: data.todayACOff },
    ],
    [
      { icon: 'ac-unit', label: 'Today AC On', value: data.todayACOn },
      { icon: '', label: '', value: '' },
    ],
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#2979FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vehicle Number and Address */}
        <Text style={styles.vehicleNumber}>{data.number}</Text>
        <Text style={styles.vehicleAddress}>{data.address}</Text>
        {/* Status Icon Row */}
        <View style={styles.statusIconRowColorful}>
          <View style={[styles.statusIconCircle, { backgroundColor: '#E3FCEC' }]}> {/* Green */}
            <MaterialIcons name="local-parking" size={28} color="#43A047" />
          </View>
          <View style={[styles.statusIconCircle, { backgroundColor: '#FFEAEA' }]}> {/* Red */}
            <MaterialIcons name="lock" size={28} color="#E53935" />
          </View>
          <View style={[styles.statusIconCircle, { backgroundColor: '#E0F7FA' }]}> {/* Cyan */}
            <MaterialIcons name="ac-unit" size={28} color="#00B8D4" />
          </View>
          <View style={[styles.statusIconCircle, { backgroundColor: '#E3FCEC' }]}> {/* Green */}
            <MaterialIcons name="directions-car" size={28} color="#43A047" />
          </View>
          <View style={[styles.statusIconCircle, { backgroundColor: '#FFF8E1' }]}> {/* Yellow */}
            <MaterialIcons name="build" size={28} color="#FFD600" />
          </View>
          <View style={[styles.statusIconCircle, { backgroundColor: '#E3F2FD' }]}> {/* Blue */}
            <MaterialIcons name="signal-cellular-alt" size={28} color="#2979FF" />
          </View>
        </View>
        {/* Stats Grid */}
        <View style={styles.statsGridColorful}>
          {stats.map((row, i) => (
            <View style={styles.statsRowColorful} key={i}>
              {row.map((stat, j) => (
                <View
                  style={[
                    styles.statsCardColorful,
                    { backgroundColor: colorfulCardColors[(i * 2 + j) % colorfulCardColors.length], shadowColor: colorfulCardColors[(i * 2 + j) % colorfulCardColors.length] }
                  ]}
                  key={j}
                >
                  {stat.icon ? (
                    <MaterialIcons name={stat.icon as any} size={22} color="#fff" style={{ marginBottom: 6 }} />
                  ) : null}
                  <Text style={styles.statsValueColorful}>{stat.value}</Text>
                  <Text style={styles.statsLabelColorful}>{stat.label}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        {/* Back to Map Button */}
        <TouchableOpacity style={styles.backBtnColorful} onPress={() => router.back()}>
          <MaterialIcons name="map" size={20} color="#fff" />
          <Text style={styles.backBtnTextColorful}>Back to Map</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const colorfulCardColors = [
  '#2979FF', // blue
  '#00B8D4', // cyan
  '#43A047', // green
  '#FFD600', // yellow
  '#FF7043', // orange
  '#AB47BC', // purple
  '#FF1744', // red
  '#00E676', // light green
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  vehicleNumber: {
    color: '#2979FF',
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 8,
    letterSpacing: 1,
  },
  vehicleAddress: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
    fontWeight: '600',
  },
  statusIconRowColorful: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 4,
    marginBottom: 22,
    marginTop: 2,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  statsGridColorful: {
    marginTop: 2,
    marginBottom: 18,
  },
  statsRowColorful: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statsCardColorful: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    backgroundColor: '#2979FF',
  },
  statsValueColorful: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  statsLabelColorful: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.85,
    fontWeight: '600',
  },
  backBtnColorful: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7043',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 10,
    alignSelf: 'center',
    width: '80%',
    shadowColor: '#FF7043',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtnTextColorful: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
}); 