import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator,
  Animated,
  Share,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ShareCard from '../../components/ShareCard';
import Toast from '../../components/Toast';

interface HistoryEntry {
  description: string;
  date: string;
  points: number;
}

const missionsList = [
  { id: "open_app", title: "Open App", points: 1, icon: "phone-portrait" },
  { id: "read_news", title: "Read News", points: 1, icon: "newspaper" },
  { id: "report_waste", title: "Report Waste Incident", points: 2, icon: "trash" },
  { id: "disposal_guide", title: "Check Disposal Guide", points: 1, icon: "book" },
];

const missionMessages: { [key: string]: string } = {
  open_app: "📱 Mission Completed: Open App",
  read_news: "📰 Mission Completed: Read News",
  report_waste: "🗑 Mission Completed: Report Waste Incident",
  disposal_guide: "📘 Mission Completed: Check Disposal Guide",
};

export default function CleanPointsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [points, setPoints] = useState<number>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<{ [key: string]: boolean }>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [isProcessingShare, setIsProcessingShare] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [shareCaption, setShareCaption] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const API_URL = "https://ecobantay-backend.onrender.com/api";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const fetchPointsAndHistory = async () => {
    setLoading(true);
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;
      const parsed = JSON.parse(storedUser);
      const { _id, name } = parsed;
      if (name) setUserName(name);

      const pointsResponse = await axios.get(`${API_URL}/user/points?userId=${_id}`);
      if (pointsResponse.status === 200) {
        setPoints(pointsResponse.data.totalPoints);
        setStreak(pointsResponse.data.streak || 0);

        if (pointsResponse.data.bonusAwarded) {
          showToast("🔥 Congrats! 7-Day Streak Bonus +5 Points!");
        }
      }

      const historyResponse = await axios.get(`${API_URL}/user/history?userId=${_id}`);
      if (historyResponse.status === 200 && Array.isArray(historyResponse.data)) {
        setHistory(historyResponse.data);
      }

      const completedResponse = await axios.get(`${API_URL}/missions/completed/${_id}`);
      if (completedResponse.status === 200) {
        setCompletedMissions(completedResponse.data);
      }
    } catch (error: any) {
      console.error("🛑 Error fetching points/history:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  useFocusEffect(useCallback(() => {
    fetchPointsAndHistory();
    startAnimations();
  }, []));

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPointsAndHistory(); 
    });
    return unsubscribe;
  }, [navigation]);

  const completeMission = async (trigger: string) => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;
      const { _id } = JSON.parse(storedUser);

      const res = await axios.post(`${API_URL}/missions/complete`, { userId: _id, trigger });

      if (res.status === 200) {
        await fetchPointsAndHistory();
        const msg = missionMessages[trigger] || `🎉 Mission Completed!`;
        showToast(msg);
      }
    } catch (err: any) {
      console.error("Mission error:", err.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPointsAndHistory();
  };

  // ✅ Share button logic
  const handleSharePoints = async () => {
    try {
      const message = `I just earned ${points} Clean Points in EcoBantay! 🌱💪
Join me in keeping Barangay Marulas clean! #EcoBantay #CleanPoints`;
      await Share.share({ message });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  // --- Image share flow: open preview modal ---
  const viewShotRef = useRef<any>(null);

  const openSharePreview = () => {
    // Set a default caption based on points
    const defaultCaption = `I just earned ${points} Clean Points in EcoBantay! 🌱💪\nJoin me in keeping Barangay Marulas clean! #EcoBantay #CleanPoints`;
    setShareCaption(defaultCaption);
    setShowShareModal(true);
  };

  const handleCaptureAndShare = async () => {
    try {
      if (!viewShotRef.current) {
        Alert.alert('Error', 'Capture reference is not ready.');
        return;
      }
      setIsProcessingShare(true);

      // capture to temporary file
      const uri = await viewShotRef.current.capture?.({ format: 'png', quality: 0.95, result: 'tmpfile' });
      if (!uri) throw new Error('No image captured');

      // Try to share via expo-sharing when available
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        // Fallback: use Share API with file url and caption as message
        await Share.share({ url: uri, message: shareCaption as any });
      }

      setShowShareModal(false);
    } catch (err: any) {
      console.error('Capture/share error:', err.message || err);
      Alert.alert('Share failed', 'Could not generate share image. Make sure the native modules are installed.');
    } finally {
      setIsProcessingShare(false);
    }
  };

  const renderMissionCard = (mission: any, index: number) => {
    const done = completedMissions[mission.id];
    const itemSlide = useRef(new Animated.Value(50)).current;
    const itemOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(itemSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(itemOpacity, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ]).start();
    }, []);

    return (
      <Animated.View key={mission.id} style={{ opacity: itemOpacity, transform: [{ translateY: itemSlide }] }}>
        <View style={[styles.card, done && styles.cardCompleted]}>
  <Ionicons name={mission.icon as any} size={28} color={done ? "#2e7d32" : "#555"} />
  <View style={styles.cardContent}>
    <Text style={styles.cardTitle}>{mission.title}</Text>
    <Text style={styles.cardPoints}>+{mission.points} pts</Text>
  </View>
  {done && <Ionicons name="checkmark-circle" size={28} color="#2e7d32" />}
</View>

      </Animated.View>
    );
  };

  const renderHistoryItem = (entry: HistoryEntry, index: number) => (
    <Animated.View 
      key={`history-${index}`}
      style={[
        styles.historyCard,
        {
          opacity: fadeAnim,
          transform: [{ 
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20 * (index + 1), 0]
            })
          }]
        }
      ]}
    >
      <Text style={styles.historyTitle}>{entry.description}</Text>
      <Text style={styles.historyDate}>{entry.date}</Text>
      <View style={styles.pointTag}>
        <Ionicons name="ellipse" size={16} color="#FFB100" />
        <Text style={styles.pointValue}>{entry.points}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} duration={4500} />      
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/screens/Dashboard')}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tabButton} onPress={() => router.push('/screens/Mission-Screen')}>
          <Text style={styles.tabText}>Missions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
          <Text style={styles.activeTabText}>My Points</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Animated.View style={[styles.pointsContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
          <Ionicons name="cash" size={60} color="#FFB100" />
          <Text style={styles.pointsLabel}>Total Points</Text>
          <Animated.Text style={[styles.pointsValue, { opacity: fadeAnim }]}>
            {loading ? <ActivityIndicator /> : points}
          </Animated.Text>

 {/* ✅ Enhanced EcoBantay Share Button */}
<TouchableOpacity
  style={styles.shareButtonEnhanced}
  onPress={openSharePreview}
  activeOpacity={0.8}
>
  <Ionicons name="share-social-outline" size={22} color="#fff" />
  <Text style={styles.shareTextEnhanced}>Share My Points</Text>
</TouchableOpacity>
        </Animated.View>

        {/* Share preview modal (shows a preview and allows capture+share) */}
        <Modal visible={showShareModal} transparent animationType="fade" onRequestClose={() => setShowShareModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.previewWrapper}>
                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }} style={styles.viewShot}>
                  <ShareCard name={userName || 'You'} points={points} />
                </ViewShot>
              </View>

              <View style={styles.captionInputWrapper}>
                <Text style={styles.captionLabel}>Add a caption (optional):</Text>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Share your message..."
                  placeholderTextColor="#999"
                  value={shareCaption}
                  onChangeText={setShareCaption}
                  multiline
                  maxLength={280}
                />
                <Text style={styles.captionCounter}>{shareCaption.length}/280</Text>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setShowShareModal(false)}>
                  <Text style={{ fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#66BB6A' }]} onPress={handleCaptureAndShare} disabled={isProcessingShare}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{isProcessingShare ? 'Generating...' : 'Generate & Share'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={styles.sectionTitle}>Daily Missions</Text>
        {missionsList.map((mission, index) => renderMissionCard(mission, index))}

        <Text style={styles.sectionTitle}>Streaks</Text>
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={28} color="#e65100" />
          {streak > 0 ? (
            <Text style={styles.streakText}>{streak}-day streak! 🔥</Text>
          ) : (
            <Text style={styles.streakText}>No current streak. Start logging in daily!</Text>
          )}
        </View>

        <View style={styles.progressContainer}>
          {[...Array(7)].map((_, index) => (
            <View key={index} style={[styles.progressDot, index < streak ? styles.progressDotActive : styles.progressDotInactive]} />
          ))}
        </View>
        <Text style={styles.progressLabel}>{streak}/7 days towards bonus +5 points</Text>

        <Text style={styles.sectionTitle}>My History</Text>
        {history.length > 0 ? history.map(renderHistoryItem) : <Text style={styles.noHistory}>No history found.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', marginTop: 33 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  tabButton: { paddingVertical: 10 },
  tabText: { fontSize: 16, color: 'gray' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#28a745' },
  activeTabText: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },
  pointsContainer: { alignItems: 'center', marginBottom: 20 },
  pointsLabel: { fontSize: 16, color: 'gray' },
  pointsValue: { fontSize: 24, fontWeight: 'bold' 
  },
  shareButtonEnhanced: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#66BB6A', // ✅ Light EcoBantay green
  paddingVertical: 12,
  paddingHorizontal: 25,
  borderRadius: 16,
  borderWidth: 1.5, // ✅ new border
  borderColor: '#fff', // ✅ white accent border
  marginTop: 18,
  shadowColor: '#388E3C', // subtle darker green shadow
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 5,
  elevation: 5,
},
shareTextEnhanced: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 16,
  marginLeft: 10,
  letterSpacing: 0.5,
},


  sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#f5f5f5", padding: 12, borderRadius: 10, marginBottom: 10 },
  cardCompleted: { backgroundColor: "#e8f5e9" },
  cardContent: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: "500" },
  cardPoints: { fontSize: 14, color: "#777" },
  streakCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff3e0", padding: 12, borderRadius: 10, marginBottom: 20 },
  streakText: { fontSize: 16, marginLeft: 8, color: "#e65100", fontWeight: "500" },
  historyCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10 },
  historyTitle: { fontSize: 16, fontWeight: 'bold' },
  historyDate: { fontSize: 14, color: 'gray', marginBottom: 5 },
  pointTag: { flexDirection: 'row', alignItems: 'center', position: 'absolute', right: 15, top: 15 },
  pointValue: { fontSize: 16, marginLeft: 5 },
  noHistory: { textAlign: 'center', marginTop: 20, color: 'gray' },
  progressContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  progressDot: { width: 20, height: 20, borderRadius: 10, marginHorizontal: 5 },
  progressDotActive: { backgroundColor: "#e65100" },
  progressDotInactive: { backgroundColor: "#ffe0b2" },
  progressLabel: { textAlign: "center", fontSize: 14, color: "gray", marginBottom: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 12, width: '100%', maxWidth: 960, alignItems: 'center' },
  previewWrapper: { width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  viewShot: { width: 720, height: 378, alignItems: 'center', justifyContent: 'center' },
  captionInputWrapper: { width: '100%', marginTop: 14, paddingHorizontal: 12 },
  captionLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
  captionInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 13, maxHeight: 80, color: '#333', backgroundColor: '#f9f9f9' },
  captionCounter: { fontSize: 12, color: '#999', marginTop: 4, textAlign: 'right' },
  modalButtonsRow: { marginTop: 14, width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, minWidth: 140, alignItems: 'center' },
});
