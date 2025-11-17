import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';

export default function RequestValidateScreen() {
  const router = useRouter();
  const { type, location: pickupLocation, images } = useLocalSearchParams();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const parsedImages = Array.isArray(images) ? images : JSON.parse(images);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const handleSubmit = async () => {
    if (parsedImages.length < 1) {
      Alert.alert("Please upload at least one image");
      return;
    }
  
    try {
      const formData = new FormData();
  
      // replace with your pickup fields
      formData.append("type", String(type));
      formData.append("location", String(pickupLocation));
  
      // use exact format from Waste-Validate.tsx
      parsedImages.forEach((uri: string, index: number) => {
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const ext = match?.[1] || "jpg";
        const mimeType = `image/${ext}`;
  
        formData.append("images", {
          uri: uri,
          name: filename || `pickup_${index}.jpg`,
          type: mimeType
        } as unknown as Blob); 
      });
  
      const response = await fetch("https://ecobantay-backend.onrender.com/api/pickups/create", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          router.replace("/screens/Dashboard");
        }, 3000);
      } else {
        console.error("❌ Backend error:", data);
        Alert.alert("Failed to submit", data.message || "Try again later.");
      }
    } catch (err) {
      console.error("🔥 Pickup request error:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };
  
  

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Pickup</Text>
      </View>

      {/* MAP VIEW */}
      {location && (
        <MapView style={styles.map} region={{ ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
          <Marker coordinate={location} title="Pickup Location" />
        </MapView>
      )}

      <Text style={styles.etaText}>Estimated Time of Arrival: 10 Minutes</Text>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      {/* SUCCESS MODAL */}
      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Your pickup request has been submitted successfully</Text>
            <Ionicons name="checkmark-circle" size={80} color="green" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  etaText: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 25,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: 'green',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 280,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
});
