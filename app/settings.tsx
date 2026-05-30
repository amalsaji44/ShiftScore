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

type ShiftDay = {
  id: string;
  name: string;
  color: string;
  emoji: string;
};

type ShiftSchedule = {
  cycleName: string;
  cycleLength: number;
  startDate: string;
  shifts: ShiftDay[];
};

const PRESET_COLORS = [
  "#4A90E2", "#7B68EE", "#4CAF50", "#FF9500",
  "#E91E63", "#00BCD4", "#FF5722", "#795548",
  "#607D8B", "#9C27B0", "#F44336", "#2196F3",
  "#009688", "#FF9800", "#8BC34A", "#673AB7",
];

const PRESET_EMOJIS = [
  "🌅", "🌙", "✅", "⭐", "🔴", "🟡", "🟢", "🔵",
  "💼", "🏥", "🚒", "👮", "✈️", "🚢", "🏭", "⚙️",
];

const PRESET_SCHEDULES = [
  {
    name: "My 9-Day (2D-2N-5O)",
    schedule: {
      cycleName: "2 Day 2 Night 5 Off",
      cycleLength: 9,
      startDate: "2026-05-05",
      shifts: [
        { id: "1", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
        { id: "2", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
        { id: "3", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
        { id: "4", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
        { id: "5", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "6", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "7", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "8", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "9", name: "Day Off", color: "#4CAF50", emoji: "✅" },
      ],
    },
  },
  {
    name: "Continental (2D-2N-4O)",
    schedule: {
      cycleName: "Continental Shift",
      cycleLength: 8,
      startDate: new Date().toISOString().split("T")[0],
      shifts: [
        { id: "1", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
        { id: "2", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
        { id: "3", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
        { id: "4", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
        { id: "5", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "6", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "7", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "8", name: "Day Off", color: "#4CAF50", emoji: "✅" },
      ],
    },
  },
  {
    name: "Panama (2D-2O-2N-2O)",
    schedule: {
      cycleName: "Panama Shift",
      cycleLength: 8,
      startDate: new Date().toISOString().split("T")[0],
      shifts: [
        { id: "1", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
        { id: "2", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
        { id: "3", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "4", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "5", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
        { id: "6", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
        { id: "7", name: "Day Off", color: "#4CAF50", emoji: "✅" },
        { id: "8", name: "Day Off", color: "#4CAF50", emoji: "✅" },
      ],
    },
  },
  {
    name: "Standard Week (5D-2O)",
    schedule: {
      cycleName: "Standard Week",
      cycleLength: 7,
      startDate: new Date().toISOString().split("T")[0],
      shifts: [
        { id: "1", name: "Work Day", color: "#4A90E2", emoji: "💼" },
        { id: "2", name: "Work Day", color: "#4A90E2", emoji: "💼" },
        { id: "3", name: "Work Day", color: "#4A90E2", emoji: "💼" },
        { id: "4", name: "Work Day", color: "#4A90E2", emoji: "💼" },
        { id: "5", name: "Work Day", color: "#4A90E2", emoji: "💼" },
        { id: "6", name: "Weekend", color: "#4CAF50", emoji: "✅" },
        { id: "7", name: "Weekend", color: "#4CAF50", emoji: "✅" },
      ],
    },
  },
  {
    name: "3-Day Rotation",
    schedule: {
      cycleName: "3-Day Rotation",
      cycleLength: 3,
      startDate: new Date().toISOString().split("T")[0],
      shifts: [
        { id: "1", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
        { id: "2", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
        { id: "3", name: "Day Off", color: "#4CAF50", emoji: "✅" },
      ],
    },
  },
];

const DEFAULT_SCHEDULE: ShiftSchedule = {
  cycleName: "My Schedule",
  cycleLength: 3,
  startDate: new Date().toISOString().split("T")[0],
  shifts: [
    { id: "1", name: "Day Shift", color: "#4A90E2", emoji: "🌅" },
    { id: "2", name: "Night Shift", color: "#7B68EE", emoji: "🌙" },
    { id: "3", name: "Day Off", color: "#4CAF50", emoji: "✅" },
  ],
};

const CITIES = [
  "London ON", "Toronto ON", "Ottawa ON", "Vancouver BC",
  "Calgary AB", "Montreal QC", "Edmonton AB", "Winnipeg MB",
  "Hamilton ON", "Kitchener ON", "Halifax NS", "Victoria BC",
];

export default function Settings() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ShiftSchedule>(DEFAULT_SCHEDULE);
  const [saved, setSaved] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDay | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [userName, setUserName] = useState("");
  const [userCity, setUserCity] = useState("London ON");
  const [customCity, setCustomCity] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const saved = await AsyncStorage.getItem("shift_schedule");
      if (saved) setSchedule(JSON.parse(saved));
      const name = await AsyncStorage.getItem("user_name");
      if (name) setUserName(name);
      const city = await AsyncStorage.getItem("user_city");
      if (city) setUserCity(city);
    } catch (e) { console.log(e); }
  }

  async function saveSchedule(updated: ShiftSchedule) {
    try {
      await AsyncStorage.setItem("shift_schedule", JSON.stringify(updated));
      setSchedule(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.log(e); }
  }

  async function saveUserName(name: string) {
    setUserName(name);
    await AsyncStorage.setItem("user_name", name);
  }

  async function saveUserCity(city: string) {
    setUserCity(city);
    await AsyncStorage.setItem("user_city", city);
    setCustomCity("");
  }

  function setCycleLength(length: number) {
    if (length < 1 || length > 30) return;
    const newShifts = Array.from({ length }, (_, i) => {
      if (i < schedule.shifts.length) return schedule.shifts[i];
      return { id: String(i + 1), name: "Day Off", color: "#4CAF50", emoji: "✅" };
    });
    saveSchedule({ ...schedule, cycleLength: length, shifts: newShifts });
  }

  function openEditShift(shift: ShiftDay) {
    setEditingShift({ ...shift });
    setShowShiftModal(true);
  }

  function saveShift() {
    if (!editingShift) return;
    const updated = {
      ...schedule,
      shifts: schedule.shifts.map(s => s.id === editingShift.id ? editingShift : s),
    };
    saveSchedule(updated);
    setShowShiftModal(false);
    setEditingShift(null);
  }

  function applyPreset(preset: typeof PRESET_SCHEDULES[0]) {
    saveSchedule(preset.schedule);
    setShowPresets(false);
    Alert.alert("✅ Schedule applied!", `${preset.name} is now active.`);
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>⚙️ Settings</Text>

      {/* PROFILE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profile</Text>

        <Text style={styles.fieldLabel}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={saveUserName}
          placeholder="Enter your name"
          placeholderTextColor="#444"
        />

        <Text style={styles.fieldLabel}>📍 Your City</Text>
        <Text style={styles.sectionSub}>Used for accurate weather on your calendar</Text>
        <View style={styles.cityGrid}>
          {CITIES.map(city => (
            <TouchableOpacity
              key={city}
              style={[styles.cityChip, userCity === city && styles.cityChipActive]}
              onPress={() => saveUserCity(city)}
            >
              <Text style={[styles.cityChipText, userCity === city && styles.cityChipTextActive]}>
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customCityRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={customCity}
            onChangeText={setCustomCity}
            placeholder="Other city..."
            placeholderTextColor="#444"
          />
          <TouchableOpacity
            style={[styles.customCityBtn, !customCity && styles.customCityBtnDisabled]}
            onPress={() => { if (customCity) saveUserCity(customCity); }}
          >
            <Text style={styles.customCityBtnText}>Set</Text>
          </TouchableOpacity>
        </View>
        {userCity && (
          <Text style={styles.currentCity}>📍 Current: {userCity}</Text>
        )}
      </View>

      {/* PRESETS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Preset Schedules</Text>
        <Text style={styles.sectionSub}>Quick start with a common shift pattern</Text>
        <TouchableOpacity style={styles.presetBtn} onPress={() => setShowPresets(true)}>
          <Text style={styles.presetBtnText}>Browse Presets 📋</Text>
        </TouchableOpacity>
      </View>

      {/* SCHEDULE BUILDER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔄 Schedule Builder</Text>

        <Text style={styles.fieldLabel}>Schedule Name</Text>
        <TextInput
          style={styles.input}
          value={schedule.cycleName}
          onChangeText={(v) => saveSchedule({ ...schedule, cycleName: v })}
          placeholder="e.g. My Hospital Schedule"
          placeholderTextColor="#444"
        />

        <Text style={styles.fieldLabel}>Cycle Start Date</Text>
        <TextInput
          style={styles.input}
          value={schedule.startDate}
          onChangeText={(v) => saveSchedule({ ...schedule, startDate: v })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#444"
        />

        <Text style={styles.fieldLabel}>Cycle Length: {schedule.cycleLength} days</Text>
        <View style={styles.cycleRow}>
          <TouchableOpacity style={styles.cycleBtn} onPress={() => setCycleLength(schedule.cycleLength - 1)}>
            <Text style={styles.cycleBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.cycleLengthDisplay}>
            <Text style={styles.cycleLengthNum}>{schedule.cycleLength}</Text>
            <Text style={styles.cycleLengthLabel}>days</Text>
          </View>
          <TouchableOpacity style={styles.cycleBtn} onPress={() => setCycleLength(schedule.cycleLength + 1)}>
            <Text style={styles.cycleBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickLengths}>
          {[3, 5, 7, 8, 9, 10, 14, 21, 28].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.quickBtn, schedule.cycleLength === n && styles.quickBtnActive]}
              onPress={() => setCycleLength(n)}
            >
              <Text style={[styles.quickBtnText, schedule.cycleLength === n && styles.quickBtnTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SHIFT DAYS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 {schedule.cycleLength}-Day Cycle</Text>
        <Text style={styles.sectionSub}>Tap any day to customize</Text>
        {schedule.shifts.map((shift, index) => (
          <TouchableOpacity key={shift.id} style={styles.shiftRow} onPress={() => openEditShift(shift)}>
            <View style={[styles.shiftDot, { backgroundColor: shift.color }]}>
              <Text style={styles.shiftDotNum}>{index + 1}</Text>
            </View>
            <Text style={styles.shiftEmoji}>{shift.emoji}</Text>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftName}>{shift.name}</Text>
              <Text style={styles.shiftDay}>Day {index + 1} of cycle</Text>
            </View>
            <Text style={styles.shiftEdit}>✏️</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* PREVIEW */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👁️ Cycle Preview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.previewRow}>
            {[...schedule.shifts, ...schedule.shifts, ...schedule.shifts].map((shift, i) => (
              <View key={i} style={styles.previewItem}>
                <View style={[styles.previewDot, { backgroundColor: shift.color }]}>
                  <Text style={styles.previewEmoji}>{shift.emoji}</Text>
                </View>
                <Text style={styles.previewDay}>{i + 1}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.previewNote}>3 complete cycles shown</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={() => saveSchedule(schedule)}>
        <Text style={styles.saveBtnText}>{saved ? "✅ Saved!" : "Save Schedule"}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* PRESETS MODAL */}
      <Modal visible={showPresets} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📋 Preset Schedules</Text>
            <ScrollView>
              {PRESET_SCHEDULES.map((preset, i) => (
                <TouchableOpacity key={i} style={styles.presetOption} onPress={() => applyPreset(preset)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetOptionName}>{preset.name}</Text>
                    <View style={styles.presetDots}>
                      {preset.schedule.shifts.map((s, j) => (
                        <View key={j} style={[styles.presetDot, { backgroundColor: s.color }]} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.presetApply}>Apply →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPresets(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT SHIFT MODAL */}
      <Modal visible={showShiftModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Shift</Text>
            {editingShift && (
              <>
                <View style={styles.shiftPreview}>
                  <View style={[styles.shiftPreviewDot, { backgroundColor: editingShift.color }]}>
                    <Text style={styles.shiftPreviewEmoji}>{editingShift.emoji}</Text>
                  </View>
                  <Text style={styles.shiftPreviewName}>{editingShift.name}</Text>
                </View>

                <Text style={styles.fieldLabel}>Shift Name</Text>
                <TextInput
                  style={styles.input}
                  value={editingShift.name}
                  onChangeText={(v) => setEditingShift({ ...editingShift, name: v })}
                  placeholder="e.g. Day Shift"
                  placeholderTextColor="#444"
                />

                <View style={styles.quickNames}>
                  {["Day Shift", "Night Shift", "Day Off", "Standby", "On Call", "Training"].map(name => (
                    <TouchableOpacity
                      key={name}
                      style={styles.quickNameBtn}
                      onPress={() => setEditingShift({ ...editingShift, name })}
                    >
                      <Text style={styles.quickNameText}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorSwatch, { backgroundColor: color }, editingShift.color === color && styles.colorSwatchActive]}
                      onPress={() => setEditingShift({ ...editingShift, color })}
                    />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Emoji</Text>
                <View style={styles.emojiGrid}>
                  {PRESET_EMOJIS.map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.emojiBtn, editingShift.emoji === emoji && styles.emojiBtnActive]}
                      onPress={() => setEditingShift({ ...editingShift, emoji })}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveShift}>
                  <Text style={styles.saveBtnText}>Save Shift ✅</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowShiftModal(false); setEditingShift(null); }}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
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
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
  section: { backgroundColor: "#1a1a1a", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2a2a2a" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  sectionSub: { fontSize: 13, color: "#666", marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "bold", color: "#888", marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#333", borderRadius: 10, padding: 12, fontSize: 15, color: "#fff", marginBottom: 8, backgroundColor: "#222" },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  cityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#333", backgroundColor: "#222" },
  cityChipActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  cityChipText: { fontSize: 12, color: "#666" },
  cityChipTextActive: { color: "#fff", fontWeight: "bold" },
  customCityRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  customCityBtn: { backgroundColor: "#4A90E2", borderRadius: 10, padding: 12, paddingHorizontal: 16 },
  customCityBtnDisabled: { backgroundColor: "#333" },
  customCityBtnText: { color: "#fff", fontWeight: "bold" },
  currentCity: { fontSize: 12, color: "#4A90E2", marginTop: 4 },
  presetBtn: { backgroundColor: "#4A90E2", borderRadius: 12, padding: 14, alignItems: "center" },
  presetBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  cycleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12 },
  cycleBtn: { backgroundColor: "#4A90E2", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cycleBtnText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  cycleLengthDisplay: { alignItems: "center" },
  cycleLengthNum: { fontSize: 40, fontWeight: "bold", color: "#fff" },
  cycleLengthLabel: { fontSize: 12, color: "#666" },
  quickLengths: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#333", backgroundColor: "#222" },
  quickBtnActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  quickBtnText: { fontSize: 14, color: "#666", fontWeight: "bold" },
  quickBtnTextActive: { color: "#fff" },
  shiftRow: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 12, marginBottom: 8, backgroundColor: "#222" },
  shiftDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 8 },
  shiftDotNum: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  shiftEmoji: { fontSize: 24, marginRight: 12 },
  shiftInfo: { flex: 1 },
  shiftName: { fontSize: 15, fontWeight: "bold", color: "#fff" },
  shiftDay: { fontSize: 12, color: "#666", marginTop: 2 },
  shiftEdit: { fontSize: 18 },
  previewRow: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  previewItem: { alignItems: "center" },
  previewDot: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  previewEmoji: { fontSize: 18 },
  previewDay: { fontSize: 10, color: "#666", marginTop: 4 },
  previewNote: { fontSize: 11, color: "#444", textAlign: "center", marginTop: 8 },
  saveBtn: { backgroundColor: "#4CAF50", margin: 16, marginTop: 0, borderRadius: 16, padding: 18, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%", borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 16, textAlign: "center" },
  modalCancelBtn: { padding: 16, alignItems: "center", marginTop: 8 },
  modalCancelText: { color: "#666", fontSize: 16 },
  presetOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 12, marginBottom: 10, backgroundColor: "#222" },
  presetOptionName: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  presetDots: { flexDirection: "row", gap: 6 },
  presetDot: { width: 16, height: 16, borderRadius: 8 },
  presetApply: { fontSize: 14, color: "#4A90E2", fontWeight: "bold" },
  shiftPreview: { alignItems: "center", marginBottom: 20 },
  shiftPreviewDot: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  shiftPreviewEmoji: { fontSize: 32 },
  shiftPreviewName: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchActive: { borderWidth: 3, borderColor: "#fff" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center", backgroundColor: "#222" },
  emojiBtnActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  emojiText: { fontSize: 22 },
  quickNames: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  quickNameBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#333", backgroundColor: "#222" },
  quickNameText: { fontSize: 13, color: "#888" },
});