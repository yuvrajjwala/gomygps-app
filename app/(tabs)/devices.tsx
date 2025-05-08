import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
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
  expirationTime?: string;
  imei?: string;
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
  const router = useRouter();
  const isFocused = useIsFocused();

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.uniqueId.toLowerCase().includes(search.toLowerCase()) ||
    (d.phone && d.phone.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    getDevices();
  }, []);

  const getDevices = async () => {
    if (!isFocused) return;
    try {
      const [responseDevices, responsePositions] = await Promise.all([
        Api.call('/api/devices', 'GET', {}, false),  
        Api.call('/api/positions', 'GET', {}, false)
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
        const response = await Api.call(`/api/devices/${editId}`, 'PUT', deviceData, false);   
        console.log("response", response);
      } else {
        await Api.call('/api/devices', 'POST', deviceData, false);
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
          <TouchableOpacity style={styles.deviceCard} 
          onPress={() => router.push({ 
            pathname: '/map', 
            params: { 
              ...item,
              disabled: item.disabled.toString()
            } 
          })}
          activeOpacity={0.85}
          >  
            <View style={styles.deviceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceNumber}>{item.name}</Text>
              </View>
              <Text style={[styles.deviceModel, { backgroundColor: item.status === 'online' ? '#43A047' : '#FF7043' }]}> 
                {item.status}
              </Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <Text style={styles.deviceDetail}>Model: {item.model || '-'}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <Text style={styles.deviceDetail}>Category: {item.category || '-'}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <Text style={styles.deviceDetail}>Contact: {item.phone || '-'}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <Text style={styles.deviceDetail}>IMEI: {item.uniqueId || '-'}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <Text style={styles.deviceDetail}>Last Update: {item.lastUpdate ? new Date(item.lastUpdate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <Text style={styles.deviceDetail}>Creation Time: {item.lastUpdate ? new Date(item.lastUpdate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <Text style={styles.deviceDetail}>Expiration Time: {item.expirationTime ? new Date(item.expirationTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</Text>
            </View>
            <View style={styles.deviceActionsRow}>
              <TouchableOpacity style={[styles.deviceActionBtn, { backgroundColor: '#43A047', flex: 1, marginRight: 6 }]} onPress={() => openEditModal(item)}>
                <Text style={styles.deviceActionBtnText}>EDIT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deviceActionBtn, { backgroundColor: '#FF7043', flex: 1, marginLeft: 6 }]} onPress={() => {}}>
                <Text style={[styles.deviceActionBtnText, { color: 'white' }]}>USERS</Text>
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
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  headerWrap: { backgroundColor: '#fff', paddingTop: 36, paddingBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 4, zIndex: 10 },
  header: { fontSize: 28, fontWeight: 'bold', alignSelf: 'center', color: '#222', letterSpacing: 1 },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 14,
    marginBottom: 16,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceNumber: {
    fontWeight: 'bold',
    fontSize: 19,
    color: '#222',
  },
  deviceName: {
    fontSize: 15,
    color: '#444',
  },
  deviceModel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  deviceDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  deviceDetail: {
    color: '#444',
    fontSize: 15,
  },
  deviceActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 0,
  },
  deviceActionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  deviceActionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  fab: { position: 'absolute', right: 24, bottom: 32, backgroundColor: '#000', borderRadius: 32, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '92%', maxHeight: '92%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#00B8D4', alignSelf: 'center', flex: 1, textAlign: 'center' },
  closeBtn: { padding: 4, marginLeft: 8 },
  formField: { marginBottom: 12 },
  label: { fontWeight: '600', color: '#222', marginBottom: 4, fontSize: 15 },
  required: { color: '#FF7043', fontWeight: 'bold' },
  input: { backgroundColor: '#F7F8FA', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E3F2FD', color: '#222' },
  pickerWrap: { backgroundColor: '#F7F8FA', borderRadius: 8, borderWidth: 1, borderColor: '#E3F2FD' },
  picker: { height: 44, width: '100%', color: '#222' },
  addBtn: { backgroundColor: '#00B8D4', borderRadius: 8, padding: 16, marginTop: 10, alignItems: 'center', shadowColor: '#00B8D4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 8, alignItems: 'center' },
  cancelBtnText: { color: '#00B8D4', fontWeight: 'bold', fontSize: 15 },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  searchInput: {
    flex: 1,
    color: '#222',
    fontSize: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
}); 