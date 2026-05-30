import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ShiftScore 🏥</Text>
      <Text style={styles.subtitle}>Welcome back, Amal!</Text>

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
        <Text style={styles.cardSub}>View your stress stats</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/settings")}>
        <Text style={styles.cardIcon}>⚙️</Text>
        <Text style={styles.cardTitle}>Settings</Text>
        <Text style={styles.cardSub}>Customize your schedule</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
    marginBottom: 40,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  cardSub: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
});