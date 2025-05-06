import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const mockGeofences = [
  { id: '1', name: 'Office Zone', type: 'circle', center: { latitude: 22.57, longitude: 88.36 }, radius: 300 },
  { id: '2', name: 'Warehouse', type: 'polygon', coordinates: [
    { latitude: 22.572, longitude: 88.362 },
    { latitude: 22.573, longitude: 88.363 },
    { latitude: 22.574, longitude: 88.361 },
  ] },
];

export default function GeofencingScreen() {
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [geofences, setGeofences] = useState(mockGeofences);
  const [drawingType, setDrawingType] = useState<'circle' | 'polygon'>('circle');
  const [circle, setCircle] = useState<any>(null);
  const [polygon, setPolygon] = useState<any[]>([]);

  const handleAddGeofence = () => {
    setMode('add');
    setCircle(null);
    setPolygon([]);
    setDrawingType('circle');
  };

  const handleSaveGeofence = () => {
    if (drawingType === 'circle' && circle) {
      setGeofences([...geofences, { id: Date.now().toString(), name: 'New Circle', type: 'circle', center: circle.center, radius: circle.radius }]);
    } else if (drawingType === 'polygon' && polygon.length > 2) {
      setGeofences([...geofences, { id: Date.now().toString(), name: 'New Polygon', type: 'polygon', coordinates: polygon }]);
    }
    setMode('list');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Geofencing</Text>
      </View>
      {mode === 'list' ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={geofences}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 18 }}
            renderItem={({ item }) => (
              <View style={styles.geofenceCard}>
                <MaterialIcons name={item.type === 'circle' ? 'radio-button-checked' : 'polyline'} size={28} color={item.type === 'circle' ? '#43A047' : '#2979FF'} />
                <Text style={styles.geofenceName}>{item.name}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No geofences found.</Text>}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddGeofence}>
            <MaterialIcons name="add-location-alt" size={26} color="#fff" />
            <Text style={styles.addBtnText}>Add Geofence</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 22.5726, longitude: 88.3639, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            onPress={e => {
              if (drawingType === 'circle') {
                setCircle({ center: e.nativeEvent.coordinate, radius: 300 });
              } else {
                setPolygon([...polygon, e.nativeEvent.coordinate]);
              }
            }}
          >
            {circle && (
              <Circle
                center={circle.center}
                radius={circle.radius}
                strokeColor="#43A047"
                fillColor="#43A04722"
              />
            )}
            {polygon.length > 1 && (
              <Polygon
                coordinates={polygon}
                strokeColor="#2979FF"
                fillColor="#2979FF22"
              />
            )}
          </MapView>
          <View style={styles.drawingBar}>
            <TouchableOpacity
              style={[styles.drawingBtn, drawingType === 'circle' && styles.drawingBtnActive]}
              onPress={() => setDrawingType('circle')}
            >
              <MaterialIcons name="radio-button-checked" size={22} color="#43A047" />
              <Text style={styles.drawingBtnText}>Circle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawingBtn, drawingType === 'polygon' && styles.drawingBtnActive]}
              onPress={() => setDrawingType('polygon')}
            >
              <MaterialIcons name="polyline" size={22} color="#2979FF" />
              <Text style={styles.drawingBtnText}>Polygon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGeofence}>
              <MaterialIcons name="save" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('list')}>
              <MaterialIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  headerBar: {
    backgroundColor: '#000',
    paddingTop: 0,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    paddingTop: 18,
  },
  geofenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  geofenceName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginLeft: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2979FF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  map: {
    flex: 1,
    width: width,
    height: height * 0.6,
  },
  drawingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
  },
  drawingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
  },
  drawingBtnActive: {
    backgroundColor: '#E3F2FD',
  },
  drawingBtnText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43A047',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  cancelBtn: {
    backgroundColor: '#FF7043',
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 4,
  },
}); 