import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as XLSX from 'xlsx';

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

export default function EventReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Device dropdown states
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [deviceValue, setDeviceValue] = useState<string | null>(null);
  const [deviceItems, setDeviceItems] = useState<DropdownItem[]>([]);
  
  // Group dropdown states
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupValue, setGroupValue] = useState<string | null>(null);
  const [groupItems, setGroupItems] = useState<DropdownItem[]>([]);

  // Event type dropdown states
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [eventTypeValue, setEventTypeValue] = useState('allEvents');
  const [eventTypeItems] = useState(eventTypes);

  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
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

      const response = await Api.call('/api/reports/events?from=' + fromDateUTC.toISOString().slice(0, 19) + 'Z&to=' + toDateUTC.toISOString().slice(0, 19) + 'Z' + (deviceValue ? '&deviceId=' + deviceValue : '') + (groupValue ? '&groupId=' + groupValue : '') + '&type=' + eventTypeValue, 'GET', {}, '');
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

  return (
    <SafeAreaView style={styles.containerDark}>
      {/* Header */}
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.headerDark}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
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
            <DropDownPicker
              open={deviceOpen}
              value={deviceValue}
              items={deviceItems}
              setOpen={setDeviceOpen}
              setValue={setDeviceValue}
              setItems={setDeviceItems}
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              placeholder="Select device"
              placeholderStyle={styles.dropdownPlaceholder}
              dropDownContainerStyle={styles.dropdownContainer}
              listItemLabelStyle={styles.dropdownItemText}
              searchable={true}
              searchPlaceholder="Search devices..."
              searchContainerStyle={styles.dropdownSearchContainer}
              searchTextInputStyle={styles.dropdownSearchInput}
              zIndex={3000}
              disabled={!!groupValue}
            />
          </View>

          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>Group</Text>
            <DropDownPicker
              open={groupOpen}
              value={groupValue}
              items={groupItems}
              setOpen={setGroupOpen}
              setValue={setGroupValue}
              setItems={setGroupItems}
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              placeholder="Select group"
              placeholderStyle={styles.dropdownPlaceholder}
              dropDownContainerStyle={styles.dropdownContainer}
              listItemLabelStyle={styles.dropdownItemText}
              searchable={true}
              searchPlaceholder="Search groups..."
              searchContainerStyle={styles.dropdownSearchContainer}
              searchTextInputStyle={styles.dropdownSearchInput}
              zIndex={2000}
              disabled={!!deviceValue}
            />
          </View>

          <View style={styles.filterFieldBlock}>
            <Text style={styles.filterLabelDark}>Event Type</Text>
            <DropDownPicker
              open={eventTypeOpen}
              value={eventTypeValue}
              items={eventTypeItems}
              setOpen={setEventTypeOpen}
              setValue={setEventTypeValue}
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              placeholder="Select event type"
              placeholderStyle={styles.dropdownPlaceholder}
              dropDownContainerStyle={styles.dropdownContainer}
              listItemLabelStyle={styles.dropdownItemText}
              zIndex={1000}
            />
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
            disabled={loading}
            onPress={fetchReport}
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
                  <View style={styles.tableRowDark}>
                    <View style={[styles.tableHeaderCellDark, { flex: getColumnWidth('vehicle number') }]}>
                      <Text style={styles.tableHeaderTextDark}>Vehicle Number</Text>
                    </View>
                    <View style={[styles.tableHeaderCellDark, { flex: getColumnWidth('type') }]}>
                      <Text style={styles.tableHeaderTextDark}>Type</Text>
                    </View>
                    <View style={[styles.tableHeaderCellDark, { flex: getColumnWidth('date & time') }]}>
                      <Text style={styles.tableHeaderTextDark}>Date & Time</Text>
                    </View>
                    <View style={[styles.tableHeaderCellDark, { flex: getColumnWidth('geofence') }]}>
                      <Text style={styles.tableHeaderTextDark}>Geofence</Text>
                    </View>
                    <View style={[styles.tableHeaderCellDark, { flex: getColumnWidth('command type') }]}>
                      <Text style={styles.tableHeaderTextDark}>Command Type</Text>
                    </View>
                    <View style={[styles.tableHeaderCellDark, { flex: getColumnWidth('command operator') }]}>
                      <Text style={styles.tableHeaderTextDark}>Command Operator</Text>
                    </View>
                    <View style={[styles.tableHeaderCellDark, { flex: getColumnWidth('maintenance') }]}>
                      <Text style={styles.tableHeaderTextDark}>Maintenance</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {currentRecords.map((entry, index) => (
                    <View key={index} style={styles.tableRowDark}>
                      <View style={[styles.tableCellDark, { flex: getColumnWidth('vehicle number') }]}>
                        <Text style={styles.tableCellTextDark}>
                          {devices.find((device) => device.id === entry?.deviceId)?.name || ""}
                        </Text>
                      </View>
                      <View style={[styles.tableCellDark, { flex: getColumnWidth('type') }]}>
                        <Text style={styles.tableCellTextDark}>
                          {formatType(entry?.type) || ""}
                        </Text>
                      </View>
                      <View style={[styles.tableCellDark, { flex: getColumnWidth('date & time') }]}>
                        <Text style={styles.tableCellTextDark}>
                          {formatDate(entry?.eventTime)}
                        </Text>
                      </View>
                      <View style={[styles.tableCellDark, { flex: getColumnWidth('geofence') }]}>
                        <Text style={styles.tableCellTextDark}>
                          {entry?.geofenceId ? entry?.geofence?.name : "-"}
                        </Text>
                      </View>
                      <View style={[styles.tableCellDark, { flex: getColumnWidth('command type') }]}>
                        <Text style={styles.tableCellTextDark}>
                          {entry?.attributes?.commandType || "-"}
                        </Text>
                      </View>
                      <View style={[styles.tableCellDark, { flex: getColumnWidth('command operator') }]}>
                        <Text style={styles.tableCellTextDark}>
                          {entry?.attributes?.command || entry?.attributes?.operator 
                            ? `${entry?.attributes?.command || ""}${entry?.attributes?.command && entry?.attributes?.operator ? " " : ""}${entry?.attributes?.operator ? `(${entry?.attributes?.operator})` : ""}`
                            : "-"}
                        </Text>
                      </View>
                      <View style={[styles.tableCellDark, { flex: getColumnWidth('maintenance') }]}>
                        <Text style={styles.tableCellTextDark}>
                          {entry?.attributes?.maintenance || "-"}
                        </Text>
                      </View>
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
            <TouchableOpacity 
              style={styles.downloadButtonDark}
              onPress={exportToExcel}
            >
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
  dropdown: {
    backgroundColor: '#181818',
    borderColor: '#333',
    borderRadius: 10,
    minHeight: 45,
  },
  dropdownText: {
    color: '#fff',
    fontSize: 15,
  },
  dropdownPlaceholder: {
    color: '#aaa',
  },
  dropdownContainer: {
    backgroundColor: '#111',
    borderColor: '#222',
    borderRadius: 10,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 14,
  },
  dropdownSearchContainer: {
    borderBottomColor: '#222',
  },
  dropdownSearchInput: {
    color: '#fff',
    borderColor: '#333',
    backgroundColor: '#181818',
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
  scrollContent: {
    paddingBottom: 32,
  },
}); 