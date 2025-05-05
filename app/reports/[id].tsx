import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Device {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface ReportData {
  [key: string]: string | number;
}

interface BaseReport {
  id: string;
  name: string;
  fields: string[];
  description: string;
}

const baseReports: BaseReport[] = [
  {
    id: 'route',
    name: 'Route Report',
    fields: ['Device', 'Start Time', 'End Time', 'Distance', 'Duration', 'Stops', 'Fuel Used'],
    description: 'Detailed route information including distance, duration, and stops'
  },
  {
    id: 'events',
    name: 'Events Report',
    fields: ['Device', 'Event Type', 'Time', 'Location', 'Details'],
    description: 'All events recorded by the device'
  },
  {
    id: 'stops',
    name: 'Stops Report',
    fields: ['Device', 'Location', 'Start Time', 'End Time', 'Duration', 'Purpose'],
    description: 'Information about vehicle stops and idle time'
  },
  {
    id: 'trips',
    name: 'Trips Report',
    fields: ['Device', 'Trip ID', 'Start Time', 'End Time', 'Distance', 'Fuel Used', 'Duration'],
    description: 'Complete trip information with start and end points'
  },
  {
    id: 'summary',
    name: 'Summary Report',
    fields: ['Device', 'Total Distance', 'Total Fuel', 'Total Stops', 'Average Speed', 'Change'],
    description: 'Summary of all activities and metrics'
  }
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getColumnWidth = (key: string) => {
  switch (key.toLowerCase()) {
    case 'device':
    case 'location':
    case 'event type':
    case 'details':
    case 'purpose':
      return 2;
    case 'distance':
    case 'duration':
    case 'fuel used':
    case 'average speed':
      return 1.5;
    default:
      return 1;
  }
};

const formatValue = (key: string, value: any) => {
  if (typeof value === 'string' && value.includes('T')) {
    return formatDate(value);
  }
  
  if (key.toLowerCase().includes('distance')) {
    return typeof value === 'number' ? `${value.toFixed(2)} km` : value;
  }
  
  if (key.toLowerCase().includes('fuel')) {
    return typeof value === 'number' ? `${value.toFixed(2)} L` : value;
  }
  
  if (key.toLowerCase().includes('speed')) {
    return typeof value === 'number' ? `${value.toFixed(1)} km/h` : value;
  }
  
  if (key.toLowerCase().includes('duration')) {
    if (typeof value === 'number') {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    return value;
  }
  
  return value;
};

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [deviceQuery, setDeviceQuery] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  const currentReport = baseReports.find(report => report.id === id);

  // Fetch devices and groups on component mount
  useEffect(() => {
    fetchDevices();
    fetchGroups();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await Api.call('/api/devices', 'GET', {}, '');
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await Api.call('/api/groups', 'GET', {}, '');
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedDevice && !selectedGroup) {
      alert('Please select a device or group');
      return;
    }

    setLoading(true);
    try {
      const fromDateUTC = new Date(fromDate);
      fromDateUTC.setHours(fromDateUTC.getHours() - 5, fromDateUTC.getMinutes() - 30);
      
      const toDateUTC = new Date(toDate);
      toDateUTC.setHours(toDateUTC.getHours() - 5, toDateUTC.getMinutes() - 30);

      const params = {
        from: `${fromDateUTC.toISOString().slice(0, 19)}Z`,
        to: `${toDateUTC.toISOString().slice(0, 19)}Z`,
        ...(selectedDevice ? { deviceId: selectedDevice } : {}),
        ...(selectedGroup ? { groupId: selectedGroup } : {}),
      };

      const response = await Api.call(`/api/reports/${id}`, 'GET', params, '');
      setReportData(response.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await Api.call(`/api/reports/${id}/export`, 'GET', {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        ...(selectedDevice ? { deviceId: selectedDevice } : {}),
        ...(selectedGroup ? { groupId: selectedGroup } : {}),
      }, 'blob');
      
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${id}_report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'route':
        return 'map';
      case 'events':
        return 'event';
      case 'stops':
        return 'place';
      case 'trips':
        return 'directions-car';
      case 'summary':
        return 'assessment';
      default:
        return 'description';
    }
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(deviceQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(groupQuery.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = reportData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(reportData.length / recordsPerPage);

  return (
    <SafeAreaView style={styles.containerDark}>
      {/* Header */}
      <View style={styles.headerDark}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitleDark}>
          {typeof id === 'string' ? id.charAt(0).toUpperCase() + id.slice(1) : id} Report
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Report Info Card */}
        {currentReport && (
          <View style={styles.reportInfoCardDark}>
            <View style={styles.reportInfoHeaderDark}>
              <MaterialIcons name={getReportIcon(currentReport.id)} size={24} color="#fff" />
              <View style={styles.reportInfoTextDark}>
                <Text style={styles.reportNameDark}>{currentReport.name}</Text>
                <Text style={styles.reportDescriptionDark}>{currentReport.description}</Text>
              </View>
            </View>
            <View style={styles.fieldsContainerDark}>
              <Text style={styles.fieldsTitleDark}>Available Fields:</Text>
              <View style={styles.fieldsListDark}>
                {currentReport.fields.map((field, index) => (
                  <View key={index} style={styles.fieldItemDark}>
                    <MaterialIcons name="check-circle" size={16} color="#43A047" />
                    <Text style={styles.fieldTextDark}>{field}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Filter Card */}
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
                    {filteredDevices.map((device) => (
                      <TouchableOpacity 
                        key={device.id} 
                        onPress={() => { 
                          setSelectedDevice(device.id); 
                          setDeviceQuery(''); 
                          setSelectedGroup('');
                        }}
                      >
                        <Text style={styles.dropdownItemDark}>{device.name}</Text>
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
                    {filteredGroups.map((group) => (
                      <TouchableOpacity 
                        key={group.id} 
                        onPress={() => { 
                          setSelectedGroup(group.id); 
                          setGroupQuery(''); 
                          setSelectedDevice('');
                        }}
                      >
                        <Text style={styles.dropdownItemDark}>{group.name}</Text>
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

          <TouchableOpacity 
            style={[styles.generateButtonDark, loading && styles.generateButtonDisabledDark]} 
            onPress={handleGenerateReport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="search" size={20} color="#fff" />
                <Text style={styles.generateButtonTextDark}>Generate Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Report Data */}
        {reportData.length > 0 && (
          <View style={styles.tableContainerDark}>
            <View style={styles.tableWrapperDark}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Table Header */}
                  {reportData[0] && (
                    <View style={styles.tableRowDark}>
                      {Object.keys(reportData[0]).map((key) => (
                        <View 
                          key={key} 
                          style={[
                            styles.tableHeaderCellDark,
                            { flex: getColumnWidth(key) }
                          ]}
                        >
                          <Text style={styles.tableHeaderTextDark}>
                            {key.split(/(?=[A-Z])/).join(' ')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Table Rows */}
                  {currentRecords.map((row: any, index: number) => (
                    <View key={index} style={styles.tableRowDark}>
                      {Object.entries(row).map(([key, value]: [string, any], i: number) => (
                        <View 
                          key={i} 
                          style={[
                            styles.tableCellDark,
                            { flex: getColumnWidth(key) }
                          ]}
                        >
                          <Text style={[
                            styles.tableCellTextDark,
                            key.toLowerCase().includes('change') && {
                              color: String(value).startsWith('+') ? '#43A047' : 
                                     String(value).startsWith('-') ? '#E53935' : '#aaa'
                            }
                          ]}>
                            {formatValue(key, value)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Pagination */}
            <View style={styles.paginationContainerDark}>
              <TouchableOpacity
                style={[styles.paginationButtonDark, currentPage === 1 && styles.paginationButtonDisabledDark]}
                onPress={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text style={styles.paginationButtonTextDark}>Previous</Text>
              </TouchableOpacity>

              <Text style={styles.paginationTextDark}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.paginationButtonDark, currentPage === totalPages && styles.paginationButtonDisabledDark]}
                onPress={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.paginationButtonTextDark}>Next</Text>
              </TouchableOpacity>
            </View>

            {/* Download Button */}
            <TouchableOpacity style={styles.downloadButtonDark} onPress={handleDownload}>
              <MaterialIcons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonTextDark}>Download Report</Text>
            </TouchableOpacity>
          </View>
        )}
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
  generateButtonDisabledDark: {
    opacity: 0.5,
  },
  generateButtonTextDark: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  tableContainerDark: {
    flex: 1,
    padding: 16,
    backgroundColor: '#181818',
  },
  tableWrapperDark: {
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  tableRowDark: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tableHeaderCellDark: {
    padding: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    minWidth: 120,
  },
  tableHeaderTextDark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  tableCellDark: {
    padding: 12,
    justifyContent: 'center',
    minWidth: 120,
  },
  tableCellTextDark: {
    color: '#fff',
    fontSize: 14,
  },
  paginationContainerDark: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#181818',
  },
  paginationButtonDark: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  paginationButtonDisabledDark: {
    opacity: 0.5,
  },
  paginationButtonTextDark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationTextDark: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 16,
  },
  downloadButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  downloadButtonTextDark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dropdownModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  reportInfoCardDark: {
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
  },
  reportInfoHeaderDark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportInfoTextDark: {
    marginLeft: 12,
    flex: 1,
  },
  reportNameDark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportDescriptionDark: {
    color: '#aaa',
    fontSize: 14,
  },
  fieldsContainerDark: {
    marginTop: 8,
  },
  fieldsTitleDark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fieldsListDark: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fieldItemDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  fieldTextDark: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
}); 