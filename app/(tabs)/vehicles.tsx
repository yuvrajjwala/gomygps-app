import Api from '@/config/Api';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const statusFilters = [
  { label: 'All', count: 5, color: '#2979FF', icon: 'apps' },
  { label: 'Running', count: 3, color: '#43A047', icon: 'autorenew' },
  { label: 'Stop', count: 1, color: '#90A4AE', icon: 'stop-circle' },
  { label: 'Idle', count: 1, color: '#FFD600', icon: 'show-chart' },
];


export default function VehiclesScreen() {
  const cardColors = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'];
  const router = useRouter();
  const [devicesData, setDevicesData] = useState([]);

  useEffect(() => {
    getDevices();
  }, []);

  const getDevices = async () => {
    const response = await Api.call('/api/devices', 'GET', {}, '');
    setDevicesData(response.data);
  }

  const renderVehicleCard = ({ item: device, index }: { item: any; index: number }) => (
    <TouchableOpacity
      key={device.id + index}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/map', params: { ...device } })}
    >
      <View
        style={[
          styles.vehicleCard,
          styles.vehicleCardShadow,
          { backgroundColor: cardColors[index % cardColors.length] },
        ]}
      >
        <View style={styles.vehicleCardHeader}>
          <View style={styles.vehicleNumberRow}>
            <MaterialIcons name="directions-car" size={22} color={index % 2 === 0 ? '#2979FF' : '#43A047'} style={{ marginRight: 8 }} />
            <Text style={[styles.vehicleNumber, { color: index % 2 === 0 ? '#2979FF' : '#43A047' }]}>{device?.name}</Text>
          </View>
          <View style={[styles.speedoWrap, { backgroundColor: index % 2 === 0 ? '#2979FF22' : '#43A04722' }]}>
            <FontAwesome5 name="tachometer-alt" size={18} color={index % 2 === 0 ? '#2979FF' : '#43A047'} />
            <Text style={[styles.speedoText, { color: index % 2 === 0 ? '#2979FF' : '#43A047' }]}>{device?.attributes?.speed || 0}</Text>
          </View>
        </View>
        <View style={styles.vehicleCardRow}>
          <MaterialIcons name="event" size={18} color="#FFD600" style={{ marginRight: 6 }} />
          <Text style={styles.vehicleCardRowText}>{device?.lastUpdate}</Text>
        </View>
        <View style={styles.vehicleCardRow}>
          <MaterialIcons name="location-on" size={18} color="#2979FF" style={{ marginRight: 6 }} />
          <Text style={styles.vehicleCardRowText}>{device?.attributes?.address}</Text>
        </View>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statsBoxRow}>
            <MaterialIcons name="speed" size={20} color="#FF9800" style={{ marginRight: 4 }} />
            <Text style={[styles.statsValue, { color: '#FF9800' }]}>{device?.attributes?.odometer}</Text>
          </View>
          <View style={styles.statsBoxRow}>
            <MaterialIcons name="alt-route" size={20} color="#43A047" style={{ marginRight: 4 }} />
            <Text style={[styles.statsValue, { color: '#43A047' }]}>{device?.attributes?.totalDistance}</Text>
          </View>
          <View style={styles.statsBoxRow}>
            <MaterialIcons name="trending-up" size={20} color="#2979FF" style={{ marginRight: 4 }} />
            <Text style={[styles.statsValue, { color: '#2979FF' }]}>{device?.attributes?.lastSpeed}</Text>
          </View>
        </View>
        <View style={styles.vehicleCardDivider} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Status Filters */}
      <View style={styles.statusRow}>
        {statusFilters.map((filter, idx) => (
          <View
            key={filter.label}
            style={[
              styles.statusCard,
              filter.label === 'Idle'
                ? { backgroundColor: '#FF6F00' } // dark orange
                : { backgroundColor: filter.color, shadowColor: filter.color },
            ]}
          >
            <MaterialIcons
              name={filter.icon as any}
              size={22}
              color={filter.label === 'Idle' ? '#fff' : '#fff'}
              style={{ marginBottom: 4 }}
            />
            <Text style={styles.statusLabel}>{filter.label}</Text>
            <Text style={styles.statusCount}>{filter.count}</Text>
          </View>
        ))}
      </View>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={22} color="#888" style={{ marginLeft: 8 }} />
        <TextInput placeholder="Search" placeholderTextColor="#888" style={styles.searchInput} />
        <TouchableOpacity>
          <Ionicons name="options-outline" size={22} color="#888" style={{ marginRight: 8 }} />
        </TouchableOpacity>
      </View>
      {/* Vehicle Cards */}
      <FlatList
        data={devicesData}
        renderItem={renderVehicleCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  statusLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  statusCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 16,
    elevation: 1,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    marginLeft: 8,
  },
  vehicleCard: {
    borderRadius: 20,
    marginHorizontal: 12,
    marginBottom: 20,
    padding: 18,
    minHeight: 140,
    justifyContent: 'center',
  },
  vehicleCardShadow: {
    elevation: 6,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vehicleNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleNumber: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#2979FF',
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
  vehicleCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  vehicleCardRowText: {
    color: '#444',
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  statsBox: {
    flex: 1,
    alignItems: 'center',
  },
  statsBoxRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsValue: {
    color: '#2979FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  vehicleCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
}); 