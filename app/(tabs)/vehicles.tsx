import Api from '@/config/Api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const statusFilters = [
  { label: 'All', color: '#2979FF', icon: 'apps' },
  { label: 'Running', color: '#43A047', icon: 'autorenew' },
  { label: 'Stop', color: '#90A4AE', icon: 'stop-circle' },
  { label: 'Idle', color: '#FFD600', icon: 'show-chart' },
];

// Car images
const carImages = {
  Running: require('@/assets/images/cars/car-green.png'),
  Idle: require('@/assets/images/cars/car-orange.png'),
  Stop: require('@/assets/images/cars/car-red.png'),
  Default: require('@/assets/images/cars/car-blue.png'),
};

export default function VehiclesScreen() {
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
    if (!isFocused) return;
    console.log('isFocused',isFocused);
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

  const renderVehicleCard = ({ item: device, index }: { item: any; index: number }) => {
    // Determine vehicle icon and color
    const isTruck = device?.category === 'truck';
    const vehicleIcon = isTruck ? 'local-shipping' : 'directions-car';
    const vehicleColor = isTruck ? '#F44336' : (index % 2 === 0 ? '#F44336' : '#FFA726');
    // Vehicle number color
    const vehicleNumberColor = '#2EAD4B';
    // Icon row colors
    const iconColors = [
      '#EF5350', // key - red
      '#EF5350', // lock - red
      '#29B6F6', // ac-unit - sky blue
      '#FFB74D', // local-gas-station - orange (a bit darker)
      '#66BB6A', // battery-full - green
    ];
    const iconNames = [
      'vpn-key', 'lock', 'ac-unit', 'local-gas-station', 'battery-full',
    ];
    return (
      <TouchableOpacity
        key={device.id + index}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/map', params: { ...device } })}
      >
        <View style={styles.vehicleCardNew}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch' }}>
            {/* Left: Icon and Info */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.vehicleIconWrap}>
                <Image
                  source={carImages[getDeviceStatus(device)] || carImages.Default}
                  style={{ width: 72, height: 72, marginRight: 20, resizeMode: 'contain' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vehicleNumberNew, { color: vehicleNumberColor }]}>{device?.name}</Text>
                <View style={{ height: 8 }} />
                <Text style={styles.vehicleAddressNew}>{device?.address}</Text>
                <Text style={styles.vehicleDateNew}>{moment(device?.lastUpdate).format('D MMM YY, hh:mm A')}</Text>
              </View>
            </View>
            {/* Right: Stats */}
            <View style={styles.statsColNew}>
              <View style={styles.statRowCompact}>
                <Text style={styles.statValueNew}>{(device?.speed || 0).toFixed(0)}</Text>
                <Text style={styles.statUnitNew}> kmh</Text>
              </View>
              <Text style={styles.statLabelNew}>Speed</Text>
              <View style={styles.statRowCompact}>
                <Text style={styles.statValueNew}>{((device?.attributes?.totalDistance || 0) / 1000).toFixed(0)}</Text>
                <Text style={styles.statUnitNew}> km</Text>
              </View>
              <Text style={styles.statLabelNew}>Distance</Text>
            </View>
          </View>
          {/* Bottom Icon Row */}
          <View style={styles.iconRowNew}>
            {iconNames.map((icon, i) => (
              <MaterialIcons
                key={icon + i}
                name={icon as any}
                size={22}
                color={iconColors[i]}
                style={{ marginHorizontal: 4 }}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
  vehicleCardNew: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 6,
    marginBottom: 6,
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  vehicleNumberNew: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 1,
  },
  vehicleAddressNew: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 1,
  },
  vehicleDateNew: {
    color: '#888',
    fontSize: 10,
    fontWeight: '400',
    marginBottom: 1,
  },
  statsColNew: {
    alignItems: 'flex-end',
    minWidth: 38,
    marginLeft: 4,
    marginTop: 0,
  },
  statRowCompact: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  statValueNew: {
    color: '#2EAD4B',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'right',
    marginBottom: 0,
  },
  statUnitNew: {
    color: '#2EAD4B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 0,
  },
  statLabelNew: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 0,
  },
  iconRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
    marginLeft: 0,
    paddingLeft: 100,
  },
  vehicleIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginRight: 10,
    marginTop: 30,
  },
}); 