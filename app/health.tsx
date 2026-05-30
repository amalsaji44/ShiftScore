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
import {
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

type HealthEntry = {
  date: string;
  sleep: number;
  sleepQuality: string;
  water: number;
  mood: string;
  energy: number;
  steps: number;
  heartRate: number;
  weight: number;
  caloriesBurned: number;
  notes: string;
};

const MOODS = [
  { label: "😄 Great", value: "Great", color: "#4CAF50" },
  { label: "🙂 Good", value: "Good", color: "#8BC34A" },
  { label: "😐 Okay", value: "Okay", color: "#FF9500" },
  { label: "😔 Low", value: "Low", color: "#FF5722" },
  { label: "😩 Awful", value: "Awful", color: "#F44336" },
];

const SLEEP_QUALITY = [
  { label: "😴 Deep", value: "Deep", color: "#4A90E2" },
  { label: "🛌 Good", value: "Good", color: "#4CAF50" },
  { label: "😪 Light", value: "Light", color: "#FF9500" },
  { label: "😵 Poor", value: "Poor", color: "#F44336" },
];

export default function Health() {
  const router = useRouter();
  const today = new Date().toDateString();
  const todayKey = new Date().toISOString().split("T")[0];

  const [entry, setEntry] = useState<HealthEntry>({
    date: todayKey,
    sleep: 0,
    sleepQuality: "",
    water: 0,
    mood: "",
    energy: 5,
    steps: 0,
    heartRate: 0,
    weight: 0,
    caloriesBurned: 0,
    notes: "",
  });

  const [history, setHistory] = useState<HealthEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [healthConnectAvailable, setHealthConnectAvailable] = useState(false);

  useEffect(() => {
    loadToday();
    loadHistory();
    checkHealthConnect();
  }, []);

  async function checkHealthConnect() {
    try {
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        setHealthConnectAvailable(true);
      }
    } catch (e) { console.log("Health Connect not available", e); }
  }

  async function syncFromHealthConnect() {
    setSyncing(true);
    try {
      const isInitialized = await initialize();
      if (!isInitialized) {
        Alert.alert("Health Connect not available on this device!");
        setSyncing(false);
        return;
      }

      await requestPermission([
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
        { accessType: "read", recordType: "SleepSession" },
      ]);

      const startTime = new Date();
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date();
      endTime.setHours(23, 59, 59, 999);

      const timeRangeFilter = {
        operator: "between" as const,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      // Steps
      let totalSteps = 0;
      try {
        const stepsData = await readRecords("Steps", { timeRangeFilter });
        totalSteps = stepsData.records.reduce((sum: number, r: any) => sum + r.count, 0);
      } catch (e) { console.log("Steps error", e); }

      // Heart Rate
      let avgHeartRate = 0;
      try {
        const hrData = await readRecords("HeartRate", { timeRangeFilter });
        if (hrData.records.length > 0) {
          const allSamples = hrData.records.flatMap((r: any) => r.samples);
          avgHeartRate = Math.round(allSamples.reduce((sum: number, s: any) => sum + s.beatsPerMinute, 0) / allSamples.length);
        }
      } catch (e) { console.log("Heart rate error", e); }

      // Calories
      let totalCalories = 0;
      try {
        const calData = await readRecords("ActiveCaloriesBurned", { timeRangeFilter });
        totalCalories = Math.round(calData.records.reduce((sum: number, r: any) => sum + r.energy.inKilocalories, 0));
      } catch (e) { console.log("Calories error", e); }

      // Sleep (last night)
      let sleepHours = 0;
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(18, 0, 0, 0);
        const sleepData = await readRecords("SleepSession", {
          timeRangeFilter: {
            operator: "between" as const,
            startTime: yesterday.toISOString(),
            endTime: endTime.toISOString(),
          }
        });
        if (sleepData.records.length > 0) {
          const totalMs = sleepData.records.reduce((sum: number, r: any) => {
            return sum + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime());
          }, 0);
          sleepHours = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
        }
      } catch (e) { console.log("Sleep error", e); }

      const updated = {
        ...entry,
        steps: totalSteps || entry.steps,
        heartRate: avgHeartRate || entry.heartRate,
        caloriesBurned: totalCalories || entry.caloriesBurned,
        sleep: sleepHours || entry.sleep,
      };

      await saveEntry(updated);
      Alert.alert(
        "✅ Synced from Health Connect!",
        `Steps: ${totalSteps}\nHeart Rate: ${avgHeartRate} bpm\nCalories: ${totalCalories} cal\nSleep: ${sleepHours}h`
      );
    } catch (e) {
      Alert.alert("Sync failed", "Make sure Health Connect is installed and permissions are granted!");
      console.log(e);
    }
    setSyncing(false);
  }

  async function loadToday() {
    try {
      const saved = await AsyncStorage.getItem(`health_${todayKey}`);
      if (saved) setEntry(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function loadHistory() {
    try {
      const entries: HealthEntry[] = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const saved = await AsyncStorage.getItem(`health_${key}`);
        if (saved) entries.push(JSON.parse(saved));
      }
      setHistory(entries);
    } catch (e) { console.log(e); }
  }

  async function saveEntry(updated: HealthEntry) {
    try {
      await AsyncStorage.setItem(`health_${todayKey}`, JSON.stringify(updated));
      setEntry(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.log(e); }
  }

  function updateField(field: keyof HealthEntry, value: any) {
    saveEntry({ ...entry, [field]: value });
  }

  function getEnergyColor(e: number) {
    if (e >= 8) return "#4CAF50";
    if (e >= 5) return "#FF9500";
    return "#F44336";
  }

  function getSleepColor(h: number) {
    if (h >= 7) return "#4CAF50";
    if (h >= 5) return "#FF9500";
    return "#F44336";
  }

  const avgSleep = history.length > 0
    ? (history.reduce((s, h) => s + h.sleep, 0) / history.length).toFixed(1)
    : "—";
  const avgEnergy = history.length > 0
    ? (history.reduce((s, h) => s + h.energy, 0) / history.length).toFixed(1)
    : "—";

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>❤️ Health</Text>
      <Text style={styles.subtitle}>{today}</Text>

      {/* SYNC CARD */}
      <TouchableOpacity
        style={[styles.syncCard, syncing && styles.syncCardActive]}
        onPress={syncFromHealthConnect}
        disabled={syncing}
      >
        <Text style={styles.syncCardIcon}>⌚</Text>
        <View style={styles.syncCardInfo}>
          <Text style={styles.syncCardTitle}>
            {syncing ? "Syncing..." : "Sync from Health Connect"}
          </Text>
          <Text style={styles.syncCardSub}>
            Auto-fill steps, heart rate, calories & sleep
          </Text>
        </View>
        <Text style={styles.syncCardArrow}>{syncing ? "⏳" : "→"}</Text>
      </TouchableOpacity>

      {/* TODAY SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Today's Overview</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>😴</Text>
            <Text style={[styles.summaryValue, { color: getSleepColor(entry.sleep) }]}>
              {entry.sleep || "—"}h
            </Text>
            <Text style={styles.summaryLabel}>Sleep</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>👟</Text>
            <Text style={styles.summaryValue}>
              {entry.steps > 0 ? entry.steps.toLocaleString() : "—"}
            </Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>❤️</Text>
            <Text style={styles.summaryValue}>
              {entry.heartRate > 0 ? `${entry.heartRate}` : "—"}
            </Text>
            <Text style={styles.summaryLabel}>BPM</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🔥</Text>
            <Text style={styles.summaryValue}>
              {entry.caloriesBurned > 0 ? entry.caloriesBurned : "—"}
            </Text>
            <Text style={styles.summaryLabel}>Cal Burned</Text>
          </View>
        </View>

        {/* Steps progress */}
        {entry.steps > 0 && (
          <>
            <View style={styles.stepsBar}>
              <View style={[styles.stepsFill, { width: `${Math.min((entry.steps / 10000) * 100, 100)}%` as any }]} />
            </View>
            <Text style={styles.stepsLabel}>{entry.steps.toLocaleString()} / 10,000 steps goal</Text>
          </>
        )}
      </View>

      {/* SLEEP */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😴 Sleep</Text>
        <Text style={styles.sectionSub}>Hours slept</Text>
        <View style={styles.btnRow}>
          {[4, 5, 6, 7, 8, 9, 10].map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.optBtn, entry.sleep === h && { backgroundColor: getSleepColor(h) }]}
              onPress={() => updateField("sleep", h)}
            >
              <Text style={[styles.optBtnText, entry.sleep === h && { color: "#fff" }]}>{h}h</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.sectionSub, { marginTop: 12 }]}>Sleep quality</Text>
        <View style={styles.btnRow}>
          {SLEEP_QUALITY.map(q => (
            <TouchableOpacity
              key={q.value}
              style={[styles.optBtn, entry.sleepQuality === q.value && { backgroundColor: q.color }]}
              onPress={() => updateField("sleepQuality", q.value)}
            >
              <Text style={[styles.optBtnText, entry.sleepQuality === q.value && { color: "#fff" }]}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* MOOD */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😊 Mood</Text>
        <View style={styles.moodRow}>
          {MOODS.map(m => (
            <TouchableOpacity
              key={m.value}
              style={[styles.moodBtn, entry.mood === m.value && { backgroundColor: m.color, borderColor: m.color }]}
              onPress={() => updateField("mood", m.value)}
            >
              <Text style={styles.moodEmoji}>{m.label.split(" ")[0]}</Text>
              <Text style={[styles.moodLabel, entry.mood === m.value && { color: "#fff" }]}>{m.value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ENERGY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Energy Level</Text>
        <Text style={styles.sectionSub}>Rate 1-10</Text>
        <View style={styles.energyRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.energyBtn, n <= entry.energy && { backgroundColor: getEnergyColor(entry.energy) }]}
              onPress={() => updateField("energy", n)}
            >
              <Text style={[styles.energyText, n <= entry.energy && { color: "#fff" }]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* WATER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💧 Water Intake</Text>
        <View style={styles.waterRow}>
          <TouchableOpacity style={styles.waterBtn} onPress={() => updateField("water", Math.max(0, entry.water - 1))}>
            <Text style={styles.waterBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.waterDisplay}>
            <Text style={styles.waterValue}>{entry.water}</Text>
            <Text style={styles.waterLabel}>glasses</Text>
          </View>
          <TouchableOpacity style={styles.waterBtn} onPress={() => updateField("water", entry.water + 1)}>
            <Text style={styles.waterBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.waterDrops}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <Text key={n} style={styles.waterDrop}>{n <= entry.water ? "💧" : "🩶"}</Text>
          ))}
        </View>
        <Text style={styles.waterGoal}>{entry.water}/8 glasses</Text>
      </View>

      {/* WEIGHT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚖️ Weight</Text>
        <TouchableOpacity style={styles.weightBtn} onPress={() => setShowWeightModal(true)}>
          <Text style={styles.weightBtnText}>
            {entry.weight > 0 ? `${entry.weight} kg` : "Tap to log weight"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* NOTES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any symptoms, feelings, observations..."
          value={entry.notes}
          onChangeText={(v) => updateField("notes", v)}
          multiline
          placeholderTextColor="#444"
        />
      </View>

      {/* 7-DAY TRENDS */}
      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 7-Day Trends</Text>
          <View style={styles.trendRow}>
            <View style={styles.trendItem}>
              <Text style={styles.trendEmoji}>😴</Text>
              <Text style={styles.trendValue}>{avgSleep}h</Text>
              <Text style={styles.trendLabel}>Avg Sleep</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendEmoji}>⚡</Text>
              <Text style={styles.trendValue}>{avgEnergy}/10</Text>
              <Text style={styles.trendLabel}>Avg Energy</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendEmoji}>💧</Text>
              <Text style={styles.trendValue}>
                {(history.reduce((s, h) => s + h.water, 0) / history.length).toFixed(1)}
              </Text>
              <Text style={styles.trendLabel}>Avg Water</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendEmoji}>👟</Text>
              <Text style={styles.trendValue}>
                {Math.round(history.reduce((s, h) => s + h.steps, 0) / history.length).toLocaleString()}
              </Text>
              <Text style={styles.trendLabel}>Avg Steps</Text>
            </View>
          </View>
        </View>
      )}

      {saved && (
        <View style={styles.savedBadge}>
          <Text style={styles.savedText}>✅ Saved!</Text>
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* WEIGHT MODAL */}
      <Modal visible={showWeightModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Weight ⚖️</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter weight in kg"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholderTextColor="#444"
            />
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => {
                updateField("weight", parseFloat(weightInput) || 0);
                setShowWeightModal(false);
                setWeightInput("");
              }}
            >
              <Text style={styles.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowWeightModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { fontSize: 16, color: "#4A90E2", fontWeight: "bold" },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 16 },
  syncCard: { backgroundColor: "#1a1a2a", margin: 16, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#4A90E2" },
  syncCardActive: { backgroundColor: "#0a0a1a", borderColor: "#7B68EE" },
  syncCardIcon: { fontSize: 32, marginRight: 14 },
  syncCardInfo: { flex: 1 },
  syncCardTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  syncCardSub: { fontSize: 12, color: "#666", marginTop: 4 },
  syncCardArrow: { fontSize: 18, color: "#4A90E2" },
  summaryCard: { backgroundColor: "#1a1a1a", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2a2a2a" },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  summaryGrid: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  summaryItem: { alignItems: "center" },
  summaryEmoji: { fontSize: 24, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  summaryLabel: { fontSize: 11, color: "#666", marginTop: 2 },
  stepsBar: { height: 6, backgroundColor: "#222", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  stepsFill: { height: "100%", backgroundColor: "#4A90E2", borderRadius: 3 },
  stepsLabel: { fontSize: 11, color: "#666", textAlign: "center" },
  section: { backgroundColor: "#1a1a1a", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2a2a2a" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  sectionSub: { fontSize: 13, color: "#666", marginBottom: 12 },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#222" },
  optBtnText: { fontSize: 13, color: "#888", fontWeight: "bold" },
  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#222" },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 10, color: "#666", marginTop: 4, fontWeight: "bold" },
  energyRow: { flexDirection: "row", gap: 4 },
  energyBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#222" },
  energyText: { fontSize: 12, color: "#666", fontWeight: "bold" },
  waterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 16 },
  waterBtn: { backgroundColor: "#4A90E2", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  waterBtnText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  waterDisplay: { alignItems: "center" },
  waterValue: { fontSize: 36, fontWeight: "bold", color: "#fff" },
  waterLabel: { fontSize: 13, color: "#666" },
  waterDrops: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 },
  waterDrop: { fontSize: 22 },
  waterGoal: { fontSize: 12, color: "#666", textAlign: "center" },
  weightBtn: { backgroundColor: "#222", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a" },
  weightBtnText: { fontSize: 15, fontWeight: "bold", color: "#888" },
  notesInput: { borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 12, fontSize: 15, color: "#fff", minHeight: 80, textAlignVertical: "top", backgroundColor: "#222" },
  trendRow: { flexDirection: "row", justifyContent: "space-around" },
  trendItem: { alignItems: "center" },
  trendEmoji: { fontSize: 22, marginBottom: 4 },
  trendValue: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  trendLabel: { fontSize: 11, color: "#666" },
  savedBadge: { margin: 16, backgroundColor: "#4CAF50", borderRadius: 12, padding: 14, alignItems: "center" },
  savedText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 16, textAlign: "center" },
  modalInput: { borderWidth: 1, borderColor: "#333", borderRadius: 10, padding: 14, fontSize: 18, color: "#fff", textAlign: "center", marginBottom: 12, backgroundColor: "#222" },
  modalSaveBtn: { backgroundColor: "#4CAF50", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 8 },
  modalSaveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalCancelBtn: { padding: 16, alignItems: "center" },
  modalCancelText: { color: "#666", fontSize: 16 },
});