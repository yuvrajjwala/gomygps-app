import UsersModal from "@/app/components/UsersModal";
import Api from "@/config/Api";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ListRenderItem,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";
import { setDevices, setLoading } from "../store/slices/deviceSlice";
import { RootState } from "../store/store";

const CATEGORY_OPTIONS = [
  "Default",
  "Animal",
  "Bicycle",
  "Boat",
  "Bus",
  "Car",
  "Camper",
  "Crane",
  "Helicopter",
  "Motorcycle",
  "Offroad",
  "Person",
  "Pickup",
  "Plane",
  "Ship",
  "Tractor",
  "Train",
  "Tram",
  "Trolleybus",
  "Truck",
  "Van",
  "Scooter",
];

const schema = z.object({
  name: z.string().trim().nonempty("Name cannot be empty"),
  uniqueId: z.string().trim().nonempty("Unique ID cannot be empty"),
  groupId: z.string().trim().optional(),
  phone: z.string().trim().regex(/^\d+$/, "Phone must contain numbers only"),
  model: z.string().trim().nonempty("Model cannot be empty"),
  contact: z.string().trim().optional(),
  category: z.string().trim(),
  lastUpdate: z.string().trim().optional(),
  expirationTime: z.string().trim().optional(),
  disabled: z.boolean().optional(),
  attributes: z
    .object({
      is_mobilized: z.boolean().optional(),
    })
    .optional(),
});

interface DropdownItem {
  label: string;
  value: string;
}

interface Group {
  id: number;
  name: string;
  groupId: number | null;
  children?: Group[];
}

// Add TypeScript interfaces for better type safety
interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  disabled: boolean;
  phone: string;
  model: string;
  contact: string;
  category: string;
  lastUpdate: string;
  expirationTime: string;
  groupId: string;
  attributes: {
    is_mobilized: boolean;
  };
}

interface DeviceFormData {
  name: string;
  uniqueId: string;
  status: string;
  disabled: boolean;
  phone: string;
  model: string;
  contact: string;
  category: string;
  lastUpdate: string;
  expirationTime: string;
  groupId: string;
  attributes: {
    is_mobilized: boolean;
  };
}

// Memoized Device Card Component
const DeviceCard = memo(({ 
  device, 
  onPress, 
  onEdit, 
  onUsers 
}: { 
  device: any; 
  onPress: () => void;
  onEdit: () => void;
  onUsers: () => void;
}) => (
  <TouchableOpacity
    style={styles.deviceCard}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.deviceRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.deviceNumber}>{device.name}</Text>
      </View>
      <Text
        style={[
          styles.deviceModel,
          {
            backgroundColor:
              device.status === "online" ? "#43A047" : "#FF7043",
          },
        ]}
      >
        {device.status}
      </Text>
    </View>
    <View style={styles.deviceDetailsRow}>
      <Text style={styles.deviceDetail}>
        Model: {device.model || "-"}
      </Text>
    </View>
    <View style={styles.deviceDetailsRow}>
      <Text style={styles.deviceDetail}>
        Category: {device.category || "-"}
      </Text>
    </View>
    <View style={styles.deviceDetailsRow}>
      <Text style={styles.deviceDetail}>
        Contact: {device.phone || "-"}
      </Text>
    </View>
    <View style={styles.deviceDetailsRow}>
      <Text style={styles.deviceDetail}>
        IMEI: {device.uniqueId || "-"}
      </Text>
    </View>
    <View style={styles.deviceDetailsRow}>
      <Text style={styles.deviceDetail}>
        Last Update:{" "}
        {device.lastUpdate
          ? new Date(device.lastUpdate).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </Text>
    </View>
    <View style={styles.deviceDetailsRow}>
      <Text style={styles.deviceDetail}>
        Expiration Time:{" "}
        {device.expirationTime
          ? new Date(device.expirationTime).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </Text>
    </View>
    <View style={styles.deviceActionsRow}>
      <TouchableOpacity
        style={[
          styles.deviceActionBtn,
          { backgroundColor: "#43A047", flex: 1, marginRight: 6 },
        ]}
        onPress={onEdit}
      >
        <Text style={styles.deviceActionBtnText}>EDIT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.deviceActionBtn,
          { backgroundColor: "#FF7043", flex: 1, marginLeft: 6 },
        ]}
        onPress={onUsers}
      >
        <Text style={[styles.deviceActionBtnText, { color: "white" }]}>
          USERS
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
));

// Memoized Skeleton Card Component
const SkeletonDeviceCard = memo(() => (
  <View style={[styles.deviceCard, { overflow: 'hidden' }]}> 
    <View style={styles.deviceRow}>
      <View style={{ flex: 1 }}>
        <View style={{ width: '60%', height: 18, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 8 }} />
      </View>
      <View style={{ width: 60, height: 22, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
    </View>
    <View style={styles.deviceDetailsRow}>
      <View style={{ width: '40%', height: 14, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 6 }} />
    </View>
    <View style={styles.deviceDetailsRow}>
      <View style={{ width: '40%', height: 14, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 6 }} />
    </View>
    <View style={styles.deviceDetailsRow}>
      <View style={{ width: '40%', height: 14, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 6 }} />
    </View>
    <View style={styles.deviceDetailsRow}>
      <View style={{ width: '40%', height: 14, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 6 }} />
    </View>
    <View style={styles.deviceDetailsRow}>
      <View style={{ width: '60%', height: 14, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 6 }} />
    </View>
    <View style={styles.deviceDetailsRow}>
      <View style={{ width: '60%', height: 14, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 6 }} />
    </View>
    <View style={styles.deviceActionsRow}>
      <View style={{ flex: 1, height: 36, backgroundColor: '#e0e0e0', borderRadius: 8, marginRight: 6 }} />
      <View style={{ flex: 1, height: 36, backgroundColor: '#e0e0e0', borderRadius: 8, marginLeft: 6 }} />
    </View>
  </View>
));

// Memoized Form Field Component
const FormField = memo(({ 
  label, 
  required, 
  children 
}: { 
  label: string; 
  required?: boolean; 
  children: React.ReactNode;
}) => (
  <View style={styles.formField}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    {children}
  </View>
));

// Memoized Date Input Component
const DateInput = memo(({ 
  value, 
  onPress, 
  placeholder 
}: { 
  value: string; 
  onPress: () => void; 
  placeholder: string;
}) => (
  <TouchableOpacity style={styles.dateInputDark} onPress={onPress}>
    <Text style={styles.dateInputTextDark}>
      {value || placeholder}
    </Text>
    <MaterialIcons
      name="calendar-today"
      size={18}
      color="#666"
      style={{ marginLeft: 6 }}
    />
  </TouchableOpacity>
));

// Memoized Switch Field Component
const SwitchField = memo(({ 
  label, 
  value, 
  onValueChange, 
  subtext 
}: { 
  label: string; 
  value: boolean; 
  onValueChange: (value: boolean) => void; 
  subtext?: string;
}) => (
  <View style={[styles.formField, styles.switchField]}>
    <Text style={[styles.label, { marginBottom: 0 }]}>
      {label} {subtext && <Text style={{ fontSize: 12, color: "#888" }}>({subtext})</Text>}
    </Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#767577", true: "#81b0ff" }}
      thumbColor={value ? "#f5dd4b" : "#f4f3f4"}
    />
  </View>
));

export default function DevicesScreen() {
  const dispatch = useDispatch();
  const { devices: devicesData, loading } = useSelector((state: RootState) => state.devices);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    uniqueId: "",
    status: "online",
    disabled: false,
    phone: "",
    model: "",
    contact: "",
    category: "Car",
    lastUpdate: "",
    expirationTime: "",
    groupId: "0",
    attributes: {
      is_mobilized: true,
    },
  });
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Add new state for dropdowns with proper typing
  const [modelOpen, setModelOpen] = useState(false);
  const [modelValue, setModelValue] = useState<string | null>(null);
  const [modelItems, setModelItems] = useState<DropdownItem[]>([
    { label: "MT200", value: "MT200" },
    { label: "RDM", value: "RDM" },
  ]);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string>("Car");
  const [categoryItems, setCategoryItems] = useState<DropdownItem[]>(
    CATEGORY_OPTIONS.map((category) => ({
      label: category,
      value: category,
    }))
  );

  // Add date picker states
  const [isLastUpdatePickerVisible, setLastUpdatePickerVisible] =
    useState(false);
  const [isExpirationPickerVisible, setExpirationPickerVisible] =
    useState(false);

  // Add group states
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupValue, setGroupValue] = useState<string>("0");
  const [groupItems, setGroupItems] = useState<DropdownItem[]>([]);
  const [groupSearch, setGroupSearch] = useState("");

  // Memoized filtered devices
  const filteredDevices = useMemo(() => {
    return devicesData.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.uniqueId.toLowerCase().includes(search.toLowerCase()) ||
        (d.phone && d.phone.toLowerCase().includes(search.toLowerCase()))
    );
  }, [devicesData, search]);

  // Memoized render item function
  const renderItem: ListRenderItem<any> = useCallback(({ item }) => (
    <DeviceCard
      device={item}
      onPress={() => router.push({
        pathname: "/map",
        params: {
          ...item,
          disabled: item.disabled.toString(),
        },
      })}
      onEdit={() => openEditModal(item)}
      onUsers={() => {
        setSelectedDeviceId(item.deviceId);
        setUsersModalVisible(true);
      }}
    />
  ), [router]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  // Memoized list header component
  const ListHeaderComponent = useMemo(() => (
    <View style={styles.searchBarWrap}>
      <MaterialIcons
        name="search"
        size={20}
        color="#bbb"
        style={{ marginLeft: 8, marginRight: 4 }}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search device..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />
    </View>
  ), [search]);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const groupDropdownItems = groups.map((group) => ({
      label: group.name,
      value: group.id.toString(),
    }));
    setGroupItems([
      { label: "Select group", value: "0" },
      ...groupDropdownItems,
    ]);
  }, [groups]);

  const getDevices = async () => {
    try {
      const [responseDevices, responsePositions] = await Promise.all([
        Api.call("/api/devices", "GET", {}, false),
        Api.call("/api/positions", "GET", {}, false),
      ]);
      
      if (responseDevices.status === 200 && responsePositions.status === 200) {
        const devicesWithPositions = responseDevices.data.map((device: any) => ({
          ...device,
          ...responsePositions.data.find(
            (position: any) => position.deviceId === device.id
          ),
        }));
        
        dispatch(setDevices(devicesWithPositions));
      } 
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await Api.call("/api/groups", "GET", {}, false);
      setGroups(response.data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  // Add this function to build the tree structure
  const buildTreeStructure = (items: Group[]) => {
    const itemMap: { [key: number]: Group & { children: Group[] } } = {};
    const roots: (Group & { children: Group[] })[] = [];

    items.forEach((item) => {
      itemMap[item.id] = { ...item, children: [] };
    });

    items.forEach((item) => {
      if (!item.groupId || item.groupId === 0) {
        roots.push(itemMap[item.id]);
      } else {
        const parent = itemMap[item.groupId];
        if (parent) {
          parent.children.push(itemMap[item.id]);
        }
      }
    });

    return roots;
  };

  // Add this function to filter groups
  const filterGroups = (groups: Group[], searchTerm: string): Group[] => {
    return groups
      .filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((group) => ({
        ...group,
        children: group.children
          ? filterGroups(group.children, searchTerm)
          : [],
      }));
  };

  // Convert groups to options format with proper indentation
  const groupOptions = React.useMemo(() => {
    const flattenGroups = (groups: Group[], depth = 0): DropdownItem[] => {
      return groups.flatMap((group) => [
        {
          value: group.id.toString(),
          label: `${"\u00A0".repeat(depth * 4)}${depth > 0 ? "└─ " : ""}${
            group.name
          }`,
        },
        ...(group.children ? flattenGroups(group.children, depth + 1) : []),
      ]);
    };
    return [
      { value: "0", label: "Select group" },
      ...flattenGroups(buildTreeStructure(groups)),
    ];
  }, [groups]);

  // Filter functions
  const filteredGroupOptions = groupOptions.filter((option) =>
    option.label.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const openAddModal = () => {
    setEditMode(false);
    setEditId(null);
    // Calculate one year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    setForm({
      name: "",
      uniqueId: "",
      status: "online",
      disabled: false,
      phone: "",
      model: "",
      contact: "",
      category: "Car",
      lastUpdate: "",
      expirationTime: oneYearFromNow.toISOString().split("T")[0],
      groupId: "0",
      attributes: {
        is_mobilized: true,
      },
    });
    setModelValue(null);
    setCategoryValue("Car");
    setGroupValue("0");
    setModalVisible(true);
  };

  const openEditModal = (device: any) => {
    setEditMode(true);
    setEditId(device.id);
    console.log("device", device);
    setForm({
      name: device.name || "",
      uniqueId: device.uniqueId || "",
      status: device.status || "online",
      disabled: device.disabled || false,
      phone: device.phone || "",
      model: device.model || "",
      contact: device.contact || "",
      category: device.category || "Car",
      lastUpdate: device.lastUpdate ? device.lastUpdate : "",
      expirationTime: device.expirationTime ? device.expirationTime : "",
      groupId: device.groupId ? device.groupId.toString() : "0",
      attributes: {
        is_mobilized: device?.attributes?.is_mobilized || false,
      },
    });
    setModelValue(device.model || null);
    setCategoryValue(device.category || "Car");
    setGroupValue(device.groupId ? device.groupId.toString() : "0");
    setModalVisible(true);
  };

  const handleAddOrEditDevice = async () => {
    try {
      // Validate form data
      const validatedData = schema.parse(form);
      const deviceData = {
        ...validatedData,
        lastUpdate: new Date().toISOString(),
        positionId: null,
        id: editId,
      };

      if (editMode && editId) {
        const response = await Api.call(
          `/api/devices/${editId}`,
          "PUT",
          deviceData,
          false
        );
        console.log("response", response);
      } else {
        await Api.call("/api/devices", "POST", deviceData, false);
      }

      setModalVisible(false);
      setEditMode(false);
      setEditId(null);
      setForm({
        name: "",
        uniqueId: "",
        status: "online",
        disabled: false,
        phone: "",
        model: "",
        contact: "",
        category: "Car",
        lastUpdate: "",
        expirationTime: "",
        groupId: "0",
        attributes: {
          is_mobilized: true,
        },
      });
      await getDevices();
    } catch (error) {
      console.error("Error saving device:", error);
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => err.message);
        console.error("Validation errors:", errors);
        // You might want to show these errors to the user
      }
    }
  };

  const handleLastUpdateConfirm = (date: Date) => {
    setForm((f) => ({ ...f, lastUpdate: date.toISOString().split("T")[0] }));
    setLastUpdatePickerVisible(false);
  };

  const handleExpirationConfirm = (date: Date) => {
    setForm((f) => ({
      ...f,
      expirationTime: date.toISOString().split("T")[0],
    }));
    setExpirationPickerVisible(false);
  };

  // Memoized form handlers
  const handleFormChange = useCallback((field: keyof DeviceFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAttributesChange = useCallback((field: keyof DeviceFormData['attributes'], value: boolean) => {
    setForm(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [field]: value }
    }));
  }, []);

  // Memoized modal content
  const ModalContent = useMemo(() => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <FormField label="Vehicle Number" required>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          placeholderTextColor="#888"
          value={form.name}
          onChangeText={(t) => handleFormChange('name', t.toUpperCase())}
        />
      </FormField>

      <FormField label="IMEI / ID" required>
        <TextInput
          style={styles.input}
          placeholder="Enter unique ID"
          placeholderTextColor="#888"
          value={form.uniqueId}
          onChangeText={(t) => handleFormChange('uniqueId', t)}
        />
      </FormField>

      <FormField label="Sim Number">
        <TextInput
          style={styles.input}
          placeholder="Enter phone"
          placeholderTextColor="#888"
          value={form.phone}
          onChangeText={(t) => handleFormChange('phone', t)}
          keyboardType="numeric"
        />
      </FormField>

      <FormField label="Model" required>
        <DropDownPicker
          open={modelOpen}
          value={modelValue}
          items={modelItems}
          setOpen={setModelOpen}
          setValue={setModelValue}
          setItems={setModelItems}
          style={styles.dropdown}
          textStyle={styles.dropdownText}
          placeholder="Select model"
          placeholderStyle={styles.dropdownPlaceholder}
          dropDownContainerStyle={styles.dropdownContainer}
          listItemLabelStyle={styles.dropdownItemText}
          zIndex={3000}
          onChangeValue={(value) => value && handleFormChange('model', value)}
        />
      </FormField>

      <FormField label="Driver Contact">
        <TextInput
          style={styles.input}
          placeholder="Enter contact"
          placeholderTextColor="#888"
          value={form.contact}
          onChangeText={(t) => handleFormChange('contact', t)}
        />
      </FormField>

      <FormField label="Category">
        <DropDownPicker
          open={categoryOpen}
          value={categoryValue}
          items={categoryItems}
          setOpen={setCategoryOpen}
          setValue={setCategoryValue}
          setItems={setCategoryItems}
          style={styles.dropdown}
          textStyle={styles.dropdownText}
          placeholder="Select category"
          placeholderStyle={styles.dropdownPlaceholder}
          dropDownContainerStyle={styles.dropdownContainer}
          listItemLabelStyle={styles.dropdownItemText}
          searchPlaceholder="Search categories..."
          searchContainerStyle={styles.dropdownSearchContainer}
          searchTextInputStyle={styles.dropdownSearchInput}
          zIndex={2000}
          onChangeValue={(value) => value && handleFormChange('category', value)}
        />
      </FormField>

      <FormField label="Group">
        <DropDownPicker
          open={groupOpen}
          value={groupValue}
          items={groupOptions}
          setOpen={setGroupOpen}
          setValue={setGroupValue}
          setItems={setGroupItems}
          style={styles.dropdown}
          textStyle={styles.dropdownText}
          placeholder="Select group"
          placeholderStyle={styles.dropdownPlaceholder}
          dropDownContainerStyle={styles.dropdownContainer}
          listItemLabelStyle={styles.dropdownItemText}
          zIndex={1000}
          onChangeValue={(value) => value && handleFormChange('groupId', value)}
        />
      </FormField>

      <FormField label="Next Renewal">
        <DateInput
          value={form.lastUpdate}
          onPress={() => setLastUpdatePickerVisible(true)}
          placeholder="Select date"
        />
      </FormField>

      <FormField label="Expiration Date">
        <DateInput
          value={form.expirationTime}
          onPress={() => setExpirationPickerVisible(true)}
          placeholder="Select date"
        />
      </FormField>

      <SwitchField
        label="Disabled"
        value={form.disabled}
        onValueChange={(value) => handleFormChange('disabled', value)}
      />

      <SwitchField
        label="Immobilizer"
        value={form.attributes.is_mobilized}
        onValueChange={(value) => handleAttributesChange('is_mobilized', value)}
        subtext="on / off"
      />

      <TouchableOpacity
        style={styles.addBtn}
        onPress={handleAddOrEditDevice}
      >
        <Text style={styles.addBtnText}>
          {editMode ? "Save Changes" : "Add Device"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  ), [form, modelOpen, categoryOpen, groupOpen, editMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.headerWrap}>
        <Text style={styles.header}>Devices</Text>
      </View>

      {loading && devicesData.length === 0 ? (
        <View style={{ paddingTop: 12, paddingBottom: 80 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonDeviceCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 12 }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 300,
            offset: 300 * index,
            index,
          })}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? "Edit Device" : "Add Device"}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </Pressable>
            </View>
            {ModalContent}
          </View>
        </View>
      </Modal>

      {usersModalVisible && (
        <UsersModal
          deviceId={selectedDeviceId}
          visible={usersModalVisible}
          onClose={() => {
            setUsersModalVisible(false);
            setSelectedDeviceId(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  header: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  deviceCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 14,
    marginBottom: 16,
    padding: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceNumber: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#222",
  },
  deviceName: {
    fontSize: 15,
    color: "#444",
  },
  deviceModel: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  deviceDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  deviceDetail: {
    color: "#444",
    fontSize: 15,
  },
  deviceActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 0,
  },
  deviceActionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  deviceActionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 1,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    backgroundColor: "#000",
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
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
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    borderRadius: 10,
    minHeight: 45,
  },
  dropdownText: {
    color: "#000",
    fontSize: 15,
  },
  dropdownPlaceholder: {
    color: "#666",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    borderRadius: 10,
  },
  dropdownItemText: {
    color: "#000",
    fontSize: 14,
  },
  dropdownSearchContainer: {
    borderBottomColor: "#e0e0e0",
  },
  dropdownSearchInput: {
    color: "#000",
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  addBtn: {
    backgroundColor: "black",
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#00B8D4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { marginTop: 8, alignItems: "center" },
  cancelBtnText: { color: "#000", fontWeight: "bold", fontSize: 15 },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
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
  dateInputDark: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginTop: 2,
  },
  dateInputTextDark: {
    color: "#000",
    fontSize: 15,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
