import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Group {
  id: string;
  name: string;
  groupId: string | null;
  children?: Group[];
  hasChildren?: boolean;
  depth?: number;
}

export default function GroupManagement({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchGroups = async () => {
    try {
      const response = await Api.call('/api/groups', 'GET', {}, false);
      setGroups(response.data);
      setMode('list');
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to fetch groups');
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = () => {
    setMode('add');
    setGroupName('');
    setSelectedParentId(null);
    setSelectedGroup(null);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setSelectedParentId(group.groupId);
    setMode('edit');
  };

  const wouldCreateCycle = (groupId: string, newParentId: string | null): boolean => {
    if (!newParentId) return false;
    if (groupId === newParentId) return true;
    
    const parentGroup = groups.find(g => g.id === newParentId);
    if (!parentGroup) return false;
    
    let currentParentId = parentGroup.groupId;
    while (currentParentId) {
      if (currentParentId === groupId) return true;
      const nextParent = groups.find(g => g.id === currentParentId);
      if (!nextParent) break;
      currentParentId = nextParent.groupId;
    }
    return false;
  };

  const getAvailableParentGroups = (currentGroupId?: string): Group[] => {
    return groups.filter(group => {
      if (currentGroupId && group.id === currentGroupId) return false;
      if (currentGroupId && wouldCreateCycle(currentGroupId, group.id)) return false;
      return true;
    });
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;

    try {
      if (mode === 'edit' && selectedGroup && wouldCreateCycle(selectedGroup.id, selectedParentId)) {
        Alert.alert('Error', 'Cannot set this parent group as it would create a cycle in the hierarchy');
        return;
      }

      const groupData = {
        name: groupName.trim(),
        groupId: selectedParentId
      };

      if (mode === 'edit' && selectedGroup) {
        await Api.call(`/api/groups/${selectedGroup.id}`, 'PUT', groupData, false);
      } else {
        await Api.call('/api/groups', 'POST', groupData, false);
      }

      await fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      Alert.alert('Error', 'Failed to save group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    const hasChildren = groups.some(g => g.groupId === groupId);

    if (hasChildren) {
      Alert.alert('Error', 'Cannot delete group with sub-groups');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Api.call(`/api/groups/${groupId}`, 'DELETE', {}, false);
              await fetchGroups();
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group');
            }
          }
        }
      ]
    );
  };

  const buildTreeStructure = (items: Group[]): Group[] => {
    const itemMap: { [key: string]: Group } = {};
    const roots: Group[] = [];

    items.forEach(item => {
      itemMap[item.id] = { ...item, children: [], hasChildren: false };
    });

    items.forEach(item => {
      if (!item.groupId) {
        roots.push(itemMap[item.id]);
      } else {
        const parent = itemMap[item.groupId];
        if (parent) {
          parent.children?.push(itemMap[item.id]);
          parent.hasChildren = true;
        }
      }
    });

    return roots;
  };

  const flattenTree = (nodes: Group[], depth = 0): Group[] => {
    return nodes.reduce((flat: Group[], node) => {
      const shouldShowChildren = expandedRows.has(node.id);
      return [
        ...flat,
        { ...node, depth },
        ...(shouldShowChildren && node.children ? flattenTree(node.children, depth + 1) : [])
      ];
    }, []);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const treeData = buildTreeStructure(groups);
  const flattenedData = flattenTree(treeData);

  const renderGroupItem = ({ item }: { item: Group }) => {
    const depth = item.depth || 0;
    const hasChildren = item.hasChildren;
    const isExpanded = expandedRows.has(item.id);

    return (
      <View style={[styles.groupCard, { marginLeft: depth * 20 }]}>
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            {hasChildren && (
              <TouchableOpacity
                onPress={() => toggleRow(item.id)}
                style={styles.expandButton}
              >
                <MaterialIcons
                  name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            )}
            <MaterialIcons name="group" size={28} color="#FFD600" />
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{item.name}</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditGroup(item)}
            >
              <MaterialIcons name="edit" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteGroup(item.id)}
            >
              <MaterialIcons name="delete" size={20} color="#FF7043" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Group Management</Text>
      </View>
      {mode === 'list' ? (
        <View style={{ flex: 1, paddingBottom: 50 }}>
          <FlatList
            data={flattenedData}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 18 }}
            renderItem={renderGroupItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No groups found.</Text>
            }
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
                {getAvailableParentGroups(mode === 'edit' ? selectedGroup?.id : undefined).map(group => (
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

const styles = StyleSheet.create({
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 12
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  expandButton: {
    padding: 4,
    marginRight: 4
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    padding: 8
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40
  }
}); 