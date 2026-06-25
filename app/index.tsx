import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [scheduleName, setScheduleName] = useState("");
  const [todayShift, setTodayShift] = useState({ name: "", color: "#4A90E2", emoji: "" });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const name = await AsyncStorage.getItem("user_name");
      if (name) setUserName(name);

      const schedule = await AsyncStorage.getItem("shift_schedule");
      if (schedule) {
        const s = JSON.parse(schedule);
        setScheduleName(s.cycleName);
        const cycleStart = new Date(s.startDate);
        const today = new Date();
        const diff = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
        const index = ((diff % s.cycleLength) + s.cycleLength) % s.cycleLength;
        const shift = s.shifts[index];
        if (shift) setTodayShift(shift);
      }
    } catch (e) { console.log(e); }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}{userName ? `, ${userName}` : ""}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* TODAY SHIFT CARD */}
      {todayShift.name ? (
        <TouchableOpacity
          style={[styles.shiftCard, { borderLeftColor: todayShift.color }]}
          onPress={() => router.push("/calendar")}
        >
          <View>
            <Text style={styles.shiftCardLabel}>Today's Shift</Text>
            <Text style={styles.shiftCardName}>{todayShift.name}</Text>
            <Text style={styles.shiftCardSub}>{scheduleName}</Text>
          </View>
          <View style={[styles.shiftIndicator, { backgroundColor: todayShift.color }]} />
        </TouchableOpacity>
      ) : null}

      {/* MAIN CARDS */}
      <View style={styles.cardGrid}>
        <TouchableOpacity style={styles.card} onPress={() => router.push("/calendar")}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIconText}>CAL</Text>
          </View>
          <Text style={styles.cardTitle}>Calendar</Text>
          <Text style={styles.cardSub}>Shift schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/stats")}>
          <View style={[styles.cardIconContainer, { backgroundColor: "#1a2a1a" }]}>
            <Text style={[styles.cardIconText, { color: "#30D158" }]}>RPM</Text>
          </View>
          <Text style={styles.cardTitle}>Shift Score</Text>
          <Text style={styles.cardSub}>Daily performance</Text>
        </TouchableOpacity>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.quickSection}>
        <Text style={styles.quickTitle}>Quick Access</Text>
        <TouchableOpacity
          style={styles.quickRow}
          onPress={() => router.push("/calendar")}
        >
          <View style={styles.quickLeft}>
            <View style={[styles.quickDot, { backgroundColor: "#4A90E2" }]} />
            <Text style={styles.quickText}>View this month</Text>
          </View>
          <Text style={styles.quickArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickRow}
          onPress={() => router.push("/settings")}
        >
          <View style={styles.quickLeft}>
            <View style={[styles.quickDot, { backgroundColor: "#888" }]} />
            <Text style={styles.quickText}>Edit schedule</Text>
          </View>
          <Text style={styles.quickArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickRow}
          onPress={() => router.push("/stats")}
        >
          <View style={styles.quickLeft}>
            <View style={[styles.quickDot, { backgroundColor: "#30D158" }]} />
            <Text style={styles.quickText}>Check shift score</Text>
          </View>
          <Text style={styles.quickArrow}>›</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  settingsIcon: {
    fontSize: 18,
    color: "#888",
  },
  shiftCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: "#1E1E1E",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftCardLabel: {
    fontSize: 12,
    color: "#666",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  shiftCardName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  shiftCardSub: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  shiftIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  card: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1a1a2a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardIconText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4A90E2",
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: "#555",
  },
  quickSection: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  quickTitle: {
    fontSize: 12,
    color: "#555",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  quickLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickText: {
    fontSize: 15,
    color: "#CCCCCC",
  },
  quickArrow: {
    fontSize: 20,
    color: "#444",
  },
});