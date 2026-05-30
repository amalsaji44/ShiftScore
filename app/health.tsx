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

      {/* SUMMARY */}
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
            <Text style={[styles.summaryValue, { color: MOODS.find(m => m.value === entry.mood)?.color || "#888" }]}>
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

      {/* VITALS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💓 Vitals</Text>
        <Text style={styles.sectionSub}>Manual entry — Fitbit sync coming soon</Text>
        <View style={styles.vitalRow}>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>❤️ Heart Rate</Text>
            <TextInput
              style={styles.vitalInput}
              placeholder="bpm"
              value={entry.heartRate > 0 ? String(entry.heartRate) : ""}
              onChangeText={(v) => updateField("heartRate", parseInt(v) || 0)}
              keyboardType="numeric"
              placeholderTextColor="#444"
            />
          </View>
          <View style={styles.vitalItem}>
            <Text style={styles.vitalLabel}>👟 Steps</Text>
            <TextInput
              style={styles.vitalInput}
              placeholder="0"
              value={entry.steps > 0 ? String(entry.steps) : ""}
              onChangeText={(v) => updateField("steps", parseInt(v) || 0)}
              keyboardType="numeric"
              placeholderTextColor="#444"
            />
          </View>
        </View>
        <TouchableOpacity style={styles.weightBtn} onPress={() => setShowWeightModal(true)}>
          <Text style={styles.weightBtnText}>
            ⚖️ Weight: {entry.weight > 0 ? `${entry.weight} kg` : "Tap to log"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.syncBtn}>
          <Text style={styles.syncBtnText}>⌚ Sync from Fitbit</Text>
          <Text style={styles.syncSubText}>Auto-fill steps & heart rate</Text>
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
  summaryCard: { backgroundColor: "#1a1a1a", margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2a2a2a" },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  summaryGrid: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryEmoji: { fontSize: 28, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  summaryLabel: { fontSize: 12, color: "#666", marginTop: 2 },
  section: { backgroundColor: "#1a1a1a", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2a2a2a" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  sectionSub: { fontSize: 13, color: "#666", marginBottom: 12 },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#333", backgroundColor: "#222" },
  optBtnText: { fontSize: 13, color: "#888", fontWeight: "bold" },
  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#333", backgroundColor: "#222" },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 10, color: "#666", marginTop: 4, fontWeight: "bold" },
  energyRow: { flexDirection: "row", gap: 4 },
  energyBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#333", alignItems: "center", backgroundColor: "#222" },
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
  vitalRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  vitalItem: { flex: 1 },
  vitalLabel: { fontSize: 13, fontWeight: "bold", color: "#888", marginBottom: 6 },
  vitalInput: { borderWidth: 1, borderColor: "#333", borderRadius: 10, padding: 10, fontSize: 16, color: "#fff", textAlign: "center", backgroundColor: "#222" },
  weightBtn: { backgroundColor: "#222", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#333" },
  weightBtnText: { fontSize: 15, fontWeight: "bold", color: "#888" },
  syncBtn: { backgroundColor: "#111", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#4A90E2" },
  syncBtnText: { fontSize: 15, fontWeight: "bold", color: "#4A90E2" },
  syncSubText: { fontSize: 12, color: "#666", marginTop: 4 },
  notesInput: { borderWidth: 1, borderColor: "#333", borderRadius: 10, padding: 12, fontSize: 15, color: "#fff", minHeight: 80, textAlignVertical: "top", backgroundColor: "#222" },
  trendRow: { flexDirection: "row", justifyContent: "space-around" },
  trendItem: { alignItems: "center" },
  trendEmoji: { fontSize: 24, marginBottom: 4 },
  trendValue: { fontSize: 16, fontWeight: "bold", color: "#fff" },
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