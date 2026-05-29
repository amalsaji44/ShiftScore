import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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

type Workout = {
  id: string;
  type: string;
  emoji: string;
  duration: string;
  calories: string;
  heartRate: string;
  intensity: string;
  notes: string;
  date: string;
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

export default function Activity() {
  const router = useRouter();
  const today = new Date().toDateString();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(WORKOUT_TYPES[0]);
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [intensity, setIntensity] = useState("Moderate");
  const [notes, setNotes] = useState("");
  const [customType, setCustomType] = useState("");

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    try {
      const saved = await AsyncStorage.getItem("workouts");
      if (saved) setWorkouts(JSON.parse(saved));
    } catch (e) {
      console.log(e);
    }
  }

  async function saveWorkout() {
    if (!duration) {
      Alert.alert("Please enter duration!");
      return;
    }

    const newWorkout: Workout = {
      id: Date.now().toString(),
      type: selectedType.name === "Custom" ? customType || "Custom" : selectedType.name,
      emoji: selectedType.emoji,
      duration,
      calories,
      heartRate,
      intensity,
      notes,
      date: today,
    };

    const updated = [...workouts, newWorkout];
    setWorkouts(updated);
    await AsyncStorage.setItem("workouts", JSON.stringify(updated));
    setShowModal(false);
    resetForm();
  }

  async function deleteWorkout(id: string) {
    const updated = workouts.filter((w) => w.id !== id);
    setWorkouts(updated);
    await AsyncStorage.setItem("workouts", JSON.stringify(updated));
  }

  function resetForm() {
    setDuration("");
    setCalories("");
    setHeartRate("");
    setNotes("");
    setCustomType("");
    setIntensity("Moderate");
    setSelectedType(WORKOUT_TYPES[0]);
  }

  function getTodayStats() {
    const todayWorkouts = workouts.filter((w) => w.date === today);
    const totalCalories = todayWorkouts.reduce((sum, w) => sum + (parseInt(w.calories) || 0), 0);
    const totalMinutes = todayWorkouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);
    return { totalCalories, totalMinutes, count: todayWorkouts.length };
  }

  const stats = getTodayStats();
  const todayWorkouts = workouts.filter((w) => w.date === today);
  const pastWorkouts = workouts.filter((w) => w.date !== today);

  function getIntensityColor(intensity: string) {
    if (intensity === "Easy") return "#4CAF50";
    if (intensity === "Moderate") return "#4A90E2";
    if (intensity === "Hard") return "#FF9500";
    return "#FF3B30";
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🏋️ Activity</Text>

      {/* TODAY'S SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🔥</Text>
            <Text style={styles.summaryValue}>{stats.totalCalories}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>⏱️</Text>
            <Text style={styles.summaryValue}>{stats.totalMinutes}</Text>
            <Text style={styles.summaryLabel}>Minutes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>💪</Text>
            <Text style={styles.summaryValue}>{stats.count}</Text>
            <Text style={styles.summaryLabel}>Workouts</Text>
          </View>
        </View>

        {/* Fitbit Sync Placeholder */}
        <TouchableOpacity style={styles.syncBtn}>
          <Text style={styles.syncBtnText}>⌚ Sync from Fitbit</Text>
          <Text style={styles.syncSubText}>Connect your Fitbit to auto-sync</Text>
        </TouchableOpacity>
      </View>

      {/* LOG WORKOUT BUTTON */}
      <TouchableOpacity style={styles.logBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.logBtnText}>+ Log Workout</Text>
      </TouchableOpacity>

      {/* TODAY'S WORKOUTS */}
      {todayWorkouts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          {todayWorkouts.map((workout) => (
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
                {workout.notes ? <Text style={styles.workoutNotes}>{workout.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => deleteWorkout(workout.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* PAST WORKOUTS */}
      {pastWorkouts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          {pastWorkouts.slice(-5).reverse().map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutLeft}>
                <Text style={styles.workoutEmoji}>{workout.emoji}</Text>
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutType}>{workout.type}</Text>
                <Text style={styles.workoutDate}>{workout.date}</Text>
                <View style={styles.workoutStats}>
                  <Text style={styles.workoutStat}>⏱️ {workout.duration} min</Text>
                  {workout.calories ? <Text style={styles.workoutStat}>🔥 {workout.calories} cal</Text> : null}
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteWorkout(workout.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {workouts.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏃</Text>
          <Text style={styles.emptyText}>No workouts logged yet!</Text>
          <Text style={styles.emptySubText}>Tap "+ Log Workout" to get started</Text>
        </View>
      )}

      {/* LOG WORKOUT MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Log Workout</Text>

              {/* Workout Type Grid */}
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

              {/* Duration */}
              <Text style={styles.modalLabel}>Duration (minutes) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 45"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />

              {/* Calories */}
              <Text style={styles.modalLabel}>Calories Burned</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 320"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />

              {/* Heart Rate */}
              <Text style={styles.modalLabel}>Avg Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 145"
                value={heartRate}
                onChangeText={setHeartRate}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />

              {/* Intensity */}
              <Text style={styles.modalLabel}>Intensity</Text>
              <View style={styles.intensityRow}>
                {INTENSITIES.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.intensityChip,
                      intensity === level && { backgroundColor: getIntensityColor(level) },
                    ]}
                    onPress={() => setIntensity(level)}
                  >
                    <Text style={[styles.intensityChipText, intensity === level && styles.intensityChipTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={styles.modalLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="How did it feel?"
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholderTextColor="#aaa"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveWorkout}>
                <Text style={styles.saveBtnText}>Save Workout 💪</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); resetForm(); }}>
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d2d2d",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  syncBtnText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  syncSubText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  logBtn: {
    backgroundColor: "#4A90E2",
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  logBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
  workoutCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  workoutLeft: {
    marginRight: 12,
  },
  workoutEmoji: {
    fontSize: 32,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  workoutDate: {
    fontSize: 11,
    color: "#aaa",
    marginBottom: 4,
  },
  workoutStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  workoutStat: {
    fontSize: 13,
    color: "#555",
  },
  intensityBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  intensityText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  workoutNotes: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    fontStyle: "italic",
  },
  deleteText: {
    fontSize: 20,
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d2d2d",
    marginBottom: 20,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 8,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  typeChip: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    width: "28%",
  },
  typeChipActive: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeName: {
    fontSize: 11,
    color: "#888",
    fontWeight: "bold",
  },
  typeNameActive: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#2d2d2d",
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  intensityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  intensityChip: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  intensityChipText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "bold",
  },
  intensityChipTextActive: {
    color: "#fff",
  },
  saveBtn: {
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 16,
  },
});