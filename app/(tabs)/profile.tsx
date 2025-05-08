import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { removeNotificationToken } from '../utils/notificationToken';




export default function DriversScreen() {
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
      onPress: () => router.push('/group-management'),
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
}); 