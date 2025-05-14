import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Row, Rows, Table, TableWrapper } from 'react-native-table-component';
import * as XLSX from 'xlsx';
import SearchableDropdown from '../components/SearchableDropdown';

interface Device {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface ReportData {
  deviceName: string;
  startTime: string;
  endTime: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  totalDistance: number;
  maxSpeed: number;
  averageSpeed: number;
  engineHours: number;
  acHours: number;
  movingDuration: number;
  stoppedDuration: number;
  idleDuration: number;
  overspeedDuration: number;
  overspeedDistance: number;
  spentFuel: number;
  mileageFuel: string;
  currentStatus: string;
  firstIgnitionOnTime: string;
  lastIgnitionOffTime: string;
  firstAddress: string;
  firstLat: number;
  firstLon: number;
  lastAddress: string;
  lastLat: number;
  lastLon: number;
  currentKnownAddress: string;
  currentKnownLat: number;
  currentKnownLon: number;
}

interface DropdownItem {
  label: string;
  value: string;
}

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
    case 'vehicle number':
    case 'mileage fuel':
      return 2;
    case 'start date':
    case 'end date':
    case 'odometer start':
    case 'odometer end':
    case 'distance':
    case 'average speed':
    case 'maximum speed':
    case 'engine hours':
    case 'ac hours':
    case 'running time':
    case 'stopped time':
    case 'idle time':
    case 'spent fuel':
      return 1.5;
    default:
      return 1;
  }
};

export default function SummaryReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Device dropdown states
  const [deviceValue, setDeviceValue] = useState<string | null>(null);
  const [deviceItems, setDeviceItems] = useState<DropdownItem[]>([]);
  
  // Group dropdown states
  const [groupValue, setGroupValue] = useState<string | null>(null);
  const [groupItems, setGroupItems] = useState<DropdownItem[]>([]);

  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24); // Set to 24 hours ago
    return date;
  });
  const [toDate, setToDate] = useState(new Date());
  const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false);
  const [isToDatePickerVisible, setToDatePickerVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  useEffect(() => {
    fetchDevices();
    fetchGroups();
  }, []);

  useEffect(() => {
    // Transform devices data for dropdown
    const deviceDropdownItems = devices.map(device => ({
      label: device.name,
      value: device.id
    }));
    setDeviceItems(deviceDropdownItems);
  }, [devices]);

  useEffect(() => {
    // Transform groups data for dropdown
    const groupDropdownItems = groups.map(group => ({
      label: group.name,
      value: group.id
    }));
    setGroupItems(groupDropdownItems);
  }, [groups]);

  const fetchDevices = async () => {
    try {
      const response = await Api.call('/api/devices', 'GET', {}, false); 
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await Api.call('/api/groups', 'GET', {}, false);
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchReport = async () => {
    if (!deviceValue && !groupValue) {
      alert("Please select a device or group.");
      return;
    }

    setLoading(true);

    try {
      // Convert local time to UTC with +5:30 offset
      const fromDateUTC = new Date(fromDate);
      fromDateUTC.setHours(fromDateUTC.getHours() - 5, fromDateUTC.getMinutes() - 30);
      
      const toDateUTC = new Date(toDate);
      toDateUTC.setHours(toDateUTC.getHours() - 5, toDateUTC.getMinutes() - 30);

      // Fetch summary data
      const summaryResponse = await Api.call('/api/reports/summary?from=' + fromDateUTC.toISOString().slice(0, 19) + 'Z&to=' + toDateUTC.toISOString().slice(0, 19) + 'Z' + (deviceValue ? '&deviceId=' + deviceValue : '') + (groupValue ? '&groupId=' + groupValue : ''), 'GET', {}, false);
      
      // Fetch trips data
      const tripsResponse = await Api.call('/api/reports/trips?from=' + fromDateUTC.toISOString().slice(0, 19) + 'Z&to=' + toDateUTC.toISOString().slice(0, 19) + 'Z' + (deviceValue ? '&deviceId=' + deviceValue : ''), 'GET', {}, false);

      // Combine the data
      const combinedData = summaryResponse.data.map((summary: any) => {
        const trip = tripsResponse.data.find((t: any) => t.deviceId === summary.deviceId);
        return {
          ...summary,
          totalDistance: trip?.distance || 0,
          firstIgnitionOnTime: trip?.startTime || '',
          lastIgnitionOffTime: trip?.endTime || '',
          firstAddress: trip?.startAddress || '',
          firstLat: trip?.startLat || 0,
          firstLon: trip?.startLon || 0,
          lastAddress: trip?.endAddress || '',
          lastLat: trip?.endLat || 0,
          lastLon: trip?.endLon || 0,
          currentKnownAddress: trip?.endAddress || '',
          currentKnownLat: trip?.endLat || 0,
          currentKnownLon: trip?.endLon || 0,
          currentStatus: 'Active' // You might want to get this from another API
        };
      });

      setReportData(combinedData);
      setCurrentPage(1); // Reset to first page after fetching new data
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        reportData.map((entry) => ({
          "Vehicle Number": entry?.deviceName || "",
          "Start Date & Time": entry?.startTime ? formatDate(entry.startTime) : "N/A",
          "End Date & Time": entry?.endTime ? formatDate(entry.endTime) : "N/A",
          "Start Odometer (km)": entry?.startOdometer ? (entry.startOdometer / 1000).toFixed(2) : "N/A",
          "End Odometer (km)": entry?.endOdometer ? (entry.endOdometer / 1000).toFixed(2) : "N/A",
          "Distance (km)": entry?.distance ? (entry.distance / 1000).toFixed(2) : "N/A",
          "Total Distance (km)": entry?.totalDistance ? (entry.totalDistance / 1000).toFixed(2) : "N/A",
          "Top Speed (km/h)": entry?.maxSpeed ? (entry.maxSpeed * 1.852).toFixed(2) : "N/A",
          "Average Speed (km/h)": entry?.averageSpeed ? (entry.averageSpeed * 1.852).toFixed(2) : "N/A",
          "Engine Hours (hr)": entry?.engineHours ? (entry.engineHours/3600).toFixed(2) : "N/A",
          "AC Hours (hr)": entry?.acHours ? entry.acHours : "N/A",
          "Running Hours (hr)": entry?.movingDuration ? (entry.movingDuration/3600).toFixed(2) : "N/A",
          "Stopped Hours (hr)": entry?.stoppedDuration ? (entry.stoppedDuration/3600).toFixed(2) : "N/A",
          "Idle Hours (hr)": entry?.idleDuration ? (entry.idleDuration/3600).toFixed(2) : "N/A",
          "Overspeed Duration (hr)": entry?.overspeedDuration ? (entry.overspeedDuration/3600).toFixed(2) : "N/A",
          "Overspeed Distance (km)": entry?.overspeedDistance ? (entry.overspeedDistance/1000).toFixed(2) : "N/A",
          "Spent Fuel (L)": entry?.spentFuel ? entry.spentFuel.toFixed(2) : "N/A",
          "Mileage Fuel": entry?.mileageFuel || "N/A",
          "Current Status": entry?.currentStatus || "N/A",
          "First Ignition On Time": entry?.firstIgnitionOnTime ? formatDate(entry.firstIgnitionOnTime) : "N/A",
          "Last Ignition Off Time": entry?.lastIgnitionOffTime ? formatDate(entry.lastIgnitionOffTime) : "N/A",
          "First Address": entry?.firstAddress || "N/A",
          "First Latitude": entry?.firstLat ? entry.firstLat.toFixed(6) : "N/A",
          "First Longitude": entry?.firstLon ? entry.firstLon.toFixed(6) : "N/A",
          "Last Address": entry?.lastAddress || "N/A",
          "Last Latitude": entry?.lastLat ? entry.lastLat.toFixed(6) : "N/A",
          "Last Longitude": entry?.lastLon ? entry.lastLon.toFixed(6) : "N/A",
          "Current Known Address": entry?.currentKnownAddress || "N/A",
          "Current Known Latitude": entry?.currentKnownLat ? entry.currentKnownLat.toFixed(6) : "N/A",
          "Current Known Longitude": entry?.currentKnownLon ? entry.currentKnownLon.toFixed(6) : "N/A"
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Summary Report");
      
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.documentDirectory + "Summary_Report.xlsx";
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  // Calculate pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = reportData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(reportData.length / recordsPerPage);

  const handleFromDateConfirm = (date: Date) => {
    setFromDate(date);
    setFromDatePickerVisible(false);
  };

  const handleToDateConfirm = (date: Date) => {
    setToDate(date);
    setToDatePickerVisible(false);
  };

  const handleDeviceChange = (value: string | null) => {
    setDeviceValue(value);
    if (value) {
      setGroupValue(null);
    }
  };

  const handleGroupChange = (value: string | null) => {
    setGroupValue(value);
    if (value) {
      setDeviceValue(null);
    }
  };

  return (
    <SafeAreaView style={styles.containerDark}>
      {/* Header */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerDark}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitleDark}>
          Summary Report
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
      
        {/* Filter Card */}
        <View style={styles.filterCardDark}>
          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>Device</Text>
            <SearchableDropdown
              items={deviceItems}
              value={deviceValue}
              onValueChange={handleDeviceChange}
              placeholder="Select device"
              disabled={!!groupValue}
              zIndex={3000}
            />
          </View>

          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>Group</Text>
            <SearchableDropdown
              items={groupItems}
              value={groupValue}
              onValueChange={handleGroupChange}
              placeholder="Select group"
              disabled={!!deviceValue}
              zIndex={2000}
            />
          </View>

          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>From</Text>
            <TouchableOpacity 
              style={styles.dateInputDark} 
              onPress={() => setFromDatePickerVisible(true)}
            >
              <Text style={styles.dateInputTextDark}>{fromDate.toLocaleString()}</Text>
              <MaterialIcons name="calendar-today" size={18} color="#666" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isFromDatePickerVisible}
              mode="datetime"
              onConfirm={handleFromDateConfirm}
              onCancel={() => setFromDatePickerVisible(false)}
              date={fromDate}
              maximumDate={toDate}
            />
          </View>

          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>To</Text>
            <TouchableOpacity 
              style={styles.dateInputDark} 
              onPress={() => setToDatePickerVisible(true)}
            >
              <Text style={styles.dateInputTextDark}>{toDate.toLocaleString()}</Text>
              <MaterialIcons name="calendar-today" size={18} color="#666" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isToDatePickerVisible}
              mode="datetime"
              onConfirm={handleToDateConfirm}
              onCancel={() => setToDatePickerVisible(false)}
              date={toDate}
              minimumDate={fromDate}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.generateButtonDark, loading && styles.generateButtonDisabledDark]} 
              disabled={loading}
              onPress={fetchReport}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="search" size={20} color="#fff" />
                  <Text style={styles.generateButtonTextDark}>Generate</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.downloadButtonDark, styles.filterDownloadButton]}
              onPress={exportToExcel}
              disabled={reportData.length === 0}
            >
              <MaterialIcons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonTextDark}>Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Report Data */}
        {reportData.length > 0 ? (
          <View style={styles.tableContainerDark}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <Table borderStyle={{ borderWidth: 1, borderColor: '#e0e0e0' }}>
                  <Row
                    data={[
                      'Vehicle Number',
                      'Start Date & Time',
                      'End Date & Time',
                      'Start Odometer',
                      'End Odometer',
                      'Distance',
                      'Total Distance',
                      'Top Speed',
                      'Average Speed',
                      'Engine Hours',
                      'AC Hours',
                      'Running Hours',
                      'Stopped Hours',
                      'Idle Hours',
                      'Overspeed Duration',
                      'Overspeed Distance',
                      'Spent Fuel',
                      'Mileage Fuel',
                      'Current Status',
                      'First Ignition On Time',
                      'Last Ignition Off Time',
                      'First Address',
                      'First Latitude',
                      'First Longitude',
                      'Last Address',
                      'Last Latitude',
                      'Last Longitude',
                      'Current Known Address',
                      'Current Known Latitude',
                      'Current Known Longitude'
                    ]}
                    style={styles.tableHeaderDark}
                    textStyle={styles.tableHeaderTextDark}
                    widthArr={[150, 150, 150, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 150, 150, 200, 120, 120, 200, 120, 120, 200, 120, 120]}
                  />
                  <TableWrapper style={styles.tableWrapperDark}>
                    <Rows
                      data={currentRecords.map(entry => [
                        String(entry?.deviceName || "N/A"),
                        String(entry?.startTime ? formatDate(entry.startTime) : "N/A"),
                        String(entry?.endTime ? formatDate(entry.endTime) : "N/A"),
                        String(entry?.startOdometer ? (entry.startOdometer / 1000).toFixed(2) + " km" : "N/A"),
                        String(entry?.endOdometer ? (entry.endOdometer / 1000).toFixed(2) + " km" : "N/A"),
                        String(entry?.distance ? (entry.distance / 1000).toFixed(2) + " km" : "N/A"),
                        String(entry?.totalDistance ? (entry.totalDistance / 1000).toFixed(2) + " km" : "N/A"),
                        String(entry?.maxSpeed ? (entry.maxSpeed * 1.852).toFixed(2) + " km/h" : "N/A"),
                        String(entry?.averageSpeed ? (entry.averageSpeed * 1.852).toFixed(2) + " km/h" : "N/A"),
                        String(entry?.engineHours ? (entry.engineHours/3600).toFixed(2) + " hr" : "N/A"),
                        String(entry?.acHours ? entry.acHours + " hr" : "N/A"),
                        String(entry?.movingDuration ? (entry.movingDuration/3600).toFixed(2) + " hr" : "N/A"),
                        String(entry?.stoppedDuration ? (entry.stoppedDuration/3600).toFixed(2) + " hr" : "N/A"),
                        String(entry?.idleDuration ? (entry.idleDuration/3600).toFixed(2) + " hr" : "N/A"),
                        String(entry?.overspeedDuration ? (entry.overspeedDuration/3600).toFixed(2) + " hr" : "N/A"),
                        String(entry?.overspeedDistance ? (entry.overspeedDistance/1000).toFixed(2) + " km" : "N/A"),
                        String(entry?.spentFuel ? entry.spentFuel.toFixed(2) + " L" : "N/A"),
                        String(entry?.mileageFuel || "N/A"),
                        String(entry?.currentStatus || "N/A"),
                        String(entry?.firstIgnitionOnTime ? formatDate(entry.firstIgnitionOnTime) : "N/A"),
                        String(entry?.lastIgnitionOffTime ? formatDate(entry.lastIgnitionOffTime) : "N/A"),
                        String(entry?.firstAddress || "N/A"),
                        String(entry?.firstLat ? entry.firstLat.toFixed(6) : "N/A"),
                        String(entry?.firstLon ? entry.firstLon.toFixed(6) : "N/A"),
                        String(entry?.lastAddress || "N/A"),
                        String(entry?.lastLat ? entry.lastLat.toFixed(6) : "N/A"),
                        String(entry?.lastLon ? entry.lastLon.toFixed(6) : "N/A"),
                        String(entry?.currentKnownAddress || "N/A"),
                        String(entry?.currentKnownLat ? entry.currentKnownLat.toFixed(6) : "N/A"),
                        String(entry?.currentKnownLon ? entry.currentKnownLon.toFixed(6) : "N/A")
                      ])}
                      textStyle={styles.tableCellTextDark}
                      style={styles.tableRowDark}
                      widthArr={[150, 150, 150, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 150, 150, 200, 120, 120, 200, 120, 120, 200, 120, 120]}
                    />
                  </TableWrapper>
                </Table>
              </View>
            </ScrollView>

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
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerDark: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitleDark: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterCardDark: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 4,
    marginBottom: 18,
  },
  filterFieldBlock: {
    marginBottom: 18,
  },
  filterLabelDark: {
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 15,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderRadius: 10,
    minHeight: 45,
  },
  dropdownText: {
    color: '#000',
    fontSize: 15,
  },
  dropdownPlaceholder: {
    color: '#666',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderRadius: 10,
  },
  dropdownItemText: {
    color: '#000',
    fontSize: 14,
  },
  dropdownSearchContainer: {
    borderBottomColor: '#e0e0e0',
  },
  dropdownSearchInput: {
    color: '#000',
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  dateInputDark: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  dateInputTextDark: {
    color: '#000',
    fontSize: 15,
  },
  generateButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7043',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    elevation: 2,
    flex: 1,
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
    backgroundColor: '#fff',
  },
  tableWrapperDark: {
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  tableRowDark: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderDark: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableHeaderTextDark: {
    color: '#000',
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
    color: '#000',
    fontSize: 14,
    textAlign: 'center',
    padding: 12,
  },
  paginationContainerDark: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  paginationButtonDark: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  paginationButtonDisabledDark: {
    opacity: 0.5,
  },
  paginationButtonTextDark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationTextDark: {
    color: '#000',
    fontSize: 14,
    marginHorizontal: 16,
  },
  downloadButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43A047',
    padding: 0,
    borderRadius: 8,
    height: 52,
    width: 100,
  },
  downloadButtonTextDark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  filterDownloadButton: {
    // Add any specific styles for the filter download button if needed
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
}); 