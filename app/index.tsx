import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const [userName, setUserName] = useState("there");

  useFocusEffect(
    useCallback(() => {
      loadUserName();
    }, [])
  );

  async function loadUserName() {
    try {
      const name = await AsyncStorage.getItem("user_name");
      if (name) setUserName(name);
    } catch (e) { console.log(e); }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ShiftScore</Text>
        <Text style={styles.subtitle}>{greeting}, {userName} 👋</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => router.push("/calendar")}>
          <Text style={styles.cardIcon}>🗓️</Text>
          <Text style={styles.cardTitle}>My Calendar</Text>
          <Text style={styles.cardSub}>View your shift schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/health")}>
          <Text style={styles.cardIcon}>❤️</Text>
          <Text style={styles.cardTitle}>Health</Text>
          <Text style={styles.cardSub}>Track your wellness</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/stats")}>
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardTitle}>Shift Score</Text>
          <Text style={styles.cardSub}>Your daily performance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/settings")}>
          <Text style={styles.cardIcon}>⚙️</Text>
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.cardSub}>Customize your schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 6,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cardIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  cardSub: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
});