import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

// ✅ Helper: Extract YouTube video ID → thumbnail
const getYouTubeThumbnail = (url: string) => {
  const match = url.match(/v=([^&]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
};

export default function DisposalDetail() {
  const router = useRouter();
  const { title, subtitle } = useLocalSearchParams();

  // ✅ Local banner images
  const imageMap: Record<string, any> = {
    "Food Waste Reduction": require("../../assets/food.jpg"),
    "Recycling Mastery": require("../../assets/recycle.jpg"),
    "Composting Guide": require("../../assets/compost.jpg"),
    "Upcycling Ideas": require("../../assets/upcycle.jpg"),
  };

  const detailsMap: Record<string, string[]> = {
    "Food Waste Reduction": [
      "Meal Planning: Plan meals for the week and buy only what you need to avoid spoilage.",
      "Proper Storage: Store fruits and vegetables correctly to extend freshness.",
      "First In, First Out: Use older food items before newer ones.",
      "Creative Leftovers: Repurpose leftovers into new meals.",
      "Portion Control: Cook appropriate portions to avoid excess food waste.",
    ],
    "Recycling Mastery": [
      "Clean Before Recycling: Rinse containers to remove food residue.",
      "Know Your Symbols: Learn recycling symbols ♻️ and local guidelines.",
      "No Plastic Bags: Never put plastic bags in curbside recycling.",
      "Break Down Boxes: Flatten cardboard to save space in bins.",
    ],
    "Composting Guide": [
      "Green & Brown Balance: Mix greens (food scraps) with browns (leaves, paper).",
      "No Meat/Dairy: Avoid composting meat, dairy, or oily foods.",
      "Aerate Regularly: Turn your compost pile weekly for faster decomposition.",
      "Smaller Pieces: Chop materials for quicker breakdown.",
    ],
    "Upcycling Ideas": [
      "Glass Jar Storage: Use glass jars for pantry organization or as drinking glasses.",
      "T-Shirt Tote Bags: Transform old t-shirts into reusable shopping bags.",
      "Furniture Makeovers: Sand and repaint old furniture instead of buying new.",
    ],
  };

  // ✅ Video sources per topic
  const videoMap: Record<string, { title: string; url: string }[]> = {
    "Food Waste Reduction": [
      {
        title: "Tips to Reduce Food Waste",
        url: "https://www.youtube.com/watch?v=MVBBe-PzCw8",
      },
      {
        title: "Food Waste: The Hidden Cost of the Food We Throw Out",
        url: "https://www.youtube.com/watch?v=ishA6kry8nc",
      },
    ],
    "Recycling Mastery": [
      {
        title: "3 Simple Tips to Recycle Properly",
        url: "https://www.youtube.com/watch?v=x_Eu4KADHbs",
      },
      {
        title: "How Plastic Recycling Actually Works",
        url: "https://www.youtube.com/watch?v=zO3jFKiqmHo",
      },
    ],
    "Composting Guide": [
      {
        title: "Beginner's Guide to Composting",
        url: "https://www.youtube.com/watch?v=egyNJ7xPyoQ",
      },
      {
        title: "How to Make Compost at Home",
        url: "https://www.youtube.com/watch?v=zy70DAaeFBI",
      },
    ],
    "Upcycling Ideas": [
      {
        title: "15 Clever Ways to Upcycle Everything",
        url: "https://www.youtube.com/watch?v=fGqfWvm4TnQ",
      },
      {
        title: "5 Practical Upcycling Projects",
        url: "https://www.youtube.com/watch?v=sGK4KWXA4NA",
      },
    ],
  };

  const tips = detailsMap[title as string] || [];
  const videos = videoMap[title as string] || [];

  // ✅ Animations
  const fadeAnim = useRef(new Animated.Value(0)).current; // banner
  const listAnims = useRef(
    tips.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const sectionHeaderAnim = useRef({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(20),
  }).current;

  const videoAnims = useRef(
    videos.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.9),
    }))
  ).current;

  useEffect(() => {
    // Banner
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      // Tips
      Animated.stagger(
        200,
        listAnims.map(({ opacity, translateY }) =>
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        )
      ).start(() => {
        // Section header (Related Videos)
        Animated.parallel([
          Animated.timing(sectionHeaderAnim.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(sectionHeaderAnim.translateY, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Video cards staggered
          Animated.stagger(
            300,
            videoAnims.map(({ opacity, scale }) =>
              Animated.parallel([
                Animated.timing(opacity, {
                  toValue: 1,
                  duration: 600,
                  useNativeDriver: true,
                }),
                Animated.timing(scale, {
                  toValue: 1,
                  duration: 600,
                  useNativeDriver: true,
                }),
              ])
            )
          ).start();
        });
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Banner */}
        {title && (
          <Animated.Image
            source={imageMap[title as string]}
            style={[styles.bannerImage, { opacity: fadeAnim }]}
          />
        )}

        {/* Title + Subtitle */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>

        {/* Tips */}
        {tips.map((tip, index) => (
          <Animated.View
            key={index}
            style={[
              styles.tipContainer,
              {
                opacity: listAnims[index].opacity,
                transform: [{ translateY: listAnims[index].translateY }],
              },
            ]}
          >
            <Ionicons name="leaf" size={18} color="green" style={styles.tipIcon} />
            <Text style={styles.tipText}>{tip}</Text>
          </Animated.View>
        ))}

        {/* Related Videos Section */}
        {videos.length > 0 && (
          <View style={{ marginTop: 24 }}>
            {/* Header */}
            <Animated.Text
              style={[
                styles.videoHeader,
                {
                  opacity: sectionHeaderAnim.opacity,
                  transform: [{ translateY: sectionHeaderAnim.translateY }],
                },
              ]}
            >
              📺 Related Videos & Sources
            </Animated.Text>

            {/* Video Cards */}
            {videos.map((video, index) => {
              const thumbnail = getYouTubeThumbnail(video.url);
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.videoCard,
                    {
                      opacity: videoAnims[index].opacity,
                      transform: [{ scale: videoAnims[index].scale }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                    onPress={() => Linking.openURL(video.url)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: thumbnail || undefined }}
                      style={styles.thumbnail}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.videoTitle}>{video.title}</Text>
                    </View>
                    <Ionicons
                      name="logo-youtube"
                      size={22}
                      color="red"
                      style={styles.youtubeIcon}
                    />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  backButton: { padding: 4 },

  scrollContainer: { padding: 16, paddingBottom: 60 },

  bannerImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
  },

  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  tipIcon: { marginRight: 8, marginTop: 2 },
  tipText: { fontSize: 15, color: "#333", flex: 1, lineHeight: 22 },

  videoHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111",
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: {
    width: 100,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  videoTitle: { fontSize: 14, fontWeight: "500", color: "#333" },
  youtubeIcon: { marginLeft: 6 },
});
