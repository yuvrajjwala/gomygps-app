import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Polygon } from 'react-native-maps';
import { z } from 'zod';

const { width, height } = Dimensions.get('window');

interface Geofence {
  id: string;
  name: string;
  description: string;
  type: 'circle' | 'polygon';
  center?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  coordinates?: Array<{
    latitude: number;
    longitude: number;
  }>;
  area: string;
  calendarId?: string;
  attributes?: {
    attribute?: string;
    type?: string;
  };
}

interface Calendar {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().nonempty({
    message: "Name is required",
  }),
  description: z.string().nonempty({
    message: "Description is required",
  }),
  area: z.string().nonempty({
    message: "Area is required",
  }),
  calendarId: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  attributes: z.object({
    attribute: z.string().optional(),
    type: z.string().optional(),
  }),
});

type FormData = z.infer<typeof formSchema>;



export default function GeofencingScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [drawingType, setDrawingType] = useState<'circle' | 'polygon'>('circle');
  const [circle, setCircle] = useState<{ center: { latitude: number; longitude: number }; radius: number } | null>(null);
  const [polygon, setPolygon] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [radius, setRadius] = useState('300');
  const [geofenceName, setGeofenceName] = useState('');
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      area: "",
      calendarId: "",
      attributes: {
        attribute: "",
        type: "",
      },
    },
  });

  useEffect(() => {
    getGeofences();
    getCalendars();
  }, []);

  useEffect(() => {
    if (selectedGeofence) {
      form.reset({
        id: selectedGeofence.id,
        name: selectedGeofence.name,
        description: selectedGeofence.description,
        area: selectedGeofence.area,
        calendarId: selectedGeofence.calendarId,
        attributes: selectedGeofence.attributes,
      });
    } else {
      form.reset();
    }
  }, [selectedGeofence]);

  const getGeofences = async () => {
    try {
        const res = await Api.call('/api/geofences', 'GET', {}, false);
      setGeofences(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch geofences");
    }
  };

  const getCalendars = async () => {
    try {
      const res = await Api.call('/api/calendars', 'GET', {}, false);
      setCalendars(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGeofence = () => {
    setMode('add');
    setCircle(null);
    setPolygon([]);
    setDrawingType('circle');
    setRadius('300');
    setGeofenceName('');
    setSelectedGeofence(null);
    form.reset();
  };

  const handleEditGeofence = (geofence: Geofence) => {
    setSelectedGeofence(geofence);
    setMode('add');
    
    // Reset form with geofence data
    form.reset({
      id: geofence.id,
      name: geofence.name,
      description: geofence.description,
      area: geofence.area,
      calendarId: geofence.calendarId || "",
      attributes: geofence.attributes || {
        attribute: "",
        type: ""
      }
    });

    // Set geometry based on type
    if (geofence.type === 'circle' && geofence.center && geofence.radius) {
      setCircle({ center: geofence.center, radius: geofence.radius });
      setDrawingType('circle');
      setRadius(geofence.radius.toString());
    } else if (geofence.type === 'polygon' && geofence.coordinates) {
      setPolygon(geofence.coordinates);
      setDrawingType('polygon');
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    try {
      await Api.call(`/api/geofences/${id}`, 'DELETE', {}, false);
      getGeofences();
      Alert.alert("Success", "Geofence deleted successfully");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete geofence");
    }
  };

  const handleSaveGeofence = () => {
    try {
      console.log('Save button clicked');
      console.log('Form values:', form.getValues());
      console.log('Selected geofence:', selectedGeofence);
      console.log('Drawing type:', drawingType);
      console.log('Circle:', circle);
      console.log('Polygon:', polygon);

      // Validate required fields
      if (!form.getValues('name')) {
        Alert.alert("Error", "Please enter a name for the geofence");
        return;
      }

      if (!form.getValues('description')) {
        Alert.alert("Error", "Please enter a description for the geofence");
        return;
      }

      // Validate geometry based on type
      if (drawingType === 'circle') {
        if (!circle) {
          Alert.alert("Error", "Please draw a circle on the map");
          return;
        }
        const areaValue = `CIRCLE (${circle.center.latitude} ${circle.center.longitude}, ${radius})`;
        console.log('Setting circle area:', areaValue);
        form.setValue('area', areaValue);
      } else if (drawingType === 'polygon') {
        if (polygon.length < 3) {
          Alert.alert("Error", "Please draw a polygon with at least 3 points");
          return;
        }
        const areaValue = `POLYGON (${polygon.map(p => `${p.latitude} ${p.longitude}`).join(', ')})`;
        console.log('Setting polygon area:', areaValue);
        form.setValue('area', areaValue);
      }

      console.log('Form values before submission:', form.getValues());
      console.log('Form errors:', form.formState.errors);

      // Trigger form submission
      form.handleSubmit((data) => {
        console.log('Form submitted with data:', data);
        onSubmit(data);
      })();
    } catch (error) {
      console.error('Error in handleSaveGeofence:', error);
      Alert.alert("Error", "An unexpected error occurred while saving. Please try again.");
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      console.log('onSubmit called with values:', values);
      
      // Prepare the geofence data based on type
      const geofenceData = {
        ...values,
        type: drawingType,
        ...(drawingType === 'circle' && circle ? {
          center: circle.center,
          radius: Number(radius)
        } : {}),
        ...(drawingType === 'polygon' && polygon.length > 2 ? {
          coordinates: polygon
        } : {})
      };

      // Convert calendarId to string if it's a number
      if (typeof geofenceData.calendarId === 'number') {
        geofenceData.calendarId = geofenceData.calendarId.toString();
      }

      // Remove empty calendarId and id
      if (!geofenceData.calendarId) {
        delete geofenceData.calendarId;
      }
      delete geofenceData.id; // Remove id from payload

      console.log('Final payload:', geofenceData);

      if (selectedGeofence) {
        console.log('Updating geofence:', selectedGeofence.id);
        const response = await Api.call(`/api/geofences/${selectedGeofence.id}`, 'PUT', geofenceData, false);
        console.log('Update response:', response);
        Alert.alert("Success", "Geofence updated successfully");
      } else {
        console.log('Creating new geofence');
        const response = await Api.call("/api/geofences", 'POST', geofenceData, false);
        console.log('Create response:', response);
        Alert.alert("Success", "Geofence created successfully");
      }
      
      getGeofences();
      setMode('list');
      setSelectedGeofence(null);
    } catch (error: any) {
      console.error('Geofence submission error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error';
      Alert.alert("Error", `Failed to save geofence: ${errorMessage}`);
    }
  };

  return (
    <View style={{ flex: 1, }}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={{ position: 'absolute', left: 0, top: 0, height: '100%', justifyContent: 'center', paddingLeft: 12 }} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerText, { textAlign: 'center' }]}>Geofencing</Text>
      </View>
      {mode === 'list' ? (
        <View style={{ flex: 1, paddingBottom: 50 }}>
          <FlatList
            data={geofences}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 18 }}
            renderItem={({ item }) => (
              <View style={styles.geofenceCard}>
                <MaterialIcons name={item.type === 'circle' ? 'radio-button-checked' : 'polyline'} size={28} color={item.type === 'circle' ? '#43A047' : '#2979FF'} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.geofenceName}>{item.name}</Text>
                  <Text style={styles.geofenceDescription}>{item.description}</Text>
                </View>
                <View style={styles.geofenceActions}>
                  <TouchableOpacity onPress={() => handleEditGeofence(item)} style={styles.actionButton}>
                    <MaterialIcons name="edit" size={24} color="#2979FF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteGeofence(item.id)} style={styles.actionButton}>
                    <MaterialIcons name="delete" size={24} color="#FF7043" />
                  </TouchableOpacity>
                </View>
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
        <View style={{ flex: 1, paddingBottom: 0, marginTop: 0 }}>
          <MapView
            style={[styles.map, { height: height - 280, marginTop: 0 }]}
            initialRegion={{ latitude: 22.5726, longitude: 88.3639, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            onPress={e => {
              if (drawingType === 'circle') {
                setCircle({ center: e.nativeEvent.coordinate, radius: Number(radius) });
              } else {
                setPolygon([...polygon, e.nativeEvent.coordinate]);
              }
            }}
          >
            {circle && (
              <Circle
                center={circle.center}
                radius={Number(radius)}
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
          <View style={styles.geoAddPanel}>
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Text style={styles.geoAddLabel}>Name</Text>
                  <TextInput
                    style={[styles.geoAddInput, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Geofence Name"
                    placeholderTextColor="#888"
                    maxLength={32}
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Text style={styles.geoAddLabel}>Description</Text>
                  <TextInput
                    style={[styles.geoAddInput, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Description"
                    placeholderTextColor="#888"
                    multiline
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />
            <Text style={styles.geoAddLabel}>Geofencing Type</Text>
            <View style={styles.geoAddTypeRow}>
              <TouchableOpacity
                style={[styles.geoAddTypeBtn, drawingType === 'circle' && styles.geoAddTypeBtnActive]}
                onPress={() => setDrawingType('circle')}
              >
                <MaterialIcons name="radio-button-checked" size={22} color="#43A047" />
                <Text style={styles.geoAddTypeText}>Circle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.geoAddTypeBtn, drawingType === 'polygon' && styles.geoAddTypeBtnActive]}
                onPress={() => setDrawingType('polygon')}
              >
                <MaterialIcons name="polyline" size={22} color="#2979FF" />
                <Text style={styles.geoAddTypeText}>Polygon</Text>
              </TouchableOpacity>
            </View>
            {drawingType === 'circle' && (
              <View style={styles.geoAddRadiusRow}>
                <Text style={styles.geoAddLabel}>Radius (meters)</Text>
                <TextInput
                  style={styles.geoAddInput}
                  value={radius}
                  onChangeText={setRadius}
                  keyboardType="numeric"
                  placeholder="Radius"
                  placeholderTextColor="#888"
                  maxLength={6}
                />
              </View>
            )}
            <View style={styles.geoAddBtnRow}>
              <TouchableOpacity style={styles.geoAddSaveBtn} onPress={handleSaveGeofence}>
                <MaterialIcons name="save" size={22} color="#fff" />
                <Text style={styles.geoAddSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.geoAddCancelBtn} onPress={() => setMode('list')}>
                <MaterialIcons name="close" size={22} color="#fff" />
                <Text style={styles.geoAddCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F7F8FA',
    },
    headerBar: {
      backgroundColor: '#000',
      paddingTop: 0,
      paddingBottom: 18,
      paddingHorizontal: 0,
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
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 32,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#2979FF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 18,
    },
    optionLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: '#222',
    },
    geofenceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
    },
    geofenceName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#222',
      marginLeft: 18,
    },
    addBtn: {
      backgroundColor: '#43A047',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 18,
      borderRadius: 16,
      marginTop: 16,
    },
    addBtnText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    map: {
      flex: 1,
      marginTop: 0,
    },
    geoAddPanel: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingVertical: 22,
      paddingHorizontal: 22,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    geoAddLabel: {
      color: '#222',
      fontWeight: '600',
      fontSize: 15,
      marginBottom: 6,
      marginTop: 10,
    },
    geoAddInput: {
      backgroundColor: '#F7F8FA',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E3F2FD',
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      color: '#222',
      marginBottom: 8,
    },
    geoAddTypeRow: {
      flexDirection: 'row',
      marginBottom: 8,
      justifyContent: 'space-between',
    },
    geoAddTypeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F7F8FA',
      borderRadius: 8,
      paddingVertical: 12,
      flex: 1,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: '#E3F2FD',
    },
    geoAddTypeBtnActive: {
      backgroundColor: '#E3F2FD',
      borderColor: '#2979FF',
    },
    geoAddTypeText: {
      color: '#222',
      fontWeight: '600',
      fontSize: 15,
      marginLeft: 6,
    },
    geoAddRadiusRow: {
      marginBottom: 8,
    },
    geoAddBtnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      gap: 12,
    },
    geoAddSaveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#43A047',
      borderRadius: 10,
      paddingVertical: 12,
      flex: 1,
    },
    geoAddSaveText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15,
      marginLeft: 6,
    },
    geoAddCancelBtn: {
      backgroundColor: '#FF7043',
      borderRadius: 10,
      paddingVertical: 12,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    geoAddCancelText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15,
      marginLeft: 6,
    },
    groupCard: {
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    groupInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    groupDetails: {
      marginLeft: 16,
      flex: 1,
    },
    groupName: {
      fontSize: 17,
      fontWeight: '600',
      color: '#222',
      marginBottom: 4,
    },
    parentGroupName: {
      fontSize: 14,
      color: '#666',
    },
    addGroupPanel: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    parentGroupSelector: {
      backgroundColor: '#F7F8FA',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E3F2FD',
      marginBottom: 16,
    },
    userCard: {
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    userDetails: {
      marginLeft: 16,
      flex: 1,
    },
    userCardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
      alignSelf: 'flex-start',
    },
    userActionBtn: {
      padding: 6,
      marginLeft: 2,
    },
    userName: {
      fontSize: 17,
      fontWeight: '600',
      color: '#222',
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    userRole: {
      fontSize: 12,
      fontWeight: '600',
      marginRight: 8,
    },
    userLimits: {
      fontSize: 12,
      color: '#666',
    },
    userExpiration: {
      fontSize: 12,
      color: '#666',
    },
    addUserPanel: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      maxHeight: height - 200,
    },
    userSearchInput: {
      backgroundColor: '#fffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'gray',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: '#222',
      marginHorizontal: 18,
      marginTop: 18,
      marginBottom: 0,
    },
    addUserFab: {
      position: 'absolute',
      right: 24,
      bottom: 32,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      zIndex: 10,
    },
    geofenceDescription: {
      fontSize: 14,
      color: '#666',
      marginLeft: 18,
    },
    geofenceActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      marginLeft: 8,
    },
    inputError: {
      borderColor: '#FF7043',
    },
    errorText: {
      color: '#FF7043',
      fontSize: 12,
      marginTop: 4,
    },
  }); 