import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export default function RequestPickupScreen() {
  const router = useRouter();
  const [wasteType, setWasteType] = useState('Residual Waste');
  const [location, setLocation] = useState('Fetching location...');
  const [images, setImages] = useState<string[]>([]);

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
    if (images.length >= 2) {
      Alert.alert('Maximum 2 images allowed');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleNext = () => {
    router.push({
      pathname: '/screens/Request-Validate',
      params: {
        type: wasteType,
        location,
        images: JSON.stringify(images)
      }
    });
    
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

      <Text style={styles.label}>Type of Waste:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={wasteType} onValueChange={setWasteType} style={styles.picker}>
          <Picker.Item label="Residual Waste" value="Residual Waste" />
          <Picker.Item label="Solid Waste" value="Solid Waste" />
        </Picker>
      </View>

      <Text style={styles.label}>Location:</Text>
      <View style={styles.locationBox}>
        <TextInput style={styles.locationText} value={location} editable={false} />
        <Ionicons name="location" size={24} color="black" style={styles.locationIcon} />
      </View>
      
      <View style={styles.imageGrid}>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.image} />
        ))}
        {images.length < 2 && (
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Ionicons name="add" size={40} color="black" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity style={styles.submitButton} onPress={handleNext}>
        <Text style={styles.submitText}>Next</Text>
      </TouchableOpacity>
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
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
  },
  locationIcon: {
    marginLeft: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  image: {
    width: '48%',
    height: 100,
    borderRadius: 10,
    backgroundColor: '#ddd',
    marginBottom: 10,
  },
  uploadBox: {
    width: '48%',
    height: 100,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
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
});