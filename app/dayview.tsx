import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DayView() {
  const { date, shift } = useLocalSearchParams();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function getShiftColor(shift: string) {
    if (shift === "Day") return "#4A90E2";
    if (shift === "Night") return "#7B68EE";
    return "#4CAF50";
  }

  function getShiftEmoji(shift: string) {
    if (shift === "Day") return "🌅";
    if (shift === "Night") return "🌙";
    return "✅";
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={[styles.header, { backgroundColor: getShiftColor(shift as string) }]}>
        <Text style={styles.headerEmoji}>{getShiftEmoji(shift as string)}</Text>
        <Text style={styles.headerDate}>{date}</Text>
        <Text style={styles.headerShift}>{shift} Shift</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Notes</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Write your notes for this day..."
          multiline
          value={note}
          onChangeText={setNote}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? "✅ Saved!" : "Save Note"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Reminders</Text>
        <Text style={styles.comingSoon}>Coming soon!</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏋️ Activity</Text>
        <Text style={styles.comingSoon}>Coming soon!</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍎 Food & Calories</Text>
        <Text style={styles.comingSoon}>Coming soon!</Text>
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
  header: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerDate: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerShift: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
    opacity: 0.9,
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
  noteInput: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#2d2d2d",
    minHeight: 100,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  comingSoon: {
    color: "#aaa",
    fontSize: 14,
    fontStyle: "italic",
  },
});