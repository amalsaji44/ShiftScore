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
  steps: number;
  heartRate: number;
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
  if (score >= 80) return { label: "EXCELLENT", color: "#30D158" };
  if (score >= 60) return { label: "GOOD", color: "#4A90E2" };
  if (score >= 40) return { label: "MODERATE", color: "#FF9F0A" };
  if (score >= 20) return { label: "TOUGH", color: "#FF6B35" };
  return { label: "CRITICAL", color: "#FF453A" };
}

function WatchFace({ score, data, color }: { score: number; data: DayData; color: string }) {
  const size = width - 64;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const arcR = size * 0.38;
  const strokeW = size * 0.028;

  // Arc from -220 to 40 degrees
  const minAngle = -220;
  const maxAngle = 40;
  const scoreAngle = minAngle + (score / 100) * (maxAngle - minAngle);

  function polar(r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(r: number, start: number, end: number) {
    const s = polar(r, start);
    const e = polar(r, end);
    const large = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  // Tick marks
  const majorTicks = [-220, -176, -132, -88, -44, 0, 40];
  const minorTicks = [-198, -154, -110, -66, -22, 20];

  return (
    <Svg width={size} height={size}>
      {/* Outer ring */}
      <Circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#1a1a1a" strokeWidth={1} />

      {/* Track */}
      <Path
        d={arcPath(arcR, minAngle, maxAngle)}
        stroke="#1E1E1E"
        strokeWidth={strokeW}
        fill="none"
        strokeLinecap="round"
      />

      {/* Score arc */}
      <Path
        d={arcPath(arcR, minAngle, scoreAngle)}
        stroke={color}
        strokeWidth={strokeW}
        fill="none"
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Major ticks */}
      {majorTicks.map((deg, i) => {
        const inner = polar(arcR - strokeW * 1.2, deg);
        const outer2 = polar(arcR + strokeW * 0.4, deg);
        const label = polar(arcR - strokeW * 2.2, deg);
        const labels = ["0", "2", "4", "6", "8", "9", "10"];
        return (
          <G key={i}>
            <Line
              x1={outer2.x} y1={outer2.y}
              x2={inner.x} y2={inner.y}
              stroke="#333" strokeWidth={1.5}
            />
            <SvgText
              x={label.x} y={label.y + 4}
              textAnchor="middle"
              fontSize={size * 0.03}
              fill="#333"
            >
              {labels[i]}
            </SvgText>
          </G>
        );
      })}

      {/* Minor ticks */}
      {minorTicks.map((deg, i) => {
        const inner = polar(arcR - strokeW * 0.8, deg);
        const outer2 = polar(arcR + strokeW * 0.2, deg);
        return (
          <Line
            key={i}
            x1={outer2.x} y1={outer2.y}
            x2={inner.x} y2={inner.y}
            stroke="#222" strokeWidth={1}
          />
        );
      })}

      {/* Center circle */}
      <Circle cx={cx} cy={cy} r={arcR * 0.68} fill="#0D0D0D" />
      <Circle cx={cx} cy={cy} r={arcR * 0.67} fill="none" stroke="#1a1a1a" strokeWidth={1} />

      {/* SCORE — large center */}
      <SvgText
        x={cx} y={cy - size * 0.06}
        textAnchor="middle"
        fontSize={size * 0.2}
        fontWeight="bold"
        fill={color}
        opacity={0.95}
      >
        {score}
      </SvgText>

      {/* /100 */}
      <SvgText
        x={cx} y={cy + size * 0.06}
        textAnchor="middle"
        fontSize={size * 0.035}
        fill="#333"
        letterSpacing={2}
      >
        / 100
      </SvgText>

      {/* TOP — Steps */}
      <SvgText
        x={cx} y={cy - arcR * 0.55}
        textAnchor="middle"
        fontSize={size * 0.028}
        fill="#444"
        letterSpacing={2}
      >
        STEPS
      </SvgText>
      <SvgText
        x={cx} y={cy - arcR * 0.38}
        textAnchor="middle"
        fontSize={size * 0.055}
        fontWeight="bold"
        fill={data.steps > 0 ? "#fff" : "#222"}
      >
        {data.steps > 0 ? data.steps.toLocaleString() : "—"}
      </SvgText>

      {/* BOTTOM LEFT — Heart Rate */}
      <SvgText
        x={cx - arcR * 0.5}
        y={cy + arcR * 0.45}
        textAnchor="middle"
        fontSize={size * 0.026}
        fill="#444"
        letterSpacing={1}
      >
        HR
      </SvgText>
      <SvgText
        x={cx - arcR * 0.5}
        y={cy + arcR * 0.62}
        textAnchor="middle"
        fontSize={size * 0.052}
        fontWeight="bold"
        fill={data.heartRate > 0 ? "#FF453A" : "#222"}
      >
        {data.heartRate > 0 ? data.heartRate : "—"}
      </SvgText>
      <SvgText
        x={cx - arcR * 0.5}
        y={cy + arcR * 0.74}
        textAnchor="middle"
        fontSize={size * 0.024}
        fill="#333"
      >
        bpm
      </SvgText>

      {/* BOTTOM RIGHT — Sleep */}
      <SvgText
        x={cx + arcR * 0.5}
        y={cy + arcR * 0.45}
        textAnchor="middle"
        fontSize={size * 0.026}
        fill="#444"
        letterSpacing={1}
      >
        SLEEP
      </SvgText>
      <SvgText
        x={cx + arcR * 0.5}
        y={cy + arcR * 0.62}
        textAnchor="middle"
        fontSize={size * 0.052}
        fontWeight="bold"
        fill={data.sleep > 0 ? "#4A90E2" : "#222"}
      >
        {data.sleep > 0 ? data.sleep : "—"}
      </SvgText>
      <SvgText
        x={cx + arcR * 0.5}
        y={cy + arcR * 0.74}
        textAnchor="middle"
        fontSize={size * 0.024}
        fill="#333"
      >
        hrs
      </SvgText>

      {/* Dot indicator at score position */}
      {score > 0 && (
        <Circle
          cx={polar(arcR, scoreAngle).x}
          cy={polar(arcR, scoreAngle).y}
          r={strokeW * 0.9}
          fill={color}
        />
      )}
    </Svg>
  );
}

export default function Stats() {
  const router = useRouter();
  const [todayData, setTodayData] = useState<DayData>({
    date: "",
    sleep: 0,
    mood: "",
    energy: 0,
    water: 0,
    foodCal: 0,
    burnedCal: 0,
    steps: 0,
    heartRate: 0,
  });
  const [weekData, setWeekData] = useState<{ data: DayData; score: number }[]>([]);
  const [todayScore, setTodayScore] = useState(0);
  const [showExplainer, setShowExplainer] = useState(false);

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  async function loadData() {
    const todayKey = new Date().toISOString().split("T")[0];
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
        steps: hd.steps || 0,
        heartRate: hd.heartRate || 0,
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
            steps: hd2.steps || 0,
            heartRate: hd2.heartRate || 0,
          };
          week.push({ data: dayData, score: calculateShiftScore(dayData) });
        }
      }
      setWeekData(week);
    } catch (e) { console.log(e); }
  }

  const scoreInfo = getScoreInfo(todayScore);
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric"
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shift Score</Text>
        <TouchableOpacity onPress={() => setShowExplainer(true)} style={styles.infoBtn}>
          <Text style={styles.infoBtnText}>i</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.dateText}>{today}</Text>

      {/* WATCH FACE */}
      <View style={styles.watchCard}>
        <WatchFace score={todayScore} data={todayData} color={scoreInfo.color} />
        <Text style={[styles.scoreLabel, { color: scoreInfo.color }]}>
          {scoreInfo.label}
        </Text>
      </View>

      {/* DATA STRIP */}
      <View style={styles.dataStrip}>
        <View style={styles.dataItem}>
          <Text style={styles.dataValue}>
            {todayData.energy > 0 ? `${todayData.energy}/10` : "—"}
          </Text>
          <Text style={styles.dataLabel}>ENERGY</Text>
        </View>
        <View style={styles.dataDivider} />
        <View style={styles.dataItem}>
          <Text style={styles.dataValue}>
            {todayData.water > 0 ? `${todayData.water}/8` : "—"}
          </Text>
          <Text style={styles.dataLabel}>WATER</Text>
        </View>
        <View style={styles.dataDivider} />
        <View style={styles.dataItem}>
          <Text style={styles.dataValue}>
            {todayData.mood || "—"}
          </Text>
          <Text style={styles.dataLabel}>MOOD</Text>
        </View>
        <View style={styles.dataDivider} />
        <View style={styles.dataItem}>
          <Text style={[styles.dataValue, {
            color: todayData.foodCal - todayData.burnedCal < 0 ? "#30D158" :
              todayData.foodCal - todayData.burnedCal > 500 ? "#FF453A" : "#FF9F0A"
          }]}>
            {todayData.foodCal > 0 || todayData.burnedCal > 0
              ? `${todayData.foodCal - todayData.burnedCal > 0 ? "+" : ""}${todayData.foodCal - todayData.burnedCal}`
              : "—"}
          </Text>
          <Text style={styles.dataLabel}>NET CAL</Text>
        </View>
      </View>

      {/* 7-DAY HISTORY */}
      {weekData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAST 7 DAYS</Text>
          {weekData.map((item, i) => {
            const info = getScoreInfo(item.score);
            return (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyDate}>{item.data.date}</Text>
                <View style={styles.historyBarBg}>
                  <View style={[styles.historyBarFill, {
                    width: `${item.score}%` as any,
                    backgroundColor: info.color
                  }]} />
                </View>
                <Text style={[styles.historyScore, { color: info.color }]}>
                  {item.score}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* EMPTY STATE */}
      {todayScore === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No data logged yet</Text>
          <Text style={styles.emptyDesc}>
            Log health data from the day view to see your score
          </Text>
        </View>
      )}

      <View style={{ height: 50 }} />

      {/* EXPLAINER MODAL */}
      <Modal visible={showExplainer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>How It Works</Text>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.modalDesc}>
                Your Shift Score is calculated from your daily health data — like a performance gauge for your body.
              </Text>

              <Text style={styles.modalSectionLabel}>ZONES</Text>
              {[
                { range: "80 – 100", label: "Excellent", color: "#30D158" },
                { range: "60 – 79", label: "Good", color: "#4A90E2" },
                { range: "40 – 59", label: "Moderate", color: "#FF9F0A" },
                { range: "20 – 39", label: "Tough", color: "#FF6B35" },
                { range: "0 – 19", label: "Critical", color: "#FF453A" },
              ].map((zone, i) => (
                <View key={i} style={styles.zoneRow}>
                  <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                  <Text style={styles.zoneRange}>{zone.range}</Text>
                  <Text style={[styles.zoneLabel2, { color: zone.color }]}>{zone.label}</Text>
                </View>
              ))}

              <Text style={styles.modalSectionLabel}>INPUTS</Text>
              {[
                { label: "Sleep", sub: "Hours and quality" },
                { label: "Mood", sub: "Daily feeling" },
                { label: "Energy", sub: "Level 1–10" },
                { label: "Water", sub: "Glasses per day" },
                { label: "Calories", sub: "Food vs burned" },
              ].map((f, i) => (
                <View key={i} style={styles.inputRow}>
                  <View style={styles.inputDot} />
                  <View>
                    <Text style={styles.inputLabel}>{f.label}</Text>
                    <Text style={styles.inputSub}>{f.sub}</Text>
                  </View>
                </View>
              ))}

              <Text style={styles.modalNote}>
                Fitbit sync coming soon. Steps, heart rate and HRV will auto-populate the gauge.
              </Text>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowExplainer(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 64, paddingHorizontal: 24, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#141414", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1E1E1E" },
  backText: { fontSize: 24, color: "#fff", fontWeight: "300" },
  title: { fontSize: 18, fontWeight: "600", color: "#fff" },
  infoBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#141414", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1E1E1E" },
  infoBtnText: { fontSize: 15, color: "#555", fontWeight: "600", fontStyle: "italic" },
  dateText: { fontSize: 12, color: "#333", paddingHorizontal: 24, marginBottom: 16, letterSpacing: 0.5 },
  watchCard: { backgroundColor: "#0D0D0D", marginHorizontal: 16, borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#1a1a1a", marginBottom: 12 },
  scoreLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 4, marginTop: 8 },
  dataStrip: { flexDirection: "row", backgroundColor: "#141414", marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1E1E1E", marginBottom: 12 },
  dataItem: { flex: 1, alignItems: "center" },
  dataDivider: { width: 1, backgroundColor: "#1E1E1E" },
  dataValue: { fontSize: 15, fontWeight: "600", color: "#fff", marginBottom: 4 },
  dataLabel: { fontSize: 9, color: "#333", letterSpacing: 1.5 },
  section: { backgroundColor: "#141414", marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#1E1E1E", marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#333", letterSpacing: 1.5, marginBottom: 16 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  historyDate: { fontSize: 11, color: "#333", width: 84 },
  historyBarBg: { flex: 1, height: 3, backgroundColor: "#1A1A1A", borderRadius: 2, overflow: "hidden" },
  historyBarFill: { height: "100%", borderRadius: 2 },
  historyScore: { fontSize: 13, fontWeight: "600", width: 28, textAlign: "right" },
  emptyCard: { backgroundColor: "#141414", marginHorizontal: 16, borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#1E1E1E" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: "#2a2a2a", textAlign: "center", lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#141414", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%", borderWidth: 1, borderColor: "#1E1E1E" },
  modalHandle: { width: 36, height: 4, backgroundColor: "#222", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 16 },
  modalDesc: { fontSize: 14, color: "#444", lineHeight: 22, marginBottom: 20 },
  modalSectionLabel: { fontSize: 10, fontWeight: "700", color: "#333", letterSpacing: 2, marginBottom: 12, marginTop: 8 },
  zoneRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  zoneDot: { width: 6, height: 6, borderRadius: 3 },
  zoneRange: { fontSize: 13, color: "#444", width: 70 },
  zoneLabel2: { fontSize: 13, fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  inputDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#222" },
  inputLabel: { fontSize: 14, color: "#555", fontWeight: "600" },
  inputSub: { fontSize: 12, color: "#333", marginTop: 1 },
  modalNote: { fontSize: 12, color: "#2a2a2a", marginTop: 20, lineHeight: 18 },
  closeBtn: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 20 },
  closeBtnText: { color: "#555", fontSize: 15, fontWeight: "600" },
});