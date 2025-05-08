import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Card, Paragraph, Title, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const theme = useTheme();
  const [devicesData, setDevicesData] = useState<any[]>([]);
  const [groupsData, setGroupsData] = useState([]);
  const [vehicleStats, setVehicleStats] = useState([
    { label: 'Running', count: 0, color: '#00E676' },
    { label: 'Stopped', count: 0, color: '#FF1744' },
    { label: 'Idle', count: 0, color: '#FFD600' },
    { label: 'No Data', count: 0, color: '#2979FF' },
  ]);

  useEffect(() => {
    getDevicesCount();
    getGroupsCount();
  }, []);

  useEffect(() => {
    if (devicesData?.length > 0) {
      updateVehicleStats();
    }
  }, [devicesData]);

  const updateVehicleStats = () => {
    const stats = [
      { label: 'Running', count: 0, color: '#00E676' },
      { label: 'Stopped', count: 0, color: '#FF1744' },
      { label: 'Idle', count: 0, color: '#FFD600' },
      { label: 'No Data', count: 0, color: '#2979FF' },
    ];

    devicesData.forEach(device => {
      if (device.status === 'online') {
        if (device.attributes.is_parked) {
          stats[1].count++;
        } else {
          stats[0].count++; 
        }
      } else if (device.status === 'offline') {
        stats[2].count++; 
      } else {
        stats[3].count++; 
      }
    });

    setVehicleStats(stats);
  };

  const getDevicesCount = async () => {
    const response = await Api.call('/api/devices', 'GET', {}, '');
    setDevicesData(response.data);
  }

  const getGroupsCount = async () => {
    const response = await Api.call('/api/groups', 'GET', {}, '');
    setGroupsData(response.data);
  }

  const pieData = vehicleStats.map(stat => ({
    name: stat.label,
    population: stat.count,
    color: stat.color,
    legendFontColor: '#222',
    legendFontSize: 16,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.blackHeader}>
        <Text style={styles.blackHeaderText}>Dashboard</Text>
      </View>
      <ScrollView>
        {/* <Title style={styles.header}>Fleet Dashboard</Title> */}
        <View style={styles.cardGrid}>
          <View style={styles.cardRow}>
            {vehicleStats.slice(0, 2).map((stat: any, idx: number) => (
              <Card key={stat.label + idx} style={[styles.statCard, { backgroundColor: stat.color + 'CC' }]}>
                <Card.Content>
                  <Title style={{ color: '#fff', fontWeight: 'bold' }}>{stat.count}</Title>
                  <Paragraph style={{ color: '#fff', fontWeight: 'bold' }}>{stat.label}</Paragraph>
                </Card.Content>
              </Card>
            ))}
          </View>
          <View style={styles.cardRow}>
            {vehicleStats.slice(2, 4).map(stat => (
              <Card key={stat.label} style={[styles.statCard, { backgroundColor: stat.color + 'CC' }]}>
                <Card.Content>
                  <Title style={{ color: '#fff', fontWeight: 'bold' }}>{stat.count}</Title>
                  <Paragraph style={{ color: '#fff', fontWeight: 'bold' }}>{stat.label}</Paragraph>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>
        <Card style={styles.chartCard}>
          <Card.Title title="Vehicle Status Distribution" titleStyle={{ color: '#FF1744', fontWeight: 'bold' }} />
          <PieChart
            data={pieData}
            width={screenWidth - 32}
            height={180}
            chartConfig={{
              color: (opacity = 1) => `rgba(255,23,68,${opacity})`,
            }}
            accessor={'population'}
            backgroundColor={'transparent'}
            paddingLeft={'15'}
            absolute
          />
        </Card>
        {/* Recent Devices */}
        <Card style={styles.listCard}>
          <Card.Title title="Recent Devices" titleStyle={styles.listTitle} />
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeader}>NAME</Text>
            <Text style={styles.listHeader}>STATUS</Text>
          </View>
          {devicesData?.length > 0 && devicesData?.slice(0, 5)?.map((device: any, idx: number) => (
            <View key={device.name + idx} style={[styles.listRow, idx !== devicesData?.length - 1 && styles.listRowBorder]}>
              <View style={styles.listLeft}>
                <View style={styles.deviceIconCircle}>
                  <MaterialIcons name="local-shipping" size={24} color="#fff" style={{}} />
                </View>
                <Text style={styles.deviceName}>{device.name}</Text>
              </View>
              <View style={[styles.statusBadge, device.status === 'online' ? styles.online : styles.offline]}>
                <View style={[styles.statusDot, device.status === 'online' ? styles.onlineDot : styles.offlineDot]} />
                <Text style={[styles.statusText, device.status === 'online' ? styles.onlineText : styles.offlineText]}>{device.status}</Text>
              </View>
            </View>
          ))}
        </Card>
        {/* Groups */}
        <Card style={styles.listCard}>
          <Card.Title title="Groups" titleStyle={styles.listTitle} />
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeader}>NAME</Text>
          </View>
          {groupsData?.length > 0 && groupsData?.map((group: any, idx: number) => (
            <View key={group.name} style={[styles.listRow, idx !== groupsData?.length - 1 && styles.listRowBorder]}>
              <View style={styles.listLeft}>
                <View style={styles.groupIconCircle}>
                  <MaterialIcons name="layers" size={22} color="#fff" />
                </View>
                <Text style={styles.deviceName}>{group.name}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    alignSelf: 'center',
    color: '#00B8D4',
  },
  cardGrid: {
    marginHorizontal: 8,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  chartCard: {
    margin: 8,
    borderRadius: 16,
    elevation: 4,
    paddingBottom: 8,
  },
  listCard: {
    margin: 8,
    borderRadius: 16,
    elevation: 4,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  listTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#222',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  listHeader: {
    fontWeight: '600',
    color: '#888',
    fontSize: 13,
    letterSpacing: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2979FF', // fallback for RN
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#536DFE',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 70,
    justifyContent: 'center',
  },
  online: {
    backgroundColor: '#E6F9ED',
  },
  offline: {
    backgroundColor: '#F2F3F5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#00C853',
  },
  offlineDot: {
    backgroundColor: '#B0BEC5',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  onlineText: {
    color: '#00C853',
  },
  offlineText: {
    color: '#888',
  },
  typeBadge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parent: {
    backgroundColor: '#E3E8FF',
  },
  child: {
    backgroundColor: '#F3E8FF',
  },
  typeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  parentText: {
    color: '#3D5AFE',
  },
  childText: {
    color: '#A259FF',
  },
  blackHeader: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackHeaderText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
