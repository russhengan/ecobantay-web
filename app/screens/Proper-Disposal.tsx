import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "../../components/Toast";

const API_URL = "https://ecobantay-backend.onrender.com/api";
const VIEW_DELAY_MS = 3500; // ~3.5 seconds

const disposalGuides = [
  {
    id: 1,
    title: "Food Waste Reduction",
    subtitle: "Smart ways to reduce food waste and save money",
    image: require("../../assets/food.jpg"),
  },
  {
    id: 2,
    title: "Recycling Mastery",
    subtitle: "Advanced techniques for effective recycling",
    image: require("../../assets/recycle.jpg"),
  },
  {
    id: 3,
    title: "Composting Guide",
    subtitle: "Turn organic waste into garden gold",
    image: require("../../assets/compost.jpg"),
  },
  {
    id: 4,
    title: "Upcycling Ideas",
    subtitle: "Creative ways to give items new life",
    image: require("../../assets/upcycle.jpg"),
  },
];

export default function ProperDisposalGuideScreen() {
  const router = useRouter();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hasTriggeredRef = useRef(false);

  // ✅ Mission trigger (after 3.5s)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;
        const { _id } = JSON.parse(storedUser);

        await axios.post(`${API_URL}/missions/complete`, {
          userId: _id,
          trigger: "disposal_guide",
        });

        setToastMessage("📘 Mission Completed: Check Disposal Guide");
        setToastVisible(true);
      } catch (err: any) {
        const msg = err?.response?.data?.msg || err.message;
        if (msg !== "Mission already completed today!") {
          console.error("Mission error (disposal_guide):", msg);
        }
      }
    }, VIEW_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* ✅ Reusable Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        duration={4500}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/screens/Dashboard")}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waste Management Tips</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* ✅ Expert Tip Card */}
        <View style={styles.expertCard}>
          <Image
            source={require("../../assets/expert.jpg")}
            style={styles.expertImage}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.expertTitle}>Expert Waste Reduction Tips</Text>
            <Text style={styles.expertDesc}>
              Practical advice from sustainability professionals to help you
              minimize waste and maximize recycling.
            </Text>
          </View>
        </View>

        {/* ✅ Cards for Disposal Guides */}
        {disposalGuides.map((tip) => (
          <TouchableOpacity
            key={tip.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/screens/Disposal-Detail",
                params: { ...tip },
              })
            }
          >
            <Image source={tip.image} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text
                style={styles.cardTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {tip.title}
              </Text>
              <Text
                style={styles.cardSubtitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {tip.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },

  scrollContainer: { padding: 16 },

  // ✅ Expert Tip Highlight Card
  expertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f4ea",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  expertImage: { width: 75, height: 75, borderRadius: 10, marginRight: 14 },
  expertTitle: {
    fontSize: 17,
    fontWeight: "bold", // ✅ bold
    color: "#1b5e20",
    marginBottom: 4,
  },
  expertDesc: { fontSize: 14, color: "#333", flexShrink: 1 },

  // ✅ Cards for Disposal Guides
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: { width: 75, height: 75, borderRadius: 10, marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold", // ✅ bold
    marginBottom: 2,
    flexShrink: 1,
  },
  cardSubtitle: { fontSize: 14, color: "#555", flexShrink: 1 },
});
