import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  // Filter state (only for Route Report)
  const [deviceQuery, setDeviceQuery] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const devices = ['Truck 001', 'Truck 002', 'Truck 003'];
  const groups = ['Group A', 'Group B', 'Group C'];

  const filteredDevices = devices.filter(d => d.toLowerCase().includes(deviceQuery.toLowerCase()));
  const filteredGroups = groups.filter(g => g.toLowerCase().includes(groupQuery.toLowerCase()));

  const handleGenerateReport = () => {
    // Implement filter logic here
    // For now, just log selected filters
    console.log({ selectedDevice, selectedGroup, fromDate, toDate });
  };

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
    <SafeAreaView style={styles.containerDark}>
      {/* Header */}
      <View style={styles.headerDark}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitleDark}>{report.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Universal Filter Card */}
        <View style={styles.filterCardDark}>
          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>Device</Text>
            <View style={styles.dropdownContainerDark}>
              <TextInput
                style={styles.dropdownInputDark}
                placeholder="Search device..."
                placeholderTextColor="#aaa"
                value={deviceQuery || selectedDevice}
                onChangeText={text => { setDeviceQuery(text); setSelectedDevice(''); }}
              />
              <Modal visible={!!deviceQuery} transparent animationType="fade">
                <View style={styles.dropdownModalBg}>
                  <View style={styles.dropdownListDark}>
                    {filteredDevices.map((d) => (
                      <TouchableOpacity key={d} onPress={() => { setSelectedDevice(d); setDeviceQuery(''); }}>
                        <Text style={styles.dropdownItemDark}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Modal>
            </View>
          </View>
          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>Group</Text>
            <View style={styles.dropdownContainerDark}>
              <TextInput
                style={styles.dropdownInputDark}
                placeholder="Search group..."
                placeholderTextColor="#aaa"
                value={groupQuery || selectedGroup}
                onChangeText={text => { setGroupQuery(text); setSelectedGroup(''); }}
              />
              <Modal visible={!!groupQuery} transparent animationType="fade">
                <View style={styles.dropdownModalBg}>
                  <View style={styles.dropdownListDark}>
                    {filteredGroups.map((g) => (
                      <TouchableOpacity key={g} onPress={() => { setSelectedGroup(g); setGroupQuery(''); }}>
                        <Text style={styles.dropdownItemDark}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Modal>
            </View>
          </View>
          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>From</Text>
            <TouchableOpacity style={styles.dateInputDark} onPress={() => setShowFromPicker(true)}>
              <Text style={styles.dateInputTextDark}>{fromDate.toLocaleString()}</Text>
              <MaterialIcons name="calendar-today" size={18} color="#aaa" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            {showFromPicker && (
              <DateTimePicker
                value={fromDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  setShowFromPicker(false);
                  if (date) setFromDate(date);
                }}
              />
            )}
          </View>
          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>To</Text>
            <TouchableOpacity style={styles.dateInputDark} onPress={() => setShowToPicker(true)}>
              <Text style={styles.dateInputTextDark}>{toDate.toLocaleString()}</Text>
              <MaterialIcons name="calendar-today" size={18} color="#aaa" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            {showToPicker && (
              <DateTimePicker
                value={toDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  setShowToPicker(false);
                  if (date) setToDate(date);
                }}
              />
            )}
          </View>
          <TouchableOpacity style={styles.generateButtonDark} onPress={handleGenerateReport}>
            <MaterialIcons name="search" size={20} color="#fff" />
            <Text style={styles.generateButtonTextDark}>Generate Report</Text>
          </TouchableOpacity>
        </View>

        {/* Report Info */}
        <View style={styles.reportInfoDark}>
          <View style={styles.reportInfoHeaderDark}>
            <MaterialIcons name={getReportIcon(report.type)} size={24} color="#fff" />
            <View style={styles.reportInfoTextDark}>
              <Text style={styles.reportDateDark}>{report.date}</Text>
              <Text style={styles.reportTypeDark}>{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainerDark}>
          <View style={styles.tableDark}>
            {/* Table Header */}
            {report.data.length > 0 && (
              <View style={styles.tableRowDark}>
                {Object.keys(report.data[0]).map((key) => (
                  <Text key={key} style={styles.tableHeaderDark}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                ))}
              </View>
            )}

            {/* Table Rows */}
            {report.data.map((row, index) => (
              <View key={index} style={styles.tableRowDark}>
                {Object.values(row).map((value, i) => (
                  <Text key={i} style={[
                    styles.tableCellDark,
                    report.type === 'summary' && i === 2 && {
                      color: value.startsWith('+') ? '#43A047' : value.startsWith('-') ? '#E53935' : '#aaa'
                    }
                  ]}>
                    {value}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Download Button */}
        <View style={styles.footerDark}>
          <TouchableOpacity style={styles.downloadButtonDark} onPress={handleDownload}>
            <MaterialIcons name="download" size={20} color="#fff" />
            <Text style={styles.downloadButtonTextDark}>Download Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerDark: {
    flex: 1,
    backgroundColor: '#181818',
  },
  headerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitleDark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterCardDark: {
    backgroundColor: '#111',
    borderRadius: 18,
    margin: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#222',
    elevation: 4,
    marginBottom: 18,
  },
  filterFieldBlock: {
    marginBottom: 18,
  },
  filterLabelDark: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 15,
  },
  dropdownContainerDark: {
    position: 'relative',
  },
  dropdownInputDark: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#181818',
    color: '#fff',
    fontSize: 15,
  },
  dropdownListDark: {
    backgroundColor: '#181818',
    borderRadius: 10,
    padding: 8,
    minWidth: 180,
    maxHeight: 200,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownItemDark: {
    padding: 10,
    color: '#fff',
    fontSize: 15,
  },
  dateInputDark: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#181818',
    marginTop: 2,
  },
  dateInputTextDark: {
    color: '#fff',
    fontSize: 15,
  },
  generateButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 10,
    justifyContent: 'center',
    elevation: 2,
  },
  generateButtonTextDark: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  reportInfoDark: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#181818',
  },
  reportInfoHeaderDark: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportInfoTextDark: {
    marginLeft: 12,
  },
  reportDateDark: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  reportTypeDark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  tableContainerDark: {
    flex: 1,
    padding: 16,
    backgroundColor: '#181818',
  },
  tableDark: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    backgroundColor: '#111',
  },
  tableRowDark: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tableHeaderDark: {
    flex: 1,
    padding: 12,
    fontWeight: 'bold',
    backgroundColor: '#222',
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
  },
  tableCellDark: {
    flex: 1,
    padding: 12,
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
  },
  footerDark: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#181818',
  },
  downloadButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
  },
  downloadButtonTextDark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dropdownModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
}); 