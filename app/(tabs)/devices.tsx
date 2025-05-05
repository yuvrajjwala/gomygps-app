import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  disabled: boolean;
  lastUpdate: string | null;
  positionId: number | null;
  groupId: number | null;
  phone: string | null;
  model: string | null;
  contact: string | null;
  category: string | null;
  attributes: any;
  latitude?: number;
  longitude?: number;
  speed?: number;
  address?: string;
}

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    uniqueId: '',
    status: 'online',
    disabled: false,
    phone: '',
    model: '',
    contact: '',
    category: '',
  });
  const [search, setSearch] = useState('');

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.uniqueId.toLowerCase().includes(search.toLowerCase()) ||
    (d.phone && d.phone.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    getDevices();
  }, []);

  const getDevices = async () => {
    try {
      const [responseDevices, responsePositions] = await Promise.all([
        Api.call('/api/devices', 'GET', {}, ''),
        Api.call('/api/positions', 'GET', {}, '')
      ]);
      setDevices(responseDevices.data.map((device: Device) => ({
        ...device,
        ...responsePositions.data.find((position: any) => position.deviceId === device.id)
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const openAddModal = () => {
    setEditMode(false);
    setEditId(null);
    setForm({
      name: '',
      uniqueId: '',
      status: 'online',
      disabled: false,
      phone: '',
      model: '',
      contact: '',
      category: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (device: Device) => {
    setEditMode(true);
    setEditId(device.id);
    setForm({
      name: device.name || '',
      uniqueId: device.uniqueId || '',
      status: device.status || 'online',
      disabled: device.disabled || false,
      phone: device.phone || '',
      model: device.model || '',
      contact: device.contact || '',
      category: device.category || '',
    });
    setModalVisible(true);
  };

  const handleAddOrEditDevice = async () => {
    try {
      const deviceData =  {
        ...form,
        lastUpdate: new Date().toISOString(),
        positionId: null,
        groupId: null,
        attributes: {},
        id: editId
      };

      if (editMode && editId) {
        const response = await Api.call(`/api/devices/${editId}`, 'PUT', deviceData, '');
        console.log("response", response);
      } else {
        await Api.call('/api/devices', 'POST', deviceData, '');
      }

      setModalVisible(false);
      setEditMode(false);
      setEditId(null);
      setForm({
        name: '',
        uniqueId: '',
        status: 'online',
        disabled: false,
        phone: '',
        model: '',
        contact: '',
        category: '',
      });
      await getDevices();

    } catch (error) {
      console.error('Error saving device:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Devices</Text>
      </View>
      <View style={styles.searchBarWrap}>
        <MaterialIcons name="search" size={20} color="#bbb" style={{ marginLeft: 8, marginRight: 4 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search device..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredDevices}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceCard} onPress={() => router.push({ pathname: '/vehicle-details', params: { device: JSON.stringify(item) } })}>  
            <View style={styles.deviceRow}>
              <View style={styles.deviceIconCircle}>
                <MaterialIcons name="directions-car" size={22} color="#00B8D4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceNumber}>{item.name}</Text>
                <Text style={styles.deviceName}>{item.uniqueId}</Text>
              </View>
              <Text style={[styles.deviceModel, { backgroundColor: item.status === 'online' ? '#43A047' : '#FF7043' }]}>
                {item.status}
              </Text>
            </View>
            {item.phone && (
              <View style={styles.deviceDetailsRow}>
                <MaterialIcons name="phone" size={16} color="#00B8D4" style={{ marginRight: 4 }} />
                <Text style={styles.deviceDetail}>Phone: {item.phone}</Text>
              </View>
            )}
            {item.model && (
              <View style={styles.deviceDetailsRow}>
                <MaterialIcons name="confirmation-number" size={16} color="#FFD600" style={{ marginRight: 4 }} />
                <Text style={styles.deviceDetail}>Model: {item.model}</Text>
              </View>
            )}
            {item.category && (
              <View style={styles.deviceDetailsRow}>
                <MaterialIcons name="category" size={16} color="#AB47BC" style={{ marginRight: 4 }} />
                <Text style={styles.deviceDetail}>Category: {item.category}</Text>
              </View>
            )}
            {item.address && (
              <View style={styles.deviceDetailsRow}>
                <MaterialIcons name="location-on" size={16} color="#1976D2" style={{ marginRight: 4 }} />
                <Text style={styles.deviceDetail}>{item.address}</Text>
              </View>
            )}
            {item.speed !== undefined && (
              <View style={styles.deviceDetailsRow}>
                <MaterialIcons name="speed" size={16} color="#FF7043" style={{ marginRight: 4 }} />
                <Text style={styles.deviceDetail}>Speed: {item.speed.toFixed(1)} km/h</Text>
              </View>
            )}
            <View style={styles.deviceActionsRow}>

              <TouchableOpacity style={[styles.deviceActionBtn, { backgroundColor: '#FF7043' }]} onPress={() => openEditModal(item)}>
                <MaterialIcons name="edit" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Device' : 'Add Device'}</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color="#00B8D4" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="Enter name" placeholderTextColor="#888" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Unique ID <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="Enter unique ID" placeholderTextColor="#888" value={form.uniqueId} onChangeText={t => setForm(f => ({ ...f, uniqueId: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} placeholder="Enter phone" placeholderTextColor="#888" value={form.phone} onChangeText={t => setForm(f => ({ ...f, phone: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter model"
                  placeholderTextColor="#888"
                  value={form.model}
                  onChangeText={t => setForm(f => ({ ...f, model: t }))}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Contact</Text>
                <TextInput style={styles.input} placeholder="Enter contact" placeholderTextColor="#888" value={form.contact} onChangeText={t => setForm(f => ({ ...f, contact: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter category"
                  placeholderTextColor="#888"
                  value={form.category}
                  onChangeText={t => setForm(f => ({ ...f, category: t }))}
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddOrEditDevice}>
                <Text style={styles.addBtnText}>{editMode ? 'Save Changes' : 'Add Device'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  headerWrap: { backgroundColor: '#111', paddingTop: 36, paddingBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 4, zIndex: 10 },
  header: { fontSize: 28, fontWeight: 'bold', alignSelf: 'center', color: '#fff', letterSpacing: 1 },
  deviceCard: { backgroundColor: '#181A20', borderRadius: 18, marginHorizontal: 14, marginBottom: 16, padding: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  deviceIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  deviceNumber: { fontWeight: 'bold', fontSize: 17, color: '#fff' },
  deviceName: { fontWeight: '600', fontSize: 15, color: '#fff', marginBottom: 2 },
  deviceModel: { fontWeight: 'bold', fontSize: 13, color: '#fff', backgroundColor: '#00B8D4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden' },
  deviceDetailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  deviceDetail: { color: '#bbb', fontSize: 13 },
  fab: { position: 'absolute', right: 24, bottom: 32, backgroundColor: '#00B8D4', borderRadius: 32, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#00B8D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#181A20', borderRadius: 20, padding: 20, width: '92%', maxHeight: '92%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#00B8D4', alignSelf: 'center', flex: 1, textAlign: 'center' },
  closeBtn: { padding: 4, marginLeft: 8 },
  formField: { marginBottom: 12 },
  label: { fontWeight: '600', color: '#fff', marginBottom: 4, fontSize: 15 },
  required: { color: '#FF7043', fontWeight: 'bold' },
  input: { backgroundColor: '#23242a', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#222', color: '#fff' },
  pickerWrap: { backgroundColor: '#23242a', borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  picker: { height: 44, width: '100%', color: '#fff' },
  addBtn: { backgroundColor: '#00B8D4', borderRadius: 8, padding: 16, marginTop: 10, alignItems: 'center', shadowColor: '#00B8D4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 8, alignItems: 'center' },
  cancelBtnText: { color: '#00B8D4', fontWeight: 'bold', fontSize: 15 },
  deviceActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  deviceActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#23242a',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
}); 