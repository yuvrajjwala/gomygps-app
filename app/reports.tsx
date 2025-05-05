import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function ReportsScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const vehicles = ['All Vehicles', 'Truck 001', 'Truck 002', 'Truck 003'];
  const groups = ['All Groups', 'Group A', 'Group B', 'Group C'];

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

  const handleApplyFilters = () => {
    setShowFilters(false);
    // Apply filters logic here
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Reports</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Vehicle Selection */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Vehicle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle}
                  style={[
                    styles.filterOption,
                    selectedVehicle === vehicle && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedVehicle(vehicle)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedVehicle === vehicle && styles.filterOptionTextSelected,
                  ]}>
                    {vehicle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Group Selection */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.filterOption,
                    selectedGroup === group && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedGroup(group)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedGroup === group && styles.filterOptionTextSelected,
                  ]}>
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date Range Selection */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateRangeSeparator}>to</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Apply Button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <MaterialIcons name="filter-list" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(selectedVehicle !== 'All Vehicles' || selectedGroup !== 'All Groups') && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedVehicle !== 'All Vehicles' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{selectedVehicle}</Text>
                <TouchableOpacity onPress={() => setSelectedVehicle('All Vehicles')}>
                  <MaterialIcons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {selectedGroup !== 'All Groups' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{selectedGroup}</Text>
                <TouchableOpacity onPress={() => setSelectedGroup('All Groups')}>
                  <MaterialIcons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Reports List */}
      <ScrollView style={styles.reportsList}>
        {reports.map((report) => (
          <TouchableOpacity 
            key={report.id} 
            style={styles.reportCard}
            onPress={() => router.push(`/reports/${report.id}`)}
          >
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDate}>{report.date}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal />

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowStartDatePicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowEndDatePicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
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
  activeFilters: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  reportsList: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#000',
  },
  filterOptionText: {
    color: '#666',
    fontWeight: '600',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  dateButtonText: {
    marginLeft: 8,
    color: '#666',
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  applyButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 