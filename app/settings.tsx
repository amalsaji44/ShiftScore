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
    name: "3-Day Rotation (1D-1N-1O)",
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

export default function Settings() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ShiftSchedule>(DEFAULT_SCHEDULE);
  const [saved, setSaved] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDay | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [userName, setUserName] = useState("Amal");

  useEffect(() => {
    loadSchedule();
    loadUserName();
  }, []);

  async function loadSchedule() {
    try {
      const saved = await AsyncStorage.getItem("shift_schedule");
      if (saved) setSchedule(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function loadUserName() {
    try {
      const name = await AsyncStorage.getItem("user_name");
      if (name) setUserName(name);
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
    await AsyncStorage.setItem("user_name", name);
    setUserName(name);
  }

  function setCycleLength(length: number) {
    if (length < 1 || length > 30) return;
    const newShifts = Array.from({ length }, (_, i) => {
      if (i < schedule.shifts.length) return schedule.shifts[i];
      return {
        id: String(i + 1),
        name: "Day Off",
        color: "#4CAF50",
        emoji: "✅",
      };
    });
    const updated = { ...schedule, cycleLength: length, shifts: newShifts };
    saveSchedule(updated);
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
    Alert.alert("✅ Schedule applied!", `${preset.name} is now your active schedule.`);
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>⚙️ Settings</Text>

      {/* USER NAME */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Your Name</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={saveUserName}
          placeholder="Enter your name"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* PRESET SCHEDULES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Preset Schedules</Text>
        <Text style={styles.sectionSubtitle}>Pick a common shift pattern to get started quickly</Text>
        <TouchableOpacity
          style={styles.presetBtn}
          onPress={() => setShowPresets(true)}
        >
          <Text style={styles.presetBtnText}>Browse Presets 📋</Text>
        </TouchableOpacity>
      </View>

      {/* SCHEDULE BUILDER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔄 Custom Schedule Builder</Text>

        {/* Schedule Name */}
        <Text style={styles.fieldLabel}>Schedule Name</Text>
        <TextInput
          style={styles.input}
          value={schedule.cycleName}
          onChangeText={(v) => saveSchedule({ ...schedule, cycleName: v })}
          placeholder="e.g. My Hospital Schedule"
          placeholderTextColor="#aaa"
        />

        {/* Cycle Start Date */}
        <Text style={styles.fieldLabel}>Cycle Start Date</Text>
        <TextInput
          style={styles.input}
          value={schedule.startDate}
          onChangeText={(v) => saveSchedule({ ...schedule, startDate: v })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#aaa"
        />

        {/* Cycle Length */}
        <Text style={styles.fieldLabel}>Cycle Length: {schedule.cycleLength} days</Text>
        <View style={styles.cycleRow}>
          <TouchableOpacity
            style={styles.cycleBtn}
            onPress={() => setCycleLength(schedule.cycleLength - 1)}
          >
            <Text style={styles.cycleBtnText}>−</Text>
          </TouchableOpacity>

          <View style={styles.cycleLengthDisplay}>
            <Text style={styles.cycleLengthNum}>{schedule.cycleLength}</Text>
            <Text style={styles.cycleLengthLabel}>days per cycle</Text>
          </View>

          <TouchableOpacity
            style={styles.cycleBtn}
            onPress={() => setCycleLength(schedule.cycleLength + 1)}
          >
            <Text style={styles.cycleBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Quick length presets */}
        <View style={styles.quickLengths}>
          {[3, 5, 7, 8, 9, 10, 14, 21, 28].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.quickLengthBtn, schedule.cycleLength === n && styles.quickLengthBtnActive]}
              onPress={() => setCycleLength(n)}
            >
              <Text style={[styles.quickLengthText, schedule.cycleLength === n && styles.quickLengthTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SHIFT DAYS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Your {schedule.cycleLength}-Day Cycle</Text>
        <Text style={styles.sectionSubtitle}>Tap any day to customize it</Text>

        {schedule.shifts.map((shift, index) => (
          <TouchableOpacity
            key={shift.id}
            style={styles.shiftRow}
            onPress={() => openEditShift(shift)}
          >
            <View style={[styles.shiftDot, { backgroundColor: shift.color }]}>
              <Text style={styles.shiftDotNum}>{index + 1}</Text>
            </View>
            <View style={[styles.shiftColorBar, { backgroundColor: shift.color }]} />
            <Text style={styles.shiftEmoji}>{shift.emoji}</Text>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftName}>{shift.name}</Text>
              <Text style={styles.shiftDay}>Day {index + 1} of cycle</Text>
            </View>
            <Text style={styles.shiftEdit}>✏️</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CYCLE PREVIEW */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👁️ Cycle Preview</Text>
        <Text style={styles.sectionSubtitle}>This is how your cycle repeats</Text>
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
        <Text style={styles.previewNote}>↑ Showing 3 complete cycles</Text>
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => saveSchedule(schedule)}
      >
        <Text style={styles.saveBtnText}>
          {saved ? "✅ Schedule Saved!" : "Save Schedule"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* PRESETS MODAL */}
      <Modal visible={showPresets} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📋 Preset Schedules</Text>
            <ScrollView>
              {PRESET_SCHEDULES.map((preset, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.presetOption}
                  onPress={() => applyPreset(preset)}
                >
                  <View style={styles.presetOptionLeft}>
                    <Text style={styles.presetOptionName}>{preset.name}</Text>
                    <View style={styles.presetDots}>
                      {preset.schedule.shifts.map((s, j) => (
                        <View
                          key={j}
                          style={[styles.presetDot, { backgroundColor: s.color }]}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.presetApply}>Apply →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowPresets(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT SHIFT MODAL */}
      <Modal visible={showShiftModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Shift Day</Text>

            {editingShift && (
              <>
                {/* Preview */}
                <View style={styles.shiftPreview}>
                  <View style={[styles.shiftPreviewDot, { backgroundColor: editingShift.color }]}>
                    <Text style={styles.shiftPreviewEmoji}>{editingShift.emoji}</Text>
                  </View>
                  <Text style={styles.shiftPreviewName}>{editingShift.name}</Text>
                </View>

                {/* Name */}
                <Text style={styles.fieldLabel}>Shift Name</Text>
                <TextInput
                  style={styles.input}
                  value={editingShift.name}
                  onChangeText={(v) => setEditingShift({ ...editingShift, name: v })}
                  placeholder="e.g. Day Shift, Night Shift, Off"
                  placeholderTextColor="#aaa"
                />

                {/* Quick name presets */}
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

                {/* Color */}
                <Text style={styles.fieldLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        editingShift.color === color && styles.colorSwatchActive,
                      ]}
                      onPress={() => setEditingShift({ ...editingShift, color })}
                    />
                  ))}
                </View>

                {/* Emoji */}
                <Text style={styles.fieldLabel}>Emoji</Text>
                <View style={styles.emojiGrid}>
                  {PRESET_EMOJIS.map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiBtn,
                        editingShift.emoji === emoji && styles.emojiBtnActive,
                      ]}
                      onPress={() => setEditingShift({ ...editingShift, emoji })}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveShift}>
                  <Text style={styles.saveBtnText}>Save Shift ✅</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => { setShowShiftModal(false); setEditingShift(null); }}
                >
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { fontSize: 16, color: "#4A90E2", fontWeight: "bold" },
  title: { fontSize: 28, fontWeight: "bold", color: "#2d2d2d", textAlign: "center", marginBottom: 20 },
  section: { backgroundColor: "#fff", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: "#888", marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, fontSize: 15, color: "#2d2d2d", marginBottom: 8 },
  presetBtn: { backgroundColor: "#4A90E2", borderRadius: 12, padding: 14, alignItems: "center" },
  presetBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  cycleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12 },
  cycleBtn: { backgroundColor: "#4A90E2", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cycleBtnText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  cycleLengthDisplay: { alignItems: "center" },
  cycleLengthNum: { fontSize: 40, fontWeight: "bold", color: "#2d2d2d" },
  cycleLengthLabel: { fontSize: 12, color: "#888" },
  quickLengths: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickLengthBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#eee", backgroundColor: "#f9f9f9" },
  quickLengthBtnActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  quickLengthText: { fontSize: 14, color: "#555", fontWeight: "bold" },
  quickLengthTextActive: { color: "#fff" },
  shiftRow: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 12, marginBottom: 8 },
  shiftDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 8 },
  shiftDotNum: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  shiftColorBar: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  shiftEmoji: { fontSize: 24, marginRight: 12 },
  shiftInfo: { flex: 1 },
  shiftName: { fontSize: 15, fontWeight: "bold", color: "#2d2d2d" },
  shiftDay: { fontSize: 12, color: "#888", marginTop: 2 },
  shiftEdit: { fontSize: 18 },
  previewRow: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  previewItem: { alignItems: "center" },
  previewDot: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  previewEmoji: { fontSize: 18 },
  previewDay: { fontSize: 10, color: "#888", marginTop: 4 },
  previewNote: { fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 8 },
  saveBtn: { backgroundColor: "#4CAF50", margin: 16, marginTop: 0, borderRadius: 16, padding: 18, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2d2d2d", marginBottom: 16, textAlign: "center" },
  modalCancelBtn: { padding: 16, alignItems: "center", marginTop: 8 },
  modalCancelText: { color: "#888", fontSize: 16 },
  presetOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#eee", borderRadius: 12, marginBottom: 10 },
  presetOptionLeft: { flex: 1 },
  presetOptionName: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d", marginBottom: 8 },
  presetDots: { flexDirection: "row", gap: 6 },
  presetDot: { width: 16, height: 16, borderRadius: 8 },
  presetApply: { fontSize: 14, color: "#4A90E2", fontWeight: "bold" },
  shiftPreview: { alignItems: "center", marginBottom: 20 },
  shiftPreviewDot: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  shiftPreviewEmoji: { fontSize: 32 },
  shiftPreviewName: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchActive: { borderWidth: 3, borderColor: "#2d2d2d" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#eee", alignItems: "center", justifyContent: "center", backgroundColor: "#f9f9f9" },
  emojiBtnActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  emojiText: { fontSize: 22 },
  quickNames: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  quickNameBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#eee", backgroundColor: "#f9f9f9" },
  quickNameText: { fontSize: 13, color: "#555" },
});