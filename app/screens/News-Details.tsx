import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../../components/Footer";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "../../components/Toast"; // ✅ Import Toast

const API_URL = "https://ecobantay-backend.onrender.com/api";

const NewsDetailScreen = () => {
  const { title, image, date, time, content, url } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Home");

  // ✅ Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // ✅ Trigger "read_news" mission once article is opened (after 6s delay)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;
        const { _id } = JSON.parse(storedUser);

        const res = await axios.post(`${API_URL}/missions/complete`, {
          userId: _id,
          trigger: "read_news",
        });

        if (res.status === 200) {
          setToastMessage("📰 Mission Completed: Read News");
          setToastVisible(true);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.msg || err.message;
        if (errorMsg === "Mission already completed today!") {
          console.log("ℹ️ Already completed today, silent skip.");
          return;
        }
        console.log("❌ Error completing read_news mission:", errorMsg);
      }
    }, 6000); // ⏳ 6 seconds delay

    return () => clearTimeout(timer); // cleanup if user exits early
  }, []);

  const imageUrl =
    typeof image === "string"
      ? image
      : Array.isArray(image) && image.length > 0
      ? image[0]
      : "https://via.placeholder.com/300";

  return (
    <View style={styles.container}>
      {/* ✅ Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        duration={4500}
      />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={30} color="black" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Image */}
      <Image source={{ uri: imageUrl }} style={styles.image} />

      {/* Date & Time */}
      <Text style={styles.datetime}>
        {date} • {time}
      </Text>

      {/* Content */}
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.content}>{content}</Text>
      </ScrollView>

      {/* Footer */}
      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};

export default NewsDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderRadius: 50,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  datetime: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  contentContainer: {
    flex: 1,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "justify",
    marginBottom: 10,
  },
});
