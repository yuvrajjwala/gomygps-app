import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const mockDevices = [
  { id: '1', vehicleNumber: 'UP15CX3953', name: 'Car 1', imei: '123456789012345', sim: '9876543210', group: 'A', model: 'GT06', driver: 'John', category: 'Car', renewal: '01/01/2025', expiration: '01/01/2026' },
  { id: '2', vehicleNumber: 'UP16AB1234', name: 'Car 2', imei: '987654321098765', sim: '8765432109', group: 'B', model: 'RDM', driver: 'Jane', category: 'Car', renewal: '01/02/2025', expiration: '01/02/2026' },
];

const groups = ['A', 'B', 'C'];
const models = ['GT06', 'RDM', 'MT200'];
const categories = ['Car', 'Truck', 'Bus'];

export default function DevicesScreen() {
  const [devices, setDevices] = useState(mockDevices);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    vehicleNumber: '',
    name: '',
    imei: '',
    identifier: '',
    sim: '',
    phone: '',
    group: '',
    model: '',
    driver: '',
    category: '',
    renewal: '',
    expiration: '',
  });
  const [search, setSearch] = useState('');

  const filteredDevices = devices.filter(d =>
    d.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.imei.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditMode(false);
    setForm({ vehicleNumber: '', name: '', imei: '', identifier: '', sim: '', phone: '', group: '', model: '', driver: '', category: '', renewal: '', expiration: '' });
    setModalVisible(true);
  };

  const openEditModal = (device: any, idx: number) => {
    setEditMode(true);
    setEditIndex(idx);
    setForm({
      vehicleNumber: device.vehicleNumber || '',
      name: device.name || '',
      imei: device.imei || '',
      identifier: device.identifier || '',
      sim: device.sim || '',
      phone: device.phone || '',
      group: device.group || '',
      model: device.model || '',
      driver: device.driver || '',
      category: device.category || '',
      renewal: device.renewal || '',
      expiration: device.expiration || '',
    });
    setModalVisible(true);
  };

  const handleAddOrEditDevice = () => {
    if (editMode && editIndex !== null) {
      const updated = [...devices];
      updated[editIndex] = { ...updated[editIndex], ...form };
      setDevices(updated);
    } else {
      setDevices([...devices, { id: Date.now().toString(), ...form }]);
    }
    setModalVisible(false);
    setEditMode(false);
    setEditIndex(null);
    setForm({ vehicleNumber: '', name: '', imei: '', identifier: '', sim: '', phone: '', group: '', model: '', driver: '', category: '', renewal: '', expiration: '' });
  };

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Devices</Text>
      </View>
      {/* Search Bar */}
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
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 12 }}
        renderItem={({ item, index }) => (
          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceIconCircle}>
                <MaterialIcons name="directions-car" size={22} color="#00B8D4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceNumber}>{item.vehicleNumber}</Text>
                <Text style={styles.deviceName}>{item.name}</Text>
              </View>
              <Text style={styles.deviceModel}>{item.model}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <MaterialIcons name="sim-card" size={16} color="#00B8D4" style={{ marginRight: 4 }} />
              <Text style={styles.deviceDetail}>SIM: {item.sim}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <MaterialIcons name="confirmation-number" size={16} color="#FFD600" style={{ marginRight: 4 }} />
              <Text style={styles.deviceDetail}>IMEI: {item.imei}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <MaterialIcons name="group" size={16} color="#43A047" style={{ marginRight: 4 }} />
              <Text style={styles.deviceDetail}>Group: {item.group}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <MaterialIcons name="person" size={16} color="#FF7043" style={{ marginRight: 4 }} />
              <Text style={styles.deviceDetail}>Driver: {item.driver}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <MaterialIcons name="category" size={16} color="#AB47BC" style={{ marginRight: 4 }} />
              <Text style={styles.deviceDetail}>Category: {item.category}</Text>
            </View>
            <View style={styles.deviceDetailsRow}>
              <MaterialIcons name="event" size={16} color="#1976D2" style={{ marginRight: 4 }} />
              <Text style={styles.deviceDetail}>Renewal: {item.renewal} | Expiry: {item.expiration}</Text>
            </View>
            {/* Action Buttons */}
            <View style={styles.deviceActionsRow}>
              <TouchableOpacity style={[styles.deviceActionBtn, { backgroundColor: '#00B8D4' }]}> 
                <MaterialIcons name="wifi" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deviceActionBtn, { backgroundColor: '#FF7043' }]} onPress={() => openEditModal(item, index)}> 
                <MaterialIcons name="edit" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      {/* Add Device Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Add/Edit Device Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header with Close Button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Device' : 'Add Device'}</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color="#00B8D4" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Form Fields */}
              <View style={styles.formField}>
                <Text style={styles.label}>Vehicle Number <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="Enter vehicle number" placeholderTextColor="#888" value={form.vehicleNumber} onChangeText={t => setForm(f => ({ ...f, vehicleNumber: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} placeholder="Enter name" placeholderTextColor="#888" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>IMEI / ID <Text style={styles.required}>*</Text></Text>
                <TextInput style={styles.input} placeholder="Enter IMEI or ID" placeholderTextColor="#888" value={form.imei} onChangeText={t => setForm(f => ({ ...f, imei: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Identifier</Text>
                <TextInput style={styles.input} placeholder="Enter identifier" placeholderTextColor="#888" value={form.identifier} onChangeText={t => setForm(f => ({ ...f, identifier: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Sim Number</Text>
                <TextInput style={styles.input} placeholder="Enter sim number" placeholderTextColor="#888" value={form.sim} onChangeText={t => setForm(f => ({ ...f, sim: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} placeholder="Enter phone" placeholderTextColor="#888" value={form.phone} onChangeText={t => setForm(f => ({ ...f, phone: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Group</Text>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={form.group} onValueChange={(v: string) => setForm(f => ({ ...f, group: v }))} style={styles.picker} dropdownIconColor="#00B8D4">
                    <Picker.Item label="Select group" value="" />
                    {groups.map(g => <Picker.Item key={g} label={g} value={g} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Model <Text style={styles.required}>*</Text></Text>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={form.model} onValueChange={(v: string) => setForm(f => ({ ...f, model: v }))} style={styles.picker} dropdownIconColor="#00B8D4">
                    <Picker.Item label="Select a model" value="" />
                    {models.map(m => <Picker.Item key={m} label={m} value={m} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Driver Contact</Text>
                <TextInput style={styles.input} placeholder="Enter contact" placeholderTextColor="#888" value={form.driver} onChangeText={t => setForm(f => ({ ...f, driver: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={form.category} onValueChange={(v: string) => setForm(f => ({ ...f, category: v }))} style={styles.picker} dropdownIconColor="#00B8D4">
                    <Picker.Item label="Car" value="Car" />
                    {categories.map(c => c !== 'Car' && <Picker.Item key={c} label={c} value={c} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Next Renewal</Text>
                <TextInput style={styles.input} placeholder="dd/mm/yyyy" placeholderTextColor="#888" value={form.renewal} onChangeText={t => setForm(f => ({ ...f, renewal: t }))} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Expiration Date</Text>
                <TextInput style={styles.input} placeholder="dd/mm/yyyy" placeholderTextColor="#888" value={form.expiration} onChangeText={t => setForm(f => ({ ...f, expiration: t }))} />
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