import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Footer from '../../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AnimatedCard, 
  AnimatedButton, 
  AnimatedList,
  AnimatedModal
} from '../../components/animated';
import { useAppearAnimation, useStaggeredList } from '../../hooks/useAnimations';


 type NewsArticle = {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
};

  type User = {
    firstName: string;
    lastName: string;
    email: string;
  };

  const DashboardScreen = () => {
    const router = useRouter();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Home');
    const [user, setUser] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [showAnnouncement, setShowAnnouncement] = useState(false);

    // Header animations - simplified
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const API_KEY = '28d3c89e5a3d4494a68b00746eba1285'; // Palitan ng valid NewsAPI key

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });


    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) {
          console.error("No user session found.");
          return;
        }
        const { token } = JSON.parse(storedUser);
        console.log("Token used for fetching user:", token);
        const response = await fetch("https://ecobantay-backend.onrender.com/api/getUser", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("User Data Fetched:", data);
        if (response.ok) {
          setUser(data);
        } else {
          console.error("Error fetching user:", data.msg);
        }
      } catch (error) {
        console.error("Failed to fetch user information:", error);
      } finally {
        setUserLoading(false);
      }
    };

        const fetchNews = async () => {
        try {
          const res = await fetch("https://ecobantay-backend.onrender.com/api/news");
          const data = await res.json();
          console.log("📰 EcoBantay News:", data);
          if (data && Array.isArray(data)) {
            setNews(data.slice(0, 2)); // Limit to 2 items if needed
          } else {
            console.error("❌ Invalid news data format:", data);
            setNews([]);
          }
        } catch (error) {
          console.error("❌ Failed to fetch news:", error);
          setNews([]);
        } finally {
          setLoading(false);
        }
      };

  useEffect(() => {
  fetchUserData();
  fetchNews();

  // 🔔 Show announcement on Sunday, Tuesday, Wednesday, and Saturday
  const today = new Date();
  const dayOfWeek = today.getDay();

  const garbageDays = [0, 2, 3, 6]; // Sunday, Tue, Wed, Sat

  if (garbageDays.includes(dayOfWeek)) {
    setShowAnnouncement(true);
  }
}, []);


    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
        </View>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View>
            {userLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.greeting}>Hi {user ? user.firstName : 'User'}!</Text>
            )}
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/screens/Profile')}>
            <Ionicons name="person-circle-outline" size={30} color="white" />
          </TouchableOpacity>
        </View>

{/* 📢 Announcement Modal */}
<Modal
  visible={showAnnouncement}
  transparent
  animationType="fade"
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.modalIconContainer}>
        <Text style={{ fontSize: 40 }}>♻️</Text>
      </View>
      <Text style={styles.modalTitle}>Waste Collection Notice</Text>
      <View style={styles.modalDivider} />
      <Text style={styles.modalMessage}>
        The garbage collectors will be collecting waste today for regular collection. Please prepare your waste properly.
      </Text>
      <Text style={[styles.modalMessage, { fontWeight: '600', color: '#1B5E20' }]}>
        🎯 Don't forget to prepare your QR code for points!
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.modalButton,
          {
            transform: [{ scale: pressed ? 0.98 : 1 }],
            backgroundColor: pressed ? '#388E3C' : '#43A047'
          }
        ]}
        onPress={() => setShowAnnouncement(false)}
      >
        <Text style={styles.modalButtonText}>Got it!</Text>
      </Pressable>
    </View>
  </View>
</Modal>

{/* News Section */}
<ScrollView 
  style={styles.newsContainer} 
  contentContainerStyle={{ paddingBottom: 20 }}
  showsVerticalScrollIndicator={false}
>
  <Text style={styles.newsTitle}>WASTE RELATED NEWS:</Text>
  {loading ? (
    <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />
  ) : news.length === 0 ? (
    <Text style={[styles.newsText, { textAlign: 'center', marginTop: 20 }]}>
      No news available at the moment
    </Text>
  ) : (
    news.map((article, index) => (
      <View
        key={article._id}
        style={styles.newsItem}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/screens/News-Details",
              params: {
                title: article.title,
                image: `http://z:5000${article.imageUrl}`,
                content: article.content,
                date: new Date(article.createdAt).toLocaleDateString(),
                time: new Date(article.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            })
          }
        >
          <Image
            source={{ uri: `https://ecobantay-backend.onrender.com${article.imageUrl}` }}
            style={styles.newsImage}
          />
          <Text style={styles.newsText}>
            {article.title.length > 50
              ? article.title.substring(0, 50) + "..."
              : article.title}
          </Text>
        </TouchableOpacity>
      </View>
    ))
  )}
</ScrollView>

        {/* Feature Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/Proper-Disposal')}>
            <Ionicons name="book-outline" size={24} color="green" />
            <Text style={styles.buttonText}>Proper Disposal Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/Clean-Points')}>
            <Ionicons name="star-outline" size={24} color="green" />
            <Text style={styles.buttonText}>Clean Points</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/Reports')}>
            <Ionicons name="document-text-outline" size={24} color="green" />
            <Text style={styles.buttonText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/Request-pickup')}>
            <Ionicons name="car-outline" size={24} color="green" />
            <Text style={styles.buttonText}>Request Pick-up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerWrapper}>
    <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
  </View>

        
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: '#F5F5F5'
    },
    header: { 
      backgroundColor: 'green', 
      padding: 15, 
      alignItems: 'center' 
    },
    headerTitle: { 
      color: 'white', 
      fontSize: 18, 
      fontWeight: 'bold', 
      top: 12 
    },
    userInfo: {
      backgroundColor: 'green',
      padding: 20,
      paddingTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    greeting: { 
      color: 'white', 
      fontSize: 18, 
      fontWeight: 'bold' 
    },
    date: { 
      color: 'white', 
      fontSize: 14 
    },
    profileIcon: { 
      padding: 10 
    },
    newsContainer: { 
      flex: 1,
      padding: 20,
      marginBottom: 20
    },
    newsTitle: { 
      fontSize: 16, 
      fontWeight: 'bold', 
      marginBottom: 15,
      color: '#333'
    },
    newsItem: { 
      backgroundColor: 'white', 
      borderRadius: 10, 
      marginBottom: 15, 
      padding: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    newsImage: { 
      width: '100%', 
      height: 150, 
      borderRadius: 10,
      marginBottom: 10
    },
    newsText: { 
      marginTop: 5, 
      fontWeight: 'bold',
      fontSize: 14,
      color: '#333'
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    button: {
      flex: 1,
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    buttonText: { marginTop: 5, fontSize: 12, fontWeight: 'bold' },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 15,
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderColor: '#ddd',
    },
    navButton: { alignItems: 'center' },
    navText: { fontSize: 12, color: 'gray' },
    footerWrapper: {
      backgroundColor: '#FFF',
      paddingVertical: 10,
    },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20, // Responsive padding
  },
  modalBox: {
    width: "90%", // Responsive width
    maxWidth: 400, // Maximum width for larger screens
    backgroundColor: "#F5FFF5", // Light eco-green background
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    color: "#2E7D32", // Darker green
    textAlign: "center",
    letterSpacing: 0.5,
    paddingHorizontal: 10, // Responsive padding
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
    color: "#1B5E20", // Deep green for better readability
    paddingHorizontal: 10, // Responsive padding
  },
  modalButton: {
    backgroundColor: "#43A047", // Fresh green
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30, // Pill shape
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    transform: [{ scale: 1 }], // For animation
  },
  modalButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalDivider: {
    width: "100%",
    height: 2,
    backgroundColor: "#A5D6A7",
    marginVertical: 16,
    borderRadius: 1,
  },

  });

  export default DashboardScreen;
