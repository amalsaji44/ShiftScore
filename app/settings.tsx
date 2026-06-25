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
  "#4A90E2", "#7B68EE", "#30D158", "#FF9F0A",
  "#FF453A", "#00BCD4", "#FF6B35", "#795548",
  "#607D8B", "#9C27B0", "#FF2D55", "#2196F3",
  "#009688", "#FF9800", "#64D2FF", "#BF5AF2",
];

const PRESET_SCHEDULES = [
  {
    name: "2 Day · 2 Night · 5 Off",
    desc: "9-day cycle — Hospital/Healthcare",
    schedule: {
      cycleName: "2D 2N 5Off",
      cycleLength: 9,
      startDate: "2026-05-05",
      shifts: [
        { id: "1", name: "Day", color: "#4A90E2", emoji: "🌅" },
        { id: "2", name: "Day", color: "#4A90E2", emoji: "🌅" },
        { id: "3", name: "Night", color: "#7B68EE", emoji: "🌙" },
        { id: "4", name: "Night", color: "#7B68EE", emoji: "🌙" },
        { id: "5", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "6", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "7", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "8", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "9", name: "Off", color: "#30D158", emoji: "✓" },
      ],
    },
  },
  {
    name: "Continental",
    desc: "8-day cycle — 2D 2N 4Off",
    schedule: {
      cycleName: "Continental",
      cycleLength: 8,
      startDate: new Date().toISOString().split("T")[0],
      shifts: [
        { id: "1", name: "Day", color: "#4A90E2", emoji: "🌅" },
        { id: "2", name: "Day", color: "#4A90E2", emoji: "🌅" },
        { id: "3", name: "Night", color: "#7B68EE", emoji: "🌙" },
        { id: "4", name: "Night", color: "#7B68EE", emoji: "🌙" },
        { id: "5", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "6", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "7", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "8", name: "Off", color: "#30D158", emoji: "✓" },
      ],
    },
  },
  {
    name: "Panama",
    desc: "8-day cycle — 2D 2Off 2N 2Off",
    schedule: {
      cycleName: "Panama",
      cycleLength: 8,
      startDate: new Date().toISOString().split("T")[0],
      shifts: [
        { id: "1", name: "Day", color: "#4A90E2", emoji: "🌅" },
        { id: "2", name: "Day", color: "#4A90E2", emoji: "🌅" },
        { id: "3", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "4", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "5", name: "Night", color: "#7B68EE", emoji: "🌙" },
        { id: "6", name: "Night", color: "#7B68EE", emoji: "🌙" },
        { id: "7", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "8", name: "Off", color: "#30D158", emoji: "✓" },
      ],
    },
  },
  {
    name: "Standard Week",
    desc: "7-day cycle — 5 Work 2 Off",
    schedule: {
      cycleName: "Standard Week",
      cycleLength: 7,
      startDate: new Date().toISOString().split("T")[0],
      shifts: [
        { id: "1", name: "Work", color: "#4A90E2", emoji: "💼" },
        { id: "2", name: "Work", color: "#4A90E2", emoji: "💼" },
        { id: "3", name: "Work", color: "#4A90E2", emoji: "💼" },
        { id: "4", name: "Work", color: "#4A90E2", emoji: "💼" },
        { id: "5", name: "Work", color: "#4A90E2", emoji: "💼" },
        { id: "6", name: "Off", color: "#30D158", emoji: "✓" },
        { id: "7", name: "Off", color: "#30D158", emoji: "✓" },
      ],
    },
  },
];

const CITIES = [
  "London ON", "Toronto ON", "Ottawa ON", "Vancouver BC",
  "Calgary AB", "Montreal QC", "Edmonton AB", "Winnipeg MB",
  "Hamilton ON", "Kitchener ON", "Halifax NS", "Victoria BC",
];

const DEFAULT_SCHEDULE: ShiftSchedule = {
  cycleName: "My Schedule",
  cycleLength: 3,
  startDate: new Date().toISOString().split("T")[0],
  shifts: [
    { id: "1", name: "Day", color: "#4A90E2", emoji: "🌅" },
    { id: "2", name: "Night", color: "#7B68EE", emoji: "🌙" },
    { id: "3", name: "Off", color: "#30D158", emoji: "✓" },
  ],
};

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

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const s = await AsyncStorage.getItem("shift_schedule");
      if (s) setSchedule(JSON.parse(s));
      const n = await AsyncStorage.getItem("user_name");
      if (n) setUserName(n);
      const c = await AsyncStorage.getItem("user_city");
      if (c) setUserCity(c);
    } catch (e) { console.log(e); }
  }

  async function saveSchedule(updated: ShiftSchedule) {
    await AsyncStorage.setItem("shift_schedule", JSON.stringify(updated));
    setSchedule(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      return { id: String(i + 1), name: "Off", color: "#30D158", emoji: "✓" };
    });
    saveSchedule({ ...schedule, cycleLength: length, shifts: newShifts });
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
    Alert.alert("Applied", `${preset.name} is now your active schedule.`);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* PROFILE SECTION */}
      <Text style={styles.sectionLabel}>PROFILE</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Name</Text>
          <TextInput
            style={styles.rowInput}
            value={userName}
            onChangeText={saveUserName}
            placeholder="Your name"
            placeholderTextColor="#444"
          />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>City</Text>
          <Text style={styles.rowValue}>{userCity}</Text>
        </View>
      </View>

      {/* CITY PICKER */}
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

      {/* SCHEDULE SECTION */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>SCHEDULE</Text>
        <TouchableOpacity onPress={() => setShowPresets(true)}>
          <Text style={styles.sectionAction}>Presets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Name</Text>
          <TextInput
            style={styles.rowInput}
            value={schedule.cycleName}
            onChangeText={(v) => saveSchedule({ ...schedule, cycleName: v })}
            placeholder="Schedule name"
            placeholderTextColor="#444"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Start Date</Text>
          <TextInput
            style={styles.rowInput}
            value={schedule.startDate}
            onChangeText={(v) => saveSchedule({ ...schedule, startDate: v })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#444"
          />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>Cycle Length</Text>
          <View style={styles.cycleControl}>
            <TouchableOpacity style={styles.cycleBtn} onPress={() => setCycleLength(schedule.cycleLength - 1)}>
              <Text style={styles.cycleBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.cycleNum}>{schedule.cycleLength} days</Text>
            <TouchableOpacity style={styles.cycleBtn} onPress={() => setCycleLength(schedule.cycleLength + 1)}>
              <Text style={styles.cycleBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QUICK LENGTHS */}
      <View style={styles.cityGrid}>
        {[3, 5, 7, 8, 9, 10, 14, 21, 28].map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.cityChip, schedule.cycleLength === n && styles.cityChipActive]}
            onPress={() => setCycleLength(n)}
          >
            <Text style={[styles.cityChipText, schedule.cycleLength === n && styles.cityChipTextActive]}>
              {n}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SHIFT DAYS */}
      <Text style={styles.sectionLabel}>SHIFT DAYS</Text>
      <View style={styles.card}>
        {schedule.shifts.map((shift, index) => (
          <TouchableOpacity
            key={shift.id}
            style={[styles.shiftRow, index === schedule.shifts.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => { setEditingShift({ ...shift }); setShowShiftModal(true); }}
          >
            <View style={styles.shiftLeft}>
              <View style={[styles.shiftNum, { backgroundColor: shift.color + "22" }]}>
                <Text style={[styles.shiftNumText, { color: shift.color }]}>{index + 1}</Text>
              </View>
              <View>
                <Text style={styles.shiftName}>{shift.name}</Text>
                <Text style={styles.shiftDay}>Day {index + 1}</Text>
              </View>
            </View>
            <View style={styles.shiftRight}>
              <View style={[styles.shiftDot, { backgroundColor: shift.color }]} />
              <Text style={styles.shiftArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* CYCLE PREVIEW */}
      <Text style={styles.sectionLabel}>PREVIEW</Text>
      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.previewRow}>
            {[...schedule.shifts, ...schedule.shifts, ...schedule.shifts].map((shift, i) => (
              <View key={i} style={styles.previewItem}>
                <View style={[styles.previewDot, { backgroundColor: shift.color }]} />
                <Text style={styles.previewNum}>{i + 1}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.previewNote}>3 complete cycles</Text>
      </View>

      {/* SAVE */}
      <TouchableOpacity style={styles.saveBtn} onPress={() => saveSchedule(schedule)}>
        <Text style={styles.saveBtnText}>{saved ? "Saved" : "Save Schedule"}</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />

      {/* PRESETS MODAL */}
      <Modal visible={showPresets} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Preset Schedules</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PRESET_SCHEDULES.map((preset, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.presetItem}
                  onPress={() => applyPreset(preset)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetName}>{preset.name}</Text>
                    <Text style={styles.presetDesc}>{preset.desc}</Text>
                    <View style={styles.presetDots}>
                      {preset.schedule.shifts.map((s, j) => (
                        <View key={j} style={[styles.presetDot, { backgroundColor: s.color }]} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.presetArrow}>›</Text>
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
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Shift</Text>
            {editingShift && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Preview */}
                <View style={styles.shiftPreview}>
                  <View style={[styles.shiftPreviewDot, { backgroundColor: editingShift.color }]} />
                  <Text style={styles.shiftPreviewName}>{editingShift.name}</Text>
                </View>

                <Text style={styles.modalLabel}>Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingShift.name}
                  onChangeText={(v) => setEditingShift({ ...editingShift, name: v })}
                  placeholder="e.g. Day Shift"
                  placeholderTextColor="#444"
                />

                <View style={styles.quickNames}>
                  {["Day", "Night", "Off", "Standby", "On Call", "Training"].map(name => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.quickNameBtn, editingShift.name === name && styles.quickNameBtnActive]}
                      onPress={() => setEditingShift({ ...editingShift, name })}
                    >
                      <Text style={[styles.quickNameText, editingShift.name === name && { color: "#fff" }]}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorSwatch, { backgroundColor: color }, editingShift.color === color && styles.colorSwatchActive]}
                      onPress={() => setEditingShift({ ...editingShift, color })}
                    />
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveShift}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowShiftModal(false); setEditingShift(null); }}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 64, paddingHorizontal: 24, marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#141414", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1E1E1E" },
  backText: { fontSize: 24, color: "#fff", fontWeight: "300" },
  title: { fontSize: 18, fontWeight: "600", color: "#fff" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#555", letterSpacing: 1.5, paddingHorizontal: 24, marginBottom: 8, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 8, marginTop: 24 },
  sectionAction: { fontSize: 14, color: "#4A90E2", fontWeight: "600" },
  card: { backgroundColor: "#141414", marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: "#1E1E1E", overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  rowLabel: { fontSize: 15, color: "#888" },
  rowInput: { fontSize: 15, color: "#fff", textAlign: "right", flex: 1, marginLeft: 16 },
  rowValue: { fontSize: 15, color: "#fff" },
  cycleControl: { flexDirection: "row", alignItems: "center", gap: 12 },
  cycleBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  cycleBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cycleNum: { fontSize: 15, color: "#fff", minWidth: 60, textAlign: "center" },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginTop: 8 },
  cityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#1E1E1E", backgroundColor: "#141414" },
  cityChipActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  cityChipText: { fontSize: 12, color: "#666" },
  cityChipTextActive: { color: "#fff", fontWeight: "600" },
  shiftRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  shiftLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  shiftNum: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  shiftNumText: { fontSize: 13, fontWeight: "700" },
  shiftName: { fontSize: 15, color: "#fff", fontWeight: "500" },
  shiftDay: { fontSize: 12, color: "#555", marginTop: 1 },
  shiftRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  shiftDot: { width: 8, height: 8, borderRadius: 4 },
  shiftArrow: { fontSize: 20, color: "#444" },
  previewRow: { flexDirection: "row", gap: 6, paddingVertical: 4, paddingHorizontal: 16 },
  previewItem: { alignItems: "center", gap: 4 },
  previewDot: { width: 28, height: 28, borderRadius: 8 },
  previewNum: { fontSize: 10, color: "#555" },
  previewNote: { fontSize: 11, color: "#444", textAlign: "center", paddingVertical: 12 },
  saveBtn: { backgroundColor: "#4A90E2", margin: 16, borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#141414", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: "#1E1E1E" },
  modalHandle: { width: 36, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 20 },
  modalLabel: { fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 16 },
  modalInput: { backgroundColor: "#0A0A0A", borderWidth: 1, borderColor: "#1E1E1E", borderRadius: 12, padding: 14, fontSize: 15, color: "#fff", marginBottom: 8 },
  quickNames: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  quickNameBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#1E1E1E", backgroundColor: "#0A0A0A" },
  quickNameBtnActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  quickNameText: { fontSize: 13, color: "#666" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchActive: { borderWidth: 3, borderColor: "#fff" },
  modalCancelBtn: { padding: 16, alignItems: "center" },
  modalCancelText: { color: "#555", fontSize: 15 },
  shiftPreview: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  shiftPreviewDot: { width: 12, height: 12, borderRadius: 6 },
  shiftPreviewName: { fontSize: 18, fontWeight: "600", color: "#fff" },
  presetItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  presetName: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 4 },
  presetDesc: { fontSize: 13, color: "#555", marginBottom: 8 },
  presetDots: { flexDirection: "row", gap: 6 },
  presetDot: { width: 12, height: 12, borderRadius: 6 },
  presetArrow: { fontSize: 24, color: "#444" },
});