import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Truck {
  id: string;
  route: { latitude: number; longitude: number }[];
  color: string;
  markerColor: string;
}

const MissionsScreen = () => {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const RESIDENT_LOCATION = { latitude: 14.679927, longitude: 120.983290 };

  const trucks: Truck[] = [
    {
      id: 'truck1',
      color: 'green',
      markerColor: 'blue',
      route: [
        { latitude: 14.704993, longitude: 120.961785 }, // Solid Waste
        { latitude: 14.7039, longitude: 120.9633 },
        { latitude: 14.7025, longitude: 120.9654 },
        { latitude: 14.7009, longitude: 120.9678 },
        { latitude: 14.6992, longitude: 120.9703 },
        { latitude: 14.6965, longitude: 120.9732 },
        { latitude: 14.6928, longitude: 120.976 },
        { latitude: 14.6884, longitude: 120.9794 },
        { latitude: 14.6841, longitude: 120.9818 },
        { latitude: 14.6815, longitude: 120.9829 },
        RESIDENT_LOCATION,
      ],
    },
    {
      id: 'truck2',
      color: 'blue',
      markerColor: 'orange',
      route: [
        { latitude: 14.702, longitude: 120.960 },
        { latitude: 14.700, longitude: 120.962 },
        { latitude: 14.698, longitude: 120.964 },
        { latitude: 14.696, longitude: 120.966 },
        { latitude: 14.693, longitude: 120.969 },
        { latitude: 14.690, longitude: 120.972 },
      ],
    },
    {
      id: 'truck3',
      color: 'purple',
      markerColor: 'red',
      route: [
        { latitude: 14.705, longitude: 120.963 },
        { latitude: 14.704, longitude: 120.965 },
        { latitude: 14.702, longitude: 120.968 },
        { latitude: 14.699, longitude: 120.971 },
        { latitude: 14.695, longitude: 120.975 },
      ],
    },
  ];

  const [truckPositions, setTruckPositions] = useState(trucks.map(t => t.route[0]));
  const [truckPaths, setTruckPaths] = useState(trucks.map(t => [t.route[0]]));
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    let step = 1;
    const interval = setInterval(() => {
      setTruckPositions(prev => {
        return prev.map((pos, i) => {
          const route = trucks[i].route;
          if (step < route.length) {
            const next = route[step];
            setTruckPaths(paths => {
              const updated = [...paths];
              updated[i] = [...updated[i], next];
              return updated;
            });

            if (i === 0) {
              setEta((route.length - step - 1) * 0.5); // only Truck 1
              mapRef.current?.animateToRegion(
                {
                  ...next,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                1000
              );
            }

            return next;
          } else {
            return pos;
          }
        });
      });

      if (step >= trucks[0].route.length) {
        clearInterval(interval);
        setEta(0);
        Alert.alert('Mission Complete', 'Truck 1 has reached your location.');
      }

      step++;
    }, 15000); // ⏱ 15 seconds per move

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/screens/Dashboard')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Missions</Text>
      </View>

      <Text style={styles.label}>Estimated Time of Arrival:</Text>
      <Text style={styles.etaText}>
        {eta !== null ? (
          <Text style={styles.etaMinutes}>{eta.toFixed(1)} Minutes</Text>
        ) : (
          'Calculating...'
        )}
      </Text>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 14.692,
            longitude: 120.975,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Resident destination marker */}
          <Marker coordinate={RESIDENT_LOCATION}>
            <Ionicons name="home" size={32} color="black" />
          </Marker>

          {/* Dynamic Trucks & Paths */}
          {trucks.map((truck, index) => (
  <React.Fragment key={truck.id}>
    <Polyline
      key={`${truck.id}-line`}
      coordinates={truckPaths[index]}
      strokeWidth={5}
      strokeColor={truck.color}
    />
    <Marker
      key={`${truck.id}-marker`}
      coordinate={truckPositions[index]}
    >
      <Image
        source={require('../../assets/truck-icon.png')}
        style={{ width: 35, height: 35, tintColor: truck.markerColor }}
      />
    </Marker>
  </React.Fragment>
))}

        </MapView>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/MissionQR')}>
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 33,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  etaText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
  },
  etaMinutes: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  mapContainer: {
    borderWidth: 2,
    borderColor: 'green',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    width: Dimensions.get('window').width * 0.9,
    height: 300,
  },
  button: {
    height: 50,
    backgroundColor: '#28a745',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MissionsScreen;
