import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Image} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LoginScreen = () => {
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // ✅ State to show bootup screen

  useEffect(() => {
    // Show bootup screen for 5 seconds
    setTimeout(() => {
      setShowSplash(false);
    }, 5000);
  }, []);

  const handleLogin = async () => {
  console.log("🔍 Login button clicked!");
  setLoading(true); // Show loading animation

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    console.log(" Sending request to backend...");
    const response = await fetch("https://ecobantay-backend.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactNumber: contact, password }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (response.ok) {
      console.log("🔑 Token received:", data.token);

      // ✅ Ensure the ID is present
      if (!data._id) {
        console.error("❌ No user ID returned from backend");
        alert("Login failed. No user ID found.");
        setLoading(false);
        return;
      }

      await AsyncStorage.removeItem("user");

      // ✅ Save the user details properly
      const userData = {
        _id: data._id,
        token: data.token,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
      };
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      console.log("👤 User role:", data.role);

      // ✅ COMPLETE OPEN_APP MISSION
      try {
        const missionRes = await fetch("https://ecobantay-backend.onrender.com/api/missions/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.token}`,
          },
          body: JSON.stringify({ userId: data._id, trigger: "open_app" }),
        });

        const missionData = await missionRes.json();
        console.log("🎯 Mission API response:", missionData);
      } catch (err) {
        console.error("⚠️ Failed to complete Open App mission", err);
      }

      // Modal
      setLoading(false);
      setLoginSuccess(true);

      setTimeout(() => {
        setLoginSuccess(false);
        if (data.role === "driver") {
          router.replace("/screens/TruckMap");
        } else {
          router.replace("/screens/Dashboard");
        }
      }, 2000); // Delay transition in boot-up
    } else {
      setLoading(false);
      alert(data.msg || "❌ Login failed.");
      console.log("❌ Server error:", data.msg);
    }
  } catch (error) {
    setLoading(false);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        alert("⏳ Server is too slow. Try again later!");
      } else {
        console.error("🔥 Login Error:", error.message);
        alert("Something went wrong. Check console logs.");
      }
    } else {
      console.error("🔥 Unknown error occurred");
      alert("An unknown error occurred.");
    }
  }
};


  // ✅ Show the Bootup screen first
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require("../assets/boot-up.png")} // ✅ Make sure this matches your image path
          style={styles.splashImage} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Information</Text>
      <Text style={styles.subtitle}>Enter information to log into your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Contact No."
        keyboardType="numeric"
        value={contact}
        onChangeText={(text) => {
          if (/^\d{0,11}$/.test(text)) {
            setContact(text);
          }
        }}
        maxLength={11}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="black"
          />
        </TouchableOpacity>
      </View>


      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>Login</Text>}
      </TouchableOpacity>

     


      <TouchableOpacity onPress={() => router.push("/signup")}>
        <Text style={styles.signUpText}>
          Don't have an account?{" "}
          <Text style={styles.signUpLink}>Sign Up Now!</Text>
        </Text>
      </TouchableOpacity>

      {/* ✅ SUCCESS MODAL */}
      <Modal visible={loginSuccess} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={50} color="green" />
            <Text style={styles.modalText}>Login Successful!</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({

 splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50", // ✅ Matches EcoBantay green theme
  },
  splashImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  passwordInput: { flex: 1 },
  rememberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  rememberMe: { fontSize: 14 },
  forgotPassword: { color: "blue" },
  loginButton: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  loginText: { color: "white", fontSize: 16, fontWeight: "bold" },
  orText: { textAlign: "center", marginBottom: 15 },
  googleButton: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  googleText: { fontSize: 16 },
  signUpText: { textAlign: "center", marginTop: 10 },
  signUpLink: { color: "green", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 250,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
});

export default LoginScreen;
