import Api from "@/config/Api";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchGroups = async () => {
    try {
      const response = await Api.call("/api/groups", "GET", {}, false);
      setGroups(response.data);
      setMode("list");
    } catch (error) {
      console.error("Error fetching groups:", error);
      Alert.alert("Error", "Failed to fetch groups");
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = () => {
    setMode("add");
    setGroupName("");
    setSelectedParentId(null);
    setSelectedGroup(null);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setSelectedParentId(group.groupId);
    setMode("edit");
  };

  const wouldCreateCycle = (
    groupId: string,
    newParentId: string | null
  ): boolean => {
    if (!newParentId) return false;
    if (groupId === newParentId) return true;

    const parentGroup = groups.find((g) => g.id === newParentId);
    if (!parentGroup) return false;

    let currentParentId = parentGroup.groupId;
    while (currentParentId) {
      if (currentParentId === groupId) return true;
      const nextParent = groups.find((g) => g.id === currentParentId);
      if (!nextParent) break;
      currentParentId = nextParent.groupId;
    }
    return false;
  };

  const getAvailableParentGroups = (currentGroupId?: string): Group[] => {
    return groups.filter((group) => {
      if (currentGroupId && group.id === currentGroupId) return false;
      if (currentGroupId && wouldCreateCycle(currentGroupId, group.id))
        return false;
      return true;
    });
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;

    try {
      if (
        mode === "edit" &&
        selectedGroup &&
        wouldCreateCycle(selectedGroup.id, selectedParentId)
      ) {
        Alert.alert(
          "Error",
          "Cannot set this parent group as it would create a cycle in the hierarchy"
        );
        return;
      }

      const groupData = {
        name: groupName.trim(),
        groupId: selectedParentId,
      };

      if (mode === "edit" && selectedGroup) {
        await Api.call(
          `/api/groups/${selectedGroup.id}`,
          "PUT",
          groupData,
          false
        );
      } else {
        await Api.call("/api/groups", "POST", groupData, false);
      }

      await fetchGroups();
    } catch (error) {
      console.error("Error saving group:", error);
      Alert.alert("Error", "Failed to save group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    const hasChildren = groups.some((g) => g.groupId === groupId);

    if (hasChildren) {
      Alert.alert("Error", "Cannot delete group with sub-groups");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Api.call(`/api/groups/${groupId}`, "DELETE", {}, false);
              await fetchGroups();
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "Failed to delete group");
            }
          },
        },
      ]
    );
  };

  const buildTreeStructure = (items: Group[]): Group[] => {
    const itemMap: { [key: string]: Group } = {};
    const roots: Group[] = [];

    items.forEach((item) => {
      itemMap[item.id] = { ...item, children: [], hasChildren: false };
    });

    items.forEach((item) => {
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
        ...(shouldShowChildren && node.children
          ? flattenTree(node.children, depth + 1)
          : []),
      ];
    }, []);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
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

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderGroupItem = ({ item }: { item: Group }) => {
    const depth = item.depth || 0;
    const hasChildren = item.hasChildren;
    const isExpanded = expandedRows.has(item.id);
    const childCount = item.children?.length || 0;

    return (
      <View style={[styles.groupCard,]}>
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            {hasChildren && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleRow(item.id)}
              >
                <MaterialIcons
                  name={isExpanded ? "expand-more" : "chevron-right"}
                  size={30}
                  color="#000000"
                />
              </TouchableOpacity>
            )}
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>
                {item.name}
                {hasChildren && ` (${childCount})`}
              </Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={26} color="#000000" />
        </TouchableOpacity>
        <Text style={[styles.headerText, { textAlign: "center" }]}>
          Groups
        </Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={{ flex: 1, paddingBottom: 10, backgroundColor: "#ffffff", paddingHorizontal: 15 }}>
        <View style={styles.searchBarWrap}>
          <MaterialIcons
            name="search"
            size={20}
            color="#bbb"
            style={{ marginLeft: 8, marginRight: 4 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
        <FlatList
          data={flattenedData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 2 }}
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

      <Modal
        visible={mode !== "list"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMode("list")}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mode === "edit" ? "Edit Group" : "Add Group"}
              </Text>
              <TouchableOpacity
                onPress={() => setMode("list")}
                style={styles.closeBtn}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.label}>
                  Group Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Enter group name"
                  placeholderTextColor="#888"
                  maxLength={32}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Parent Group</Text>
                <View style={styles.parentGroupSelector}>
                  <Picker
                    selectedValue={selectedParentId}
                    onValueChange={(value) => setSelectedParentId(value)}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="None" value={null} />
                    {getAvailableParentGroups(
                      mode === "edit" ? selectedGroup?.id : undefined
                    ).map((group) => (
                      <Picker.Item
                        key={group.id}
                        label={group.name}
                        value={group.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={handleSaveGroup}>
                <Text style={styles.addBtnText}>
                  {mode === "edit" ? "Save Changes" : "Add Group"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setMode("list")}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  searchInput: {
    flex: 1,
    color: "#222",
    fontSize: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
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
    flex: 1,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 18,
    letterSpacing: 0.3,
    textTransform: "capitalize",
  },
  groupCardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupActionBtn: {
    padding: 8,
    marginLeft: 8,
  },
  expandButton: {
    padding: 4,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  addBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "95%",
    maxHeight: "97%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    alignSelf: "center",
    flex: 1,
    textAlign: "center",
  },
  closeBtn: { padding: 4, marginLeft: 8 },
  formField: { marginBottom: 12 },
  label: { fontWeight: "600", color: "#222", marginBottom: 4, fontSize: 15 },
  required: { color: "#FF7043", fontWeight: "bold" },
  input: {
    backgroundColor: "#F7F8FA",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    color: "#222",
  },
  parentGroupSelector: {
    backgroundColor: "#F7F8FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    marginBottom: 8,
  },
  cancelBtn: { marginTop: 8, alignItems: "center" },
  cancelBtnText: { color: "#000", fontWeight: "bold", fontSize: 15 },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
  backButton: {
    padding: 4,
  },
});
