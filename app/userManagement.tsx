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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConnectionsForm from "./components/ConnectionsForm";
const { height } = Dimensions.get("window");

const DEFAULT_MAP_OPTIONS = [
  "LocationIQ Streets",
  "LocationIQ Dark",
  "OpenStreetMap",
  "OpenTopoMap",
  "Carto Basemaps",
  "Google Road",
  "Google Satellite",
  "Google Hybrid",
  "AutoNavi",
  "Ordnance Survey",
];

const COORDINATES_FORMAT_OPTIONS = [
  "Decimal Degrees",
  "Degrees Decimal Minutes",
  "Degrees Minutes Seconds",
];

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  readonly: boolean;
  administrator: boolean;
  map?: string;
  latitude?: string;
  longitude?: string;
  zoom?: string;
  coordinateFormat?: string;
  expirationTime?: string;
  deviceLimit: number;
  userLimit: number;
  deviceReadonly: boolean;
  disabled: boolean;
  limitCommands: boolean;
  fixedEmail: boolean;
  poiLayer?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  readonly: boolean;
  administrator: boolean;
  map: string;
  latitude: string;
  longitude: string;
  zoom: string;
  coordinateFormat: string;
  expirationTime: string;
  deviceLimit: string;
  userLimit: string;
  deviceReadonly: boolean;
  disabled: boolean;
  limitCommands: boolean;
  fixedEmail: boolean;
  poiLayer: string;
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    readonly: true,
    administrator: false,
    map: "",
    latitude: "",
    longitude: "",
    zoom: "",
    coordinateFormat: "",
    expirationTime: new Date().toISOString().split("T")[0],
    deviceLimit: "0",
    userLimit: "0",
    deviceReadonly: false,
    disabled: false,
    limitCommands: false,
    fixedEmail: false,
    poiLayer: "",
  });
  const router = useRouter();
  const getUsers = async () => {
    try {
      const res = await Api.call(`/api/users`, "GET", {}, false);
      setUsers(res.data);
      setAddModal(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      readonly: true,
      administrator: false,
      map: "",
      latitude: "",
      longitude: "",
      zoom: "",
      coordinateFormat: "",
      expirationTime: new Date().toISOString().split("T")[0],
      deviceLimit: "0",
      userLimit: "0",
      deviceReadonly: false,
      disabled: false,
      limitCommands: false,
      fixedEmail: false,
      poiLayer: "",
    });
    setAddModal(true);
  };

  const handleEditUser = (user: User) => {
    const expirationDate = user.expirationTime
      ? new Date(user.expirationTime as string)
      : new Date();
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      readonly: user.readonly || false,
      administrator: user.administrator || false,
      map: user.map || "",
      latitude: String(user.latitude) || "",
      longitude: String(user.longitude) || "",
      zoom: String(user.zoom) || "",
      coordinateFormat: user.coordinateFormat || "",
      expirationTime: expirationDate.toISOString().split("T")[0],
      deviceLimit: String(user.deviceLimit) || "0",
      userLimit: String(user.userLimit) || "0",
      deviceReadonly: user.deviceReadonly || false,
      disabled: user.disabled || false,
      limitCommands: user.limitCommands || false,
      fixedEmail: user.fixedEmail || false,
      poiLayer: user.poiLayer || "",
    });
    setAddModal(true);
  };

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        await Api.call(
          `/api/users/${selectedUser.id}`,
          "PUT",
          {
            ...formData,
            id: selectedUser.id,
          },
          false
        );
      } else {
        await Api.call("/api/users", "POST", formData, false);
      }
      getUsers();
      setAddModal(false);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteUser = async (id: string) => {
    Alert.alert("Delete User", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await Api.call(`/api/users/${id}`, "DELETE", {}, false);
          getUsers();
        } catch (error) {
          console.log(error);
        }
        },
      },
    ]);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.name}
            <Text style={{ color: "green", fontSize: 12, fontWeight: "bold" }}>
             {" "} (
              {item.administrator
                ? "Admin"
                : item.readonly
                ? "Read Only"
                : "Write"}
              )
            </Text>
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <Text style={styles.userLimits}>
              Devices: {item.deviceLimit} • Users: {item.userLimit}
            </Text>
          </View>
          <Text style={styles.userExpiration}>
            Expires:{" "}
            {new Date(item?.expirationTime || new Date()).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.userCardActions}>
          <TouchableOpacity
            onPress={() => {
              setSelectedUserId(item.id);
              setConnectionModalOpen(true);
            }}
            style={styles.userActionBtn}
          >
            <MaterialIcons name="link" size={22} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleEditUser(item)}
            style={styles.userActionBtn}
          >
            <MaterialIcons name="edit" size={22} color="#2979FF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteUser(item.id)}
            style={styles.userActionBtn}
          >
            <MaterialIcons name="delete" size={22} color="#FF3D00" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardButtonsContainer}>
        <TouchableOpacity style={styles.cardButton}>
          <Text style={styles.cardButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardButton}>
          <Text style={styles.cardButtonText}>Devices</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      <View style={{ flex: 1, marginTop: 40 }}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerText, { textAlign: "center" }]}>
            User Management
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <View
          style={{
            flex: 1,
            paddingBottom: 50,
            backgroundColor: "#000000",
            paddingHorizontal: 15,
          }}
        >
          <TextInput
            style={styles.userSearchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
            placeholderTextColor="#888"
            autoCapitalize="none"
          />
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 2 }}
            renderItem={renderUserItem}
            ListEmptyComponent={
              <Text
                style={{ color: "#888", textAlign: "center", marginTop: 40 }}
              >
                No users found.
              </Text>
            }
          />
          <TouchableOpacity
            style={styles.addUserFab}
            onPress={handleAddUser}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={addModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedUser ? "Edit User" : "Add User"}
                </Text>
                <TouchableOpacity
                  onPress={() => setAddModal(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.geoAddLabel}>Name</Text>
                <TextInput
                  style={styles.geoAddInput}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter full name"
                  placeholderTextColor="#888"
                />

                <Text style={styles.geoAddLabel}>Email</Text>
                <TextInput
                  style={styles.geoAddInput}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="Enter email"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {!selectedUser && (
                  <>
                    <Text style={styles.geoAddLabel}>Password</Text>
                    <TextInput
                      style={styles.geoAddInput}
                      value={formData.password}
                      onChangeText={(text) =>
                        setFormData({ ...formData, password: text })
                      }
                      placeholder="Enter password"
                      placeholderTextColor="#888"
                      secureTextEntry
                    />
                  </>
                )}

                <Text style={styles.geoAddLabel}>Phone</Text>
                <TextInput
                  style={styles.geoAddInput}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Enter phone number"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                />

                <Text style={styles.geoAddLabel}>Default Map</Text>
                <View style={styles.parentGroupSelector}>
                  <Picker
                    selectedValue={formData.map}
                    onValueChange={(value) =>
                      setFormData({ ...formData, map: value })
                    }
                    style={{ color: "#fff" }}
                  >
                    <Picker.Item label="Select default map" value="" />
                    {DEFAULT_MAP_OPTIONS.map((option) => (
                      <Picker.Item key={option} label={option} value={option} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.geoAddLabel}>Coordinates Format</Text>
                <View style={styles.parentGroupSelector}>
                  <Picker
                    selectedValue={formData.coordinateFormat}
                    onValueChange={(value) =>
                      setFormData({ ...formData, coordinateFormat: value })
                    }
                    style={{ color: "#fff" }}
                  >
                    <Picker.Item label="Select coordinates format" value="" />
                    {COORDINATES_FORMAT_OPTIONS.map((option) => (
                      <Picker.Item key={option} label={option} value={option} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.geoAddLabel}>Expiration Date</Text>
                <TextInput
                  style={styles.geoAddInput}
                  value={formData.expirationTime}
                  onChangeText={(text) =>
                    setFormData({ ...formData, expirationTime: text })
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#888"
                />

                <Text style={styles.geoAddLabel}>Device Limit</Text>
                <TextInput
                  style={styles.geoAddInput}
                  value={formData.deviceLimit}
                  onChangeText={(text) =>
                    setFormData({ ...formData, deviceLimit: text })
                  }
                  placeholder="Enter device limit"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />

                <Text style={styles.geoAddLabel}>User Limit</Text>
                <TextInput
                  style={styles.geoAddInput}
                  value={formData.userLimit}
                  onChangeText={(text) =>
                    setFormData({ ...formData, userLimit: text })
                  }
                  placeholder="Enter user limit"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() =>
                      setFormData({ ...formData, readonly: !formData.readonly })
                    }
                  >
                    <MaterialIcons
                      name={
                        formData.readonly
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.checkboxLabel}>Read Only</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        administrator: !formData.administrator,
                      })
                    }
                  >
                    <MaterialIcons
                      name={
                        formData.administrator
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.checkboxLabel}>Administrator</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        deviceReadonly: !formData.deviceReadonly,
                      })
                    }
                  >
                    <MaterialIcons
                      name={
                        formData.deviceReadonly
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.checkboxLabel}>Device Read Only</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() =>
                      setFormData({ ...formData, disabled: !formData.disabled })
                    }
                  >
                    <MaterialIcons
                      name={
                        formData.disabled
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.checkboxLabel}>Disabled</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.geoAddBtnRow}>
                <TouchableOpacity
                  style={styles.geoAddSaveBtn}
                  onPress={handleSaveUser}
                >
                  <MaterialIcons name="save" size={22} color="#fff" />
                  <Text style={styles.geoAddSaveText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.geoAddCancelBtn}
                  onPress={() => setAddModal(false)}
                >
                  <MaterialIcons name="close" size={22} color="#fff" />
                  <Text style={styles.geoAddCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {selectedUserId && (
          <ConnectionsForm
            id={selectedUserId}
            open={connectionModalOpen}
          onClose={() => {
            setConnectionModalOpen(false);
            setSelectedUserId(null);
          }}
            type="userId"
          />
        )}
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
    paddingTop: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
  },
  userCardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  userActionBtn: {
    padding: 6,
    marginLeft: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 18,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginLeft: 18,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 18,
  },
  userRole: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  userLimits: {
    fontSize: 12,
    color: "#666",
  },
  userExpiration: {
    fontSize: 12,
    color: "#666",
    marginLeft: 18,
  },
  userSearchInput: {
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
  checkboxContainer: {
    marginTop: 16,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: "#FFFFFF",
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
  cardButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 18,
    gap: 8,
  },
  cardButton: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
