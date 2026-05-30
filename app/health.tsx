import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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
    notes: "",
  });

  const [history, setHistory] = useState<HealthEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  useEffect(() => {
    loadToday();
    loadHistory();
  }, []);

  async function loadToday() {
    try {
      const saved = await AsyncStorage.getItem(`health_${todayKey}`);
      if (saved) setEntry(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function loadHistory() {
    try {
      const keys = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        keys.push(d.toISOString().split("T")[0]);
      }
      const entries: HealthEntry[] = [];
      for (const key of keys) {
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
    const updated = { ...entry, [field]: value };
    saveEntry(updated);
  }

  function getEnergyColor(energy: number) {
    if (energy >= 8) return "#4CAF50";
    if (energy >= 5) return "#FF9500";
    return "#F44336";
  }

  function getMoodColor(mood: string) {
    return MOODS.find(m => m.value === mood)?.color || "#888";
  }

  function getSleepColor(hours: number) {
    if (hours >= 7) return "#4CAF50";
    if (hours >= 5) return "#FF9500";
    return "#F44336";
  }

  const avgSleep = history.length > 0
    ? (history.reduce((sum, h) => sum + h.sleep, 0) / history.length).toFixed(1)
    : "—";

  const avgEnergy = history.length > 0
    ? (history.reduce((sum, h) => sum + h.energy, 0) / history.length).toFixed(1)
    : "—";

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>❤️ Health</Text>
      <Text style={styles.subtitle}>{today}</Text>

      {/* TODAY SUMMARY CARD */}
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
            <Text style={styles.summaryEmoji}>💧</Text>
            <Text style={styles.summaryValue}>{entry.water || "—"}</Text>
            <Text style={styles.summaryLabel}>Glasses</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>
              {entry.mood ? MOODS.find(m => m.value === entry.mood)?.label.split(" ")[0] : "😐"}
            </Text>
            <Text style={[styles.summaryValue, { color: entry.mood ? getMoodColor(entry.mood) : "#888" }]}>
              {entry.mood || "—"}
            </Text>
            <Text style={styles.summaryLabel}>Mood</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>⚡</Text>
            <Text style={[styles.summaryValue, { color: getEnergyColor(entry.energy) }]}>
              {entry.energy}/10
            </Text>
            <Text style={styles.summaryLabel}>Energy</Text>
          </View>
        </View>
      </View>

      {/* SLEEP */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😴 Sleep</Text>
        <Text style={styles.sectionSubtitle}>How many hours did you sleep?</Text>
        <View style={styles.buttonRow}>
          {[4, 5, 6, 7, 8, 9, 10].map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.optionBtn, entry.sleep === h && { backgroundColor: getSleepColor(h) }]}
              onPress={() => updateField("sleep", h)}
            >
              <Text style={[styles.optionBtnText, entry.sleep === h && styles.optionBtnTextActive]}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>Sleep quality?</Text>
        <View style={styles.buttonRow}>
          {SLEEP_QUALITY.map(q => (
            <TouchableOpacity
              key={q.value}
              style={[styles.optionBtn, entry.sleepQuality === q.value && { backgroundColor: q.color }]}
              onPress={() => updateField("sleepQuality", q.value)}
            >
              <Text style={[styles.optionBtnText, entry.sleepQuality === q.value && styles.optionBtnTextActive]}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* MOOD */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😊 Mood</Text>
        <Text style={styles.sectionSubtitle}>How are you feeling today?</Text>
        <View style={styles.buttonRow}>
          {MOODS.map(m => (
            <TouchableOpacity
              key={m.value}
              style={[styles.moodBtn, entry.mood === m.value && { backgroundColor: m.color }]}
              onPress={() => updateField("mood", m.value)}
            >
              <Text style={styles.moodEmoji}>{m.label.split(" ")[0]}</Text>
              <Text style={[styles.moodLabel, entry.mood === m.value && { color: "#fff" }]}>
                {m.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ENERGY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Energy Level</Text>
        <Text style={styles.sectionSubtitle}>Rate your energy 1-10</Text>
        <View style={styles.energyRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <TouchableOpacity
              key={n}
              style={[
                styles.energyBtn,
                n <= entry.energy && { backgroundColor: getEnergyColor(entry.energy) }
              ]}
              onPress={() => updateField("energy", n)}
            >
              <Text style={[styles.energyBtnText, n <= entry.energy && { color: "#fff" }]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* WATER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💧 Water Intake</Text>
        <Text style={styles.sectionSubtitle}>Glasses of water today</Text>
        <View style={styles.waterRow}>
          <TouchableOpacity
            style={styles.waterBtn}
            onPress={() => updateField("water", Math.max(0, entry.water - 1))}
          >
            <Text style={styles.waterBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.waterDisplay}>
            <Text style={styles.waterValue}>{entry.water}</Text>
            <Text style={styles.waterLabel}>glasses</Text>
          </View>
          <TouchableOpacity
            style={styles.waterBtn}
            onPress={() => updateField("water", entry.water + 1)}
          >
            <Text style={styles.waterBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Water progress */}
        <View style={styles.waterProgress}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <Text key={n} style={styles.waterDrop}>
              {n <= entry.water ? "💧" : "🩶"}
            </Text>
          ))}
        </View>
        <Text style={styles.waterGoal}>{entry.water}/8 glasses daily goal</Text>
      </View>

      {/* VITALS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💓 Vitals</Text>
        <Text style={styles.sectionSubtitle}>Optional — sync from Fitbit when ready</Text>

        <View style={styles.vitalRow}>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>❤️ Heart Rate</Text>
            <View style={styles.vitalInputRow}>
              <TextInput
                style={styles.vitalInput}
                placeholder="bpm"
                value={entry.heartRate > 0 ? String(entry.heartRate) : ""}
                onChangeText={(v) => updateField("heartRate", parseInt(v) || 0)}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.vitalUnit}>bpm</Text>
            </View>
          </View>

          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>👟 Steps</Text>
            <View style={styles.vitalInputRow}>
              <TextInput
                style={styles.vitalInput}
                placeholder="0"
                value={entry.steps > 0 ? String(entry.steps) : ""}
                onChangeText={(v) => updateField("steps", parseInt(v) || 0)}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.vitalUnit}>steps</Text>
            </View>
          </View>
        </View>

        {/* Weight */}
        <TouchableOpacity style={styles.weightBtn} onPress={() => setShowWeightModal(true)}>
          <Text style={styles.weightBtnText}>
            ⚖️ Weight: {entry.weight > 0 ? `${entry.weight} kg` : "Tap to log"}
          </Text>
        </TouchableOpacity>

        {/* Fitbit sync placeholder */}
        <TouchableOpacity style={styles.syncBtn}>
          <Text style={styles.syncBtnText}>⌚ Sync from Fitbit</Text>
          <Text style={styles.syncSubText}>Auto-fill steps & heart rate</Text>
        </TouchableOpacity>
      </View>

      {/* NOTES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Health Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any symptoms, feelings, or observations..."
          value={entry.notes}
          onChangeText={(v) => updateField("notes", v)}
          multiline
          placeholderTextColor="#aaa"
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
                {history.length > 0 ? (history.reduce((s,h) => s + h.water, 0) / history.length).toFixed(1) : "—"}
              </Text>
              <Text style={styles.trendLabel}>Avg Water</Text>
            </View>
          </View>

          {/* History list */}
          {history.slice(0, 5).map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{h.date}</Text>
              <Text style={styles.historyItem}>😴 {h.sleep}h</Text>
              <Text style={styles.historyItem}>💧 {h.water}</Text>
              <Text style={styles.historyItem}>⚡ {h.energy}/10</Text>
              <Text style={[styles.historyMood, { color: getMoodColor(h.mood) }]}>
                {MOODS.find(m => m.value === h.mood)?.label.split(" ")[0] || "—"}
              </Text>
            </View>
          ))}
        </View>
      )}

      {saved && (
        <View style={styles.savedBadge}>
          <Text style={styles.savedText}>✅ Saved!</Text>
        </View>
      )}

      {/* Weight Modal */}
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
              placeholderTextColor="#aaa"
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { fontSize: 16, color: "#4A90E2", fontWeight: "bold" },
  title: { fontSize: 28, fontWeight: "bold", color: "#2d2d2d", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 16 },
  summaryCard: { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d", marginBottom: 16 },
  summaryGrid: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryEmoji: { fontSize: 28, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  summaryLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  section: { backgroundColor: "#fff", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: "#888", marginBottom: 12 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#eee", backgroundColor: "#f9f9f9" },
  optionBtnText: { fontSize: 13, color: "#555", fontWeight: "bold" },
  optionBtnTextActive: { color: "#fff" },
  moodBtn: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: "#eee", backgroundColor: "#f9f9f9" },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 11, color: "#555", marginTop: 4, fontWeight: "bold" },
  energyRow: { flexDirection: "row", gap: 6 },
  energyBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#eee", alignItems: "center", backgroundColor: "#f9f9f9" },
  energyBtnText: { fontSize: 13, color: "#555", fontWeight: "bold" },
  waterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 16 },
  waterBtn: { backgroundColor: "#4A90E2", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  waterBtnText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  waterDisplay: { alignItems: "center" },
  waterValue: { fontSize: 36, fontWeight: "bold", color: "#2d2d2d" },
  waterLabel: { fontSize: 13, color: "#888" },
  waterProgress: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 },
  waterDrop: { fontSize: 24 },
  waterGoal: { fontSize: 12, color: "#888", textAlign: "center" },
  vitalRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  vitalItem: { flex: 1 },
  vitalLabel: { fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 6 },
  vitalInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vitalInput: { flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 10, fontSize: 16, color: "#2d2d2d", textAlign: "center" },
  vitalUnit: { fontSize: 12, color: "#888" },
  weightBtn: { backgroundColor: "#f0f0f0", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 12 },
  weightBtnText: { fontSize: 15, fontWeight: "bold", color: "#2d2d2d" },
  syncBtn: { backgroundColor: "#f0f7ff", borderRadius: 12, padding: 14, alignItems: "center" },
  syncBtnText: { fontSize: 15, fontWeight: "bold", color: "#4A90E2" },
  syncSubText: { fontSize: 12, color: "#888", marginTop: 4 },
  notesInput: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, fontSize: 15, color: "#2d2d2d", minHeight: 80, textAlignVertical: "top" },
  trendRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  trendItem: { alignItems: "center" },
  trendEmoji: { fontSize: 24, marginBottom: 4 },
  trendValue: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d" },
  trendLabel: { fontSize: 11, color: "#888" },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  historyDate: { fontSize: 11, color: "#888", width: 80 },
  historyItem: { fontSize: 12, color: "#555" },
  historyMood: { fontSize: 18 },
  savedBadge: { margin: 16, backgroundColor: "#4CAF50", borderRadius: 12, padding: 14, alignItems: "center" },
  savedText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2d2d2d", marginBottom: 16, textAlign: "center" },
  modalInput: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 14, fontSize: 18, color: "#2d2d2d", textAlign: "center", marginBottom: 12 },
  modalSaveBtn: { backgroundColor: "#4CAF50", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 8 },
  modalSaveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalCancelBtn: { padding: 16, alignItems: "center" },
  modalCancelText: { color: "#888", fontSize: 16 },
});