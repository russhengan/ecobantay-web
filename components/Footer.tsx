import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type FooterProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const Footer = ({ activeTab, setActiveTab }: FooterProps) => {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      {/* Home - Left */}
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'Home' && styles.activeTab]}
        onPress={() => {
          router.push('/screens/Dashboard');
          setActiveTab('Home');
        }}
      >
        <Ionicons name="home" size={24} color={activeTab === 'Home' ? 'green' : 'gray'} />
        <Text style={[styles.navText, activeTab === 'Home' && styles.activeText]}>Home</Text>
      </TouchableOpacity>

      {/* Profile - Center */}
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'Profile' && styles.activeTab]}
        onPress={() => {
          router.push('/screens/Profile');
          setActiveTab('Profile');
        }}
      >
        <Ionicons name="person" size={24} color={activeTab === 'Profile' ? 'green' : 'gray'} />
        <Text style={[styles.navText, activeTab === 'Profile' && styles.activeText]}>Profile</Text>
      </TouchableOpacity>

      {/* Leaderboard - Right */}
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'Leaderboard' && styles.activeTab]}
        onPress={() => {
          router.push('/screens/Leaderboards'); // Make sure this path exists
          setActiveTab('Leaderboard');
        }}
      >
        <Ionicons name="trophy-outline" size={24} color={activeTab === 'Leaderboard' ? 'green' : 'gray'} />
        <Text style={[styles.navText, activeTab === 'Leaderboard' && styles.activeText]}>Leaderboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Evenly spread items (Home left, Profile center, Leaderboard right)
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15, // Adds spacing from screen edges
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  navButton: {
    alignItems: 'center',
    flex: 1, // Each button takes equal space
  },
  navText: { fontSize: 12, color: 'gray', marginTop: 5 },
  activeTab: {  borderBottomColor: 'green' },
  activeText: { color: 'green', fontWeight: 'bold' },
});

export default Footer;
