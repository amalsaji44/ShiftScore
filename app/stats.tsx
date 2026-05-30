import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

const { width } = Dimensions.get("window");

type DayData = {
  date: string;
  sleep: number;
  mood: string;
  energy: number;
  water: number;
  foodCal: number;
  burnedCal: number;
};

const MOOD_SCORES: { [key: string]: number } = {
  "Great": 100, "Good": 75, "Okay": 50, "Low": 25, "Awful": 0,
};

function calculateShiftScore(data: DayData): number {
  let score = 0;
  let factors = 0;
  if (data.sleep > 0) { score += Math.min((data.sleep / 8) * 100, 100); factors++; }
  if (data.mood) { score += MOOD_SCORES[data.mood] || 50; factors++; }
  if (data.energy > 0) { score += (data.energy / 10) * 100; factors++; }
  if (data.water > 0) { score += Math.min((data.water / 8) * 100, 100); factors++; }
  if (data.foodCal > 0 || data.burnedCal > 0) {
    const net = data.foodCal - data.burnedCal;
    score += net < 500 ? 100 : net < 1000 ? 70 : net < 1500 ? 40 : 10;
    factors++;
  }
  return factors > 0 ? Math.round(score / factors) : 0;
}

function getScoreInfo(score: number) {
  if (score >= 80) return { label: "EXCELLENT", color: "#4CAF50", rpm: "High Performance", zone: "Green Zone" };
  if (score >= 60) return { label: "GOOD", color: "#8BC34A", rpm: "Cruising Speed", zone: "Green-Yellow Zone" };
  if (score >= 40) return { label: "MODERATE", color: "#FF9500", rpm: "Mid Range", zone: "Yellow Zone" };
  if (score >= 20) return { label: "TOUGH", color: "#FF5722", rpm: "Low Power", zone: "Orange Zone" };
  return { label: "CRITICAL", color: "#F44336", rpm: "Redline Warning", zone: "Red Zone" };
}

function RPMMeter({ score, color }: { score: number; color: string }) {
  const size = width - 48;
  const cx = size / 2;
  const cy = size * 0.55;
  const r = size * 0.4;
  const strokeWidth = size * 0.06;

  const minAngle = -210;
  const maxAngle = 30;
  const angle = minAngle + (score / 100) * (maxAngle - minAngle);
  const angleRad = (angle * Math.PI) / 180;

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(startAngle: number, endAngle: number, radius: number) {
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const zones = [
    { start: -210, end: -168, color: "#1a1a2e" },
    { start: -168, end: -126, color: "#16213e" },
    { start: -126, end: -84, color: "#0f3460" },
    { start: -84, end: -42, color: "#533483" },
    { start: -42, end: 0, color: "#e94560" },
    { start: 0, end: 30, color: "#FF0000" },
  ];

  const ticks = [
    { val: 0, label: "0" },
    { val: 20, label: "2" },
    { val: 40, label: "4" },
    { val: 60, label: "6" },
    { val: 80, label: "8" },
    { val: 100, label: "10" },
  ];

  const miniTicks = [10, 30, 50, 70, 90];

  const needleLength = r * 0.82;
  const needleX = cx + needleLength * Math.cos(angleRad);
  const needleY = cy + needleLength * Math.sin(angleRad);

  return (
    <Svg width={size} height={size * 0.7}>
      {/* Dark background circle */}
      <Circle cx={cx} cy={cy} r={r + strokeWidth} fill="#1a1a1a" />

      {/* Zone arcs */}
      {zones.map((zone, i) => (
        <Path
          key={i}
          d={arcPath(zone.start, zone.end, r)}
          stroke={zone.color}
          strokeWidth={strokeWidth * 0.9}
          fill="none"
        />
      ))}

      {/* Active progress glow */}
      <Path
        d={arcPath(minAngle, angle, r)}
        stroke={color}
        strokeWidth={strokeWidth * 0.5}
        fill="none"
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Major tick marks + labels */}
      {ticks.map((tick) => {
        const tickAngle = minAngle + (tick.val / 100) * (maxAngle - minAngle);
        const tickRad = (tickAngle * Math.PI) / 180;
        const innerR = r - strokeWidth * 1.1;
        const outerR = r + strokeWidth * 0.2;
        const labelR = r - strokeWidth * 1.9;
        const x1 = cx + outerR * Math.cos(tickRad);
        const y1 = cy + outerR * Math.sin(tickRad);
        const x2 = cx + innerR * Math.cos(tickRad);
        const y2 = cy + innerR * Math.sin(tickRad);
        const lx = cx + labelR * Math.cos(tickRad);
        const ly = cy + labelR * Math.sin(tickRad);
        return (
          <G key={tick.val}>
            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={2.5} />
            <SvgText x={lx} y={ly + 4} textAnchor="middle" fontSize={size * 0.038} fill="#fff" fontWeight="bold">
              {tick.label}
            </SvgText>
          </G>
        );
      })}

      {/* Minor tick marks */}
      {miniTicks.map((tick) => {
        const tickAngle = minAngle + (tick / 100) * (maxAngle - minAngle);
        const tickRad = (tickAngle * Math.PI) / 180;
        const innerR = r - strokeWidth * 0.7;
        const outerR = r + strokeWidth * 0.1;
        const x1 = cx + outerR * Math.cos(tickRad);
        const y1 = cy + outerR * Math.sin(tickRad);
        const x2 = cx + innerR * Math.cos(tickRad);
        const y2 = cy + innerR * Math.sin(tickRad);
        return (
          <Line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#888" strokeWidth={1.5} />
        );
      })}

      {/* Needle shadow */}
      <Line
        x1={cx + 3}
        y1={cy + 3}
        x2={needleX + 3}
        y2={needleY + 3}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={size * 0.012}
        strokeLinecap="round"
      />

      {/* Needle */}
      <Line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="#fff"
        strokeWidth={size * 0.012}
        strokeLinecap="round"
      />

      {/* Red tip of needle */}
      <Line
        x1={cx}
        y1={cy}
        x2={cx + (needleLength * 0.3) * Math.cos(angleRad)}
        y2={cy + (needleLength * 0.3) * Math.sin(angleRad)}
        stroke="#FF0000"
        strokeWidth={size * 0.014}
        strokeLinecap="round"
      />

      {/* Center hub */}
      <Circle cx={cx} cy={cy} r={size * 0.045} fill="#333" />
      <Circle cx={cx} cy={cy} r={size * 0.028} fill="#555" />
      <Circle cx={cx} cy={cy} r={size * 0.012} fill="#FF0000" />

      {/* RPM label */}
      <SvgText
        x={cx}
        y={cy - r * 0.3}
        textAnchor="middle"
        fontSize={size * 0.04}
        fill="#888"
        fontWeight="bold"
      >
        SHIFT SCORE x10
      </SvgText>

      {/* Score number display */}
      <SvgText
        x={cx}
        y={cy + r * 0.25}
        textAnchor="middle"
        fontSize={size * 0.16}
        fontWeight="bold"
        fill={color}
      >
        {score}
      </SvgText>
    </Svg>
  );
}

export default function Stats() {
  const router = useRouter();
  const [todayData, setTodayData] = useState<DayData | null>(null);
  const [weekData, setWeekData] = useState<{ data: DayData; score: number }[]>([]);
  const [todayScore, setTodayScore] = useState(0);
  const [showExplainer, setShowExplainer] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];
    try {
      const health = await AsyncStorage.getItem(`health_${todayKey}`);
      const food = await AsyncStorage.getItem(`food_${todayKey}`);
      const workouts = await AsyncStorage.getItem(`workouts_${todayKey}`);
      const hd = health ? JSON.parse(health) : {};
      const fd = food ? JSON.parse(food) : [];
      const wd = workouts ? JSON.parse(workouts) : [];
      const foodCal = fd.reduce((s: number, f: any) => s + (f.calories || 0), 0);
      const burnedCal = wd.reduce((s: number, w: any) => s + (parseInt(w.calories) || 0), 0);
      const data: DayData = {
        date: todayKey,
        sleep: hd.sleep || 0,
        mood: hd.mood || "",
        energy: hd.energy || 0,
        water: hd.water || 0,
        foodCal,
        burnedCal,
      };
      setTodayData(data);
      setTodayScore(calculateShiftScore(data));

      const week = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const h = await AsyncStorage.getItem(`health_${key}`);
        const f = await AsyncStorage.getItem(`food_${key}`);
        const w = await AsyncStorage.getItem(`workouts_${key}`);
        const hd2 = h ? JSON.parse(h) : {};
        const fd2 = f ? JSON.parse(f) : [];
        const wd2 = w ? JSON.parse(w) : [];
        if (hd2.mood || hd2.sleep || fd2.length > 0) {
          const dayData: DayData = {
            date: key,
            sleep: hd2.sleep || 0,
            mood: hd2.mood || "",
            energy: hd2.energy || 0,
            water: hd2.water || 0,
            foodCal: fd2.reduce((s: number, x: any) => s + (x.calories || 0), 0),
            burnedCal: wd2.reduce((s: number, x: any) => s + (parseInt(x.calories) || 0), 0),
          };
          week.push({ data: dayData, score: calculateShiftScore(dayData) });
        }
      }
      setWeekData(week);
    } catch (e) { console.log(e); }
  }

  const scoreInfo = getScoreInfo(todayScore);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>📊 Shift Score</Text>
      <Text style={styles.subtitle}>
        {new Date().toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
      </Text>

      {/* RPM GAUGE */}
      <TouchableOpacity
        style={styles.gaugeCard}
        onPress={() => setShowExplainer(true)}
        activeOpacity={0.9}
      >
        <RPMMeter score={todayScore} color={scoreInfo.color} />
        <Text style={[styles.scoreLabel, { color: scoreInfo.color }]}>{scoreInfo.label}</Text>
        <Text style={styles.rpmLabel}>{scoreInfo.rpm}</Text>
        <Text style={styles.zoneLabel}>{scoreInfo.zone}</Text>
        <Text style={styles.tapHint}>Tap to understand your score ⓘ</Text>
      </TouchableOpacity>

      {/* TODAY BREAKDOWN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Breakdown</Text>

        {todayScore > 0 && todayData ? (
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownEmoji}>😴</Text>
              <Text style={styles.breakdownValue}>{todayData.sleep > 0 ? `${todayData.sleep}h` : "—"}</Text>
              <Text style={styles.breakdownLabel}>Sleep</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, {
                  width: `${Math.min((todayData.sleep / 8) * 100, 100)}%` as any,
                  backgroundColor: todayData.sleep >= 7 ? "#4CAF50" : "#FF9500"
                }]} />
              </View>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownEmoji}>⚡</Text>
              <Text style={styles.breakdownValue}>{todayData.energy > 0 ? `${todayData.energy}/10` : "—"}</Text>
              <Text style={styles.breakdownLabel}>Energy</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, {
                  width: `${(todayData.energy / 10) * 100}%` as any,
                  backgroundColor: "#FF9500"
                }]} />
              </View>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownEmoji}>💧</Text>
              <Text style={styles.breakdownValue}>{todayData.water > 0 ? `${todayData.water}/8` : "—"}</Text>
              <Text style={styles.breakdownLabel}>Water</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, {
                  width: `${Math.min((todayData.water / 8) * 100, 100)}%` as any,
                  backgroundColor: "#4A90E2"
                }]} />
              </View>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownEmoji}>😊</Text>
              <Text style={styles.breakdownValue}>{todayData.mood || "—"}</Text>
              <Text style={styles.breakdownLabel}>Mood</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, {
                  width: `${MOOD_SCORES[todayData.mood] || 0}%` as any,
                  backgroundColor: "#7B68EE"
                }]} />
              </View>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownEmoji}>🍎</Text>
              <Text style={styles.breakdownValue}>{todayData.foodCal > 0 ? todayData.foodCal : "—"}</Text>
              <Text style={styles.breakdownLabel}>Cal In</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, {
                  width: `${Math.min((todayData.foodCal / 2000) * 100, 100)}%` as any,
                  backgroundColor: "#4CAF50"
                }]} />
              </View>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownEmoji}>🔥</Text>
              <Text style={styles.breakdownValue}>{todayData.burnedCal > 0 ? todayData.burnedCal : "—"}</Text>
              <Text style={styles.breakdownLabel}>Cal Burned</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, {
                  width: `${Math.min((todayData.burnedCal / 500) * 100, 100)}%` as any,
                  backgroundColor: "#FF5722"
                }]} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>No data yet today!</Text>
            <Text style={styles.emptyDesc}>Log health, food and activity to see your score</Text>
          </View>
        )}
      </View>

      {/* 7 DAY HISTORY */}
      {weekData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 7-Day History</Text>
          {weekData.map((item, i) => {
            const info = getScoreInfo(item.score);
            return (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyDate}>{item.data.date}</Text>
                <View style={styles.historyBarContainer}>
                  <View style={[styles.historyBar, {
                    width: `${item.score}%` as any,
                    backgroundColor: info.color
                  }]} />
                </View>
                <Text style={[styles.historyScore, { color: info.color }]}>{item.score}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* EXPLAINER MODAL */}
      <Modal visible={showExplainer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 How Shift Score Works</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDesc}>
                Your Shift Score is like an RPM meter for your body — it shows how well your engine is running today based on your health data.
              </Text>

              <View style={styles.explainerRow}>
                <Text style={[styles.explainerZone, { color: "#4CAF50" }]}>● Green Zone (80-100)</Text>
                <Text style={styles.explainerDesc}>Peak performance — your body is running at its best</Text>
              </View>
              <View style={styles.explainerRow}>
                <Text style={[styles.explainerZone, { color: "#8BC34A" }]}>● Yellow-Green (60-79)</Text>
                <Text style={styles.explainerDesc}>Good condition — cruising comfortably</Text>
              </View>
              <View style={styles.explainerRow}>
                <Text style={[styles.explainerZone, { color: "#FF9500" }]}>● Yellow Zone (40-59)</Text>
                <Text style={styles.explainerDesc}>Moderate — some areas need attention</Text>
              </View>
              <View style={styles.explainerRow}>
                <Text style={[styles.explainerZone, { color: "#FF5722" }]}>● Orange Zone (20-39)</Text>
                <Text style={styles.explainerDesc}>Low power — rest and recovery recommended</Text>
              </View>
              <View style={styles.explainerRow}>
                <Text style={[styles.explainerZone, { color: "#F44336" }]}>● Red Zone (0-19)</Text>
                <Text style={styles.explainerDesc}>Critical — your body needs urgent recovery</Text>
              </View>

              <Text style={styles.modalSubtitle}>What affects your score?</Text>
              <Text style={styles.modalFactors}>
                😴 Sleep quality and duration{"\n"}
                😊 Daily mood{"\n"}
                ⚡ Energy level{"\n"}
                💧 Water intake{"\n"}
                🍎 Calorie balance (food vs burned)
              </Text>

              <Text style={styles.modalNote}>
                As Fitbit sync is added, your score will also include heart rate, steps, and HRV for an even more accurate reading!!
              </Text>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowExplainer(false)}
              >
                <Text style={styles.modalCloseBtnText}>Got it! 👍</Text>
              </TouchableOpacity>
            </ScrollView>
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
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 16 },
  gaugeCard: { backgroundColor: "#1a1a1a", margin: 16, borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#333" },
  scoreLabel: { fontSize: 26, fontWeight: "bold", marginTop: 8, letterSpacing: 4 },
  rpmLabel: { fontSize: 14, color: "#888", marginTop: 4 },
  zoneLabel: { fontSize: 12, color: "#555", marginTop: 2 },
  tapHint: { fontSize: 11, color: "#444", marginTop: 12 },
  section: { backgroundColor: "#1a1a1a", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#333" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  breakdownItem: { width: "47%", backgroundColor: "#222", borderRadius: 12, padding: 12 },
  breakdownEmoji: { fontSize: 22, marginBottom: 4 },
  breakdownValue: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  breakdownLabel: { fontSize: 12, color: "#666", marginBottom: 8 },
  breakdownBar: { height: 4, backgroundColor: "#333", borderRadius: 2, overflow: "hidden" },
  breakdownFill: { height: "100%", borderRadius: 2 },
  emptyState: { alignItems: "center", padding: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  emptyDesc: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 8 },
  historyRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  historyDate: { fontSize: 11, color: "#666", width: 80 },
  historyBarContainer: { flex: 1, height: 10, backgroundColor: "#333", borderRadius: 5, overflow: "hidden" },
  historyBar: { height: "100%", borderRadius: 5 },
  historyScore: { fontSize: 14, fontWeight: "bold", width: 30, textAlign: "right" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 16, textAlign: "center" },
  modalDesc: { fontSize: 14, color: "#888", lineHeight: 22, marginBottom: 20 },
  explainerRow: { marginBottom: 12 },
  explainerZone: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  explainerDesc: { fontSize: 13, color: "#666", paddingLeft: 16 },
  modalSubtitle: { fontSize: 16, fontWeight: "bold", color: "#fff", marginTop: 20, marginBottom: 12 },
  modalFactors: { fontSize: 14, color: "#888", lineHeight: 28 },
  modalNote: { fontSize: 13, color: "#555", marginTop: 20, fontStyle: "italic", lineHeight: 20 },
  modalCloseBtn: { backgroundColor: "#4A90E2", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  modalCloseBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});