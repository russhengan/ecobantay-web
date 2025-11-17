import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  name: string;
  points: number;
  caption?: string;
};

export default function ShareCard({ name, points, caption }: Props) {
  // Use app icon (update path if you add a dedicated logo)
  const logo = require('../assets/icon.png');

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["#66BB6A", "#2E7D32"]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.card}
      >
        <View style={styles.contentRow}>
          <View style={styles.brandBlock}>
            <View style={styles.logoWrap}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.appName}>EcoBantay</Text>
            <Text style={styles.tagline}>Keeping Barangay Marulas clean!</Text>
          </View>

          <View style={styles.pointsBlock}>
            <Text style={styles.pointsLabel}>Clean Points</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsNumber}>{points}</Text>
            </View>
          </View>

          <View style={styles.userBlock}>
            <Text style={styles.userSmall}>Shared by</Text>
            <Text style={styles.userName}>{name}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Caption displayed outside the image (not captured) */}
      {caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{caption}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 28,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBlock: { flex: 1, alignItems: 'flex-start' },
  logoWrap: {
    width: 116,
    height: 116,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  logo: { width: 88, height: 88 },
  appName: { fontSize: 34, color: '#fff', fontWeight: '900' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  pointsBlock: { alignItems: 'center', flex: 1 },
  pointsLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pointsNumber: { fontSize: 56, color: '#FFF8E1', fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 10 },
  userBlock: { alignItems: 'flex-end', flex: 0.8 },
  userSmall: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginBottom: 6 },
  userName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  captionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    maxWidth: '90%',
  },
  captionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
});
