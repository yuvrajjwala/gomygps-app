import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { removeNotificationToken } from '../utils/notificationToken';
const { width, height } = Dimensions.get('window');


const mockGroups = [
  { id: '1', name: 'Fleet A', parentId: null },
  { id: '2', name: 'Fleet B', parentId: null },
  { id: '3', name: 'Trucks', parentId: '1' },
  { id: '4', name: 'Vans', parentId: '1' },
  { id: '5', name: 'Cars', parentId: '2' },
];

const mockUsers = [
  { 
    id: '1', 
    name: 'John Doe', 
    userId: 'john.doe',
    email: 'john@example.com',
    role: 'admin',
    deviceLimit: 10,
    userLimit: 5,
    expiration: '2024-12-31'
  },
  { 
    id: '2', 
    name: 'Jane Smith', 
    userId: 'jane.smith',
    email: 'jane@example.com',
    role: 'readonly',
    deviceLimit: 5,
    userLimit: 0,
    expiration: '2024-06-30'
  },
];


function GroupManagementScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [groups, setGroups] = useState(mockGroups);
  const [groupName, setGroupName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const handleAddGroup = () => {
    setMode('add');
    setGroupName('');
    setSelectedParentId(null);
  };

  const handleSaveGroup = () => {
    if (groupName.trim()) {
      setGroups([...groups, {
        id: Date.now().toString(),
        name: groupName.trim(),
        parentId: selectedParentId
      }]);
      setMode('list');
    }
  };

  const getParentGroup = (parentId: string | null) => {
    if (!parentId) return null;
    return groups.find(g => g.id === parentId);
  };

  const renderGroupItem = ({ item }: { item: typeof mockGroups[0] }) => {
    const parentGroup = getParentGroup(item.parentId);
    return (
      <View style={styles.groupCard}>
        <View style={styles.groupInfo}>
          <MaterialIcons name="group" size={28} color="#FFD600" />
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{item.name}</Text>
            {parentGroup && (
              <Text style={styles.parentGroupName}>Parent: {parentGroup.name}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={{ position: 'absolute', left: 0, top: 0, height: '100%', justifyContent: 'center', paddingLeft: 12 }} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerText, { textAlign: 'center' }]}>Group Management</Text>
      </View>
      {mode === 'list' ? (
        <View style={{ flex: 1, paddingBottom: 50 }}>
          <FlatList
            data={groups}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 18 }}
            renderItem={renderGroupItem}
            ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No groups found.</Text>}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddGroup}>
            <MaterialIcons name="add" size={26} color="#fff" />
            <Text style={styles.addBtnText}>Add Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1, padding: 18 }}>
          <View style={styles.addGroupPanel}>
            <Text style={styles.geoAddLabel}>Group Name</Text>
            <TextInput
              style={styles.geoAddInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor="#888"
              maxLength={32}
            />
            <Text style={styles.geoAddLabel}>Parent Group (Optional)</Text>
            <View style={styles.parentGroupSelector}>
              <Picker
                selectedValue={selectedParentId}
                onValueChange={(value) => setSelectedParentId(value)}
                style={{ color: '#222' }}
              >
                <Picker.Item label="None" value={null} />
                {groups.map(group => (
                  <Picker.Item key={group.id} label={group.name} value={group.id} />
                ))}
              </Picker>
            </View>
            <View style={styles.geoAddBtnRow}>
              <TouchableOpacity style={styles.geoAddSaveBtn} onPress={handleSaveGroup}>
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


export default function DriversScreen() {
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const dispatch = useDispatch();
  const options = [
    {
      label: 'Geofencing',
      icon: 'my-location',
      color: '#43A047',
      onPress: () => router.push('/geofencing'),
    },
    {
      label: 'User Management',
      icon: 'person',
      color: '#2979FF',
      onPress: () => router.push('/userManagement'),
    },
    {
      label: 'Group Management',
      icon: 'group',
      color: '#FFD600',
      onPress: () => setShowGroupManagement(true),
    },
    {
      label: 'Help & Support',
      icon: 'help-outline',
      color: '#FF7043',
      onPress: () => {},
    },
    {
      label: 'Logout',
      icon: 'logout',
      color: '#FF3D00',
      onPress: async () => {
        await removeNotificationToken();
        dispatch(logout()); 
        router.replace('/login');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      { showGroupManagement ? (
        <GroupManagementScreen onBack={() => setShowGroupManagement(false)} />
      )  : (
        <>
          <View style={styles.headerBar}>
            <Text style={styles.headerText}>Settings</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.optionCard}
                activeOpacity={0.8}
                onPress={opt.onPress}
              >
                <View style={[styles.iconCircle, { backgroundColor: opt.color + '22' }]}>
                  <MaterialIcons name={opt.icon as any} size={28} color={opt.color} />
                </View>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <MaterialIcons name="chevron-right" size={26} color="#bbb" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
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
}); 