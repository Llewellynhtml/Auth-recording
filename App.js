import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Button, Modal, Pressable, StyleSheet,
    Text, TextInput, TouchableOpacity, View, ScrollView
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function App() {
    const [recordings, setRecordings] = useState([]);
    const [recording, setRecording] = useState(null);
    const [recordingName, setRecordingName] = useState('');
    const [playing, setPlaying] = useState(-1);
    const [sound, setSound] = useState(null);
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    async function startRecording() {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            let { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });
        setDialogVisible(true);
    }

    const handleSaveRecording = () => {
        if (recordingName.trim() !== '') {
            const timestamp = new Date().toLocaleString(); // Get the current date and time
            setRecordings([
                ...recordings,
                {
                    name: recordingName,
                    recording: recording,
                    timestamp: timestamp,
                },
            ]);
            setRecording(undefined);
            setDialogVisible(false);
            setRecordingName('');
        }
    };

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    const filteredRecordings = recordings.filter((rec) =>
        rec.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <Text style={styles.heading}>
                Codetribe Audio Recorder
            </Text>

            <Modal visible={isDialogVisible} animationType="slide" style={styles.modal}>
                <View style={styles.column}>
                    <Text style={styles.modalText}>Enter Recording Name:</Text>
                    <TextInput
                        style={styles.modalInput}
                        onChangeText={(text) => setRecordingName(text)}
                        value={recordingName}
                    />
                    <Pressable style={styles.saveButton} onPress={handleSaveRecording}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </Pressable>
                    <Pressable style={styles.cancelButton} onPress={() => setDialogVisible(false)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                </View>
            </Modal>

            <TextInput
                style={styles.searchInput}
                placeholder="Search recordings..."
                onChangeText={setSearchQuery}
                value={searchQuery}
            />

            <ScrollView style={styles.list}>
                {filteredRecordings.map((recording, index) => {
                    return (
                        <View key={index} style={styles.recordingContainer}>
                            <TouchableOpacity
                                onPress={async () => {
                                    const { sound } = await recording.recording.createNewLoadedSoundAsync();
                                    setSound(sound);
                                    setPlaying(index);
                                    await sound.playAsync();
                                    sound.setOnPlaybackStatusUpdate(async (status) => {
                                        if (status.didJustFinish) {
                                            setPlaying(-1);
                                            await sound.unloadAsync();
                                        }
                                    });
                                }}
                                style={styles.playButton}
                            >
                                <Ionicons
                                    name={playing === index ? 'pause-circle' : 'play-circle'}
                                    size={40}
                                    color="#FF6F61"
                                />
                                <View style={styles.recordingInfo}>
                                    <Text style={styles.recordingName}>{recording.name}</Text>
                                    <Text style={styles.timestamp}>{recording.timestamp}</Text>
                                </View>
                            </TouchableOpacity>
                            <Ionicons
                                name="trash-bin"
                                size={30}
                                color="#FF6F61"
                                onPress={() => {
                                    setRecordings(recordings.filter((rec, i) => i !== index));
                                }}
                                style={styles.trashIcon}
                            />
                        </View>
                    );
                })}
            </ScrollView>

            <Pressable
                style={styles.recordButton}
                onPress={recording ? stopRecording : startRecording}
            >
                <Text style={styles.recordButtonText}>
                    {recording ? 'Stop Recording' : 'Start Recording'}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#F9F9F9",
        height: "100%",
        padding: 20,
    },
    heading: {
        color: "#FF6F61",
        fontSize: 32,
        textAlign: "center",
        fontWeight: "bold",
        marginVertical: 20,
    },
    searchInput: {
        height: 40,
        borderColor: "#DDDDDD",
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginBottom: 20,
        backgroundColor: "#FFF",
    },
    list: {
        marginTop: 10,
        flex: 1,
    },
    recordingContainer: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        marginVertical: 5,
        borderRadius: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    playButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    recordingInfo: {
        marginLeft: 10,
    },
    recordingName: {
        fontSize: 18,
        color: "#333",
        fontWeight: "600",
    },
    timestamp: {
        fontSize: 12,
        color: "#777",
        marginTop: 4,
    },
    trashIcon: {
        marginLeft: 15,
    },
    modal: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalText: {
        fontSize: 18,
        marginBottom: 10,
    },
    modalInput: {
        height: 40,
        borderColor: "#DDDDDD",
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 10,
        width: 200,
        backgroundColor: "#F2F2F2",
    },
    saveButton: {
        backgroundColor: "#FF6F61",
        padding: 10,
        marginTop: 20,
        borderRadius: 20,
        width: 100,
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFF",
        fontWeight: "bold",
    },
    cancelButton: {
        marginTop: 10,
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#888",
    },
    recordButton: {
        alignItems: "center",
        backgroundColor: "#FF6F61",
        padding: 15,
        marginTop: 20,
        borderRadius: 25,
    },
    recordButtonText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
});
