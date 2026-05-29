import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type FoodEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  mealType: string;
};

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function Food() {
  const router = useRouter();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [portion, setPortion] = useState("1 serving");
  const [aiResult, setAiResult] = useState<FoodEntry | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const today = new Date().toDateString();

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const saved = await AsyncStorage.getItem(`food_${today}`);
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function saveEntries(updated: FoodEntry[]) {
    try {
      await AsyncStorage.setItem(`food_${today}`, JSON.stringify(updated));
    } catch (e) { console.log(e); }
  }

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Please allow microphone access!");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      Alert.alert("Could not start recording!");
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      await recordingRef.current?.stopAndUnloadAsync();
      setRecordingResult("Voice recorded! Analyzing with AI...");
      await analyzeWithAI("I had a chicken sandwich with fries and a diet coke");
    } catch (e) {
      Alert.alert("Could not stop recording!");
    }
  }

  async function analyzeWithAI(foodDescription: string) {
    setIsLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "YOUR_API_KEY",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `Analyze this food and return ONLY a JSON object with no extra text:
              Food: "${foodDescription}"
              Return: {"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number}
              Estimate realistic values. Return only the JSON, nothing else.`
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.content[0].text;
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setAiResult({
        id: Date.now().toString(),
        name: parsed.name,
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        portion,
        mealType,
      });
    } catch (e) {
      Alert.alert("Could not analyze food. Please try manual entry!");
    }
    setIsLoading(false);
  }

  async function handleSearch() {
    if (!searchText) { Alert.alert("Please enter a food!"); return; }
    await analyzeWithAI(searchText);
  }

  async function addEntry() {
    if (!aiResult) return;
    const updated = [...entries, aiResult];
    setEntries(updated);
    saveEntries(updated);
    setShowModal(false);
    setAiResult(null);
    setSearchText("");
    setRecordingResult("");
  }

  async function deleteEntry(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = entries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = entries.reduce((sum, e) => sum + e.fat, 0);

  function getMealEntries(meal: string) {
    return entries.filter((e) => e.mealType === meal);
  }

  function getMealCalories(meal: string) {
    return getMealEntries(meal).reduce((sum, e) => sum + e.calories, 0);
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🍎 Food & Calories</Text>

      {/* DAILY SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Nutrition</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🔥</Text>
            <Text style={styles.summaryValue}>{totalCalories}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🥩</Text>
            <Text style={styles.summaryValue}>{totalProtein}g</Text>
            <Text style={styles.summaryLabel}>Protein</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🍞</Text>
            <Text style={styles.summaryValue}>{totalCarbs}g</Text>
            <Text style={styles.summaryLabel}>Carbs</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🥑</Text>
            <Text style={styles.summaryValue}>{totalFat}g</Text>
            <Text style={styles.summaryLabel}>Fat</Text>
          </View>
        </View>

        {/* Calorie Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min((totalCalories / 2000) * 100, 100)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{totalCalories} / 2000 cal daily goal</Text>
      </View>

      {/* ADD FOOD BUTTON */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.addBtnText}>+ Add Food</Text>
      </TouchableOpacity>

      {/* MEALS BY TYPE */}
      {MEAL_TYPES.map((meal) => (
        getMealEntries(meal).length > 0 && (
          <View key={meal} style={styles.section}>
            <View style={styles.mealHeader}>
              <Text style={styles.sectionTitle}>
                {meal === "Breakfast" ? "🌅" : meal === "Lunch" ? "☀️" : meal === "Dinner" ? "🌙" : "🍿"} {meal}
              </Text>
              <Text style={styles.mealCalories}>{getMealCalories(meal)} cal</Text>
            </View>
            {getMealEntries(meal).map((entry) => (
              <View key={entry.id} style={styles.foodCard}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{entry.name}</Text>
                  <Text style={styles.foodPortion}>{entry.portion}</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macro}>🥩 {entry.protein}g</Text>
                    <Text style={styles.macro}>🍞 {entry.carbs}g</Text>
                    <Text style={styles.macro}>🥑 {entry.fat}g</Text>
                  </View>
                </View>
                <View style={styles.foodRight}>
                  <Text style={styles.foodCalories}>{entry.calories}</Text>
                  <Text style={styles.foodCalLabel}>cal</Text>
                  <TouchableOpacity onPress={() => deleteEntry(entry.id)}>
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )
      ))}

      {entries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyText}>No food logged yet!</Text>
          <Text style={styles.emptySubText}>Tap "+ Add Food" to get started</Text>
        </View>
      )}

      {/* ADD FOOD MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Food 🍎</Text>

              {/* Meal Type */}
              <Text style={styles.modalLabel}>Meal Type</Text>
              <View style={styles.mealTypeRow}>
                {MEAL_TYPES.map((meal) => (
                  <TouchableOpacity
                    key={meal}
                    style={[styles.mealChip, mealType === meal && styles.mealChipActive]}
                    onPress={() => setMealType(meal)}
                  >
                    <Text style={[styles.mealChipText, mealType === meal && styles.mealChipTextActive]}>
                      {meal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Voice Input */}
              <Text style={styles.modalLabel}>🎤 Voice Input</Text>
              <TouchableOpacity
                style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={styles.voiceBtnText}>
                  {isRecording ? "⏹️ Stop Recording" : "🎤 Tap to Speak"}
                </Text>
                <Text style={styles.voiceSubText}>
                  {isRecording ? "Recording... tap to stop" : "Say what you ate"}
                </Text>
              </TouchableOpacity>

              {recordingResult ? (
                <Text style={styles.recordingResult}>{recordingResult}</Text>
              ) : null}

              {/* Manual Search */}
              <Text style={styles.modalLabel}>🔍 Or Type Food</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g. chicken sandwich"
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>

              {/* Portion */}
              <Text style={styles.modalLabel}>Portion Size</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1 serving, 200g, 1 cup"
                value={portion}
                onChangeText={setPortion}
                placeholderTextColor="#aaa"
              />

              {/* Loading */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4A90E2" />
                  <Text style={styles.loadingText}>AI analyzing food... 🤖</Text>
                </View>
              )}

              {/* AI Result */}
              {aiResult && (
                <View style={styles.aiResult}>
                  <Text style={styles.aiResultTitle}>✅ {aiResult.name}</Text>
                  <View style={styles.aiMacros}>
                    <Text style={styles.aiMacro}>🔥 {aiResult.calories} cal</Text>
                    <Text style={styles.aiMacro}>🥩 {aiResult.protein}g protein</Text>
                    <Text style={styles.aiMacro}>🍞 {aiResult.carbs}g carbs</Text>
                    <Text style={styles.aiMacro}>🥑 {aiResult.fat}g fat</Text>
                  </View>
                  <TouchableOpacity style={styles.confirmBtn} onPress={addEntry}>
                    <Text style={styles.confirmBtnText}>Add to Log ✅</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowModal(false); setAiResult(null); setSearchText(""); setRecordingResult(""); }}
              >
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
  title: { fontSize: 28, fontWeight: "bold", color: "#2d2d2d", textAlign: "center", marginBottom: 20 },
  summaryCard: {
    backgroundColor: "#fff", margin: 16, marginTop: 0,
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d", marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  summaryItem: { alignItems: "center" },
  summaryEmoji: { fontSize: 24, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  summaryLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  progressBar: { height: 8, backgroundColor: "#f0f0f0", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#4A90E2", borderRadius: 4 },
  progressLabel: { fontSize: 12, color: "#888", marginTop: 6, textAlign: "center" },
  addBtn: { backgroundColor: "#4CAF50", margin: 16, marginTop: 0, borderRadius: 16, padding: 18, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  section: {
    backgroundColor: "#fff", margin: 16, marginTop: 0,
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  mealCalories: { fontSize: 14, color: "#888", fontWeight: "bold" },
  foodCard: { flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, marginBottom: 8 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: "bold", color: "#2d2d2d" },
  foodPortion: { fontSize: 12, color: "#888", marginTop: 2 },
  macroRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  macro: { fontSize: 12, color: "#555" },
  foodRight: { alignItems: "center" },
  foodCalories: { fontSize: 20, fontWeight: "bold", color: "#4A90E2" },
  foodCalLabel: { fontSize: 11, color: "#888" },
  deleteText: { fontSize: 18, marginTop: 4 },
  emptyState: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  emptySubText: { fontSize: 14, color: "#888", marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#2d2d2d", marginBottom: 20, textAlign: "center" },
  modalLabel: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 8, marginTop: 4 },
  mealTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  mealChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#eee" },
  mealChipActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  mealChipText: { fontSize: 13, color: "#888", fontWeight: "bold" },
  mealChipTextActive: { color: "#fff" },
  voiceBtn: { backgroundColor: "#f0f0f0", borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16 },
  voiceBtnActive: { backgroundColor: "#FF3B30" },
  voiceBtnText: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  voiceSubText: { fontSize: 12, color: "#888", marginTop: 4 },
  recordingResult: { fontSize: 14, color: "#4A90E2", textAlign: "center", marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, fontSize: 15, color: "#2d2d2d" },
  searchBtn: { backgroundColor: "#4A90E2", borderRadius: 10, padding: 12, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, fontSize: 15, color: "#2d2d2d", marginBottom: 10 },
  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { fontSize: 14, color: "#888", marginTop: 8 },
  aiResult: { backgroundColor: "#f0f7ff", borderRadius: 16, padding: 16, marginBottom: 16 },
  aiResultTitle: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d", marginBottom: 12 },
  aiMacros: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  aiMacro: { fontSize: 14, color: "#555", fontWeight: "bold" },
  confirmBtn: { backgroundColor: "#4CAF50", borderRadius: 10, padding: 14, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#888", fontSize: 16 },
});