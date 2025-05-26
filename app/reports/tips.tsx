import Api from "@/config/Api";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Row, Rows, Table, TableWrapper } from 'react-native-table-component';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from "xlsx";
import SearchableDropdown from "../components/SearchableDropdown";
import { setLoading } from '../store/slices/deviceSlice';
import { RootState } from '../store/store';

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
  startTime: string;
  endTime: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  duration: number;
  startAddress: string;
  endAddress: string;
  averageSpeed: number;
  maxSpeed: number;
  acHours: number;
  spentFuel: number;
  mileageFuel: string;
}

interface DropdownItem {
  label: string;
  value: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


export default function TipsReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const dispatch = useDispatch();
  const { devices: devicesData, loading } = useSelector((state: RootState) => state.devices);
  // Device dropdown states
  const [deviceValue, setDeviceValue] = useState<string | null>(null);
  const [deviceItems, setDeviceItems] = useState<DropdownItem[]>([]);

  // Group dropdown states
  const [groupValue, setGroupValue] = useState<string | null>(null);
  const [groupItems, setGroupItems] = useState<DropdownItem[]>([]);

  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [toDate, setToDate] = useState(new Date());
  const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false);
  const [isToDatePickerVisible, setToDatePickerVisible] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState('today');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  const [downloadProgress] = useState(new Animated.Value(0));
  const [downloadStatus, setDownloadStatus] = useState('');
  const [generatingProgress] = useState(new Animated.Value(0));
  const [targetProgress, setTargetProgress] = useState(0);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [reportFetched, setReportFetched] = useState(false);

  const dateRangeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 3 Days', value: 'last3days' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Custom Range', value: 'custom' }
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    // Transform devices data for dropdown
    const deviceDropdownItems = devicesData.map((device: Device) => ({
      label: device.name,
      value: device.id,
    }));
    setDeviceItems(deviceDropdownItems);
  }, [devicesData]);

  useEffect(() => {
    // Transform groups data for dropdown
    const groupDropdownItems = groups.map((group) => ({
      label: group.name,
      value: group.id,
    }));
    setGroupItems(groupDropdownItems);
  }, [groups]);

  

  const fetchGroups = async () => {
    try {
      const response = await Api.call("/api/groups", "GET", {}, false);
      setGroups(response.data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const animateGeneratingProgress = (value: number) => {
    Animated.timing(generatingProgress, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false
    }).start();
  };

  const handleGenerateReport = async () => {
    if (!deviceValue && !groupValue) {
      alert("Please select a device or group");
      return;
    }

    dispatch(setLoading(true));
    setGeneratingStatus('Initializing report generation...');
    animateGeneratingProgress(20);

    try {
      const fromDateUTC = new Date(fromDate);
      fromDateUTC.setHours(
        fromDateUTC.getHours(),
        fromDateUTC.getMinutes()
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
      setGeneratingStatus('Processing date range...');
      animateGeneratingProgress(30);

      const toDateUTC = new Date(toDate);
      toDateUTC.setHours(toDateUTC.getHours(), toDateUTC.getMinutes());

      await new Promise(resolve => setTimeout(resolve, 1000));
      setGeneratingStatus('Fetching trips data...');
      animateGeneratingProgress(50);

      const params = {
        from: fromDateUTC.toISOString(),
        to: toDateUTC.toISOString(),
        ...(deviceValue ? { deviceId: deviceValue } : {}),
        ...(groupValue ? { groupId: groupValue } : {}),
      };

      const response = await Api.call(
        `/api/reports/trips?from=${fromDateUTC.toISOString()}&to=${toDateUTC.toISOString()}&deviceId=${deviceValue}`,
        "GET",
        params,
        false
      );

      setGeneratingStatus('Processing response...');
      animateGeneratingProgress(70);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportData(response.data || []);
      setCurrentPage(1);

      setGeneratingStatus('Completing report generation...');
      animateGeneratingProgress(100);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setReportFetched(true);
      setTimeout(() => {
        dispatch(setLoading(false));
        generatingProgress.setValue(0);
        setTargetProgress(0);
      }, 1000);
    }
  };

  const exportToExcel = async () => {
    setIsDownloading(true);
    setDownloadStatus('Preparing report data...');
    
    Animated.timing(downloadProgress, {
      toValue: 30,
      duration: 800,
      useNativeDriver: false
    }).start();

    setTimeout(async () => {
      try {
        const worksheet = XLSX.utils.json_to_sheet(
          reportData.map((trip) => ({
            "Vehicle Number":
              devicesData.find((device) => device.id === trip?.deviceId)?.name || "",
            "Start Time": formatDate(trip.startTime),
            "End Time": formatDate(trip.endTime),
            "Odometer Start": trip.startOdometer || "0",
            "Odometer End": trip.endOdometer || "0",
            "Distance (km)": (trip.distance / 1000).toFixed(2),
            "Duration (min)": (trip.duration / 60000).toFixed(2),
            "Start Address": trip.startAddress || "N/A",
            "End Address": trip.endAddress || "N/A",
            "Average Speed (km/h)": (trip.averageSpeed * 1.852).toFixed(2),
            "Maximum Speed (km/h)": (trip.maxSpeed * 1.852).toFixed(2),
            "AC Hours": trip.acHours || "0",
            "Spent Fuel (L)": trip.spentFuel || "0",
            "Mileage Fuel": trip.mileageFuel || "N/A",
          }))
        );

        setDownloadStatus('Generating Excel file...');
        Animated.timing(downloadProgress, {
          toValue: 60,
          duration: 600,
          useNativeDriver: false
        }).start();

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Trip Report");

        setDownloadStatus('Saving file...');
        Animated.timing(downloadProgress, {
          toValue: 85,
          duration: 500,
          useNativeDriver: false
        }).start();

        const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
        const uri = FileSystem.documentDirectory + "Trip_Report.xlsx";
        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setDownloadStatus('Ready to share!');
        Animated.timing(downloadProgress, {
          toValue: 100,
          duration: 400,
          useNativeDriver: false
        }).start();

        await Sharing.shareAsync(uri);
      } catch (error) {
        console.error("Error exporting to Excel:", error);
        setDownloadStatus('Download failed. Please try again.');
      } finally {
        setTimeout(() => {
          Animated.timing(downloadProgress, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false
          }).start(() => {
            setIsDownloading(false);
          });
        }, 1000);
      }
    }, 0);
  };

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

  const handleDateRangeChange = (value: string | null) => {
    if (!value) return;
    
    setDateRangeOption(value);
    setShowCustomDateRange(value === 'custom');
    
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    switch (value) {
      case 'today':
        setFromDate(today);
        setToDate(now);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setFromDate(yesterday);
        setToDate(today);
        break;
      case 'last3days':
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        setFromDate(threeDaysAgo);
        setToDate(now);
        break;
      case 'last7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        setFromDate(sevenDaysAgo);
        setToDate(now);
        break;
      case 'custom':
        // Keep existing dates
        break;
    }
  };

  // Calculate pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = reportData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(reportData.length / recordsPerPage);

  const LoadingOverlay = () => {
    if (!loading) return null;

    return (
      <View style={styles.downloadOverlay}>
        <View style={styles.downloadCard}>
          <MaterialIcons name="sync" size={40} color="#FF7043" />
          <Text style={styles.downloadStatusText}>{generatingStatus}</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: generatingProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} 
            />
          </View>
          <Text style={styles.downloadStatusText1}>Generating Report...</Text>
        </View>
      </View>
    );
  };

  const DownloadOverlay = () => {
    if (!isDownloading) return null;

    return (
      <View style={styles.downloadOverlay}>
        <View style={styles.downloadCard}>
          <MaterialIcons name="cloud-download" size={40} color="#FF7043" />
          <Text style={styles.downloadStatusText}>{downloadStatus}</Text>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack} />
            <Animated.View 
              style={[
                styles.sliderBall,
                {
                  left: downloadProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '92%']
                  })
                }
              ]} 
            >
              <MaterialIcons name="fiber-manual-record" size={24} color="#FF7043" />
            </Animated.View>
          </View>

          <Text style={styles.downloadStatusText1}>Downloading Report...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.containerDark}>
      {/* Header */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerDark}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitleDark}>Trip Report</Text>
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
              placeholder={isLoadingVehicles ? "Loading vehicles..." : "Select device"}
              disabled={!!groupValue || isLoadingVehicles}
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
            <Text style={styles.filterLabelDark}>Date Range</Text>
            <SearchableDropdown
              items={dateRangeOptions}
              value={dateRangeOption}
              onValueChange={handleDateRangeChange}
              placeholder="Select date range"
              zIndex={1000}
            />
          </View>

          {showCustomDateRange && (
            <>
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
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.generateButtonDark,
                loading && styles.generateButtonDisabledDark,
              ]}
              onPress={handleGenerateReport}
              disabled={loading}
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

            {/* Download Button */}
            <TouchableOpacity 
              style={[
                styles.downloadButtonDark,
                reportData.length === 0 && styles.downloadButtonDisabledDark
              ]}
              onPress={exportToExcel}
              disabled={reportData.length === 0 || isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="download" size={20} color="#fff" />
                  <Text style={styles.downloadButtonTextDark}>Excel</Text>
                </>
              )}
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
                      'Start Time',
                      'End Time',
                      'Odometer Start',
                      'Odometer End',
                      'Distance',
                      'Duration',
                      'Start Address',
                      'End Address',
                      'Average Speed',
                      'Maximum Speed',
                      'AC Hours',
                      'Spent Fuel',
                      'Mileage Fuel'
                    ]}
                    style={styles.tableHeaderDark}
                    textStyle={styles.tableHeaderTextDark}
                    widthArr={[150, 150, 150, 120, 120, 100, 100, 200, 200, 120, 120, 100, 100, 150]}
                  />
                  <TableWrapper style={styles.tableWrapperDark}>
                    <Rows
                      data={currentRecords.map(trip => [
                        String(devicesData.find(device => device.id === trip?.deviceId)?.name || ''),
                        formatDate(trip.startTime),
                        formatDate(trip.endTime),
                        String(trip.startOdometer || '0'),
                        String(trip.endOdometer || '0'),
                        `${(trip.distance / 1000).toFixed(2)} km`,
                        `${(trip.duration / 60000).toFixed(2)} min`,
                        String(trip.startAddress || 'N/A'),
                        String(trip.endAddress || 'N/A'),
                        `${(trip.averageSpeed * 3.5).toFixed(2)} km/h`,
                        `${(trip.maxSpeed * 1.852).toFixed(2)} km/h`,
                        String(trip.acHours || '0'),
                        `${trip.spentFuel || '0'} L`,
                        String(trip.mileageFuel || 'N/A')
                      ])}
                      textStyle={styles.tableCellTextDark}
                      style={styles.tableRowDark}
                      widthArr={[150, 150, 150, 120, 120, 100, 100, 200, 200, 120, 120, 100, 100, 150]}
                    />
                  </TableWrapper>
                </Table>
              </View>
            </ScrollView>

            {/* Pagination */}
            <View style={styles.paginationContainerDark}>
              <TouchableOpacity
                style={[
                  styles.paginationButtonDark,
                  currentPage === 1 && styles.paginationButtonDisabledDark,
                ]}
                onPress={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text style={styles.paginationButtonTextDark}>Previous</Text>
              </TouchableOpacity>

              <Text style={styles.paginationTextDark}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.paginationButtonDark,
                  currentPage === totalPages && styles.paginationButtonDisabledDark,
                ]}
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
      <LoadingOverlay />
      <DownloadOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerDark: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitleDark: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  filterCardDark: {
    backgroundColor: "#fff",
    borderRadius: 18,
    margin: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 4,
    marginBottom: 18,
  },
  filterFieldBlock: {
    marginBottom: 18,
  },
  filterLabelDark: {
    color: "#000",
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 15,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    borderRadius: 10,
    minHeight: 45,
  },
  dropdownText: {
    color: "#000",
    fontSize: 15,
  },
  dropdownPlaceholder: {
    color: "#666",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    borderRadius: 10,
  },
  dropdownItemText: {
    color: "#000",
    fontSize: 14,
  },
  dropdownSearchContainer: {
    borderBottomColor: "#e0e0e0",
  },
  dropdownSearchInput: {
    color: "#000",
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  dateInputDark: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginTop: 2,
  },
  dateInputTextDark: {
    color: "#000",
    fontSize: 15,
  },
  generateButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7043",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: "center",
    elevation: 2,
    flex: 1,
  },
  generateButtonDisabledDark: {
    opacity: 0.5,
  },
  generateButtonTextDark: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  tableContainerDark: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  tableWrapperDark: {
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  tableHeaderDark: {
    height: 50,
    backgroundColor: '#f5f5f5',
  },
  tableHeaderTextDark: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    padding: 8,
  },
  tableRowDark: {
    height: 50,
    backgroundColor: '#fff',
  },
  tableCellTextDark: {
    color: '#000',
    fontSize: 14,
    textAlign: 'center',
    padding: 8,
  },
  paginationContainerDark: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  paginationButtonDark: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  paginationButtonDisabledDark: {
    opacity: 0.5,
  },
  paginationButtonTextDark: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  paginationTextDark: {
    color: "#000",
    fontSize: 14,
    marginHorizontal: 16,
  },
  downloadButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#43A047",
    padding: 0,
    borderRadius: 8,
    height: 52,
    width: 100,
  },
  downloadButtonDisabledDark: {
    opacity: 0.5,
    backgroundColor: "#a5d6a7",
  },
  downloadButtonTextDark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  },
  filterDownloadButton: {
    // Add any specific styles for the filter download button
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  downloadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  downloadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  downloadStatusText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  downloadStatusText1: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF7043',
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    position: 'absolute',
  },
  sliderBall: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -12 }],
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
