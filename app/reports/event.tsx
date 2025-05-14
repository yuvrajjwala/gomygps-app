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
  deviceId: string;
  type: string;
  eventTime: string;
  geofenceId?: string;
  geofence?: {
    name: string;
  };
  attributes?: {
    commandType?: string;
    command?: string;
    operator?: string;
    maintenance?: string;
  };
}

interface DropdownItem {
  label: string;
  value: string;
}

const eventTypes = [
  { value: 'allEvents', label: 'All Events' },
  { value: 'commandResult', label: 'Command Result' },
  { value: 'deviceOnline', label: 'Status Online' },
  { value: 'deviceUnknown', label: 'Status Unknown' },
  { value: 'deviceOffline', label: 'Status Offline' },
  { value: 'deviceInactive', label: 'Device Inactive' },
  { value: 'queuedCommandSent', label: 'Queued Command Sent' },
  { value: 'deviceMoving', label: 'Device Moving' },
  { value: 'deviceStopped', label: 'Device Stopped' },
  { value: 'deviceOverspeed', label: 'Speed Limit Exceeded' },
  { value: 'deviceFuelDrop', label: 'Fuel Drop' },
  { value: 'deviceFuelIncrease', label: 'Fuel Increase' },
  { value: 'geofenceExit', label: 'Geofence Exit' },
  { value: 'geofenceEnter', label: 'Geofence Enter' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'ignitionOn', label: 'Ignition On' },
  { value: 'ignitionOff', label: 'Ignition Off' },
  { value: 'maintenance', label: 'Maintenance Required' },
  { value: 'textMessage', label: 'Text Message Required' },
  { value: 'driverChanged', label: 'Driver Changed' },
  { value: 'media', label: 'Media' }
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

const formatType = (type: string) => {
  if (!type) return '';
  
  const typeMap: { [key: string]: string } = {
    "allEvents": "All Events",
    "commandResult": "Command Result",
    "deviceOnline": "Status Online",
    "deviceUnknown": "Status Unknown",
    "deviceOffline": "Status Offline",
    "deviceInactive": "Device Inactive",
    "queuedCommandSent": "Queued Command Sent",
    "deviceMoving": "Device Moving",
    "deviceStopped": "Device Stopped",
    "deviceOverspeed": "Speed Limit Exceeded",
    "deviceFuelDrop": "Fuel Drop",
    "deviceFuelIncrease": "Fuel Increase",
    "geofenceExit": "Geofence Exit",
    "geofenceEnter": "Geofence Enter",
    "alarm": "Alarm",
    "ignitionOn": "Ignition On",
    "ignitionOff": "Ignition Off",
    "maintenance": "Maintenance Required",
    "textMessage": "Text Message Required",
    "driverChanged": "Driver Changed",
    "media": "Media"
  };
  
  return typeMap[type] || type
    .replace(/([A-Z0-9])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const getColumnWidth = (key: string) => {
  switch (key.toLowerCase()) {
    case 'vehicle number':
    case 'command operator':
    case 'maintenance':
      return 2;
    case 'type':
    case 'date & time':
    case 'geofence':
    case 'command type':
      return 1.5;
    default:
      return 1;
  }
};

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
    // Add any specific styles for the filter download button
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

const NoDataFound = () => (
  <View style={styles.noDataContainer}>
    <MaterialIcons name="info-outline" size={48} color="#666" />
    <Text style={styles.noDataText}>No data found</Text>
  </View>
);

export default function EventReportScreen() {
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

  // Event type dropdown states
  const [eventTypeValue, setEventTypeValue] = useState<string | null>('allEvents');
  const [eventTypeItems] = useState(eventTypes);

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
      console.log(response.data);
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

      const response = await Api.call('/api/reports/events?from=' + fromDateUTC.toISOString().slice(0, 19) + 'Z&to=' + toDateUTC.toISOString().slice(0, 19) + 'Z' + (deviceValue ? '&deviceId=' + deviceValue : '') + (groupValue ? '&groupId=' + groupValue : '') + '&type=' + eventTypeValue, 'GET', {}, false);
      setReportData(response.data || []);
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
          "Vehicle Number": devices.find((device) => device.id === entry?.deviceId)?.name || "",
          "Type": formatType(entry?.type) || "",
          "Date & Time": formatDate(entry?.eventTime),
          "Geofence": entry?.geofenceId ? entry?.geofence?.name : "-",
          "Command Type": entry?.attributes?.commandType || "-",
          "Command Operator": entry?.attributes?.command || entry?.attributes?.operator 
            ? `${entry?.attributes?.command || ""}${entry?.attributes?.command && entry?.attributes?.operator ? " " : ""}${entry?.attributes?.operator ? `(${entry?.attributes?.operator})` : ""}`
            : "-",
          "Maintenance": entry?.attributes?.maintenance || "-"
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Event Report");
      
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.documentDirectory + "Event_Report.xlsx";
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

  const handleEventTypeChange = (value: string | null) => {
    setEventTypeValue(value || 'allEvents');
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
          Event Report
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
            <Text style={styles.filterLabelDark}>Event Type</Text>
            <SearchableDropdown
              items={eventTypeItems}
              value={eventTypeValue}
              onValueChange={handleEventTypeChange}
              placeholder="Select event type"
              zIndex={1000}
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
        {loading ? (
          <View style={styles.noDataContainer}>
            <ActivityIndicator size="large" color="#FF7043" />
          </View>
        ) : reportData.length > 0 ? (
          <View style={styles.tableContainerDark}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <Table borderStyle={{ borderWidth: 1, borderColor: '#e0e0e0' }}>
                  <Row
                    data={[
                      'Vehicle Number',
                      'Type',
                      'Date & Time',
                      'Geofence',
                      'Command Type',
                      'Command Operator',
                      'Maintenance'
                    ]}
                    style={styles.tableHeaderDark}
                    textStyle={styles.tableHeaderTextDark}
                    widthArr={[150, 150, 150, 150, 150, 200, 150]}
                  />
                  <TableWrapper style={styles.tableWrapperDark}>
                    <Rows
                      data={currentRecords.map(entry => [
                        String(devices.find((device) => device.id === entry?.deviceId)?.name || ""),
                        String(formatType(entry?.type) || ""),
                        String(formatDate(entry?.eventTime)),
                        String(entry?.geofenceId ? entry?.geofence?.name : "-"),
                        String(entry?.attributes?.commandType || "-"),
                        String(entry?.attributes?.command || entry?.attributes?.operator 
                          ? `${entry?.attributes?.command || ""}${entry?.attributes?.command && entry?.attributes?.operator ? " " : ""}${entry?.attributes?.operator ? `(${entry?.attributes?.operator})` : ""}`
                          : "-"),
                        String(entry?.attributes?.maintenance || "-")
                      ])}
                      textStyle={styles.tableCellTextDark}
                      style={styles.tableRowDark}
                      widthArr={[150, 150, 150, 150, 150, 200, 150]}
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
          <NoDataFound />
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 