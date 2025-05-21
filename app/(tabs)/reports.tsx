import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Report = {
  id: number;
  title: string;
  type: 'route' | 'event' | 'stop' | 'summary' | 'tips';
  icon: keyof typeof MaterialIcons.glyphMap;
};

export default function ReportsScreen() {
  const router = useRouter();
  const { deviceId } = useLocalSearchParams();

  const reports: Report[] = [
    {
      id: 1,
      title: 'Route Report',
      type: 'route',
      icon: 'map',
    },
    {
      id: 2,
      title: 'Event Report',
      type: 'event',
      icon: 'event',
    },
    {
      id: 3,
      title: 'Stop Report',
      type: 'stop',
      icon: 'location-on',
    },
    {
      id: 4,
      title: 'Summary Report',
      type: 'summary',
      icon: 'assessment',
    },
    {
      id: 5,
      title: 'Trips Report',
      type: 'tips',
      icon: 'lightbulb',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      {/* Reports List */}
      <ScrollView style={styles.reportsList}>
        {reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => router.push({
              pathname: `/reports/${report.type}`,
              params: { deviceId }
            })}
          >
            <View style={styles.reportInfo}>
              <View style={styles.reportHeader}>
                <MaterialIcons name={report.icon} size={24} color="#000" style={styles.reportIcon} />
                <Text style={styles.reportTitle}>{report.title}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportInfo: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
}); 