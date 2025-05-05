import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Card, Paragraph, Title, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

const vehicleStats = [
  { label: 'Running', count: 120, color: '#00E676' }, // Vibrant Green
  { label: 'Stopped', count: 45, color: '#FF1744' }, // Vibrant Red
  { label: 'Idle', count: 30, color: '#FFD600' }, // Vibrant Yellow
  { label: 'No Data', count: 10, color: '#2979FF' }, // Vibrant Blue
];

const pieData = vehicleStats.map(stat => ({
  name: stat.label,
  population: stat.count,
  color: stat.color,
  legendFontColor: '#222',
  legendFontSize: 16,
}));

const devices = [
  { name: 'HR38AE2205', status: 'Online' },
  { name: 'TN12AX9880', status: 'Offline' },
  { name: 'KA05AK7893', status: 'Online' },
  { name: 'KA05AK6882', status: 'Online' },
  { name: 'KA05AK6883', status: 'Online' },
];

const groups = [
  { name: 'Group 1', type: 'Parent' },
  { name: 'child group', type: 'Child' },
];

export default function DashboardScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.blackHeader}>
        <Text style={styles.blackHeaderText}>Dashboard</Text>
      </View>
      <ScrollView>
        <Title style={styles.header}>Fleet Dashboard</Title>
        <View style={styles.cardGrid}>
          <View style={styles.cardRow}>
            {vehicleStats.slice(0, 2).map(stat => (
              <Card key={stat.label} style={[styles.statCard, { backgroundColor: stat.color + 'CC' }]}> 
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
          {devices.map((device, idx) => (
            <View key={device.name} style={[styles.listRow, idx !== devices.length - 1 && styles.listRowBorder]}> 
              <View style={styles.listLeft}>
                <View style={styles.deviceIconCircle}>
                  <MaterialIcons name="local-shipping" size={24} color="#fff" style={{}} />
                </View>
                <Text style={styles.deviceName}>{device.name}</Text>
              </View>
              <View style={[styles.statusBadge, device.status === 'Online' ? styles.online : styles.offline]}>
                <View style={[styles.statusDot, device.status === 'Online' ? styles.onlineDot : styles.offlineDot]} />
                <Text style={[styles.statusText, device.status === 'Online' ? styles.onlineText : styles.offlineText]}>{device.status}</Text>
              </View>
            </View>
          ))}
        </Card>
        {/* Groups */}
        <Card style={styles.listCard}>
          <Card.Title title="Groups" titleStyle={styles.listTitle} />
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeader}>NAME</Text>
            <Text style={styles.listHeader}>TYPE</Text>
          </View>
          {groups.map((group, idx) => (
            <View key={group.name} style={[styles.listRow, idx !== groups.length - 1 && styles.listRowBorder]}> 
              <View style={styles.listLeft}>
                <View style={styles.groupIconCircle}>
                  <MaterialIcons name="layers" size={22} color="#fff" />
                </View>
                <Text style={styles.deviceName}>{group.name}</Text>
              </View>
              <View style={[styles.typeBadge, group.type === 'Parent' ? styles.parent : styles.child]}>
                <Text style={[styles.typeText, group.type === 'Parent' ? styles.parentText : styles.childText]}>{group.type}</Text>
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
    backgroundColor: '#000',
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackHeaderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
