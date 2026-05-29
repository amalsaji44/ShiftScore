import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Alarm = {
  id: string;
  label: string;
  time: string;
  repeat: string;
  active: boolean;
};

export default function Alarms() {
  const router = useRouter();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState("Once");

  useEffect(() => {
    loadAlarms();
  }, []);

  async function loadAlarms() {
    try {
      const saved = await AsyncStorage.getItem("alarms");
      if (saved) setAlarms(JSON.parse(saved));
    } catch (e) {
      console.log("Error loading alarms", e);
    }
  }

  async function saveAlarms(updated: Alarm[]) {
    try {
      await AsyncStorage.setItem("alarms", JSON.stringify(updated));
    } catch (e) {
      console.log("Error saving alarms", e);
    }
  }

  async function handleAddAlarm() {
    if (!label) {
      Alert.alert("Please enter an alarm label!");
      return;
    }

    const parts = time.split(":");
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    if (isNaN(hours) || isNaN(minutes)) {
      Alert.alert("Please enter a valid time (e.g. 0630)");
      return;
    }

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      label,
      time,
      repeat,
      active: true,
    };

    const alarmDate = new Date();
    alarmDate.setHours(hours, minutes, 0, 0);
    if (alarmDate < new Date()) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ ShiftScore Alarm",
        body: label,
        sound: true,
      },
      trigger: alarmDate,
    });

    const updated = [...alarms, newAlarm];
    setAlarms(updated);
    saveAlarms(updated);
    setLabel("");
    setTime("");
    Alert.alert("✅ Alarm set for " + time);
  }

  async function handleDeleteAlarm(id: string) {
    const updated = alarms.filter((a) => a.id !== id);
    setAlarms(updated);
    saveAlarms(updated);
  }

  function toggleRepeat() {
    const options = ["Once", "Daily", "Weekdays", "Shift Days"];
    const current = options.indexOf(repeat);
    setRepeat(options[(current + 1) % options.length]);
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>⏰ Alarms</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Alarm</Text>

        <TextInput
          style={styles.input}
          placeholder="Alarm label (e.g. Wake up for night shift)"
          value={label}
          onChangeText={setLabel}
          placeholderTextColor="#aaa"
        />

        <TextInput
          style={styles.input}
          placeholder="Type time e.g. 0630 → 06:30"
          value={time}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, "").slice(0, 4);
            if (cleaned.length >= 3) {
              setTime(cleaned.slice(0, 2) + ":" + cleaned.slice(2));
            } else {
              setTime(cleaned);
            }
          }}
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          maxLength={5}
        />

        <TouchableOpacity style={styles.repeatBtn} onPress={toggleRepeat}>
          <Text style={styles.repeatText}>🔄 Repeat: {repeat}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addBtn} onPress={handleAddAlarm}>
          <Text style={styles.addBtnText}>Set Alarm ⏰</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Alarms</Text>
        {alarms.length === 0 && (
          <Text style={styles.noAlarms}>No alarms set yet!</Text>
        )}
        {alarms.map((alarm) => (
          <View key={alarm.id} style={styles.alarmCard}>
            <View style={styles.alarmInfo}>
              <Text style={styles.alarmTime}>{alarm.time}</Text>
              <Text style={styles.alarmLabel}>{alarm.label}</Text>
              <Text style={styles.alarmRepeat}>🔄 {alarm.repeat}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteAlarm(alarm.id)}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  backBtn: {
    padding: 16,
    paddingTop: 60,
  },
  backText: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d2d2d",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d2d2d",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#2d2d2d",
    marginBottom: 10,
  },
  repeatBtn: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  repeatText: {
    fontSize: 15,
    color: "#2d2d2d",
    fontWeight: "bold",
  },
  addBtn: {
    backgroundColor: "#7B68EE",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  noAlarms: {
    color: "#aaa",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  alarmCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  alarmLabel: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  alarmRepeat: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 20,
  },
});