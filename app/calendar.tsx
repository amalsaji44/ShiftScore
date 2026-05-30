import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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

const DEFAULT_SCHEDULE: ShiftSchedule = {
  cycleName: "My Schedule",
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
};

const CITY_COORDS: { [key: string]: { lat: number; lng: number; tz: string } } = {
  "London ON":     { lat: 42.9849, lng: -81.2453, tz: "America%2FToronto" },
  "Toronto ON":    { lat: 43.6532, lng: -79.3832, tz: "America%2FToronto" },
  "Ottawa ON":     { lat: 45.4215, lng: -75.6972, tz: "America%2FToronto" },
  "Vancouver BC":  { lat: 49.2827, lng: -123.1207, tz: "America%2FVancouver" },
  "Calgary AB":    { lat: 51.0447, lng: -114.0719, tz: "America%2FCalgary" },
  "Montreal QC":   { lat: 45.5017, lng: -73.5673, tz: "America%2FToronto" },
  "Edmonton AB":   { lat: 53.5461, lng: -113.4938, tz: "America%2FCalgary" },
  "Winnipeg MB":   { lat: 49.8951, lng: -97.1384, tz: "America%2FWinnipeg" },
  "Hamilton ON":   { lat: 43.2557, lng: -79.8711, tz: "America%2FToronto" },
  "Kitchener ON":  { lat: 43.4516, lng: -80.4925, tz: "America%2FToronto" },
  "Halifax NS":    { lat: 44.6488, lng: -63.5752, tz: "America%2FHalifax" },
  "Victoria BC":   { lat: 48.4284, lng: -123.3656, tz: "America%2FVancouver" },
};

const DAY_LABELS = [
  { label: "🏃 Easy Run", color: "#4CAF50" },
  { label: "⚡ Speed Intervals", color: "#FF9500" },
  { label: "🏃 Long Run", color: "#2E7D32" },
  { label: "🏋️ Upper Body", color: "#1565C0" },
  { label: "🏋️ Lower Body", color: "#6A1B9A" },
  { label: "🏋️ Full Body", color: "#4A90E2" },
  { label: "🏋️ Push", color: "#E53935" },
  { label: "🏋️ Pull", color: "#8E24AA" },
  { label: "🏋️ Legs", color: "#F4511E" },
  { label: "🏋️ Abs", color: "#00897B" },
  { label: "💪 Arms", color: "#3949AB" },
  { label: "💪 Biceps", color: "#1E88E5" },
  { label: "💪 Triceps", color: "#D81B60" },
  { label: "🏋️ Back", color: "#6D4C41" },
  { label: "💪 Shoulders", color: "#546E7A" },
  { label: "💪 Forearms", color: "#795548" },
  { label: "🚴 Cycling", color: "#FF9500" },
  { label: "🏊 Swimming", color: "#00BCD4" },
  { label: "⚽ Soccer", color: "#43A047" },
  { label: "🏸 Badminton", color: "#FDD835" },
  { label: "🧘 Yoga", color: "#7B68EE" },
  { label: "🚶 Walk", color: "#8BC34A" },
  { label: "❤️ Cardio", color: "#E91E63" },
  { label: "⚡ HIIT", color: "#FF3D00" },
  { label: "😴 Rest Day", color: "#888" },
  { label: "🧊 Recovery", color: "#00ACC1" },
  { label: "🏥 Work", color: "#EF5350" },
  { label: "📅 Off Day", color: "#BDBDBD" },
];

function getWeatherEmoji(code: number, temp: number) {
  if (code === 0) return temp > 25 ? "☀️" : "🌤️";
  if (code <= 2) return "⛅";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌤️";
}

export default function Calendar() {
  const router = useRouter();
  const today = new Date();
  const [schedule, setSchedule] = useState<ShiftSchedule>(DEFAULT_SCHEDULE);
  const [userCity, setUserCity] = useState("London ON");
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [weather, setWeather] = useState<{ [key: string]: { emoji: string; tempMax: number; tempMin: number } }>({});
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadScheduleAndCity();
      loadLabels();
    }, [])
  );

  useEffect(() => {
    fetchWeather();
  }, [currentMonth, userCity]);

  async function loadScheduleAndCity() {
    try {
      const saved = await AsyncStorage.getItem("shift_schedule");
      if (saved) setSchedule(JSON.parse(saved));
      const city = await AsyncStorage.getItem("user_city");
      if (city) setUserCity(city);
    } catch (e) { console.log(e); }
  }

  async function loadLabels() {
    try {
      const saved = await AsyncStorage.getItem("day_labels");
      if (saved) setLabels(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function saveLabel(dateStr: string, label: string) {
    const updated = { ...labels, [dateStr]: label };
    setLabels(updated);
    await AsyncStorage.setItem("day_labels", JSON.stringify(updated));
    setShowLabelModal(false);
    setCustomLabel("");
  }

  async function fetchWeather() {
    setLoadingWeather(true);
    try {
      const coords = CITY_COORDS[userCity] || CITY_COORDS["London ON"];
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=${coords.tz}&start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url);
      const data = await res.json();
      const weatherMap: { [key: string]: { emoji: string; tempMax: number; tempMin: number } } = {};
      data.daily.time.forEach((date: string, i: number) => {
        const code = data.daily.weathercode[i];
        const tempMax = Math.round(data.daily.temperature_2m_max[i]);
        const tempMin = Math.round(data.daily.temperature_2m_min[i]);
        weatherMap[date] = { emoji: getWeatherEmoji(code, tempMax), tempMax, tempMin };
      });
      setWeather(weatherMap);
    } catch (e) { console.log(e); }
    setLoadingWeather(false);
  }

  function getShiftForDate(date: Date) {
    const cycleStart = new Date(schedule.startDate);
    const diff = Math.floor((date.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    const index = ((diff % schedule.cycleLength) + schedule.cycleLength) % schedule.cycleLength;
    return schedule.shifts[index] || schedule.shifts[0];
  }

  function getDaysInMonth() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({ date, shift: getShiftForDate(date) });
    }
    return days;
  }

  function getRows() {
    const days = getDaysInMonth();
    const rows = [];
    for (let i = 0; i < days.length; i += schedule.cycleLength) {
      rows.push(days.slice(i, i + schedule.cycleLength));
    }
    return rows;
  }

  function formatDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  const rows = getRows();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const labelCategories = [
    { title: "🏃 Running", items: DAY_LABELS.slice(0, 3) },
    { title: "🏋️ Weight Training", items: DAY_LABELS.slice(3, 16) },
    { title: "🏅 Cardio & Sports", items: DAY_LABELS.slice(16, 24) },
    { title: "😴 Rest & Recovery", items: DAY_LABELS.slice(24) },
  ];

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.monthInfo}>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <Text style={styles.scheduleName}>{schedule.cycleName} · {schedule.cycleLength}-day · 📍{userCity}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        {[...new Map(schedule.shifts.map(s => [s.name, s])).values()].map(shift => (
          <View key={shift.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: shift.color }]} />
            <Text style={styles.legendText}>{shift.emoji} {shift.name}</Text>
          </View>
        ))}
        {loadingWeather && <ActivityIndicator size="small" color="#888" />}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.rowBlock}>
          <View style={styles.dayNameRow}>
            {row.map((item, colIndex) => {
              const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;
              return (
                <Text key={colIndex} style={[styles.dayName, isWeekend && styles.dayNameWeekend]}>
                  {item.date.toLocaleString("default", { weekday: "short" })}
                </Text>
              );
            })}
          </View>

          <View style={styles.row}>
            {row.map((item, colIndex) => {
              const isToday = item.date.toDateString() === today.toDateString();
              const dateKey = formatDateKey(item.date);
              const weatherData = weather[dateKey];
              const dayLabel = labels[dateKey];
              const isPast = item.date < today && !isToday;
              const labelData = DAY_LABELS.find(l => l.label === dayLabel);

              return (
                <View key={colIndex} style={styles.tileWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.tile,
                      { backgroundColor: item.shift.color + "CC" },
                      isToday && styles.todayTile,
                      isPast && styles.pastTile,
                    ]}
                    onPress={() => router.push({
                      pathname: "/dayview",
                      params: { date: item.date.toDateString(), shift: item.shift.name }
                    })}
                    onLongPress={() => { setSelectedDate(dateKey); setShowLabelModal(true); }}
                  >
                    <Text style={styles.dayNum}>{item.date.getDate()}</Text>
                    <Text style={styles.shiftEmoji}>{item.shift.emoji}</Text>
                    {weatherData && <Text style={styles.weatherEmoji}>{weatherData.emoji}</Text>}
                    {weatherData && <Text style={styles.temp}>↑{weatherData.tempMax}° ↓{weatherData.tempMin}°</Text>}
                    {isToday && <View style={styles.todayDot} />}
                  </TouchableOpacity>

                  {dayLabel ? (
                    <TouchableOpacity
                      style={[styles.labelBadge, { backgroundColor: labelData?.color || "#555" }]}
                      onPress={() => { setSelectedDate(dateKey); setShowLabelModal(true); }}
                    >
                      <Text style={styles.labelText}>{dayLabel}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.addLabelBtn}
                      onPress={() => { setSelectedDate(dateKey); setShowLabelModal(true); }}
                    >
                      <Text style={styles.addLabelText}>+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {showLabelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Day Label</Text>
            <Text style={styles.modalSubtitle}>{selectedDate}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.customSection}>
                <Text style={styles.catTitle}>✏️ Custom</Text>
                <View style={styles.customRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Type your own label..."
                    value={customLabel}
                    onChangeText={setCustomLabel}
                    placeholderTextColor="#444"
                    maxLength={20}
                  />
                  <TouchableOpacity
                    style={[styles.customSaveBtn, !customLabel && styles.customSaveBtnDisabled]}
                    onPress={() => { if (customLabel && selectedDate) saveLabel(selectedDate, customLabel); }}
                  >
                    <Text style={styles.customSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {labelCategories.map((cat) => (
                <View key={cat.title}>
                  <Text style={styles.catTitle}>{cat.title}</Text>
                  <View style={styles.labelGrid}>
                    {cat.items.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        style={[styles.labelChip, { backgroundColor: item.color }]}
                        onPress={() => selectedDate && saveLabel(selectedDate, item.label)}
                      >
                        <Text style={styles.labelChipText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  if (selectedDate) {
                    const updated = { ...labels };
                    delete updated[selectedDate];
                    setLabels(updated);
                    AsyncStorage.setItem("day_labels", JSON.stringify(updated));
                    setShowLabelModal(false);
                  }
                }}
              >
                <Text style={styles.clearBtnText}>🗑️ Remove Label</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowLabelModal(false); setCustomLabel(""); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { fontSize: 16, color: "#4A90E2", fontWeight: "bold" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 32, color: "#4A90E2", fontWeight: "bold" },
  monthInfo: { alignItems: "center", flex: 1 },
  monthTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  scheduleName: { fontSize: 10, color: "#555", marginTop: 2, textAlign: "center" },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 8, paddingHorizontal: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#888" },
  rowBlock: { marginBottom: 8, paddingHorizontal: 8 },
  dayNameRow: { flexDirection: "row", gap: 4, marginBottom: 3 },
  dayName: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "bold", color: "#555" },
  dayNameWeekend: { color: "#FF3B30" },
  row: { flexDirection: "row", gap: 4 },
  tileWrapper: { flex: 1, alignItems: "center" },
  tile: { width: "100%", borderRadius: 12, padding: 5, alignItems: "center", minHeight: 90, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  todayTile: { borderWidth: 2, borderColor: "#FFD700" },
  pastTile: { opacity: 0.5 },
  dayNum: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  shiftEmoji: { fontSize: 13, marginTop: 2 },
  weatherEmoji: { fontSize: 15, marginTop: 2 },
  temp: { color: "rgba(255,255,255,0.8)", fontSize: 8, marginTop: 1, textAlign: "center" },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFD700", marginTop: 2 },
  labelBadge: { borderRadius: 6, paddingHorizontal: 3, paddingVertical: 2, marginTop: 3, width: "100%", alignItems: "center" },
  labelText: { color: "#fff", fontSize: 8, fontWeight: "bold" },
  addLabelBtn: { marginTop: 3, width: "100%", alignItems: "center" },
  addLabelText: { color: "#333", fontSize: 12 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: "#666", textAlign: "center", marginBottom: 12 },
  customSection: { backgroundColor: "#222", borderRadius: 12, padding: 12, marginBottom: 8 },
  customRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  customInput: { flex: 1, borderWidth: 1, borderColor: "#333", borderRadius: 10, padding: 10, fontSize: 14, color: "#fff", backgroundColor: "#111" },
  customSaveBtn: { backgroundColor: "#4A90E2", borderRadius: 10, padding: 10, paddingHorizontal: 16 },
  customSaveBtnDisabled: { backgroundColor: "#333" },
  customSaveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  catTitle: { fontSize: 13, fontWeight: "bold", color: "#888", marginBottom: 8, marginTop: 12 },
  labelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  labelChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  labelChipText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  clearBtn: { padding: 16, alignItems: "center", marginTop: 8 },
  clearBtnText: { fontSize: 15, color: "#FF3B30", fontWeight: "bold" },
  cancelBtn: { padding: 16, alignItems: "center" },
  cancelBtnText: { fontSize: 15, color: "#666" },
});