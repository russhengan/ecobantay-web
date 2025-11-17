import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ✅ Reusable toast component
import Toast from '../../components/Toast';

const API_URL = "https://ecobantay-backend.onrender.com/api";

export default function WasteValidateScreen() {
  const { reporterName, reportType, description }: {
    reporterName: string;
    reportType: string;
    description: string;
  } = useLocalSearchParams();

  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('Fetching location...');
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Toast state (for mission completion)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Permission denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocation(address[0]?.formattedAddress || 'Location not found');
    })();
  }, []);

  const pickImage = async () => {
    if (images.length >= 4) {
      Alert.alert('Maximum 4 images allowed');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (images.length < 1) {
      Alert.alert("Please upload at least one image");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", reporterName);
      formData.append("type", reportType);
      formData.append("description", description);
      formData.append("location", location);

      images.forEach((uri, index) => {
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const ext = match?.[1] || "jpg";
        const mimeType = `image/${ext}`;
        formData.append("images", {
          uri,
          name: filename || `photo_${index}.jpg`,
          type: mimeType,
        } as any);
      });

      const response = await fetch(`${API_URL}/reports/create`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Complete the "report_waste" mission (silent if already done today)
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const { _id } = JSON.parse(storedUser);
            await axios.post(`${API_URL}/missions/complete`, {
              userId: _id,
              trigger: "report_waste",
            });
            showToast("🗑 Mission Completed: Report Waste Incident");
          }
        } catch (missionErr: any) {
          const msg = missionErr?.response?.data?.msg || missionErr.message;
          if (msg === "Mission already completed today!") {
            // ignore silently
          } else {
            console.error("Mission error:", msg);
          }
        }

        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          router.push("/screens/Dashboard");
        }, 3000);
      } else {
        console.error("❌ Backend error:", data);
        Alert.alert("Failed to submit", data.message || "Try again later.");
      }
    } catch (err) {
      console.error("🔥 Submit error:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ Reusable Toast */}
      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />

      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waste Report</Text>
      </View>

      {/* LOCATION FIELD */}
      <Text style={styles.label}>Location</Text>
      <View style={styles.locationBox}>
        <TextInput style={styles.locationText} value={location} editable={false} />
        <Ionicons name="location" size={24} color="black" style={styles.locationIcon} />
      </View>

      {/* IMAGE UPLOAD GRID */}
      <Text style={styles.label}>Upload Images</Text>
      <View style={styles.imageGrid}>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.image} />
        ))}
        {images.length < 4 && (
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Ionicons name="add" size={40} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {/* SUBMIT BUTTON */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      {/* SUCCESS MODAL */}
      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Your report has been submitted successfully</Text>
            <Ionicons name="checkmark-circle" size={80} color="green" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  headerWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, marginBottom: 15 },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationText: { flex: 1, fontSize: 16 },
  locationIcon: { marginLeft: 10 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  image: { width: '48%', height: 120, borderRadius: 10, backgroundColor: '#ddd', marginBottom: 10 },
  uploadBox: {
    width: '48%',
    height: 120,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: 280, backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center' },
  modalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
});
