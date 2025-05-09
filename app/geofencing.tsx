import Api from "@/config/Api";
import { MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Polygon } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
const { width, height } = Dimensions.get("window");

interface Geofence {
  id: string;
  name: string;
  description: string;
  type: "circle" | "polygon" | "linestring";
  center?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  coordinates?: Array<{
    latitude: number;
    longitude: number;
  }>;
  area: string;
  calendarId?: string;
  attributes?: {
    attribute?: string;
    type?: string;
  };
}

interface Calendar {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  area: z.string().min(1, "Area is required"),
  calendarId: z.union([z.string(), z.number()]).optional(),
  attributes: z.object({
    attribute: z.string().optional(),
    type: z.string().optional(),
  }),
});

type FormData = z.infer<typeof formSchema> & {
  id?: string | number;
  calendarId?: string | number;
};

export default function GeofencingScreen() {
  const [mode, setMode] = useState<"list" | "add">("list");
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [drawingType, setDrawingType] = useState<"circle" | "polygon" | "linestring">("circle");
  const [geometryType, setGeometryType] = useState<"CIRCLE" | "POLYGON" | "LINESTRING">("CIRCLE");
  const [circle, setCircle] = useState<{
    center: { latitude: number; longitude: number };
    radius: number;
  } | null>(null);
  const [polygon, setPolygon] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [radius, setRadius] = useState("300");
  const [geofenceName, setGeofenceName] = useState("");
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(
    null
  );
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 22.5726,
    longitude: 88.3639,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      area: "",
      calendarId: "",
      attributes: {
        attribute: "",
        type: "",
      },
    },
  });
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getGeofences();
    getCalendars();
  }, []);

  useEffect(() => {
    if (selectedGeofence) {
      form.reset({
        id: selectedGeofence.id,
        name: selectedGeofence.name,
        description: selectedGeofence.description,
        area: selectedGeofence.area,
        calendarId: selectedGeofence.calendarId,
        attributes: selectedGeofence.attributes,
      });
    } else {
      form.reset();
    }
  }, [selectedGeofence]);

  const getGeofences = async () => {
    try {
      const res = await Api.call("/api/geofences", "GET", {}, false);
      setGeofences(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch geofences");
    }
  };

  const getCalendars = async () => {
    try {
      const res = await Api.call("/api/calendars", "GET", {}, false);
      setCalendars(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGeofence = () => {
    setMode("add");
    setCircle(null);
    setPolygon([]);
    setDrawingType("circle");
    setRadius("300");
    setGeofenceName("");
    setSelectedGeofence(null);
    form.reset();
  };

  const handleEditGeofence = (geofence: Geofence) => {
    setSelectedGeofence(geofence);
    console.log("Editing geofence:", geofence);
    setMode("add");

    // Reset form with geofence data
    form.reset({
      id: geofence.id,
      name: geofence.name,
      description: geofence.description,
      area: geofence.area,
      calendarId: geofence.calendarId || "",
      attributes: geofence.attributes || {
        attribute: "",
        type: "",
      },
    });

    // Parse the area string to determine type and coordinates
    console.log("Parsing area string:", geofence.area);
    
    // Handle CIRCLE format: "CIRCLE (lat lng, radius)"
    const circleMatch = geofence.area.match(/CIRCLE \(([^,]+) ([^,]+), ([^)]+)\)/);
    if (circleMatch) {
      const lat = parseFloat(circleMatch[1]);
      const lng = parseFloat(circleMatch[2]);
      const radius = parseFloat(circleMatch[3]);

      setCircle({ center: { latitude: lat, longitude: lng }, radius });
      setDrawingType("circle");
      setRadius(radius.toString());
      setPolygon([]);

      // Update map region to focus on circle
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: (radius * 2) / 111000,
        longitudeDelta: (radius * 2) / (111000 * Math.cos(lat * Math.PI / 180)),
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      return;
    }

    // Handle LINESTRING or POLYGON format
    const shapeMatch = geofence.area.match(/\((.*)\)/);
    if (shapeMatch) {
      const coordinates = shapeMatch[1].split(",").map((coord) => {
        const [lat, lng] = coord.trim().split(" ");
        return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      });

      if (geofence.area.startsWith("LINESTRING")) {
        setPolygon(coordinates);
        setDrawingType("polygon");
        setCircle(null);
      } else if (geofence.area.startsWith("POLYGON")) {
        setPolygon(coordinates);
        setDrawingType("polygon");
        setCircle(null);
      }

      // Calculate center and bounds
      const center = coordinates.reduce(
        (acc, coord) => ({
          latitude: acc.latitude + coord.latitude / coordinates.length,
          longitude: acc.longitude + coord.longitude / coordinates.length,
        }),
        { latitude: 0, longitude: 0 }
      );
      
      const bounds = coordinates.reduce(
        (acc, coord) => ({
          minLat: Math.min(acc.minLat, coord.latitude),
          maxLat: Math.max(acc.maxLat, coord.latitude),
          minLng: Math.min(acc.minLng, coord.longitude),
          maxLng: Math.max(acc.maxLng, coord.longitude),
        }),
        { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
      );

      // Update map region
      const newRegion = {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: (bounds.maxLat - bounds.minLat) * 1.5,
        longitudeDelta: (bounds.maxLng - bounds.minLng) * 1.5,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    try {
      await Api.call(`/api/geofences/${id}`, "DELETE", {}, false);
      getGeofences();
      Alert.alert("Success", "Geofence deleted successfully");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete geofence");
    }
  };

  const handleSaveGeofence = () => {
    try {
      if (!form.getValues("name")) {
        Alert.alert("Error", "Please enter a name for the geofence");
        return;
      }

      if (!form.getValues("description")) {
        Alert.alert("Error", "Please enter a description for the geofence");
        return;
      }

      // Validate geometry based on type
      if (drawingType === "circle") {
        if (!circle) {
          Alert.alert("Error", "Please draw a circle on the map");
          return;
        }
        const areaValue = `CIRCLE (${circle.center.latitude} ${circle.center.longitude}, ${radius})`;
        console.log("Setting circle area:", areaValue);
        form.setValue("area", areaValue);
      } else if (drawingType === "polygon") {
        if (polygon.length < 3) {
          Alert.alert("Error", "Please draw a polygon with at least 3 points");
          return;
        }
        const coordinates = polygon.map((p) => `${p.latitude} ${p.longitude}`).join(", ");
        const areaValue = `POLYGON ((${coordinates}))`;
        console.log("Setting polygon area:", areaValue);
        form.setValue("area", areaValue);
      }

      console.log("Form values before submission:", form.getValues());
      console.log("Form errors:", form.formState.errors);

      // Trigger form submission
      form.handleSubmit((data) => {
        console.log("Form submitted with data:", data);
        onSubmit(data);
      })();
    } catch (error) {
      console.error("Error in handleSaveGeofence:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while saving. Please try again."
      );
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      console.log("onSubmit called with values:", values);

      // Prepare the geofence data
      const restValues = { ...values };
      
      // Remove empty calendarId
      if (!restValues.calendarId) {
        delete restValues.calendarId;
      }

      // Remove id from payload
      delete restValues.id;

      console.log("Final payload for API:", restValues);

      if (selectedGeofence) {
        console.log("Updating geofence:", selectedGeofence.id);
        console.log("Update URL:", `/api/geofences/${selectedGeofence.id}`);
        console.log("Update payload:", restValues);
        
        const response = await Api.call(
          `/api/geofences/${selectedGeofence.id}`,
          "PUT",
          restValues,
          false
        );
        console.log("Update response:", response);
        Alert.alert("Success", "Geofence updated successfully");
      } else {
        console.log("Creating new geofence");
        console.log("Create payload:", restValues);
        
        const response = await Api.call(
          "/api/geofences",
          "POST",
          restValues,
          false
        );
        console.log("Create response:", response);
        Alert.alert("Success", "Geofence created successfully");
      }

      getGeofences();
      setMode("list");
      setSelectedGeofence(null);
      setCircle(null);
      setPolygon([]);
      form.reset();
    } catch (error: any) {
      console.error("Geofence submission error:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      const errorMessage =
        error?.message || error?.response?.data?.message || "Unknown error";
      Alert.alert("Error", `Failed to save geofence: ${errorMessage}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerText, { textAlign: "center" }]}>
          Geofencing
        </Text>
        <View style={{ width: 26 }} />
      </View>
      {mode === "list" ? (
        <View
          style={{ flex: 1, paddingBottom: 10, backgroundColor: "#000000", paddingHorizontal: 15 }}
        >
          <FlatList
            data={geofences}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 2 }}
            renderItem={({ item }) => (
              <View style={styles.geofenceCard}>
                <MaterialIcons
                  name={
                    item.type === "circle" ? "radio-button-checked" : item.type === "polygon" ? "polyline" : "directions"
                  }
                  size={28}
                  color={item.type === "circle" ? "#43A047" : item.type === "polygon" ? "#2979FF" : "#FF7043"}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.geofenceName}>{item.name}</Text>
                  <Text style={styles.geofenceDescription}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.geofenceActions}>
                  <TouchableOpacity
                    onPress={() => handleEditGeofence(item)}
                    style={styles.actionButton}
                  >
                    <MaterialIcons name="edit" size={24} color="#2979FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteGeofence(item.id)}
                    style={styles.actionButton}
                  >
                    <MaterialIcons name="delete" size={24} color="#FF7043" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text
                style={{ color: "#888", textAlign: "center", marginTop: 40 }}
              >
                No geofences found.
              </Text>
            }
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddGeofence}>
            <MaterialIcons name="add-location-alt" size={26} color="#fff" />
            <Text style={styles.addBtnText}>Add Geofence</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            paddingBottom: 0,
            marginTop: 0,
            backgroundColor: "#000000",
          }}
        >
          <MapView
            ref={mapRef}
            style={[styles.map, { height: height - 280, marginTop: 0 }]}
            initialRegion={mapRegion}
            region={mapRegion}
            onPress={(e) => {
              if (drawingType === "circle") {
                setCircle({
                  center: e.nativeEvent.coordinate,
                  radius: Number(radius),
                });
              } else {
                setPolygon([...polygon, e.nativeEvent.coordinate]);
              }
            }}
          >
            {circle && (
              <Circle
                center={circle.center}
                radius={Number(radius)}
                strokeColor="#43A047"
                fillColor="#43A04722"
                strokeWidth={2}
              />
            )}
            {polygon.length > 1 && (
              <Polygon
                coordinates={polygon}
                strokeColor="#2979FF"
                fillColor="#2979FF22"
                strokeWidth={2}
              />
            )}
          </MapView>
          <View style={styles.geoAddPanel}>
            <Controller
              control={form.control}
              name="name"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <View>
                  <TextInput
                    style={[styles.geoAddInput, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Geofence Name"
                    placeholderTextColor="#888"
                    maxLength={32}
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <View>
                  <TextInput
                    style={[styles.geoAddInput, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Description"
                    placeholderTextColor="#888"
                    multiline
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                </View>
              )}
            />
            <View style={styles.geoAddTypeRow}>
              <TouchableOpacity
                style={[
                  styles.geoAddTypeBtn,
                  drawingType === "circle" && styles.geoAddTypeBtnActive,
                ]}
                onPress={() => {
                  setDrawingType("circle");
                  setPolygon([]);
                }}
              >
                <MaterialIcons
                  name="radio-button-checked"
                  size={22}
                  color="#43A047"
                />
                <Text style={styles.geoAddTypeText}>Circle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.geoAddTypeBtn,
                  drawingType === "polygon" && styles.geoAddTypeBtnActive,
                ]}
                onPress={() => {
                  setDrawingType("polygon");
                  setCircle(null);
                }}
              >
                <MaterialIcons name="polyline" size={22} color="#2979FF" />
                <Text style={styles.geoAddTypeText}>Polygon</Text>
              </TouchableOpacity>
            </View>
            {drawingType === "circle" && (
              <View style={styles.geoAddRadiusRow}>
                <TextInput
                  style={styles.geoAddInput}
                  value={radius}
                  onChangeText={setRadius}
                  keyboardType="numeric"
                  placeholder="Radius (meters)"
                  placeholderTextColor="#888"
                  maxLength={6}
                />
              </View>
            )}
            <View style={styles.geoAddBtnRow}>
              <TouchableOpacity
                style={styles.geoAddSaveBtn}
                onPress={handleSaveGeofence}
              >
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.geoAddSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.geoAddCancelBtn}
                onPress={() => setMode("list")}
              >
                <MaterialIcons name="close" size={20} color="#fff" />
                <Text style={styles.geoAddCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  geofenceCard: {
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
  geofenceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 18,
    letterSpacing: 0.3,
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
  },
  map: {
    flex: 1,
    marginTop: 0,
  },
  geoAddPanel: {
    backgroundColor: "#000000",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 22,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
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
  geoAddTypeRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  geoAddTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingVertical: 5,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  geoAddTypeBtnActive: {
    backgroundColor: "#333",
    borderColor: "#FFFFFF",
  },
  geoAddTypeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
  geoAddRadiusRow: {
  },
  geoAddBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    gap: 12,
  },
  geoAddSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 10,
    paddingVertical: 8,
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
    paddingVertical: 8,
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
  geofenceDescription: {
    fontSize: 14,
    color: "#666",
    marginLeft: 18,
  },
  geofenceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  inputError: {
    borderColor: "#FF7043",
  },
  errorText: {
    color: "#FF7043",
    fontSize: 12,
    marginTop: 4,
  },
});
