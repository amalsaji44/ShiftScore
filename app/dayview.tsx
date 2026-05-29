import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AlarmReminder = {
  id: string;
  type: "Reminder" | "Alarm";
  label: string;
  time: string;
  repeatUnit: string;
  repeatValue: string;
};

type Workout = {
  id: string;
  type: string;
  emoji: string;
  duration: string;
  calories: string;
  heartRate: string;
  intensity: string;
  notes: string;
};

const WORKOUT_TYPES = [
  { name: "Walking", emoji: "🚶" },
  { name: "Running", emoji: "🏃" },
  { name: "Cycling", emoji: "🚴" },
  { name: "Strength", emoji: "🏋️" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Yoga", emoji: "🧘" },
  { name: "Cardio", emoji: "❤️" },
  { name: "HIIT", emoji: "⚡" },
  { name: "Custom", emoji: "➕" },
];

const INTENSITIES = ["Easy", "Moderate", "Hard", "Max"];

export default function DayView() {
  const { date, shift } = useLocalSearchParams();
  const router = useRouter();

  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"Reminder" | "Alarm">("Reminder");
  const [repeatUnit, setRepeatUnit] = useState("Once");
  const [repeatValue, setRepeatValue] = useState("");
  const [showRepeat, setShowRepeat] = useState(false);
  const [items, setItems] = useState<AlarmReminder[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedType, setSelectedType] = useState(WORKOUT_TYPES[0]);
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [intensity, setIntensity] = useState("Moderate");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [customType, setCustomType] = useState("");

  const repeatUnits = ["Once", "Minutes", "Hours", "Days", "Weeks", "Weekdays", "Shift Days"];

  useEffect(() => {
    loadNote();
    loadItems();
    loadWorkouts();
  }, []);

  async function loadNote() {
    try {
      const saved = await AsyncStorage.getItem(`note_${date}`);
      if (saved) setNote(saved);
    } catch (e) { console.log(e); }
  }

  async function loadItems() {
    try {
      const saved = await AsyncStorage.getItem(`items_${date}`);
      if (saved) setItems(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function loadWorkouts() {
    try {
      const saved = await AsyncStorage.getItem(`workouts_${date}`);
      if (saved) setWorkouts(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function handleSaveNote() {
    try {
      await AsyncStorage.setItem(`note_${date}`, note);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (e) { console.log(e); }
  }

  async function handleAddItem() {
    if (!label) { Alert.alert("Please enter a label!"); return; }
    const parts = time.split(":");
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) { Alert.alert("Please enter a valid time (e.g. 0630)"); return; }
    const triggerDate = new Date(date as string);
    triggerDate.setHours(hours, minutes, 0, 0);
    if (triggerDate < new Date()) { Alert.alert("That time has already passed!"); return; }

    let repeatInterval = undefined;
    if (repeatUnit === "Minutes" && repeatValue) repeatInterval = parseInt(repeatValue) * 60;
    else if (repeatUnit === "Hours" && repeatValue) repeatInterval = parseInt(repeatValue) * 60 * 60;
    else if (repeatUnit === "Days" && repeatValue) repeatInterval = parseInt(repeatValue) * 60 * 60 * 24;
    else if (repeatUnit === "Weeks" && repeatValue) repeatInterval = parseInt(repeatValue) * 60 * 60 * 24 * 7;
    else if (repeatUnit === "Weekdays") repeatInterval = 60 * 60 * 24;
    else if (repeatUnit === "Shift Days") repeatInterval = 60 * 60 * 24 * 9;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: type === "Alarm" ? "⏰ ShiftScore Alarm" : "🔔 ShiftScore Reminder",
        body: label,
        sound: true,
      },
      trigger: repeatInterval ? { seconds: repeatInterval, repeats: true } : triggerDate,
    });

    const newItem: AlarmReminder = {
      id: Date.now().toString(),
      type, label, time, repeatUnit, repeatValue,
    };

    const updated = [...items, newItem];
    setItems(updated);
    await AsyncStorage.setItem(`items_${date}`, JSON.stringify(updated));
    setLabel(""); setTime(""); setRepeatValue(""); setRepeatUnit("Once"); setShowRepeat(false);
    Alert.alert(`✅ ${type} set for ${time}`);
  }

  async function handleDeleteItem(id: string) {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    await AsyncStorage.setItem(`items_${date}`, JSON.stringify(updated));
  }

  async function saveWorkout() {
    if (!duration) { Alert.alert("Please enter duration!"); return; }
    const newWorkout: Workout = {
      id: Date.now().toString(),
      type: selectedType.name === "Custom" ? customType || "Custom" : selectedType.name,
      emoji: selectedType.emoji,
      duration, calories, heartRate, intensity,
      notes: workoutNotes,
    };
    const updated = [...workouts, newWorkout];
    setWorkouts(updated);
    await AsyncStorage.setItem(`workouts_${date}`, JSON.stringify(updated));
    setShowWorkoutModal(false);
    resetWorkoutForm();
  }

  async function deleteWorkout(id: string) {
    const updated = workouts.filter((w) => w.id !== id);
    setWorkouts(updated);
    await AsyncStorage.setItem(`workouts_${date}`, JSON.stringify(updated));
  }

  function resetWorkoutForm() {
    setDuration(""); setCalories(""); setHeartRate("");
    setWorkoutNotes(""); setCustomType(""); setIntensity("Moderate");
    setSelectedType(WORKOUT_TYPES[0]);
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

  function getIntensityColor(intensity: string) {
    if (intensity === "Easy") return "#4CAF50";
    if (intensity === "Moderate") return "#4A90E2";
    if (intensity === "Hard") return "#FF9500";
    return "#FF3B30";
  }

  function getRepeatLabel(item: AlarmReminder) {
    if (item.repeatUnit === "Once") return "Once";
    if (item.repeatValue) return `Every ${item.repeatValue} ${item.repeatUnit}`;
    return `Every ${item.repeatUnit}`;
  }

  const totalCalories = workouts.reduce((sum, w) => sum + (parseInt(w.calories) || 0), 0);
  const totalMinutes = workouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/calendar")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={[styles.header, { backgroundColor: getShiftColor(shift as string) }]}>
        <Text style={styles.headerEmoji}>{getShiftEmoji(shift as string)}</Text>
        <Text style={styles.headerDate}>{date}</Text>
        <Text style={styles.headerShift}>{shift} Shift</Text>
      </View>

      {/* NOTES */}
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
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
          <Text style={styles.saveBtnText}>{noteSaved ? "✅ Saved!" : "Save Note"}</Text>
        </TouchableOpacity>
      </View>

      {/* REMINDERS & ALARMS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Reminders & Alarms</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === "Reminder" && styles.toggleActive]}
            onPress={() => setType("Reminder")}
          >
            <Text style={[styles.toggleText, type === "Reminder" && styles.toggleTextActive]}>🔔 Reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, type === "Alarm" && styles.toggleActive]}
            onPress={() => setType("Alarm")}
          >
            <Text style={[styles.toggleText, type === "Alarm" && styles.toggleTextActive]}>⏰ Alarm</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={type === "Alarm" ? "Alarm label (e.g. Wake up!)" : "Reminder message"}
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

        <TouchableOpacity
          style={[styles.repeatToggleBtn, repeatUnit !== "Once" && styles.repeatToggleActive]}
          onPress={() => setShowRepeat(!showRepeat)}
        >
          <Text style={[styles.repeatToggleText, repeatUnit !== "Once" && styles.repeatToggleTextActive]}>
            🔄 {repeatUnit !== "Once" ? `Repeat: Every ${repeatValue} ${repeatUnit}` : "Repeat: Off — tap to set"}
          </Text>
        </TouchableOpacity>

        {showRepeat && (
          <View style={styles.repeatPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {repeatUnits.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.repeatChip, repeatUnit === unit && styles.repeatChipActive]}
                  onPress={() => {
                    setRepeatUnit(unit);
                    if (unit === "Once") { setShowRepeat(false); setRepeatValue(""); }
                  }}
                >
                  <Text style={[styles.repeatChipText, repeatUnit === unit && styles.repeatChipTextActive]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {["Minutes", "Hours", "Days", "Weeks"].includes(repeatUnit) && (
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder={`Every how many ${repeatUnit.toLowerCase()}?`}
                value={repeatValue}
                onChangeText={setRepeatValue}
                placeholderTextColor="#aaa"
                keyboardType="numeric"
              />
            )}
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
          <Text style={styles.addBtnText}>{type === "Alarm" ? "Set Alarm ⏰" : "Set Reminder 🔔"}</Text>
        </TouchableOpacity>

        {items.length > 0 && (
          <View style={styles.itemList}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemType}>{item.type === "Alarm" ? "⏰" : "🔔"} {item.type}</Text>
                  <Text style={styles.itemTime}>{item.time}</Text>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemRepeat}>🔄 {getRepeatLabel(item)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ACTIVITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏋️ Activity</Text>

        {workouts.length > 0 && (
          <View style={styles.activitySummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🔥</Text>
              <Text style={styles.summaryValue}>{totalCalories}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>⏱️</Text>
              <Text style={styles.summaryValue}>{totalMinutes}</Text>
              <Text style={styles.summaryLabel}>Minutes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>💪</Text>
              <Text style={styles.summaryValue}>{workouts.length}</Text>
              <Text style={styles.summaryLabel}>Workouts</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.syncBtn}>
          <Text style={styles.syncBtnText}>⌚ Sync from Fitbit</Text>
          <Text style={styles.syncSubText}>Connect your Fitbit to auto-sync</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logBtn} onPress={() => setShowWorkoutModal(true)}>
          <Text style={styles.logBtnText}>+ Log Workout</Text>
        </TouchableOpacity>

        {workouts.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <View style={styles.workoutLeft}>
              <Text style={styles.workoutEmoji}>{workout.emoji}</Text>
            </View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutType}>{workout.type}</Text>
              <View style={styles.workoutStats}>
                <Text style={styles.workoutStat}>⏱️ {workout.duration} min</Text>
                {workout.calories ? <Text style={styles.workoutStat}>🔥 {workout.calories} cal</Text> : null}
                {workout.heartRate ? <Text style={styles.workoutStat}>❤️ {workout.heartRate} bpm</Text> : null}
              </View>
              <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(workout.intensity) }]}>
                <Text style={styles.intensityText}>{workout.intensity}</Text>
              </View>
              {workout.notes ? <Text style={styles.workoutNoteText}>{workout.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => deleteWorkout(workout.id)}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        {workouts.length === 0 && (
          <Text style={styles.comingSoon}>No workouts logged yet! Tap + Log Workout</Text>
        )}
      </View>

      {/* FOOD */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍎 Food & Calories</Text>
        <Text style={styles.comingSoon}>Coming soon!</Text>
      </View>

      {/* WORKOUT MODAL */}
      <Modal visible={showWorkoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Log Workout</Text>

              <Text style={styles.modalLabel}>Workout Type</Text>
              <View style={styles.typeGrid}>
                {WORKOUT_TYPES.map((wtype) => (
                  <TouchableOpacity
                    key={wtype.name}
                    style={[styles.typeChip, selectedType.name === wtype.name && styles.typeChipActive]}
                    onPress={() => setSelectedType(wtype)}
                  >
                    <Text style={styles.typeEmoji}>{wtype.emoji}</Text>
                    <Text style={[styles.typeName, selectedType.name === wtype.name && styles.typeNameActive]}>
                      {wtype.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedType.name === "Custom" && (
                <TextInput
                  style={styles.input}
                  placeholder="Custom workout name"
                  value={customType}
                  onChangeText={setCustomType}
                  placeholderTextColor="#aaa"
                />
              )}

              <Text style={styles.modalLabel}>Duration (minutes) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 45"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />

              <Text style={styles.modalLabel}>Calories Burned</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 320"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />

              <Text style={styles.modalLabel}>Avg Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 145"
                value={heartRate}
                onChangeText={setHeartRate}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />

              <Text style={styles.modalLabel}>Intensity</Text>
              <View style={styles.intensityRow}>
                {INTENSITIES.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.intensityChip, intensity === level && { backgroundColor: getIntensityColor(level) }]}
                    onPress={() => setIntensity(level)}
                  >
                    <Text style={[styles.intensityChipText, intensity === level && styles.intensityChipTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="How did it feel?"
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
                multiline
                placeholderTextColor="#aaa"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveWorkout}>
                <Text style={styles.saveBtnText}>Save Workout 💪</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowWorkoutModal(false); resetWorkoutForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { fontSize: 16, color: "#4A90E2", fontWeight: "bold" },
  header: { margin: 16, borderRadius: 16, padding: 24, alignItems: "center" },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerDate: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerShift: { fontSize: 16, color: "#fff", marginTop: 4, opacity: 0.9 },
  section: {
    backgroundColor: "#fff", margin: 16, marginTop: 0,
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d", marginBottom: 12 },
  noteInput: {
    borderWidth: 1, borderColor: "#eee", borderRadius: 10,
    padding: 12, fontSize: 15, color: "#2d2d2d", minHeight: 100, textAlignVertical: "top",
  },
  saveBtn: { backgroundColor: "#4A90E2", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 12 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  toggleRow: { flexDirection: "row", marginBottom: 12, gap: 10 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#eee", alignItems: "center" },
  toggleActive: { backgroundColor: "#7B68EE", borderColor: "#7B68EE" },
  toggleText: { fontSize: 14, color: "#888", fontWeight: "bold" },
  toggleTextActive: { color: "#fff" },
  input: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, fontSize: 15, color: "#2d2d2d", marginBottom: 10 },
  repeatToggleBtn: { backgroundColor: "#f0f0f0", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 10 },
  repeatToggleActive: { backgroundColor: "#e8e4ff", borderColor: "#7B68EE", borderWidth: 1 },
  repeatToggleText: { fontSize: 14, color: "#888", fontWeight: "bold" },
  repeatToggleTextActive: { color: "#7B68EE" },
  repeatPanel: { backgroundColor: "#f9f9f9", borderRadius: 10, padding: 12, marginBottom: 10 },
  repeatChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#eee", marginRight: 8, backgroundColor: "#fff" },
  repeatChipActive: { backgroundColor: "#7B68EE", borderColor: "#7B68EE" },
  repeatChipText: { fontSize: 13, color: "#888", fontWeight: "bold" },
  repeatChipTextActive: { color: "#fff" },
  addBtn: { backgroundColor: "#7B68EE", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 4 },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  itemList: { marginTop: 16 },
  itemCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, marginBottom: 8 },
  itemInfo: { flex: 1 },
  itemType: { fontSize: 12, color: "#7B68EE", fontWeight: "bold" },
  itemTime: { fontSize: 20, fontWeight: "bold", color: "#2d2d2d" },
  itemLabel: { fontSize: 13, color: "#555" },
  itemRepeat: { fontSize: 12, color: "#aaa", marginTop: 2 },
  deleteText: { fontSize: 20 },
  activitySummary: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  summaryItem: { alignItems: "center" },
  summaryEmoji: { fontSize: 24, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: "bold", color: "#2d2d2d" },
  summaryLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  syncBtn: { backgroundColor: "#f0f0f0", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 12 },
  syncBtnText: { fontSize: 15, fontWeight: "bold", color: "#2d2d2d" },
  syncSubText: { fontSize: 12, color: "#888", marginTop: 4 },
  logBtn: { backgroundColor: "#4A90E2", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 12 },
  logBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  workoutCard: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, marginBottom: 10 },
  workoutLeft: { marginRight: 12 },
  workoutEmoji: { fontSize: 32 },
  workoutInfo: { flex: 1 },
  workoutType: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d" },
  workoutStats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  workoutStat: { fontSize: 13, color: "#555" },
  intensityBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  intensityText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  workoutNoteText: { fontSize: 12, color: "#888", marginTop: 6, fontStyle: "italic" },
  comingSoon: { color: "#aaa", fontSize: 14, fontStyle: "italic" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#2d2d2d", marginBottom: 20, textAlign: "center" },
  modalLabel: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 8, marginTop: 4 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  typeChip: { alignItems: "center", borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, width: "28%" },
  typeChipActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeName: { fontSize: 11, color: "#888", fontWeight: "bold" },
  typeNameActive: { color: "#fff" },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  intensityRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  intensityChip: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#eee", alignItems: "center" },
  intensityChipText: { fontSize: 12, color: "#888", fontWeight: "bold" },
  intensityChipTextActive: { color: "#fff" },
  cancelBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#888", fontSize: 16 },
});