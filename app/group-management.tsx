import Api from '@/config/Api';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get("window");

interface Group {
  id: string;
  name: string;
  groupId: string | null;
  children?: Group[];
  hasChildren?: boolean;
  depth?: number;
}

export default function GroupManagement() {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const router = useRouter();

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

  const filteredGroups = groups.filter(
    (g) => g.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <View style={styles.groupCardActions}>
            <TouchableOpacity
              style={styles.groupActionBtn}
              onPress={() => handleEditGroup(item)}
            >
              <MaterialIcons name="edit" size={22} color="#2979FF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.groupActionBtn}
              onPress={() => handleDeleteGroup(item.id)}
            >
              <MaterialIcons name="delete" size={22} color="#FF3D00" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      <View style={{ flex: 1, marginTop: 40 }}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerText, { textAlign: "center" }]}>
            Group Management
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={{ flex: 1, paddingBottom: 50, backgroundColor: "#000000", paddingHorizontal: 15 }}>
          <TextInput
            style={styles.groupSearchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search groups..."
            placeholderTextColor="#888"
            autoCapitalize="none"
          />
          <FlatList
            data={filteredGroups}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 2 }}
            renderItem={renderGroupItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No groups found.</Text>
            }
          />
          <TouchableOpacity
            style={styles.addUserFab}
            onPress={handleAddGroup}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={mode !== 'list'}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setMode('list')}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {mode === 'edit' ? "Edit Group" : "Add Group"}
                </Text>
                <TouchableOpacity
                  onPress={() => setMode('list')}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
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
                    style={{ color: "#fff" }}
                  >
                    <Picker.Item label="None" value={null} />
                    {getAvailableParentGroups(mode === 'edit' ? selectedGroup?.id : undefined).map(group => (
                      <Picker.Item key={group.id} label={group.name} value={group.id} />
                    ))}
                  </Picker>
                </View>
              </ScrollView>

              <View style={styles.geoAddBtnRow}>
                <TouchableOpacity
                  style={styles.geoAddSaveBtn}
                  onPress={handleSaveGroup}
                >
                  <MaterialIcons name="save" size={22} color="#fff" />
                  <Text style={styles.geoAddSaveText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.geoAddCancelBtn}
                  onPress={() => setMode('list')}
                >
                  <MaterialIcons name="close" size={22} color="#fff" />
                  <Text style={styles.geoAddCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: "#000000",
    paddingBottom: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "gray",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  groupInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupDetails: {
    marginLeft: 16,
    flex: 1,
  },
  groupCardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  groupActionBtn: {
    padding: 6,
    marginLeft: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 18,
    letterSpacing: 0.3,
  },
  groupSearchInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  addUserFab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    zIndex: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#000000",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: height - 200,
  },
  geoAddLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
    marginTop: 10,
  },
  geoAddInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  parentGroupSelector: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  geoAddBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  geoAddSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 10,
    paddingVertical: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  geoAddSaveText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  geoAddCancelBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 12,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#333",
  },
  geoAddCancelText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expandButton: {
    padding: 4,
    marginRight: 4,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
}); 