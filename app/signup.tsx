import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

const SignUpScreen = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [address, setAddress] = useState("");

  const handleNext = () => {
    // Ensure all fields are filled
    if (!firstName || !lastName || !gender || !contactNumber || !city || !barangay || !address) {
      alert("Please fill in all fields.");
      return;
    }

    // Navigate to the next screen and pass the data
    router.push({
      pathname: "/signup-validate",
      params: {
        firstName,
        lastName,
        gender,
        contactNumber,
        city,
        barangay,
        address,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Basic Information</Text>
      <Text style={styles.subtitle}>Create an account to get all features.</Text>

      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />

      <View style={styles.pickerContainer}>
        <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)}>
          <Picker.Item label="Gender/Sex" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
        </Picker>
      </View>

      <TextInput style={styles.input} placeholder="Contact Number" keyboardType="phone-pad" maxLength={11} value={contactNumber} onChangeText={setContactNumber} />
      <TextInput style={styles.input} placeholder="City/Municipality" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Barangay" value={barangay} onChangeText={setBarangay} />
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 15 },
  nextButton: { backgroundColor: "green", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  nextText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default SignUpScreen;
