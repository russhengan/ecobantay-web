import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const SignupValidateScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("resident"); // ✅ Ensure consistency
  const [registrationSuccess, setRegistrationSuccess] = useState(false); // ✅ For modal display

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("https://ecobantay-backend.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: params.firstName,
          lastName: params.lastName,
          gender: params.gender,
          contactNumber: params.contactNumber,
          city: params.city,
          barangay: params.barangay,
          address: params.address,
          email,
          password,
          role,
        }),
      });

      // ✅ Log raw response para malaman kung JSON o may error
      const textResponse = await response.text();
      console.log("📥 Raw Response:", textResponse);

      const data = JSON.parse(textResponse);
      console.log("✅ Parsed JSON:", data);

      if (response.ok) {
        // ✅ Show success modal
        setRegistrationSuccess(true);

        // ✅ Auto-close modal after 2 seconds & redirect to Login
        setTimeout(() => {
          setRegistrationSuccess(false);
          router.replace("/");
        }, 2000);
      } else {
        alert(data.msg || "Signup failed.");
      }
    } catch (error) {
      console.error("❌ Signup Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/signup")} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Account Creation</Text>
      <Text style={styles.subtitle}>Create an account to get all features.</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail Address:"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
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
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="black" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>

      {/* ✅ SUCCESS MODAL (Same Style as Index.tsx) */}
      <Modal visible={registrationSuccess} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={50} color="green" />
            <Text style={styles.modalText}>Registration Successful!</Text>
            <Text style={styles.modalSubtext}>Please log in to continue.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ✅ Keep styles as is & added modal styles
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  backButton: { position: "absolute", top: 70, left: 10, padding: 10 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 15, backgroundColor: "#F3F3F3" },
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 15, backgroundColor: "#F3F3F3" },
  passwordInput: { flex: 1 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, backgroundColor: "#F3F3F3", marginBottom: 15 },
  signupButton: { backgroundColor: "green", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 15 },
  signupText: { color: "white", fontSize: 16, fontWeight: "bold" },

  // ✅ Modal Styles (Same as index.tsx)
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
  modalSubtext: {
    fontSize: 14,
    marginTop: 5,
    color: "gray",
  },
});

export default SignupValidateScreen;
