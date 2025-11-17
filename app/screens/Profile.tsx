import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Footer from '../../components/Footer';
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ Added AsyncStorage
import { useFocusEffect } from "@react-navigation/native"; // ✅ Added useFocusEffect


// 1. Define a TypeScript interface for user data
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  contactNumber: string; 
}

const ProfileScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Profile');
  const [user, setUser] = useState<UserData | null>(null);
  

  // 2. Fetch user data from the backend on component mount
  const fetchUserInfo = async () => {
    try {
      // ✅ Kunin ang token mula sa AsyncStorage
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        Alert.alert("Error", "No user session found. Please log in again.");
        return;
      }

      const { token } = JSON.parse(storedUser);
      console.log("🔑 Token fetched:", token);

      // ✅ I-clear muna ang user data bago mag-fetch
      setUser(null);

      // ✅ Gamitin ang token para i-fetch ang tamang user info
      const response = await fetch('https://ecobantay-backend.onrender.com/api/getUser', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // ✅ Include token
        },
      });

      const data = await response.json();
      console.log("📥 User Data Fetched:", data);

      if (response.ok) {
        setUser(data);
      } else {
        console.error('❌ Failed to fetch user profile:', data.msg);
        Alert.alert("Error", data.msg || "Failed to fetch user profile.");
      }
    } catch (error) {
      console.error("🔥 Fetch Profile Error:", error);
      Alert.alert("Error", "Something went wrong while fetching user info.");
    }
  };

  // ✅ Force refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserInfo();
    }, [])
  );

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // 3. Show loading indicator while fetching data
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/ecobantay-profile.jpg')}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Profile Information Card */}
      <View style={styles.profileCard}>
        <Text style={styles.label}>First Name</Text>
        <Text style={styles.value}>{user.firstName}</Text>

        <Text style={styles.label}>Last Name</Text>
        <Text style={styles.value}>{user.lastName}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>

        <Text style={styles.label}>Gender</Text>
        <Text style={styles.value}>{user.gender}</Text>

        <Text style={styles.label}>Contact Number</Text>
        <Text style={styles.value}>{user.contactNumber}</Text>
      </View>

      {/* Edit Profile Button - Redirects to EditProfile.tsx */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push('/screens/Edit-Profile')}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* ✅ Updated Logout Button to Remove Token */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await AsyncStorage.removeItem("user"); // ✅ Clear token on logout
          Alert.alert("Success", "Logged out successfully!");
          router.push('/'); // Redirect to login screen
        }}
      >
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      {/* ✅ Fix Footer Position */}
      <View style={styles.footerWrapper}>
        <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#2E7D32',
    paddingVertical: 30,
    alignItems: 'center',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  userEmail: {
    color: '#D1D1D1',
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: 'gray',
    marginTop: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#808080',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  footerWrapper: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
  },
});
