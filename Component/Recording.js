import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/FontAwesome5";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons"; // Using Ionicons for other icons

export default function RecordingsScreen({ navigation }) {
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [newRecordingName, setNewRecordingName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Profile states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false); // Toggle profile editing

  // Google Drive upload handler
  const googleDriveUpload = () => {
    Linking.openURL("https://drive.google.com/");
  };

  // Fetch email and recordings on component mount
  useEffect(() => {
    const fetchEmail = async () => {
      const storedEmail = await AsyncStorage.getItem("email");
      setEmail(storedEmail);
      if (storedEmail) {
        loadRecordings(storedEmail);
        loadUserProfile(storedEmail);
      }
    };
    fetchEmail();
  }, []);

  // Load recordings from AsyncStorage
  const loadRecordings = async (email) => {
    try {
      const storedRecordings = await AsyncStorage.getItem(email);
      if (storedRecordings) {
        setRecordings(JSON.parse(storedRecordings));
      }
    } catch (error) {
      console.error("Failed to load recordings:", error);
    }
  };

  // Load user profile from AsyncStorage
  const loadUserProfile = async (email) => {
    try {
      const storedFirstName = await AsyncStorage.getItem('firstName');
      const storedLastName = await AsyncStorage.getItem('lastName');
      
      if (storedFirstName) setFirstName(storedFirstName);
      if (storedLastName) setLastName(storedLastName);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  // Start recording
  async function startRecording() {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert("Microphone permission is required to record audio.");
      return;
    }
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setElapsedTime(0);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }

  // Stop recording
  async function stopRecording() {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        const newRecording = {
          id: Date.now().toString(),
          name: newRecordingName || `Recording-${Date.now()}`,
          uri,
          date: new Date().toLocaleString(),
          duration: elapsedTime,
        };
        const updatedRecordings = [...recordings, newRecording];
        setRecordings(updatedRecordings);
        await AsyncStorage.setItem(email, JSON.stringify(updatedRecordings));
        setRecording(null);
        setNewRecordingName("");
        setIsRecording(false);
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }
    }
  }

  // Toggle recording state
  async function handleRecording() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  // Play selected recording
  async function playRecording(recording) {
    const { sound } = await Audio.Sound.createAsync({ uri: recording.uri });
    await sound.playAsync();
  }

  // Delete selected recording
  async function deleteRecording(id) {
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    setRecordings(updatedRecordings);
    await AsyncStorage.setItem(email, JSON.stringify(updatedRecordings));
  }

  // Share recording
  async function shareRecording(recording) {
    try {
      if (await Sharing.isAvailableAsync()) {
        const result = await Sharing.shareAsync(recording.uri, {
          mimeType: "audio/m4a",
          dialogTitle: `Share ${recording.name}`,
          UTI: "com.apple.m4a-audio",
        });
        console.log("Shared successfully!", result);
      } else {
        console.log("Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error sharing recording:", error);
    }
  }

  // Filter recordings by search term
  const filteredRecordings = recordings.filter((rec) =>
    rec.date.includes(searchTerm)
  );

  // Handle profile editing
  const handleProfileEdit = () => {
    setIsEditingProfile(!isEditingProfile);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      if (firstName && lastName && email) {
        await AsyncStorage.setItem("firstName", firstName);
        await AsyncStorage.setItem("lastName", lastName);
        Alert.alert("Profile updated successfully!");
        setIsEditingProfile(false);
      } else {
        Alert.alert("Please fill out all fields.");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Failed to update profile. Please try again later.");
    }
  };

  // Logout user
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("email");
      await AsyncStorage.removeItem("firstName");
      await AsyncStorage.removeItem("lastName");
      navigation.replace("Login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Render recording item in list
  const renderItem = ({ item }) => (
    <View style={styles.recordingItem}>
      <Text style={styles.recordingText}>
        {item.name} - {item.date}
      </Text>
      <Text style={styles.recordingDuration}>
        Duration: {formatDuration(item.duration)}
      </Text>
      <View style={styles.recordingButtons}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => playRecording(item)}
        >
          <Icon name="play" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteRecording(item.id)}
        >
          <Icon name="trash-alt" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => shareRecording(item)}
        >
          <Icon name="share-alt" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Format duration in minutes:seconds
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search by date"
        placeholderTextColor="#888"
        onChangeText={setSearchTerm}
        style={styles.searchInput}
      />
      {!isRecording && (
        <TextInput
          placeholder="Enter recording name"
          placeholderTextColor="#888"
          onChangeText={setNewRecordingName}
          value={newRecordingName}
          style={styles.nameInput}
        />
      )}
      <TouchableOpacity style={styles.recordButton} onPress={handleRecording}>
        <Ionicons
          name={isRecording ? "stop-circle-outline" : "mic-outline"}
          size={30}
          color="#fff"
        />
        <Text style={styles.recordButtonText}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Text style={styles.profileTitle}>Profile</Text>
        {isEditingProfile ? (
          <>
            <TextInput
              style={styles.profileInput}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.profileInput}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.profileInfo}>{firstName} {lastName}</Text>
            <TouchableOpacity onPress={handleProfileEdit}>
              <Text style={styles.editButton}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Recordings List */}
      <FlatList
        data={filteredRecordings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
      
      {/* Google Drive upload */}
      <TouchableOpacity style={styles.uploadButton} onPress={googleDriveUpload}>
        <Text style={styles.uploadButtonText}>Upload to Google Drive</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  nameInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  profileSection: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  profileInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  profileInfo: {
    fontSize: 16,
    color: "#333",
  },
  editButton: {
    color: "#007bff",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: "#ff9900",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  recordingItem: {
    padding: 15,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  recordingDuration: {
    color: "#777",
  },
  recordingButtons: {
    flexDirection: "row",
    marginTop: 10,
  },
  playButton: {
    marginRight: 10,
    backgroundColor: "#007bff",
    padding: 5,
    borderRadius: 5,
  },
  deleteButton: {
    marginRight: 10,
    backgroundColor: "#dc3545",
    padding: 5,
    borderRadius: 5,
  },
  shareButton: {
    backgroundColor: "#28a745",
    padding: 5,
    borderRadius: 5,
  },
});
