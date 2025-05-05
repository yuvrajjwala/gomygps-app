import Api from '@/config/Api';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const statusFilters = [
  { label: 'All', color: '#2979FF', icon: 'apps' },
  { label: 'Running', color: '#43A047', icon: 'autorenew' },
  { label: 'Stop', color: '#90A4AE', icon: 'stop-circle' },
  { label: 'Idle', color: '#FFD600', icon: 'show-chart' },
];

export default function VehiclesScreen() {
  const cardColors = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'];
  const router = useRouter();
  const [devicesData, setDevicesData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
    const isFocused = useIsFocused();

  useEffect(() => {
    getDevices();
    const interval = setInterval(() => {
      if (isFocused) {
        getDevices();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getDevices = async () => {
    try {
      const [responseDevices, responsePositions] = await Promise.all([
        Api.call('/api/devices', 'GET', {}, ''),
        Api.call('/api/positions', 'GET', {}, '')
      ]);
      setDevicesData(responseDevices.data.map((device: any) => ({
        ...device,
        ...responsePositions.data.find((position: any) => position.deviceId === device.id)
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const getDeviceStatus = (device: any) => {
    if (device?.attributes?.motion) return 'Running';
    if (device?.attributes?.ignition) return 'Idle';
    return 'Stop';
  };

  const filteredDevices = useMemo(() => {
    return devicesData.filter((device: any) => {
      const matchesSearch = device?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device?.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'All' || getDeviceStatus(device) === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [devicesData, searchQuery, selectedFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: devicesData.length,
      Running: 0,
      Stop: 0,
      Idle: 0
    };

    devicesData.forEach((device: any) => {
      const status = getDeviceStatus(device);
      counts[status]++;
    });

    return counts;
  }, [devicesData]);

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
            <Text style={[styles.speedoText, { color: index % 2 === 0 ? '#2979FF' : '#43A047' }]}>{(device?.speed || 0).toFixed(0)}</Text>
          </View>
        </View>
        <View style={styles.vehicleCardRow}>
          <MaterialIcons name="event" size={18} color="#FFD600" style={{ marginRight: 6 }} />
          <Text style={styles.vehicleCardRowText}>{moment(device?.lastUpdate).format('DD/MM/YYYY HH:mm')}</Text>
        </View>
        <View style={styles.vehicleCardRow}>
          <MaterialIcons name="location-on" size={18} color="#2979FF" style={{ marginRight: 6 }} />
          <Text style={styles.vehicleCardRowText}>{device?.address}</Text>
        </View>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statsBoxRow}>
            <MaterialIcons name="speed" size={20} color={device?.attributes?.ignition ? "#FF9800" : "#90A4AE"} style={{ marginRight: 4 }} />
            <Text style={[styles.statsValue, { color: device?.attributes?.ignition ? "#FF9800" : "#90A4AE" }]}>
              {device?.attributes?.ignition ? "On" : "Off"}
            </Text>
          </View>
          <View style={styles.statsBoxRow}>
            <MaterialIcons name="alt-route" size={20} color={device?.attributes?.motion ? "#43A047" : "#90A4AE"} style={{ marginRight: 4 }} />
            <Text style={[styles.statsValue, { color: device?.attributes?.motion ? "#43A047" : "#90A4AE" }]}>
              {device?.attributes?.motion ? "Moving" : "Stopped"}
            </Text>
          </View>
          <View style={styles.statsBoxRow}>
            <MaterialIcons name="trending-up" size={20} color="#2979FF" style={{ marginRight: 4 }} />
            <Text style={[styles.statsValue, { color: '#2979FF' }]}>{(device?.attributes?.totalDistance / 1000 || 0).toFixed(0)} KM</Text>
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
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            onPress={() => setSelectedFilter(filter.label)}
            style={[
              styles.statusCard,
              filter.label === 'Idle'
                ? { backgroundColor: '#FF6F00' }
                : { backgroundColor: filter.color, shadowColor: filter.color },
              selectedFilter === filter.label && { borderWidth: 2, borderColor: '#fff' }
            ]}
          >
            <MaterialIcons
              name={filter.icon as any}
              size={22}
              color="#fff"
              style={{ marginBottom: 4 }}
            />
            <Text style={styles.statusLabel}>{filter.label}</Text>
            <Text style={styles.statusCount}>{filterCounts[filter.label]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={22} color="#888" style={{ marginLeft: 8 }} />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={22} color="#888" style={{ marginRight: 8 }} />
        </TouchableOpacity>
      </View>
      {/* Vehicle Cards */}
      <FlatList
        data={filteredDevices}
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
    paddingHorizontal: 15,
  },
  statsBox: {
    flex: 1,
    alignItems: 'center',
  },
  statsBoxRow: {
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