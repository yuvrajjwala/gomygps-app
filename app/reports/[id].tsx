import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReportData {
  [key: string]: string;
}

interface Report {
  id: number;
  title: string;
  date: string;
  type: string;
  data: ReportData[];
}

// This would typically come from an API
const reports: Report[] = [
  {
    id: 1,
    title: 'Route Report',
    date: '2024-03-20',
    type: 'route',
    data: [
      { route: 'Route 1', distance: '150 km', duration: '2h 30m', stops: '3', fuel: '25 L' },
      { route: 'Route 2', distance: '200 km', duration: '3h 15m', stops: '4', fuel: '35 L' },
      { route: 'Route 3', distance: '180 km', duration: '2h 45m', stops: '2', fuel: '30 L' },
    ]
  },
  {
    id: 2,
    title: 'Event Report',
    date: '2024-03-19',
    type: 'event',
    data: [
      { event: 'Engine Start', time: '08:00', location: 'New York', vehicle: 'Truck 001' },
      { event: 'Speed Alert', time: '09:15', location: 'Boston', vehicle: 'Truck 002' },
      { event: 'Fuel Stop', time: '10:30', location: 'Chicago', vehicle: 'Truck 003' },
    ]
  },
  {
    id: 3,
    title: 'Stop Report',
    date: '2024-03-18',
    type: 'stop',
    data: [
      { location: 'New York', duration: '45m', purpose: 'Loading', vehicle: 'Truck 001' },
      { location: 'Boston', duration: '30m', purpose: 'Unloading', vehicle: 'Truck 002' },
      { location: 'Chicago', duration: '60m', purpose: 'Break', vehicle: 'Truck 003' },
    ]
  },
  {
    id: 4,
    title: 'Trip Report',
    date: '2024-03-17',
    type: 'trip',
    data: [
      { trip: 'NY-BOS', start: '08:00', end: '12:00', distance: '350 km', fuel: '45 L' },
      { trip: 'BOS-CHI', start: '13:00', end: '18:00', distance: '400 km', fuel: '50 L' },
      { trip: 'CHI-NY', start: '09:00', end: '15:00', distance: '380 km', fuel: '48 L' },
    ]
  },
  {
    id: 5,
    title: 'Summary Report',
    date: '2024-03-16',
    type: 'summary',
    data: [
      { metric: 'Total Distance', value: '1,130 km', change: '+5%' },
      { metric: 'Total Fuel', value: '143 L', change: '-2%' },
      { metric: 'Total Stops', value: '9', change: '0%' },
      { metric: 'Avg Speed', value: '65 km/h', change: '+3%' },
    ]
  },
];

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const report = reports.find(r => r.id === Number(id));

  const handleDownload = () => {
    if (report) {
      console.log('Downloading report:', report.title);
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'route':
        return 'map';
      case 'event':
        return 'event';
      case 'stop':
        return 'place';
      case 'trip':
        return 'directions-car';
      case 'summary':
        return 'assessment';
      default:
        return 'description';
    }
  };

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Not Found</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{report.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Report Info */}
      <View style={styles.reportInfo}>
        <View style={styles.reportInfoHeader}>
          <MaterialIcons name={getReportIcon(report.type)} size={24} color="#000" />
          <View style={styles.reportInfoText}>
            <Text style={styles.reportDate}>{report.date}</Text>
            <Text style={styles.reportType}>{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <ScrollView style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Table Header */}
          {report.data.length > 0 && (
            <View style={styles.tableRow}>
              {Object.keys(report.data[0]).map((key) => (
                <Text key={key} style={styles.tableHeader}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              ))}
            </View>
          )}

          {/* Table Rows */}
          {report.data.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              {Object.values(row).map((value, i) => (
                <Text key={i} style={[
                  styles.tableCell,
                  report.type === 'summary' && i === 2 && {
                    color: value.startsWith('+') ? '#43A047' : value.startsWith('-') ? '#E53935' : '#666'
                  }
                ]}>
                  {value}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Download Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <MaterialIcons name="download" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Download Report</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reportInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reportInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportInfoText: {
    marginLeft: 12,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportType: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    padding: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeader: {
    flex: 1,
    padding: 12,
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 