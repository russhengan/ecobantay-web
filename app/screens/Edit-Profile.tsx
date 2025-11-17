import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ User Data Interface
interface UserData {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  contactNumber: string;
  city: string;
  barangay: string;
  address: string;
  password?: string;
}

const EditProfileScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [updatedUser, setUpdatedUser] = useState<UserData | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  
  // ✅ Fetch User Info from API with Authentication Token
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log("Fetching user data...");
        // Read stored user object (login saves it under key 'user')
        const storedUser = await AsyncStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const token = parsedUser?.token;
        console.log("Stored user token:", token ? "Token exists" : "No token found");

        if (!token) {
          Alert.alert('Error', 'No token found. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await fetch('https://ecobantay-backend.onrender.com/api/getUser', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Fetch failed: ", errorText);
          Alert.alert('Error', `Failed to fetch user data. Status: ${response.status}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("User data fetched:", data);

        // ✅ Data is returned directly as user object
        if (data._id) {
          setUser(data);
          setUpdatedUser(data);
        } else {
          console.error("Invalid user data format:", data);
          Alert.alert('Error', 'Invalid user data received.');
        }
      } catch (error) {
        console.error("Network error:", error);
        Alert.alert('Error', 'Check your internet or backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // ✅ Handle Input Change
  const handleChange = (field: keyof UserData, value: string) => {
    if (!updatedUser) return;
    setUpdatedUser((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // ✅ Show Confirmation Modal before updating
  const handleConfirmUpdate = () => {
    setShowConfirmModal(true);
  };

  // ✅ Update Profile Handler
  const handleUpdateProfile = async () => {
    if (!updatedUser) return;

    // ✅ Validate Password Change
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    // Read token from stored user object
    const storedUser = await AsyncStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const token = parsedUser?.token;
    if (!token) {
      Alert.alert('Error', 'Authentication error. Please log in again.');
      return;
    }

    // ✅ Only include fields that should be updated
    const updatedData: any = {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      gender: updatedUser.gender,
      city: updatedUser.city,
      barangay: updatedUser.barangay,
      address: updatedUser.address,
    };

    // ✅ Only add password if user is changing it
    if (newPassword) {
      updatedData.password = newPassword;
    }

    try {
      const response = await fetch('https://ecobantay-backend.onrender.com/api/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      console.log("Update response status:", response.status);

      if (response.ok) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  // ✅ Show Loading Indicator while fetching user data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ Styled Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push('/screens/Profile')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Information</Text>
        <Text style={styles.headerSubtitle}>Update an account</Text>
      </View>

      {/* ✅ Profile Input Fields */}
      <TextInput
        style={styles.input}
        value={updatedUser?.firstName || ''}
        onChangeText={(text) => handleChange('firstName', text)}
        placeholder="First Name"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        value={updatedUser?.lastName || ''}
        onChangeText={(text) => handleChange('lastName', text)}
        placeholder="Last Name"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        value={updatedUser?.gender || ''}
        editable={false}
        onChangeText={(text) => handleChange('gender', text)}
        placeholder="Gender"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        value={updatedUser?.contactNumber || ''}
        editable={false}
        placeholder="Contact Number"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        value={updatedUser?.email || ''}
        editable={false}
        placeholder="Email"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        value={updatedUser?.city || ''}
        onChangeText={(text) => handleChange('city', text)}
        placeholder="City"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        value={updatedUser?.barangay || ''}
        onChangeText={(text) => handleChange('barangay', text)}
        placeholder="Barangay"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        value={updatedUser?.address || ''}
        onChangeText={(text) => handleChange('address', text)}
        placeholder="Address"
        placeholderTextColor="#888"
      />

      {/* ✅ Password Update Section */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current Password"
          placeholderTextColor="#888"
          secureTextEntry={!showCurrentPassword}
        />
        <TouchableOpacity onPress={() => setShowCurrentPassword((s) => !s)} style={{ paddingHorizontal: 8 }}>
          <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          placeholderTextColor="#888"
          secureTextEntry={!showNewPassword}
        />
        <TouchableOpacity onPress={() => setShowNewPassword((s) => !s)} style={{ paddingHorizontal: 8 }}>
          <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter Password"
          placeholderTextColor="#888"
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)} style={{ paddingHorizontal: 8 }}>
          <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {/* ✅ Update Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleConfirmUpdate}>
        <Text style={styles.updateButtonText}>Update Profile</Text>
      </TouchableOpacity>

      {/* ✅ Confirmation Modal (centered & improved UI) */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update Information</Text>
            <Text style={styles.modalText}>Are you sure you want to update your profile?</Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleUpdateProfile}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Success Modal (centered & improved UI) */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="checkmark-circle" size={64} color="#22C55E" style={styles.successIcon} />
            <Text style={styles.modalTitle}>Information Updated</Text>
            <Text style={styles.modalText}>Your profile has been successfully updated.</Text>

            <TouchableOpacity style={[styles.confirmButton, { alignSelf: 'stretch', marginTop: 12, marginBottom: 6 }]} onPress={() => router.push('/screens/Profile')}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 70,
  },

  /* ✅ Loading Screen */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },

  /* ✅ Header Styling */
  headerContainer: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    left: 5,
    bottom: 75,
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },

  /* ✅ Input Fields */
  input: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },

  /* Password input row (text + eye icon) */
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },

  /* ✅ Update Button */
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  modalText: { fontSize: 14, textAlign: 'center', marginVertical: 12, color: '#4B5563' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  confirmButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  successIcon: { marginBottom: 6 },
});
