import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { Camera as ExpoCamera, CameraView } from 'expo-camera';
import axios from 'axios';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import AsyncStorage  from '@react-native-async-storage/async-storage'



const { width, height } = Dimensions.get('window');
const qrSize = width * 0.7; // Scanner target size

const MissionQR = () => {
  const navigation = useNavigation();
  // State Variables
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);
  const animatedLine = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Request Camera Permissions
  useEffect(() => {
    (async () => {
      const { status } = await ExpoCamera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Animated scanning line
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedLine, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedLine, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Handle QR Code Scanned
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
  
    // ✅ Extract the encrypted part if the QR contains a full URL
    const extractEncryptedValue = (url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.searchParams.get("data") || url; // If not a URL, return raw string
      } catch (e) {
        return url; // Fallback to the original string
      }
    };
  
    try {
      // 🔐 Get user ID from AsyncStorage
      const storedUser = await AsyncStorage.getItem("user");
      const { _id } = JSON.parse(storedUser || '{}');

      const response = await axios.post('https://ecobantay-backend.onrender.com/api/qr/validate', {
        encryptedData: extractEncryptedValue(data),
        userId: _id  // ✅ SEND userId to backend
      });
      console.log("Response Data:", response.data);

  
      if (response.status === 200) {
        Alert.alert('QR Code Validated', `You have earned 1 point! 🎉`);
  
        // ✅ 1️⃣ Add Points to the User
    try {
      // Fetch user from AsyncStorage
      const storedUser = await AsyncStorage.getItem("user");
      console.log("🟢 Stored User from AsyncStorage (Add Points):", storedUser);

      if (!storedUser) {
        console.error("No user session found.");
        return;
      }

      // Parse the stored user data
      const { _id } = JSON.parse(storedUser);

      if (!_id) {
        console.error("❌ User ID is undefined.");
        return;
      }

      const response = await axios.post('https://ecobantay-backend.onrender.com/api/user/addPoints', {
        userId: _id,   // ✅ Now sending the correct userId
        description: "QR Mission Reward",
        points: 1
      });

      if (response.status === 200) {
        console.log('✅ Points added successfully!');
        Alert.alert('QR Code Validated', `You have earned 1 point! 🎉`);
        //✅ Navigate using Expo Router
        router.push('/screens/Clean-Points');
      } else {
        console.warn('⚠️ Unexpected response status:', response.status);
      }
    } catch (error: any) {
      if (error.response) {
        console.error("Server responded with error: ", error.response.data);
        Alert.alert('Error', error.response.data.msg);
      } else if (error.request) {
        console.error("No response from server. Error: ", error.message);
        Alert.alert('Error', 'Failed to connect to the server.');
      } else {
        console.error("Unknown error: ", error.message);
        Alert.alert('Error', 'Something went wrong.');
      }
    }

      
            //✅ Navigate using Expo Router
            router.push('/screens/Clean-Points');
          }
            } catch (error: any) {
          if (error.response) {
            console.error("Server responded with error: ", error.response.data);

            // ✅ Check if "message" exists before accessing
            const errorMessage = error.response.data.message || "An error occurred.";
            
            Alert.alert('Validation Failed', errorMessage);
          } else if (error.request) {
            console.error("No response from server. Error: ", error.message);
            Alert.alert('Error', 'Failed to connect to the server.');
          } else {
            console.error("Unknown error: ", error.message);
            Alert.alert('Error', 'Something went wrong.');
          }
        } finally {
          setLoading(false);
        }
  };
      
  

  // Permissions not granted
  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => ExpoCamera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.cameraContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Validating QR code...</Text>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Scanner guides */}
            <View style={styles.scanArea}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: animatedLine.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, qrSize - 10],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>

            <Text style={styles.instructionText}>
              Place the Ecobantay QR code inside the frame
            </Text>
          </>
        )}
      </View>

      {scanned && (
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: qrSize,
    height: qrSize,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    height: 2,
    width: qrSize - 20,
    backgroundColor: '#3498db',
    position: 'absolute',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
    fontWeight: '500',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  scanButton: {
    backgroundColor: '#3498db',
    marginHorizontal: 50,
    marginVertical: 30,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#3498db',
    marginTop: 20,
    padding: 15,
    borderRadius: 30,
    width: 200,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    width: '100%',
    height: '100%',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
});

export default MissionQR;
