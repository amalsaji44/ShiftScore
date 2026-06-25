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
};

const CITY_COORDS: { [key: string]: { lat: number; lng: number; tz: string } } = {
  "London ON":    { lat: 42.9849, lng: -81.2453, tz: "America%2FToronto" },
  "Toronto ON":   { lat: 43.6532, lng: -79.3832, tz: "America%2FToronto" },
  "Ottawa ON":    { lat: 45.4215, lng: -75.6972, tz: "America%2FToronto" },
  "Vancouver BC": { lat: 49.2827, lng: -123.1207, tz: "America%2FVancouver" },
  "Calgary AB":   { lat: 51.0447, lng: -114.0719, tz: "America%2FCalgary" },
  "Montreal QC":  { lat: 45.5017, lng: -73.5673, tz: "America%2FToronto" },
  "Edmonton AB":  { lat: 53.5461, lng: -113.4938, tz: "America%2FCalgary" },
  "Winnipeg MB":  { lat: 49.8951, lng: -97.1384, tz: "America%2FWinnipeg" },
  "Hamilton ON":  { lat: 43.2557, lng: -79.8711, tz: "America%2FToronto" },
  "Kitchener ON": { lat: 43.4516, lng: -80.4925, tz: "America%2FToronto" },
  "Halifax NS":   { lat: 44.6488, lng: -63.5752, tz: "America%2FHalifax" },
  "Victoria BC":  { lat: 48.4284, lng: -123.3656, tz: "America%2FVancouver" },
};

const DAY_LABELS = [
  { label: "Easy Run", color: "#30D158" },
  { label: "Speed Work", color: "#FF9F0A" },
  { label: "Long Run", color: "#2E7D32" },
  { label: "Upper Body", color: "#4A90E2" },
  { label: "Lower Body", color: "#7B68EE" },
  { label: "Full Body", color: "#00BCD4" },
  { label: "Push", color: "#FF453A" },
  { label: "Pull", color: "#BF5AF2" },
  { label: "Legs", color: "#FF6B35" },
  { label: "Abs", color: "#30D158" },
  { label: "Arms", color: "#4A90E2" },
  { label: "Back", color: "#795548" },
  { label: "Shoulders", color: "#607D8B" },
  { label: "Cycling", color: "#FF9F0A" },
  { label: "Swimming", color: "#00BCD4" },
  { label: "Soccer", color: "#30D158" },
  { label: "Badminton", color: "#FF9F0A" },
  { label: "Yoga", color: "#BF5AF2" },
  { label: "Walk", color: "#8BC34A" },
  { label: "Cardio", color: "#FF453A" },
  { label: "HIIT", color: "#FF6B35" },
  { label: "Rest", color: "#444" },
  { label: "Recovery", color: "#00BCD4" },
];

function getWeatherEmoji(code: number, temp: number) {
  if (code === 0) return temp > 25 ? "☀" : "◑";
  if (code <= 2) return "◑";
  if (code <= 3) return "●";
  if (code <= 48) return "≋";
  if (code <= 67) return "▼";
  if (code <= 77) return "❄";
  if (code <= 82) return "▼";
  if (code <= 86) return "❄";
  if (code <= 99) return "↯";
  return "◑";
}

export default function Calendar() {
  const router = useRouter();
  const today = new Date();
  const [schedule, setSchedule] = useState<ShiftSchedule>(DEFAULT_SCHEDULE);
  const [userCity, setUserCity] = useState("London ON");
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [weather, setWeather] = useState<{ [key: string]: { icon: string; tempMax: number; tempMin: number } }>({});
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
      const weatherMap: { [key: string]: { icon: string; tempMax: number; tempMin: number } } = {};
      data.daily.time.forEach((date: string, i: number) => {
        const code = data.daily.weathercode[i];
        const tempMax = Math.round(data.daily.temperature_2m_max[i]);
        const tempMin = Math.round(data.daily.temperature_2m_min[i]);
        weatherMap[date] = { icon: getWeatherEmoji(code, tempMax), tempMax, tempMin };
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
    { title: "Running", items: DAY_LABELS.slice(0, 3) },
    { title: "Strength", items: DAY_LABELS.slice(3, 13) },
    { title: "Cardio & Sports", items: DAY_LABELS.slice(13, 21) },
    { title: "Recovery", items: DAY_LABELS.slice(21) },
  ];

  const uniqueShifts = [...new Map(schedule.shifts.map(s => [s.name, s])).values()];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
        {loadingWeather
          ? <ActivityIndicator size="small" color="#555" />
          : <View style={{ width: 40 }} />
        }
      </View>

      {/* LEGEND */}
      <View style={styles.legend}>
        {uniqueShifts.map(shift => (
          <View key={shift.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: shift.color }]} />
            <Text style={styles.legendText}>{shift.name}</Text>
          </View>
        ))}
        <Text style={styles.legendSep}>·</Text>
        <Text style={styles.legendCity}>{userCity}</Text>
      </View>

      {/* CALENDAR */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.rowBlock}>

          {/* Day names */}
          <View style={styles.dayNameRow}>
            {row.map((item, colIndex) => {
              const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;
              return (
                <Text
                  key={colIndex}
                  style={[styles.dayName, isWeekend && styles.dayNameWeekend]}
                >
                  {item.date.toLocaleString("default", { weekday: "short" })}
                </Text>
              );
            })}
          </View>

          {/* Tiles */}
          <View style={styles.tileRow}>
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
                      { borderTopColor: item.shift.color },
                      isToday && styles.todayTile,
                      isPast && styles.pastTile,
                    ]}
                    onPress={() => router.push({
                      pathname: "/dayview",
                      params: { date: item.date.toDateString(), shift: item.shift.name }
                    })}
                    onLongPress={() => { setSelectedDate(dateKey); setShowLabelModal(true); }}
                  >
                    {/* Date */}
                    <Text style={[styles.dayNum, isToday && styles.todayNum]}>
                      {item.date.getDate()}
                    </Text>

                    {/* Shift name */}
                    <Text style={[styles.shiftName, { color: item.shift.color }]}>
                      {item.shift.name}
                    </Text>

                    {/* Weather */}
                    {weatherData && (
                      <Text style={styles.weatherIcon}>{weatherData.icon}</Text>
                    )}
                    {weatherData && (
                      <Text style={styles.temp}>
                        {weatherData.tempMax}°
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Label */}
                  {dayLabel ? (
                    <TouchableOpacity
                      style={[styles.labelBadge, { backgroundColor: labelData?.color + "33" || "#22222255" }]}
                      onPress={() => { setSelectedDate(dateKey); setShowLabelModal(true); }}
                    >
                      <Text style={[styles.labelText, { color: labelData?.color || "#888" }]}>
                        {dayLabel}
                      </Text>
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

      <View style={{ height: 40 }} />

      {/* LABEL MODAL */}
      {showLabelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Label Day</Text>
            <Text style={styles.modalDate}>{selectedDate}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Custom input */}
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Custom label..."
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  placeholderTextColor="#444"
                  maxLength={20}
                />
                <TouchableOpacity
                  style={[styles.customSaveBtn, !customLabel && { opacity: 0.3 }]}
                  onPress={() => { if (customLabel && selectedDate) saveLabel(selectedDate, customLabel); }}
                >
                  <Text style={styles.customSaveBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {labelCategories.map((cat) => (
                <View key={cat.title}>
                  <Text style={styles.catLabel}>{cat.title.toUpperCase()}</Text>
                  <View style={styles.labelGrid}>
                    {cat.items.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        style={[styles.labelChip, { borderColor: item.color + "55" }]}
                        onPress={() => selectedDate && saveLabel(selectedDate, item.label)}
                      >
                        <View style={[styles.labelChipDot, { backgroundColor: item.color }]} />
                        <Text style={styles.labelChipText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Remove */}
              {labels[selectedDate || ""] && (
                <TouchableOpacity
                  style={styles.removeBtn}
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
                  <Text style={styles.removeBtnText}>Remove Label</Text>
                </TouchableOpacity>
              )}

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
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 64, paddingHorizontal: 24, marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#141414", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1E1E1E" },
  backText: { fontSize: 24, color: "#fff", fontWeight: "300" },
  monthNav: { flexDirection: "row", alignItems: "center", gap: 16 },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 22, color: "#4A90E2", fontWeight: "300" },
  monthTitle: { fontSize: 17, fontWeight: "600", color: "#fff", minWidth: 160, textAlign: "center" },
  legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, paddingHorizontal: 24, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 12, color: "#666" },
  legendSep: { color: "#333", fontSize: 12 },
  legendCity: { fontSize: 12, color: "#444" },
  rowBlock: { marginBottom: 4, paddingHorizontal: 12 },
  dayNameRow: { flexDirection: "row", gap: 3, marginBottom: 3, paddingHorizontal: 2 },
  dayName: { flex: 1, textAlign: "center", fontSize: 9, fontWeight: "600", color: "#444", letterSpacing: 0.5 },
  dayNameWeekend: { color: "#FF453A" },
  tileRow: { flexDirection: "row", gap: 3 },
  tileWrapper: { flex: 1 },
  tile: { backgroundColor: "#141414", borderRadius: 10, padding: 6, alignItems: "center", minHeight: 80, borderWidth: 1, borderColor: "#1E1E1E", borderTopWidth: 2 },
  todayTile: { backgroundColor: "#1a1a2a", borderColor: "#4A90E2" },
  pastTile: { opacity: 0.4 },
  dayNum: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 2 },
  todayNum: { color: "#4A90E2" },
  shiftName: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  weatherIcon: { fontSize: 12, color: "#888", marginBottom: 1 },
  temp: { fontSize: 10, color: "#666" },
  labelBadge: { borderRadius: 6, paddingHorizontal: 4, paddingVertical: 3, marginTop: 3, alignItems: "center" },
  labelText: { fontSize: 8, fontWeight: "600" },
  addLabelBtn: { marginTop: 3, alignItems: "center" },
  addLabelText: { fontSize: 14, color: "#2a2a2a" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#141414", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: "#1E1E1E" },
  modalHandle: { width: 36, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 4 },
  modalDate: { fontSize: 13, color: "#555", marginBottom: 20 },
  customRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  customInput: { flex: 1, backgroundColor: "#0A0A0A", borderWidth: 1, borderColor: "#1E1E1E", borderRadius: 12, padding: 12, fontSize: 15, color: "#fff" },
  customSaveBtn: { backgroundColor: "#4A90E2", borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  customSaveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  catLabel: { fontSize: 11, fontWeight: "700", color: "#444", letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  labelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  labelChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: "#0A0A0A" },
  labelChipDot: { width: 6, height: 6, borderRadius: 3 },
  labelChipText: { color: "#888", fontSize: 13 },
  removeBtn: { marginTop: 20, padding: 14, alignItems: "center" },
  removeBtnText: { color: "#FF453A", fontSize: 15 },
  cancelBtn: { padding: 14, alignItems: "center" },
  cancelBtnText: { color: "#555", fontSize: 15 },
});