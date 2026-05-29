import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SHIFT_CYCLE = ["Day", "Day", "Night", "Night", "Off", "Off", "Off", "Off", "Off"];
const CYCLE_START = new Date(2026, 4, 5);

function getShiftForDate(date: Date) {
  const diff = Math.floor((date.getTime() - CYCLE_START.getTime()) / (1000 * 60 * 60 * 24));
  const index = ((diff % 9) + 9) % 9;
  return SHIFT_CYCLE[index];
}

function getShiftColor(shift: string) {
  if (shift === "Day") return "#4A90E2";
  if (shift === "Night") return "#7B68EE";
  return "#4CAF50";
}

function getShiftEmoji(shift: string) {
  if (shift === "Day") return "🌅";
  if (shift === "Night") return "🌙";
  return "✅";
}

export default function Calendar() {
  const router = useRouter();
  const today = new Date();
  const days = [];

  for (let i = -9; i < 45; i++) {
    const date = new Date(CYCLE_START);
    date.setDate(CYCLE_START.getDate() + i);
    const shift = getShiftForDate(date);
    days.push({ date, shift });
  }

  const rows = [];
  for (let i = 0; i < days.length; i += 9) {
    rows.push(days.slice(i, i + 9));
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🗓️ Shift Calendar</Text>

      <View style={styles.legend}>
        <Text style={[styles.legendItem, { color: "#4A90E2" }]}>🌅 Day</Text>
        <Text style={[styles.legendItem, { color: "#7B68EE" }]}>🌙 Night</Text>
        <Text style={[styles.legendItem, { color: "#4CAF50" }]}>✅ Off</Text>
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item, colIndex) => {
            const isToday = item.date.toDateString() === today.toDateString();
            const dateStr = item.date.toDateString();
            return (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.cell,
                  { backgroundColor: getShiftColor(item.shift) },
                  isToday && styles.todayCell,
                ]}
                onPress={() => router.push({
                  pathname: "/dayview",
                  params: { date: dateStr, shift: item.shift }
                })}
              >
                <Text style={styles.dayNum}>{item.date.getDate()}</Text>
                <Text style={styles.monthText}>
                  {item.date.toLocaleString("default", { month: "short" })}
                </Text>
                <Text style={styles.emoji}>{getShiftEmoji(item.shift)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 60,
    paddingHorizontal: 8,
  },
  backBtn: {
    padding: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d2d2d",
    textAlign: "center",
    marginBottom: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    fontSize: 14,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 4,
  },
  cell: {
    flex: 1,
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    minWidth: 34,
  },
  todayCell: {
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  dayNum: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  monthText: {
    color: "#fff",
    fontSize: 9,
  },
  emoji: {
    fontSize: 12,
    marginTop: 2,
  },
});