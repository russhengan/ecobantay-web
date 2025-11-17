import React, { useEffect, useRef, useState } from "react";
import {
View,Text,TouchableOpacity,StyleSheet,Modal,Alert,Image,Dimensions,Animated,TextInput,ScrollView,} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, LatLng } from "react-native-maps";
import dayjs from "dayjs";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import haversine from "haversine-distance";
import AsyncStorage from "@react-native-async-storage/async-storage";


const SIMULATED_ROUTE: LatLng[] = [
  { latitude: 14.6983, longitude: 120.9611 }, // Malinta (near MacArthur Highway)
  { latitude: 14.6979, longitude: 120.9613 },
  { latitude: 14.6984, longitude: 120.9632 },
  { latitude: 14.6973, longitude: 120.9636 },
  { latitude: 14.6962, longitude: 120.9639 }, // Intersection to Maysan Road
  { latitude: 14.6957, longitude: 120.9641 },
  { latitude: 14.6950, longitude: 120.9641},
  { latitude: 14.694210660198735, longitude: 120.96409222203182 },
{ latitude: 14.693445685298085, longitude: 120.96396684508525 },
{ latitude: 14.692997893881023, longitude: 120.96404882232075 },
{ latitude: 14.692517449986001, longitude: 120.9645937298271 },
{ latitude: 14.692643391681004, longitude: 120.9656208563793 },
{ latitude: 14.692825307353107, longitude: 120.96685533713844 },
{ latitude: 14.692885945875576, longitude: 120.96830199425628 },
{ latitude: 14.69267604321852, longitude: 120.9693339430128 },
{ latitude: 14.692274895360136, longitude: 120.9704719799531 },
{ latitude: 14.69199968884697, longitude: 120.97129175232071 },
{ latitude: 14.691369977723241, longitude: 120.9727721647747 },
{ latitude: 14.69104812467773, longitude: 120.97323027285529 },
{ latitude: 14.690329784270174, longitude: 120.97371731409142 },
{ latitude: 14.689219617193729, longitude: 120.97437313198436 },
{ latitude: 14.68817008429216, longitude: 120.97496143922197 },
{ latitude: 14.687274478901257, longitude: 120.97546776921853 },
{ latitude: 14.686108320553407, longitude: 120.97614769806707 },
{ latitude: 14.684984138038278, longitude: 120.97678422718955 },
{ latitude: 14.683071615033358, longitude: 120.97781617594943 },
{ latitude: 14.682082694137057, longitude: 120.97836108347106 },
{ latitude: 14.68058064537306, longitude: 120.97912781173996 },
{ latitude: 14.680986479439467, longitude: 120.97966789707098 },
{ latitude: 14.680883854804218, longitude: 120.9810373991268 },
{ latitude: 14.680851201498758, longitude: 120.98224294673828 },
 // Endpoint near Novaliches
];


interface TutorialStep {
  title: string;
  description: string;
  image: any;
}


const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to EcoBantay Driver",
    description: "Let's learn how to use the app to track your waste collection route efficiently.",
    image: require('../../assets/truck-icon.png'), // Replace with actual tutorial images
  },
  {
    title: "Start Your Route",
    description: "Press the START COLLECTING button when you're ready to begin your route. The app will track your location and speed.",
    image: require('../../assets/truck-icon.png'),
  },
  {
    title: "Monitor Your Progress",
    description: "Keep an eye on your speed (20-40 km/h recommended) and track your collection progress in real-time.",
    image: require('../../assets/truck-icon.png'),
  },
  {
    title: "Complete Your Route",
    description: "Press FINISH when you've completed your collection route to view your summary.",
    image: require('../../assets/truck-icon.png'),
  },
];

const TruckMap = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [locationHistory, setLocationHistory] = useState<LatLng[]>([]);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any | null>(null);
  // Route creation state
  const [createMode, setCreateMode] = useState(false);
  const [tempPins, setTempPins] = useState<LatLng[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [backendUrl] = useState('https://ecobantay-backend.onrender.com/api'); // adjust to your backend host
  const mapRef = useRef<MapView | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleMapPressForRoute = (e: any) => {
    if (!createMode) return;
    const { coordinate } = e.nativeEvent;
    setTempPins(prev => [...prev, coordinate]);
  };

  const clearTempPins = () => setTempPins([]);

  const saveTempRoute = async () => {
    if (tempPins.length === 0) return Alert.alert('No pins', 'Please add at least one point');
    setShowSaveModal(false);
    try {
      const res = await fetch(`${backendUrl}/trucks/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRouteName || 'Unnamed Route', route: tempPins, createdBy: null }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Saved', 'Route saved successfully');
        setNewRouteName('');
        setCreateMode(false);
        setTempPins([]);
        loadSavedRoutes();
      } else {
        console.error('Save route error', data);
        Alert.alert('Error', data.error || 'Failed to save route');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save route');
    }
  };

  const loadSavedRoutes = async () => {
    try {
      const res = await fetch(`${backendUrl}/trucks/routes`);
      const data = await res.json();
      if (res.ok) setSavedRoutes(data.routes || []);
    } catch (err) {
      console.error('Error loading routes', err);
    }
  };

  const deleteRoute = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/trucks/routes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Deleted', 'Route removed');
        loadSavedRoutes();
      } else {
        Alert.alert('Error', data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const assignRouteToTruck = async (routeId: string) => {
    Alert.prompt(
      'Assign Route',
      'Enter truckId to assign',
      async (truckId) => {
        if (!truckId) return;
        try {
          const res = await fetch(`${backendUrl}/trucks/routes/${routeId}/assign`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ truckId })
          });
          const data = await res.json();
          if (res.ok) {
            Alert.alert('Assigned', `Route assigned to ${truckId}`);
            loadSavedRoutes();
          } else {
            Alert.alert('Error', data.error || 'Failed to assign');
          }
        } catch (err) {
          console.error('Assign error', err);
        }
      }
    );
  };

  const startSimulation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 >= SIMULATED_ROUTE.length) {
          clearInterval(intervalRef.current!);
          handleFinish();
          return prev;
        }

        const next = SIMULATED_ROUTE[prev + 1];
        const current = SIMULATED_ROUTE[prev];
        const dist = haversine(current, next);
        // Calculate speed between 20-40 km/h
        const baseSpeed = 30; // Base speed of 30 km/h
        const variation = 10; // +/- 10 km/h variation
        const estSpeed = baseSpeed + (Math.random() * variation * 2 - variation);

        setSpeed(estSpeed);
        setDistance((d) => d + dist);
        setLocationHistory((h) => [...h, next]);
        return prev + 1;
      });
    }, 15000); // ⏱ 15 seconds per move
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
  };

  const stopSimulation = () => intervalRef.current && clearInterval(intervalRef.current);
  const stopTimer = () => timerRef.current && clearInterval(timerRef.current);

  const handleStart = () => {
    setIsCollecting(true);
    setStartTime(dayjs());
    setCurrentIndex(0);
    setDuration(0);
    setDistance(0);
    setSpeed(0);
    setLocationHistory([SIMULATED_ROUTE[0]]);
    startSimulation();
    startTimer();
  };

  const handlePause = () => {
    stopSimulation();
    stopTimer();
    setIsPaused(true);
  };

  const handleResume = () => {
    startSimulation();
    startTimer();
    setIsPaused(false);
  };

  const handleFinish = async () => {
  stopSimulation();
  stopTimer();
  setIsCollecting(false);
  setIsPaused(false);
  setShowSummary(true);

  try {
    const storedUser = await AsyncStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user || user.role !== "driver") return;

    await fetch(`https://ecobantay-backend.onrender.com/api/truck-logs/complete/${user._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distance,
        duration,
        remarks: "Collection route completed successfully.",
      }),
    });

    console.log("✅ Truck log updated to completed");
  } catch (error) {
    console.error("❌ Error updating truck log:", error);
  }
};


  const resetSession = () => {
    setShowSummary(false);
    setDuration(0);
    setDistance(0);
    setSpeed(0);
    setCurrentIndex(0);
    setLocationHistory([]);
  };

  useEffect(() => {
    if (locationHistory.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(locationHistory, {
        edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
        animated: true,
      });
    }
  }, [locationHistory]);

  // Check if tutorial should be shown
  useEffect(() => {
    checkTutorial();
  }, []);

  // On mount, fetch today's assignment for the logged-in driver (if any)
  useEffect(() => {
    const fetchAssignmentAndFocus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (!parsedUser || parsedUser.role !== 'driver' || !parsedUser._id) return;

        const resp = await fetch(`${backendUrl}/driver/assignment/${parsedUser._id}`);
        if (!resp.ok) return; // no assignment or error
        const data = await resp.json();
        const assignment = data.assignment;
        const route = assignment?.scheduleId?.routeId?.route;
        if (route && route.length) {
          // store the assignment and show a small modal so driver can Accept or Start
          setPendingAssignment(assignment);
          setAssignmentModalVisible(true);
        }
      } catch (err) {
        console.error('Failed to fetch assignment', err);
      }
    };

    fetchAssignmentAndFocus();
  }, []);

  const checkTutorial = async () => {
    try {
      // Show tutorial only for drivers who haven't seen it yet.
      const storedUser = await AsyncStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // If no logged-in user or not a driver, don't show tutorial
      if (!parsedUser || parsedUser.role !== 'driver') return;

      const perUserKey = `hasSeenDriverTutorial_${parsedUser._id}`;
      const hasSeenTutorial = await AsyncStorage.getItem(perUserKey);
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  const handleNextTutorial = async () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      setShowTutorial(false);
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (parsedUser && parsedUser._id) {
          const perUserKey = `hasSeenDriverTutorial_${parsedUser._id}`;
          await AsyncStorage.setItem(perUserKey, 'true');
        } else {
          // Fallback to global flag if user info isn't available
          await AsyncStorage.setItem('hasSeenDriverTutorial', 'true');
        }
      } catch (error) {
        console.error('Error saving tutorial status:', error);
      }
    }
  };

  // Assignment actions
  const acceptAssignment = () => {
    setAssignmentModalVisible(false);
    setPendingAssignment(null);
  };

  const startAssignment = async () => {
    if (!pendingAssignment) return acceptAssignment();
    const route = pendingAssignment.scheduleId?.routeId?.route;
    if (route && route.length) {
      const coords = route.map((p: any) => ({ latitude: p.lat ?? p.latitude, longitude: p.lng ?? p.longitude }));
      setLocationHistory(coords);
    }

    // create truck log on start (server will return existing if duplicate)
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const driverId = parsedUser?._id;
      const truckId = pendingAssignment.truckId?._id || pendingAssignment.truckId;
      const routeName = pendingAssignment.scheduleId?.routeId?.name || 'Assigned Route';
      const date = pendingAssignment.date || new Date();

      if (driverId && truckId) {
        const resp = await fetch(`${backendUrl}/truck-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ truckId, driverId, date, routeName, status: 'In Progress', remarks: `Started collection for ${routeName}` }),
        });
        try { const data = await resp.json(); console.log('TruckLog creation response:', data); } catch (e) { console.log('TruckLog create parse error', e); }
      }
    } catch (err) {
      console.error('Failed to create truck log on start:', err);
    }

    setAssignmentModalVisible(false);
    setPendingAssignment(null);
    // start collection flow
    handleStart();
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        region={{
          latitude: locationHistory[locationHistory.length - 1]?.latitude || 14.7,
          longitude: locationHistory[locationHistory.length - 1]?.longitude || 120.98,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
          onPress={handleMapPressForRoute}
      >
        {locationHistory.length > 0 && (
          <Marker coordinate={locationHistory[locationHistory.length - 1]} anchor={{ x: 0.5, y: 0.5 }} flat>
            <Image
              source={require('../../assets/truck-icon.png')}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          </Marker>
        )}
        {locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory}
            strokeColor="#33AA55"
            strokeWidth={5}
            lineDashPattern={[1]}
          />
        )}

        {/* Temp pins for route creation */}
        {tempPins.map((p, i) => (
          <Marker
            key={`temp-${i}`}
            coordinate={p}
            draggable
            onDragEnd={(e) => {
              const coord = e.nativeEvent.coordinate;
              setTempPins(prev => prev.map((pt, idx) => idx === i ? coord : pt));
            }}
          />
        ))}

        {tempPins.length > 1 && (
          <Polyline coordinates={tempPins} strokeColor="#FF8C00" strokeWidth={4} />
        )}
      </MapView>

      {/* Waze-like Stats Header */}
      <View style={styles.overlayStats}>
        <View>
          <Ionicons name="time-outline" size={24} color="#33AA55" />
          <Text style={styles.statText}>{startTime?.format("h:mm A") || "--:--"}</Text>
        </View>
        <View>
          <Ionicons name="map-outline" size={24} color="#33AA55" />
          <Text style={styles.statText}>{(distance / 1000).toFixed(2)} KM</Text>
        </View>
        <View>
          <Ionicons name="timer-outline" size={24} color="#33AA55" />
          <Text style={styles.statText}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {/* Waze-like Speedometer */}
      <View style={styles.speedBadge}>
        <MaterialCommunityIcons name="speedometer" size={20} color="white" />
        <Text style={styles.speedText}>{speed.toFixed(1)} KM/H</Text>
      </View>

      {/* Control Buttons */}
      <View style={{ position: 'absolute', top: 110, right: 16, zIndex: 50 }}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: createMode ? '#FF8C00' : '#2D4150' }]}
          onPress={() => setCreateMode(prev => !prev)}
        >
          <Ionicons name="pin" size={18} color="white" />
          <Text style={[styles.controlText, { fontSize: 12, marginLeft: 8 }]}>{createMode ? 'Creating' : 'Create Route'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: '#33AA55', marginTop: 8 }]}
          onPress={() => { loadSavedRoutes(); setShowRoutesModal(true); }}
        >
          <Ionicons name="list" size={18} color="white" />
          <Text style={[styles.controlText, { fontSize: 12, marginLeft: 8 }]}>Saved Routes</Text>
        </TouchableOpacity>
        {/* Save / Clear while creating a route */}
        {createMode && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#33AA55', marginTop: 6 }]}
              onPress={() => setShowSaveModal(true)}
            >
              <Ionicons name="save" size={18} color="white" />
              <Text style={[styles.controlText, { fontSize: 12, marginLeft: 8 }]}>Save Route</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#E53935', marginTop: 6 }]}
              onPress={() => setTempPins([])}
            >
              <Ionicons name="trash" size={18} color="white" />
              <Text style={[styles.controlText, { fontSize: 12, marginLeft: 8 }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Save temp route modal */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.summaryTitle}>Save Route</Text>
            <TextInput value={newRouteName} onChangeText={setNewRouteName} placeholder="Route name" style={{ width: '100%', borderColor: '#ddd', borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#33AA55', marginRight: 8 }]} onPress={saveTempRoute}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#E53935' }]} onPress={() => setShowSaveModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved routes modal */}
      <Modal visible={showRoutesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%', width: '95%' }]}>
            <Text style={styles.summaryTitle}>Saved Routes</Text>
            <ScrollView 
              style={{ width: '100%', marginTop: 8 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={true}
            >
              {savedRoutes.length === 0 && <Text style={{ textAlign: 'center', color: '#999', marginTop: 16 }}>No saved routes</Text>}
              {savedRoutes.map(r => (
                <View key={r._id} style={{ padding: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', borderRadius: 8, backgroundColor: '#F5F7FA' }}>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#2D4150', marginBottom: 4 }}>{r.name || 'Unnamed'}</Text>
                  <Text style={{ color: '#666', fontSize: 13 }}>{r.route?.length ?? 0} points</Text>
                  <View style={{ flexDirection: 'row', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                    <TouchableOpacity 
                      style={[styles.routeActionButton, { backgroundColor: '#2D4150', flex: 1, minWidth: '30%' }]} 
                      onPress={() => {
                        if (r.route && r.route.length) {
                          const coords = r.route.map((p: any) => ({ latitude: p.lat, longitude: p.lng }));
                          setLocationHistory(coords);
                          setShowRoutesModal(false);
                        }
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.routeActionButton, { backgroundColor: '#33AA55', flex: 1, minWidth: '30%' }]} 
                      onPress={() => assignRouteToTruck(r._id)}
                    >
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>Assign</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.routeActionButton, { backgroundColor: '#E53935', flex: 1, minWidth: '30%' }]} 
                      onPress={() => deleteRoute(r._id)}
                    >
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.modalButton, { marginTop: 12, width: '100%' }]} onPress={() => setShowRoutesModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {!isCollecting && !showSummary && (
        <TouchableOpacity style={styles.collectButton} onPress={handleStart}>
          <Ionicons name="play" size={24} color="white" />
          <Text style={styles.collectText}>START COLLECTING</Text>
        </TouchableOpacity>
      )}

      {isCollecting && !isPaused && (
        <View style={styles.controlGroup}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: "#424242" }]} 
            onPress={handlePause}
          >
            <Ionicons name="pause" size={24} color="white" />
            <Text style={styles.controlText}>PAUSE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: "#E53935" }]} 
            onPress={handleFinish}
          >
            <Ionicons name="stop" size={24} color="white" />
            <Text style={styles.controlText}>FINISH</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPaused && (
        <View style={styles.controlGroup}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: "#33AA55" }]} 
            onPress={handleResume}
          >
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.controlText}>RESUME</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: "#E53935" }]} 
            onPress={handleFinish}
          >
            <Ionicons name="stop" size={24} color="white" />
            <Text style={styles.controlText}>FINISH</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tutorial Modal */}
      <Modal visible={showTutorial} transparent animationType="fade">
        <Animated.View style={[styles.tutorialOverlay, { opacity: fadeAnim }]}>
          <View style={styles.tutorialCard}>
            <Image
              source={tutorialSteps[tutorialStep].image}
              style={styles.tutorialImage}
              resizeMode="contain"
            />
            <Text style={styles.tutorialTitle}>{tutorialSteps[tutorialStep].title}</Text>
            <Text style={styles.tutorialText}>{tutorialSteps[tutorialStep].description}</Text>
            <TouchableOpacity style={styles.tutorialButton} onPress={handleNextTutorial}>
              <Text style={styles.tutorialButtonText}>
                {tutorialStep < tutorialSteps.length - 1 ? "NEXT" : "GET STARTED"}
              </Text>
              <Ionicons name="arrow-forward" size={24} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* Assignment Modal (shown when driver has a dispatch) */}
      <Modal visible={assignmentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.summaryTitle}>New Dispatch</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{pendingAssignment?.scheduleId?.routeId?.name || 'Assigned Route'}</Text>
            <Text style={{ color: '#546E7A', marginBottom: 12 }}>{pendingAssignment?.scheduleId?.barangay || ''}</Text>
            <Text style={{ color: '#546E7A', marginBottom: 16 }}>{pendingAssignment?.shift || ''} • {pendingAssignment?.date ? new Date(pendingAssignment.date).toLocaleDateString() : ''}</Text>

            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.modalActionButton, { backgroundColor: '#369cfbff', marginRight: 8 }]} onPress={acceptAssignment}>
                <Text style={styles.modalActionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalActionButton, { backgroundColor: '#33AA55' }]} onPress={startAssignment}>
                <Text style={styles.modalActionButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Summary Modal */}
      <Modal visible={showSummary} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.summaryTitle}>Route Summary</Text>
            
            <View style={styles.summaryStat}>
              <Ionicons name="time-outline" size={32} color="#33AA55" />
              <View>
                <Text style={styles.summaryLabel}>Start Time</Text>
                <Text style={styles.summaryValue}>{startTime?.format("h:mm A")}</Text>
              </View>
            </View>

            <View style={styles.summaryStat}>
              <Ionicons name="map-outline" size={32} color="#33AA55" />
              <View>
                <Text style={styles.summaryLabel}>Distance Covered</Text>
                <Text style={styles.summaryValue}>{(distance / 1000).toFixed(2)} KM</Text>
              </View>
            </View>

            <View style={styles.summaryStat}>
              <Ionicons name="timer-outline" size={32} color="#33AA55" />
              <View>
                <Text style={styles.summaryLabel}>Total Duration</Text>
                <Text style={styles.summaryValue}>{formatDuration(duration)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={resetSession}>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.modalButtonText}>COMPLETE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Waze-like header
  overlayStats: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D4150',
    marginBottom: 4,
  },
  // Waze-like speedometer
  speedBadge: {
  position: 'absolute',
  bottom: 140,
  right: 16,
  backgroundColor: '#2D4150',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 24,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 4,
},

  speedText: {
  color: '#FFFFFF',
  fontWeight: '700',
  fontSize: 14,
  marginLeft: 6,
},

  // Waze-like action buttons
  collectButton: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#33AA55',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  collectText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 8,
  },
  controlGroup: {
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    gap: 16,
    alignSelf: 'center',
  },
  controlButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  controlText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  // Tutorial styles
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tutorialImage: {
    width: '100%',
    height: 200,
    marginVertical: 16,
    borderRadius: 12,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D4150',
    marginBottom: 8,
    textAlign: 'center',
  },
  tutorialText: {
    fontSize: 16,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  tutorialButton: {
    backgroundColor: '#33AA55',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorialButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  // Summary modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D4150',
    marginBottom: 24,
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#546E7A',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D4150',
  },
  modalButton: {
    marginTop: 24,
    backgroundColor: '#33AA55',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 8,
  },
  modalActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  routeActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default TruckMap;
