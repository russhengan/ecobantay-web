import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function WasteReportScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const [reporterName, setReporterName] = useState<string>('Loading...');
  const [reportType, setReportType] = useState('Illegal Dumping');
  const [description, setDescription] = useState('');

  // Fetch user data from AsyncStorage
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          
          if (user.firstName && user.lastName) {
            setReporterName(`${user.firstName} ${user.lastName}`);
          } else {
            setReporterName("Unknown User");
          }

        } else {
          console.error("❌ No user data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("🔥 Error fetching user data from AsyncStorage:", error);
      }
    };
  
    getUserData();
  }, []);

  const handleNext = () => {
    router.push({
      pathname: '/screens/Waste-Validate',
      params: {
        reporterName,
        reportType,
        description
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waste Report</Text>
      </View>

      {/* REPORTER NAME (FETCHED FROM ASYNC STORAGE) */}
      <Text style={styles.label}>Reporter Name</Text>
      <View style={styles.inputBox}>
        <Text style={styles.inputText}>{reporterName}</Text>
      </View>

      {/* REPORT TYPE DROPDOWN */}
      <Text style={styles.label}>Type of Waste</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={reportType} onValueChange={setReportType} style={styles.picker}>
          <Picker.Item label="Illegal Dumping" value="Illegal Dumping" />
          <Picker.Item label="Large Waste" value="Large Waste" />
          <Picker.Item label="General Waste" value="General Waste" />
        </Picker>
      </View>

      {/* DESCRIPTION */}
      <Text style={styles.label}>Message (optional)</Text>
      <TextInput 
        style={styles.textArea} 
        placeholder="Enter details..." 
        multiline 
        value={description} 
        onChangeText={setDescription} 
      />

      {/* NEXT BUTTON */}
      <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#fff',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 25,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputBox: {
    height: 60,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginBottom: 20,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
    height: 60,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
  },
  textArea: {
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  nextButton: {
    height: 60,
    backgroundColor: 'green',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
