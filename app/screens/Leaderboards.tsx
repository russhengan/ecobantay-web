import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

// Define types
interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface LeaderboardEntry {
  _id: string;
  user_id: User;
  clean_points: number;
  streak?: number;
  timestamp: string;
}

const API_BASE_URL = "https://ecobantay-backend.onrender.com/api/leaderboard";

export default function LeaderboardsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Weekly");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint;
      switch (activeTab) {
        case "Weekly":
          endpoint = `${API_BASE_URL}/weekly`;
          break;
        case "Monthly":
          endpoint = `${API_BASE_URL}/monthly`;
          break;
        case "All Time":
          endpoint = `${API_BASE_URL}/alltime`;
          break;
        default:
          endpoint = `${API_BASE_URL}/weekly`;
      }

      const response = await axios.get(endpoint);
      console.log("Leaderboard API response:", response.data);
      setLeaderboardData(response.data);
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
      setError("Failed to load leaderboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.push("/screens/Dashboard")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboards</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["Weekly", "Monthly", "All Time"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard */}
        <View style={styles.cardContainer}>
          <View style={styles.cardBackground}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>
                  Loading leaderboard data...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#d32f2f"
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchLeaderboardData}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : leaderboardData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={48} color="#2E7D32" />
                <Text style={styles.emptyText}>
                  No data available for this period
                </Text>
              </View>
            ) : (
              <FlatList
                data={leaderboardData}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => {
                  console.log("DEBUG renderItem item:", item);

                  return (
                    <View style={styles.row}>
                      {/* Rank */}
                      <View style={styles.rankCircle}>
                        <Text style={styles.rankText}>
                          {String(index + 1)}
                        </Text>
                      </View>

                      {/* Name */}
                      <Text style={styles.nameText}>
                        {item?.user_id?.last_name && item?.user_id?.first_name
                          ? `${item.user_id.last_name}, ${item.user_id.first_name}`
                          : "Unknown User"}
                      </Text>

                      {/* Points */}
                      <View style={styles.scoreContainer}>
                        <Ionicons
                          name="star"
                          size={16}
                          color="#FFD700"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.scoreText}>
                          {String(item.clean_points ?? 0)}
                        </Text>
                      </View>

                      {/* Streak */}
                      {item.streak && item.streak > 0 ? (
                        <View style={styles.streakContainer}>
                          <Ionicons name="flame" size={16} color="#e65100" />
                          <Text style={styles.streakText}>
                            {String(item.streak)}d
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", paddingHorizontal: 20, paddingTop: 10 },
  customHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { padding: 5, marginTop: 30 },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10, marginTop: 30 },
  tabContainer: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 20,
  },
  tabButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#F1F1F1" },
  activeTabButton: { backgroundColor: "#2E7D32" },
  tabText: { fontSize: 14, color: "#000", fontWeight: "600" },
  activeTabText: { color: "#FFF", fontWeight: "bold" },
  cardContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  cardBackground: { flex: 1, backgroundColor: "#A5D6A7", padding: 15, borderRadius: 10 },
  listContent: { paddingBottom: 20 },
  row: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rankText: { color: "#FFF", fontWeight: "bold" },
  nameText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#000" },
  scoreContainer: { flexDirection: "row", alignItems: "center" },
  scoreText: { fontSize: 14, fontWeight: "bold", color: "#000" },
  streakContainer: { flexDirection: "row", alignItems: "center", marginLeft: 10 },
  streakText: { fontSize: 12, fontWeight: "bold", color: "#e65100", marginLeft: 3 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#333", fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { marginTop: 10, color: "#d32f2f", fontSize: 14, textAlign: "center" },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#2E7D32",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryButtonText: { color: "#FFF", fontWeight: "bold" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { marginTop: 10, color: "#666", fontSize: 14, textAlign: "center" },
});
