import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

interface ConnectionsFormProps {
  id: string | null;
  open: boolean;
  onClose: () => void;
  type?: string;
}

const ConnectionsForm: React.FC<ConnectionsFormProps> = ({
  id,
  open,
  onClose,
  type = 'userId',
}) => {
  const [allDevices, setAllDevices] = useState([]);
  const [allGeofences, setAllGeofences] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGeofences, setSelectedGeofences] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const reqJSON = { [type]: id };

  const getSelectedDevices = async () => {
    try {
      const res = await Api.call(`/api/devices?${type}=` + id, 'GET', {}, false);
      setSelectedDevices(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getSelectedGroups = async () => {
    try {
      const res = await Api.call(`/api/groups?${type}=` + id, 'GET', {}, false);
      setSelectedGroups(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getSelectedUsers = async () => {
    try {
      const res = await Api.call(`/api/users?${type}=` + id, 'GET', {}, false);
      setSelectedUsers(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getSelectedGeofences = async () => {
    try {
      const res = await Api.call(`/api/geofences?${type}=` + id, 'GET', {}, false);
      setSelectedGeofences(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getSelectedNotifications = async () => {
    try {
      const res = await Api.call(`/api/notifications?${type}=` + id, 'GET', {}, false);
      setSelectedNotifications(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const addDevice = async (deviceId: string) => {
    try {
      await Api.call('/api/permissions', 'POST', { ...reqJSON, deviceId }, false);
      getSelectedDevices();
    } catch (err) {
      console.error('Error adding device');
    }
  };

  const addGeofence = async (geofenceId: string) => {
    try {
      await Api.call('/api/permissions', 'POST', { ...reqJSON, geofenceId }, false);
      getSelectedGeofences();
    } catch (err) {
      console.error('Error adding geofence');
    }
  };

  const addGroup = async (groupId: string) => {
    try {
      await Api.call('/api/permissions', 'POST', { ...reqJSON, groupId }, false);
      getSelectedGroups();
    } catch (err) {
      console.error('Error adding group');
    }
  };

  const addUser = async (userId: string) => {
    try {
      await Api.call('/api/permissions', 'POST', { userId: userId, ...reqJSON }, false);
      getSelectedUsers();
    } catch (err) {
      console.error('Error adding user');
    }
  };

  const addNotification = async (notificationId: string) => {
    try {
      await Api.call('/api/permissions', 'POST', { ...reqJSON, notificationId }, false);
      getSelectedNotifications();
    } catch (err) {
      console.error('Error adding notification');
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      await Api.call('/api/permissions', 'DELETE', { ...reqJSON, deviceId }, false);
      getSelectedDevices();
    } catch (err) {
      console.error('Error deleting device');
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await Api.call('/api/permissions', 'DELETE', { ...reqJSON, groupId }, false);
      getSelectedGroups();
    } catch (err) {
      console.error('Error deleting group');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await Api.call('/api/permissions', 'DELETE', { userId: userId, ...reqJSON }, false);
      getSelectedUsers();
    } catch (err) {
      console.error('Error deleting user');
    }
  };

  const deleteGeofence = async (geofenceId: string) => {
    try {
      await Api.call('/api/permissions', 'DELETE', { geofenceId: geofenceId, ...reqJSON }, false);
      getSelectedGeofences();
    } catch (err) {
      console.error('Error deleting geofence');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await Api.call('/api/permissions', 'DELETE', { ...reqJSON, notificationId }, false);
      getSelectedNotifications();
    } catch (err) {
      console.error('Error deleting notification');
    }
  };

  const getAllGeofences = async () => {
    try {
      const res = await Api.call('/api/geofences', 'GET', {}, false);
      setAllGeofences(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllNotifications = async () => {
    try {
      const res = await Api.call('/api/notifications?all=true', 'GET', {}, false);
      setAllNotifications(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllGeofences();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesRes, groupsRes, usersRes] = await Promise.all([
          Api.call('/api/devices', 'GET', {}, false),
          Api.call('/api/groups', 'GET', {}, false),
          Api.call('/api/users', 'GET', {}, false),
        ]);
        setAllDevices(devicesRes.data);
        setGroups(groupsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      getSelectedDevices();
      getSelectedGroups();
      getSelectedUsers();
      getSelectedGeofences();
      getSelectedNotifications();
    }
  }, [id]);

  useEffect(() => {
    getAllNotifications();
  }, []);

  if (!open && !id) return null;

  const renderBadge = (item: any, onDelete: () => void) => (
    <TouchableOpacity
      key={item.id}
      style={styles.badge}
      onPress={onDelete}
    >
      <Text style={styles.badgeText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSection = (
    title: string,
    items: any[],
    onDelete: (id: string) => void,
    onAdd: (id: string) => void,
    allItems: any[]
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.badgeContainer}>
        {items.map((item) => renderBadge(item, () => onDelete(item.id)))}
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue=""
          onValueChange={(value) => value && onAdd(value)}
          style={styles.picker}
        >
          <Picker.Item label={`Select ${title}`} value="" />
          {allItems.map((item) => (
            <Picker.Item key={item.id} label={item.name} value={item.id} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Connections</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content}>
            {renderSection('Geofences', selectedGeofences, deleteGeofence, addGeofence, allGeofences)}
            {renderSection('Devices', selectedDevices, deleteDevice, addDevice, allDevices)}
            {renderSection('Groups', selectedGroups, deleteGroup, addGroup, groups)}
            {renderSection('Users', selectedUsers, deleteUser, addUser, users)}
            {renderSection('Notifications', selectedNotifications, deleteNotification, addNotification, allNotifications)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: height - 200,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  badgeText: {
    color: '#000000',
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    color: '#000000',
  },
});

export default ConnectionsForm; 