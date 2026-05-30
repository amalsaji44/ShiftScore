import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

type AlarmReminder = {
  id: string;
  type: "Reminder" | "Alarm";
  label: string;
  time: string;
  repeatUnit: string;
  repeatValue: string;
};

type Workout = {
  id: string;
  type: string;
  emoji: string;
  duration: string;
  calories: string;
  heartRate: string;
  intensity: string;
  notes: string;
};

type FoodEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  mealType: string;
};

type FoodDBItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  category: string;
  custom?: boolean;
};

const WORKOUT_TYPES = [
  { name: "Walking", emoji: "🚶" },
  { name: "Running", emoji: "🏃" },
  { name: "Cycling", emoji: "🚴" },
  { name: "Strength", emoji: "🏋️" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Yoga", emoji: "🧘" },
  { name: "Cardio", emoji: "❤️" },
  { name: "HIIT", emoji: "⚡" },
  { name: "Custom", emoji: "➕" },
];

const INTENSITIES = ["Easy", "Moderate", "Hard", "Max"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const FOOD_DATABASE: FoodDBItem[] = [
  { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Orange", calories: 62, protein: 1, carbs: 15, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Mango", calories: 201, protein: 3, carbs: 50, fat: 1, portion: "1 whole", category: "Fruits" },
  { name: "Avocado", calories: 234, protein: 3, carbs: 12, fat: 21, portion: "1 whole", category: "Fruits" },
  { name: "Strawberries", calories: 49, protein: 1, carbs: 12, fat: 0, portion: "1 cup", category: "Fruits" },
  { name: "Blueberries", calories: 84, protein: 1, carbs: 21, fat: 0, portion: "1 cup", category: "Fruits" },
  { name: "Watermelon", calories: 86, protein: 2, carbs: 22, fat: 0, portion: "2 cups", category: "Fruits" },
  { name: "Broccoli", calories: 55, protein: 4, carbs: 11, fat: 1, portion: "1 cup", category: "Vegetables" },
  { name: "Spinach", calories: 7, protein: 1, carbs: 1, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Carrots", calories: 52, protein: 1, carbs: 12, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Tomato", calories: 22, protein: 1, carbs: 5, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Potato", calories: 161, protein: 4, carbs: 37, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Sweet potato", calories: 103, protein: 2, carbs: 24, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Mushrooms", calories: 15, protein: 2, carbs: 2, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Olive oil", calories: 119, protein: 0, carbs: 0, fat: 14, portion: "1 tbsp", category: "Oils" },
  { name: "Coconut oil", calories: 121, protein: 0, carbs: 0, fat: 14, portion: "1 tbsp", category: "Oils" },
  { name: "Butter", calories: 102, protein: 0, carbs: 0, fat: 12, portion: "1 tbsp", category: "Oils" },
  { name: "Ghee", calories: 112, protein: 0, carbs: 0, fat: 13, portion: "1 tbsp", category: "Oils" },
  { name: "Peanut butter", calories: 190, protein: 8, carbs: 6, fat: 16, portion: "2 tbsp", category: "Oils" },
  { name: "Chicken breast grilled", calories: 165, protein: 31, carbs: 0, fat: 4, portion: "100g", category: "Proteins" },
  { name: "Chicken thigh grilled", calories: 209, protein: 26, carbs: 0, fat: 11, portion: "100g", category: "Proteins" },
  { name: "Salmon grilled", calories: 208, protein: 28, carbs: 0, fat: 10, portion: "100g", category: "Proteins" },
  { name: "Tuna canned", calories: 132, protein: 29, carbs: 0, fat: 1, portion: "100g", category: "Proteins" },
  { name: "Beef ground cooked", calories: 250, protein: 26, carbs: 0, fat: 16, portion: "100g", category: "Proteins" },
  { name: "Steak grilled", calories: 271, protein: 26, carbs: 0, fat: 18, portion: "100g", category: "Proteins" },
  { name: "Eggs 2 scrambled", calories: 180, protein: 12, carbs: 2, fat: 14, portion: "2 eggs", category: "Proteins" },
  { name: "Eggs boiled", calories: 155, protein: 13, carbs: 1, fat: 11, portion: "2 eggs", category: "Proteins" },
  { name: "Tofu firm", calories: 144, protein: 17, carbs: 3, fat: 9, portion: "100g", category: "Proteins" },
  { name: "Lentils cooked", calories: 230, protein: 18, carbs: 40, fat: 1, portion: "1 cup", category: "Proteins" },
  { name: "Chickpeas cooked", calories: 269, protein: 15, carbs: 45, fat: 4, portion: "1 cup", category: "Proteins" },
  { name: "Protein shake whey", calories: 200, protein: 30, carbs: 10, fat: 5, portion: "1 scoop", category: "Proteins" },
  { name: "White rice cooked", calories: 206, protein: 4, carbs: 45, fat: 0, portion: "1 cup", category: "Grains" },
  { name: "Brown rice cooked", calories: 216, protein: 5, carbs: 45, fat: 2, portion: "1 cup", category: "Grains" },
  { name: "Pasta cooked", calories: 220, protein: 8, carbs: 43, fat: 1, portion: "1 cup", category: "Grains" },
  { name: "White bread", calories: 79, protein: 3, carbs: 15, fat: 1, portion: "1 slice", category: "Grains" },
  { name: "Whole wheat bread", calories: 69, protein: 4, carbs: 12, fat: 1, portion: "1 slice", category: "Grains" },
  { name: "Oatmeal cooked", calories: 150, protein: 5, carbs: 27, fat: 3, portion: "1 cup", category: "Grains" },
  { name: "Roti whole wheat", calories: 120, protein: 3, carbs: 18, fat: 4, portion: "1 roti", category: "Grains" },
  { name: "Naan bread", calories: 262, protein: 9, carbs: 45, fat: 5, portion: "1 piece", category: "Grains" },
  { name: "Whole milk", calories: 149, protein: 8, carbs: 12, fat: 8, portion: "1 cup", category: "Dairy" },
  { name: "Greek yogurt plain", calories: 130, protein: 17, carbs: 9, fat: 0, portion: "1 cup", category: "Dairy" },
  { name: "Cheddar cheese", calories: 113, protein: 7, carbs: 0, fat: 9, portion: "30g", category: "Dairy" },
  { name: "Cottage cheese", calories: 206, protein: 28, carbs: 8, fat: 9, portion: "1 cup", category: "Dairy" },
  { name: "Water", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "1 glass", category: "Drinks" },
  { name: "Coffee black", calories: 5, protein: 0, carbs: 0, fat: 0, portion: "1 cup", category: "Drinks" },
  { name: "Coffee with milk sugar", calories: 80, protein: 1, carbs: 14, fat: 2, portion: "1 cup", category: "Drinks" },
  { name: "Green tea", calories: 2, protein: 0, carbs: 0, fat: 0, portion: "1 cup", category: "Drinks" },
  { name: "Orange juice", calories: 112, protein: 2, carbs: 26, fat: 0, portion: "1 cup", category: "Drinks" },
  { name: "Coca Cola", calories: 140, protein: 0, carbs: 39, fat: 0, portion: "355ml can", category: "Drinks" },
  { name: "Diet Coke", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "355ml can", category: "Drinks" },
  { name: "Energy drink Red Bull", calories: 110, protein: 1, carbs: 28, fat: 0, portion: "250ml can", category: "Drinks" },
  { name: "Gatorade", calories: 140, protein: 0, carbs: 36, fat: 0, portion: "591ml bottle", category: "Drinks" },
  { name: "Tim Hortons Double Double", calories: 170, protein: 4, carbs: 28, fat: 5, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Black Coffee", calories: 5, protein: 0, carbs: 1, fat: 0, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Bagel plain", calories: 280, protein: 10, carbs: 55, fat: 2, portion: "1 bagel", category: "Tim Hortons" },
  { name: "Tim Hortons Bagel with cream cheese", calories: 430, protein: 14, carbs: 58, fat: 16, portion: "1 bagel", category: "Tim Hortons" },
  { name: "Tim Hortons Muffin blueberry", calories: 390, protein: 5, carbs: 64, fat: 14, portion: "1 muffin", category: "Tim Hortons" },
  { name: "Tim Hortons Timbits glazed", calories: 60, protein: 1, carbs: 9, fat: 2, portion: "1 piece", category: "Tim Hortons" },
  { name: "Tim Hortons Donut", calories: 260, protein: 3, carbs: 36, fat: 12, portion: "1 donut", category: "Tim Hortons" },
  { name: "Tim Hortons Chicken wrap", calories: 510, protein: 30, carbs: 55, fat: 19, portion: "1 wrap", category: "Tim Hortons" },
  { name: "Tim Hortons Chili", calories: 300, protein: 22, carbs: 40, fat: 6, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Iced Capp", calories: 460, protein: 6, carbs: 63, fat: 22, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons French Vanilla", calories: 240, protein: 4, carbs: 42, fat: 7, portion: "1 medium", category: "Tim Hortons" },
  { name: "McDonalds Big Mac", calories: 550, protein: 25, carbs: 46, fat: 30, portion: "1 burger", category: "McDonalds" },
  { name: "McDonalds Quarter Pounder", calories: 520, protein: 30, carbs: 42, fat: 26, portion: "1 burger", category: "McDonalds" },
  { name: "McDonalds McChicken", calories: 400, protein: 20, carbs: 42, fat: 17, portion: "1 burger", category: "McDonalds" },
  { name: "McDonalds French Fries medium", calories: 320, protein: 4, carbs: 44, fat: 15, portion: "1 medium", category: "McDonalds" },
  { name: "McDonalds McNuggets 6pc", calories: 280, protein: 14, carbs: 18, fat: 17, portion: "6 pieces", category: "McDonalds" },
  { name: "McDonalds Egg McMuffin", calories: 300, protein: 18, carbs: 30, fat: 12, portion: "1 sandwich", category: "McDonalds" },
  { name: "Subway 6 inch Turkey", calories: 280, protein: 18, carbs: 46, fat: 4, portion: "6 inch", category: "Subway" },
  { name: "Subway 6 inch Chicken", calories: 310, protein: 23, carbs: 47, fat: 5, portion: "6 inch", category: "Subway" },
  { name: "Subway 6 inch Tuna", calories: 480, protein: 22, carbs: 45, fat: 24, portion: "6 inch", category: "Subway" },
  { name: "Subway Footlong Turkey", calories: 560, protein: 36, carbs: 92, fat: 8, portion: "12 inch", category: "Subway" },
  { name: "KFC Original chicken piece", calories: 320, protein: 28, carbs: 10, fat: 19, portion: "1 piece", category: "KFC" },
  { name: "KFC Chicken sandwich", calories: 490, protein: 28, carbs: 51, fat: 20, portion: "1 sandwich", category: "KFC" },
  { name: "KFC Poutine", calories: 500, protein: 12, carbs: 60, fat: 25, portion: "1 small", category: "KFC" },
  { name: "Burger King Whopper", calories: 660, protein: 28, carbs: 49, fat: 40, portion: "1 burger", category: "Burger King" },
  { name: "Harveys Original Burger", calories: 470, protein: 25, carbs: 44, fat: 21, portion: "1 burger", category: "Harveys" },
  { name: "Harveys Poutine", calories: 620, protein: 18, carbs: 72, fat: 30, portion: "1 regular", category: "Harveys" },
  { name: "Swiss Chalet Quarter Chicken", calories: 360, protein: 42, carbs: 1, fat: 20, portion: "1 quarter", category: "Swiss Chalet" },
  { name: "Swiss Chalet Fries", calories: 380, protein: 5, carbs: 55, fat: 16, portion: "1 regular", category: "Swiss Chalet" },
  { name: "A&W Teen Burger", calories: 500, protein: 26, carbs: 45, fat: 24, portion: "1 burger", category: "A&W" },
  { name: "A&W Mama Burger", calories: 390, protein: 19, carbs: 40, fat: 17, portion: "1 burger", category: "A&W" },
  { name: "Pizza Pizza slice cheese", calories: 290, protein: 12, carbs: 38, fat: 10, portion: "1 slice", category: "Pizza Pizza" },
  { name: "Pizza Pizza slice pepperoni", calories: 330, protein: 14, carbs: 38, fat: 14, portion: "1 slice", category: "Pizza Pizza" },
  { name: "Popeyes Chicken sandwich", calories: 700, protein: 35, carbs: 60, fat: 42, portion: "1 sandwich", category: "Popeyes" },
  { name: "Chicken biryani", calories: 520, protein: 28, carbs: 65, fat: 15, portion: "1 plate", category: "South Asian" },
  { name: "Dal tadka", calories: 180, protein: 10, carbs: 25, fat: 5, portion: "1 cup", category: "South Asian" },
  { name: "Butter chicken", calories: 380, protein: 28, carbs: 15, fat: 22, portion: "1 cup", category: "South Asian" },
  { name: "Chicken tikka masala", calories: 350, protein: 30, carbs: 12, fat: 20, portion: "1 cup", category: "South Asian" },
  { name: "Samosa", calories: 150, protein: 3, carbs: 18, fat: 8, portion: "1 piece", category: "South Asian" },
  { name: "Mango lassi", calories: 290, protein: 7, carbs: 48, fat: 8, portion: "1 glass", category: "South Asian" },
  { name: "Shawarma chicken wrap", calories: 550, protein: 35, carbs: 55, fat: 20, portion: "1 wrap", category: "Middle Eastern" },
  { name: "Falafel wrap", calories: 480, protein: 18, carbs: 60, fat: 18, portion: "1 wrap", category: "Middle Eastern" },
  { name: "Hummus", calories: 166, protein: 8, carbs: 18, fat: 8, portion: "100g", category: "Middle Eastern" },
  { name: "Kebab plate", calories: 580, protein: 40, carbs: 50, fat: 22, portion: "1 plate", category: "Middle Eastern" },
  { name: "Fried rice chicken", calories: 430, protein: 18, carbs: 58, fat: 14, portion: "1 cup", category: "Chinese" },
  { name: "Chow mein", calories: 380, protein: 16, carbs: 52, fat: 12, portion: "1 cup", category: "Chinese" },
  { name: "Sweet and sour chicken", calories: 400, protein: 22, carbs: 48, fat: 12, portion: "1 cup", category: "Chinese" },
  { name: "Thai chicken curry", calories: 380, protein: 28, carbs: 18, fat: 22, portion: "1 cup", category: "Thai" },
  { name: "Pad Thai chicken", calories: 450, protein: 25, carbs: 55, fat: 14, portion: "1 plate", category: "Thai" },
  { name: "Spaghetti bolognese", calories: 530, protein: 28, carbs: 65, fat: 16, portion: "1 plate", category: "Italian" },
  { name: "Caesar salad", calories: 180, protein: 8, carbs: 12, fat: 12, portion: "1 bowl", category: "Italian" },
  { name: "Burrito chicken", calories: 680, protein: 38, carbs: 75, fat: 22, portion: "1 burrito", category: "Mexican" },
  { name: "Taco chicken", calories: 280, protein: 18, carbs: 25, fat: 12, portion: "2 tacos", category: "Mexican" },
  { name: "Sushi roll salmon 6pc", calories: 300, protein: 16, carbs: 44, fat: 8, portion: "6 pieces", category: "Japanese" },
  { name: "Ramen bowl", calories: 550, protein: 28, carbs: 65, fat: 18, portion: "1 bowl", category: "Japanese" },
  { name: "Lays chips regular", calories: 160, protein: 2, carbs: 15, fat: 10, portion: "28g bag", category: "Snacks" },
  { name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, portion: "28g", category: "Snacks" },
  { name: "Protein bar", calories: 220, protein: 20, carbs: 25, fat: 7, portion: "1 bar", category: "Snacks" },
  { name: "Granola bar", calories: 190, protein: 4, carbs: 30, fat: 6, portion: "1 bar", category: "Snacks" },
  { name: "Chocolate bar", calories: 235, protein: 3, carbs: 30, fat: 13, portion: "1 bar", category: "Snacks" },
  { name: "Hospital cafeteria sandwich", calories: 380, protein: 18, carbs: 45, fat: 12, portion: "1 sandwich", category: "Hospital" },
  { name: "Instant noodles", calories: 380, protein: 8, carbs: 52, fat: 16, portion: "1 pack", category: "Hospital" },
  { name: "Vending machine chips", calories: 160, protein: 2, carbs: 17, fat: 10, portion: "1 bag", category: "Hospital" },
  { name: "Energy drink", calories: 110, protein: 0, carbs: 29, fat: 0, portion: "1 can", category: "Hospital" },
];

export default function DayView() {
  const { date, shift } = useLocalSearchParams();
  const router = useRouter();

  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);

  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [foodExpanded, setFoodExpanded] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<FoodDBItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodDBItem | null>(null);
  const [mealType, setMealType] = useState("Breakfast");
  const [portion, setPortion] = useState("");
  const [foodTab, setFoodTab] = useState<"search" | "custom">("search");
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customPortion, setCustomPortion] = useState("");
  const [customFoods, setCustomFoods] = useState<FoodDBItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedType, setSelectedType] = useState(WORKOUT_TYPES[0]);
  const [duration, setDuration] = useState("");
  const [wCalories, setWCalories] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [intensity, setIntensity] = useState("Moderate");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [customWorkoutType, setCustomWorkoutType] = useState("");

  const [items, setItems] = useState<AlarmReminder[]>([]);
  const [remindersExpanded, setRemindersExpanded] = useState(false);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"Reminder" | "Alarm">("Reminder");
  const [repeatUnit, setRepeatUnit] = useState("Once");
  const [repeatValue, setRepeatValue] = useState("");
  const [showRepeat, setShowRepeat] = useState(false);

  const repeatUnits = ["Once", "Minutes", "Hours", "Days", "Weeks", "Weekdays", "Shift Days"];

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const n = await AsyncStorage.getItem(`note_${date}`);
      if (n) setNote(n);
      const f = await AsyncStorage.getItem(`food_${date}`);
      if (f) setFoodEntries(JSON.parse(f));
      const w = await AsyncStorage.getItem(`workouts_${date}`);
      if (w) setWorkouts(JSON.parse(w));
      const i = await AsyncStorage.getItem(`items_${date}`);
      if (i) setItems(JSON.parse(i));
      const cf = await AsyncStorage.getItem("custom_foods");
      if (cf) setCustomFoods(JSON.parse(cf));
    } catch (e) { console.log(e); }
  }

  async function handleSaveNote() {
    await AsyncStorage.setItem(`note_${date}`, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  function handleFoodSearch(text: string) {
    setSearchText(text);
    setSelectedFood(null);
    if (text.length < 2) { setSearchResults([]); return; }
    const custom = customFoods.filter(f => f.name.toLowerCase().includes(text.toLowerCase()));
    const builtin = FOOD_DATABASE.filter(f =>
      f.name.toLowerCase().includes(text.toLowerCase()) ||
      f.category.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults([...custom, ...builtin].slice(0, 10));
  }

  function selectFood(food: FoodDBItem) {
    setSelectedFood(food);
    setPortion(food.portion);
    setSearchResults([]);
    setSearchText(food.name);
  }

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) { console.log(e); }
  }

  async function stopRecording() {
    setIsRecording(false);
    await recordingRef.current?.stopAndUnloadAsync();
  }

  async function saveCustomFood() {
    if (!customName || !customCalories) { Alert.alert("Please enter name and calories!"); return; }
    const newCustom: FoodDBItem = {
      name: customName,
      calories: parseInt(customCalories) || 0,
      protein: parseInt(customProtein) || 0,
      carbs: parseInt(customCarbs) || 0,
      fat: parseInt(customFat) || 0,
      portion: customPortion || "1 serving",
      category: "⭐ My Foods",
      custom: true,
    };
    const updatedCustom = [...customFoods, newCustom];
    setCustomFoods(updatedCustom);
    await AsyncStorage.setItem("custom_foods", JSON.stringify(updatedCustom));
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: newCustom.name,
      calories: newCustom.calories,
      protein: newCustom.protein,
      carbs: newCustom.carbs,
      fat: newCustom.fat,
      portion: newCustom.portion,
      mealType,
    };
    const updated = [...foodEntries, entry];
    setFoodEntries(updated);
    await AsyncStorage.setItem(`food_${date}`, JSON.stringify(updated));
    Alert.alert("✅ Saved to your personal database!");
    resetFoodModal();
  }

  async function addFoodEntry() {
    if (!selectedFood) return;
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: selectedFood.name,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
      portion: portion || selectedFood.portion,
      mealType,
    };
    const updated = [...foodEntries, entry];
    setFoodEntries(updated);
    await AsyncStorage.setItem(`food_${date}`, JSON.stringify(updated));
    resetFoodModal();
  }

  async function deleteFoodEntry(id: string) {
    const updated = foodEntries.filter(e => e.id !== id);
    setFoodEntries(updated);
    await AsyncStorage.setItem(`food_${date}`, JSON.stringify(updated));
  }

  function resetFoodModal() {
    setShowFoodModal(false);
    setSelectedFood(null);
    setSearchText(""); setSearchResults([]); setPortion("");
    setFoodTab("search");
    setCustomName(""); setCustomCalories(""); setCustomProtein("");
    setCustomCarbs(""); setCustomFat(""); setCustomPortion("");
  }

  async function saveWorkout() {
    if (!duration) { Alert.alert("Please enter duration!"); return; }
    const newWorkout: Workout = {
      id: Date.now().toString(),
      type: selectedType.name === "Custom" ? customWorkoutType || "Custom" : selectedType.name,
      emoji: selectedType.emoji,
      duration, calories: wCalories, heartRate, intensity,
      notes: workoutNotes,
    };
    const updated = [...workouts, newWorkout];
    setWorkouts(updated);
    await AsyncStorage.setItem(`workouts_${date}`, JSON.stringify(updated));
    setShowWorkoutModal(false);
    resetWorkoutForm();
  }

  async function deleteWorkout(id: string) {
    const updated = workouts.filter(w => w.id !== id);
    setWorkouts(updated);
    await AsyncStorage.setItem(`workouts_${date}`, JSON.stringify(updated));
  }

  function resetWorkoutForm() {
    setDuration(""); setWCalories(""); setHeartRate("");
    setWorkoutNotes(""); setCustomWorkoutType(""); setIntensity("Moderate");
    setSelectedType(WORKOUT_TYPES[0]);
  }

  async function handleAddItem() {
    if (!label) { Alert.alert("Please enter a label!"); return; }
    const parts = time.split(":");
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) { Alert.alert("Please enter valid time (e.g. 0630)"); return; }
    const triggerDate = new Date(date as string);
    triggerDate.setHours(hours, minutes, 0, 0);
    if (triggerDate < new Date()) { Alert.alert("That time has already passed!"); return; }

    let repeatInterval = undefined;
    if (repeatUnit === "Minutes" && repeatValue) repeatInterval = parseInt(repeatValue) * 60;
    else if (repeatUnit === "Hours" && repeatValue) repeatInterval = parseInt(repeatValue) * 60 * 60;
    else if (repeatUnit === "Days" && repeatValue) repeatInterval = parseInt(repeatValue) * 60 * 60 * 24;
    else if (repeatUnit === "Weeks" && repeatValue) repeatInterval = parseInt(repeatValue) * 60 * 60 * 24 * 7;
    else if (repeatUnit === "Weekdays") repeatInterval = 60 * 60 * 24;
    else if (repeatUnit === "Shift Days") repeatInterval = 60 * 60 * 24 * 9;

    await Notifications.scheduleNotificationAsync({
      content: { title: type === "Alarm" ? "⏰ ShiftScore Alarm" : "🔔 ShiftScore Reminder", body: label, sound: true },
      trigger: repeatInterval ? { seconds: repeatInterval, repeats: true } : triggerDate,
    });

    const newItem: AlarmReminder = { id: Date.now().toString(), type, label, time, repeatUnit, repeatValue };
    const updated = [...items, newItem];
    setItems(updated);
    await AsyncStorage.setItem(`items_${date}`, JSON.stringify(updated));
    setLabel(""); setTime(""); setRepeatValue(""); setRepeatUnit("Once"); setShowRepeat(false);
    Alert.alert(`✅ ${type} set for ${time}`);
  }

  async function handleDeleteItem(id: string) {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    await AsyncStorage.setItem(`items_${date}`, JSON.stringify(updated));
  }

  function getIntensityColor(i: string) {
    if (i === "Easy") return "#4CAF50";
    if (i === "Moderate") return "#4A90E2";
    if (i === "Hard") return "#FF9500";
    return "#FF3B30";
  }

  function getRepeatLabel(item: AlarmReminder) {
    if (item.repeatUnit === "Once") return "Once";
    if (item.repeatValue) return `Every ${item.repeatValue} ${item.repeatUnit}`;
    return `Every ${item.repeatUnit}`;
  }

  const totalFoodCal = foodEntries.reduce((sum, e) => sum + e.calories, 0);
  const totalFoodProtein = foodEntries.reduce((sum, e) => sum + e.protein, 0);
  const totalFoodCarbs = foodEntries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFoodFat = foodEntries.reduce((sum, e) => sum + e.fat, 0);
  const totalBurnedCal = workouts.reduce((sum, w) => sum + (parseInt(w.calories) || 0), 0);
  const totalWorkoutMin = workouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);
  const netCalories = totalFoodCal - totalBurnedCal;

  function getNetStatus() {
    if (totalFoodCal === 0 && totalBurnedCal === 0) return null;
    if (netCalories < -100) return { label: "Deficit 🟢", color: "#4CAF50" };
    if (netCalories > 100) return { label: "Surplus 🔴", color: "#FF3B30" };
    return { label: "Balanced 🟡", color: "#FF9500" };
  }

  function getMealEntries(meal: string) {
    return foodEntries.filter(e => e.mealType === meal);
  }

  const netStatus = getNetStatus();
  const notePreview = note.length > 60 ? note.substring(0, 60) + "..." : note;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/calendar")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerDate}>{date}</Text>
        <View style={styles.shiftBadge}>
          <Text style={styles.shiftBadgeText}>{shift as string}</Text>
        </View>
      </View>

      {/* NET CALORIE CARD */}
      {netStatus && (
        <View style={[styles.netCard, { borderLeftColor: netStatus.color }]}>
          <View style={styles.netRow}>
            <View style={styles.netItem}>
              <Text style={styles.netLabel}>Consumed</Text>
              <Text style={styles.netValue}>🍎 {totalFoodCal} cal</Text>
            </View>
            <View style={styles.netDivider} />
            <View style={styles.netItem}>
              <Text style={styles.netLabel}>Burned</Text>
              <Text style={styles.netValue}>🔥 {totalBurnedCal} cal</Text>
            </View>
            <View style={styles.netDivider} />
            <View style={styles.netItem}>
              <Text style={styles.netLabel}>Net</Text>
              <Text style={[styles.netValueBig, { color: netStatus.color }]}>
                {netCalories > 0 ? "+" : ""}{netCalories}
              </Text>
              <Text style={[styles.netStatus, { color: netStatus.color }]}>{netStatus.label}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 1. NOTES */}
      <TouchableOpacity style={styles.sectionCard} onPress={() => setNoteExpanded(!noteExpanded)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📝 Notes</Text>
          <Text style={styles.chevron}>{noteExpanded ? "▲" : "▼"}</Text>
        </View>
        {!noteExpanded && note.length > 0 && <Text style={styles.preview}>{notePreview}</Text>}
        {!noteExpanded && note.length === 0 && <Text style={styles.emptyHint}>Tap to add notes</Text>}
      </TouchableOpacity>

      {noteExpanded && (
        <View style={styles.expandedContent}>
          <TextInput
            style={styles.noteInput}
            placeholder="Write your notes for this day..."
            multiline
            value={note}
            onChangeText={setNote}
            placeholderTextColor="#444"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
            <Text style={styles.saveBtnText}>{noteSaved ? "✅ Saved!" : "Save Note"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. FOOD */}
      <TouchableOpacity style={styles.sectionCard} onPress={() => setFoodExpanded(!foodExpanded)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🍎 Food & Calories</Text>
          <Text style={styles.chevron}>{foodExpanded ? "▲" : "▼"}</Text>
        </View>
        <Text style={styles.sectionSummary}>
          {totalFoodCal > 0 ? `${totalFoodCal} cal consumed` : "Tap to log food"}
        </Text>
      </TouchableOpacity>

      {foodExpanded && (
        <View style={styles.expandedContent}>
          {foodEntries.length > 0 && (
            <>
              <View style={styles.macroRow}>
                {[
                  { emoji: "🔥", val: totalFoodCal, label: "Cal" },
                  { emoji: "🥩", val: `${totalFoodProtein}g`, label: "Protein" },
                  { emoji: "🍞", val: `${totalFoodCarbs}g`, label: "Carbs" },
                  { emoji: "🥑", val: `${totalFoodFat}g`, label: "Fat" },
                ].map((item, i) => (
                  <View key={i} style={styles.macroItem}>
                    <Text style={styles.macroEmoji}>{item.emoji}</Text>
                    <Text style={styles.macroValue}>{item.val}</Text>
                    <Text style={styles.macroLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((totalFoodCal / 2000) * 100, 100)}%` as any }]} />
              </View>
              <Text style={styles.progressLabel}>{totalFoodCal} / 2000 cal</Text>
            </>
          )}

          <TouchableOpacity style={styles.logBtn} onPress={() => setShowFoodModal(true)}>
            <Text style={styles.logBtnText}>+ Add Food</Text>
          </TouchableOpacity>

          {MEAL_TYPES.map(meal => (
            getMealEntries(meal).length > 0 && (
              <View key={meal} style={styles.mealSection}>
                <Text style={styles.mealTitle}>
                  {meal === "Breakfast" ? "🌅" : meal === "Lunch" ? "☀️" : meal === "Dinner" ? "🌙" : "🍿"} {meal}
                </Text>
                {getMealEntries(meal).map(entry => (
                  <View key={entry.id} style={styles.foodCard}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{entry.name}</Text>
                      <Text style={styles.foodPortion}>{entry.portion}</Text>
                    </View>
                    <View style={styles.foodRight}>
                      <Text style={styles.foodCal}>{entry.calories} cal</Text>
                      <TouchableOpacity onPress={() => deleteFoodEntry(entry.id)}>
                        <Text style={styles.deleteText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )
          ))}
        </View>
      )}

      {/* 3. ACTIVITY */}
      <TouchableOpacity style={styles.sectionCard} onPress={() => setActivityExpanded(!activityExpanded)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏋️ Activity</Text>
          <Text style={styles.chevron}>{activityExpanded ? "▲" : "▼"}</Text>
        </View>
        <Text style={styles.sectionSummary}>
          {totalBurnedCal > 0 ? `${totalBurnedCal} cal burned` : "Tap to log workout"}
        </Text>
      </TouchableOpacity>

      {activityExpanded && (
        <View style={styles.expandedContent}>
          {workouts.length > 0 && (
            <View style={styles.macroRow}>
              {[
                { emoji: "🔥", val: totalBurnedCal, label: "Burned" },
                { emoji: "⏱️", val: totalWorkoutMin, label: "Minutes" },
                { emoji: "💪", val: workouts.length, label: "Sessions" },
              ].map((item, i) => (
                <View key={i} style={styles.macroItem}>
                  <Text style={styles.macroEmoji}>{item.emoji}</Text>
                  <Text style={styles.macroValue}>{item.val}</Text>
                  <Text style={styles.macroLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.syncBtn}>
            <Text style={styles.syncBtnText}>⌚ Sync from Fitbit</Text>
            <Text style={styles.syncSubText}>Auto-fill workouts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logBtn} onPress={() => setShowWorkoutModal(true)}>
            <Text style={styles.logBtnText}>+ Log Workout</Text>
          </TouchableOpacity>

          {workouts.map(workout => (
            <View key={workout.id} style={styles.workoutCard}>
              <Text style={styles.workoutEmoji}>{workout.emoji}</Text>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutType}>{workout.type}</Text>
                <View style={styles.workoutStats}>
                  <Text style={styles.workoutStat}>⏱️ {workout.duration} min</Text>
                  {workout.calories ? <Text style={styles.workoutStat}>🔥 {workout.calories} cal</Text> : null}
                  {workout.heartRate ? <Text style={styles.workoutStat}>❤️ {workout.heartRate} bpm</Text> : null}
                </View>
                <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(workout.intensity) }]}>
                  <Text style={styles.intensityText}>{workout.intensity}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteWorkout(workout.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          {workouts.length === 0 && <Text style={styles.emptyHint}>No workouts logged yet</Text>}
        </View>
      )}

      {/* 4. REMINDERS & ALARMS */}
      <TouchableOpacity style={styles.sectionCard} onPress={() => setRemindersExpanded(!remindersExpanded)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔔 Reminders & Alarms</Text>
          <Text style={styles.chevron}>{remindersExpanded ? "▲" : "▼"}</Text>
        </View>
        <Text style={styles.sectionSummary}>
          {items.length > 0 ? `${items.length} set` : "Tap to add reminder or alarm"}
        </Text>
      </TouchableOpacity>

      {remindersExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, type === "Reminder" && styles.toggleActive]}
              onPress={() => setType("Reminder")}
            >
              <Text style={[styles.toggleText, type === "Reminder" && styles.toggleTextActive]}>🔔 Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, type === "Alarm" && styles.toggleActive]}
              onPress={() => setType("Alarm")}
            >
              <Text style={[styles.toggleText, type === "Alarm" && styles.toggleTextActive]}>⏰ Alarm</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={type === "Alarm" ? "Alarm label" : "Reminder message"}
            value={label}
            onChangeText={setLabel}
            placeholderTextColor="#444"
          />

          <TextInput
            style={styles.input}
            placeholder="Time e.g. 0630 → 06:30"
            value={time}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "").slice(0, 4);
              if (cleaned.length >= 3) setTime(cleaned.slice(0, 2) + ":" + cleaned.slice(2));
              else setTime(cleaned);
            }}
            placeholderTextColor="#444"
            keyboardType="numeric"
            maxLength={5}
          />

          <TouchableOpacity
            style={[styles.repeatToggleBtn, repeatUnit !== "Once" && styles.repeatToggleActive]}
            onPress={() => setShowRepeat(!showRepeat)}
          >
            <Text style={[styles.repeatToggleText, repeatUnit !== "Once" && styles.repeatToggleTextActive]}>
              🔄 {repeatUnit !== "Once" ? `Every ${repeatValue} ${repeatUnit}` : "Repeat: Off"}
            </Text>
          </TouchableOpacity>

          {showRepeat && (
            <View style={styles.repeatPanel}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {repeatUnits.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.repeatChip, repeatUnit === unit && styles.repeatChipActive]}
                    onPress={() => {
                      setRepeatUnit(unit);
                      if (unit === "Once") { setShowRepeat(false); setRepeatValue(""); }
                    }}
                  >
                    <Text style={[styles.repeatChipText, repeatUnit === unit && styles.repeatChipTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {["Minutes", "Hours", "Days", "Weeks"].includes(repeatUnit) && (
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  placeholder={`Every how many ${repeatUnit.toLowerCase()}?`}
                  value={repeatValue}
                  onChangeText={setRepeatValue}
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                />
              )}
            </View>
          )}

          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
            <Text style={styles.addBtnText}>{type === "Alarm" ? "Set Alarm ⏰" : "Set Reminder 🔔"}</Text>
          </TouchableOpacity>

          {items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemType}>{item.type === "Alarm" ? "⏰" : "🔔"} {item.type}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemRepeat}>🔄 {getRepeatLabel(item)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* FOOD MODAL */}
      <Modal visible={showFoodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Food 🍎</Text>

              <Text style={styles.modalLabel}>Meal Type</Text>
              <View style={styles.mealTypeRow}>
                {MEAL_TYPES.map(meal => (
                  <TouchableOpacity
                    key={meal}
                    style={[styles.mealChip, mealType === meal && styles.mealChipActive]}
                    onPress={() => setMealType(meal)}
                  >
                    <Text style={[styles.mealChipText, mealType === meal && styles.mealChipTextActive]}>{meal}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeBtn, foodTab === "search" && styles.modeBtnActive]}
                  onPress={() => setFoodTab("search")}
                >
                  <Text style={[styles.modeBtnText, foodTab === "search" && styles.modeBtnTextActive]}>🔍 Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, foodTab === "custom" && styles.modeBtnActive]}
                  onPress={() => setFoodTab("custom")}
                >
                  <Text style={[styles.modeBtnText, foodTab === "custom" && styles.modeBtnTextActive]}>⭐ Custom</Text>
                </TouchableOpacity>
              </View>

              {foodTab === "search" ? (
                <>
                  <TouchableOpacity
                    style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Text style={styles.voiceBtnText}>{isRecording ? "⏹️ Stop" : "🎤 Speak food name"}</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.modalInput}
                    placeholder="Search food..."
                    value={searchText}
                    onChangeText={handleFoodSearch}
                    placeholderTextColor="#444"
                  />

                  {searchResults.map(food => (
                    <TouchableOpacity
                      key={food.name}
                      style={[styles.resultItem, selectedFood?.name === food.name && styles.resultItemActive]}
                      onPress={() => selectFood(food)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{food.custom ? "⭐ " : ""}{food.name}</Text>
                        <Text style={styles.resultPortion}>{food.portion} · {food.category}</Text>
                      </View>
                      <Text style={styles.resultCalories}>{food.calories} cal</Text>
                    </TouchableOpacity>
                  ))}

                  {searchText.length >= 2 && searchResults.length === 0 && (
                    <TouchableOpacity style={styles.notFoundBtn} onPress={() => setFoodTab("custom")}>
                      <Text style={styles.notFoundText}>Not found — add as custom ⭐</Text>
                    </TouchableOpacity>
                  )}

                  {selectedFood && (
                    <View style={styles.selectedCard}>
                      <Text style={styles.selectedTitle}>✅ {selectedFood.name}</Text>
                      <View style={styles.macroRow}>
                        <Text style={styles.macro}>🔥 {selectedFood.calories}</Text>
                        <Text style={styles.macro}>🥩 {selectedFood.protein}g</Text>
                        <Text style={styles.macro}>🍞 {selectedFood.carbs}g</Text>
                        <Text style={styles.macro}>🥑 {selectedFood.fat}g</Text>
                      </View>
                      <TextInput
                        style={[styles.modalInput, { marginTop: 10 }]}
                        placeholder="Portion size"
                        value={portion}
                        onChangeText={setPortion}
                        placeholderTextColor="#444"
                      />
                      <TouchableOpacity style={styles.confirmBtn} onPress={addFoodEntry}>
                        <Text style={styles.confirmBtnText}>Add to Log ✅</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.customNote}>⭐ Saved to your personal database!</Text>
                  <TextInput style={styles.modalInput} placeholder="Food name *" value={customName} onChangeText={setCustomName} placeholderTextColor="#444" />
                  <TextInput style={styles.modalInput} placeholder="Calories *" value={customCalories} onChangeText={setCustomCalories} keyboardType="numeric" placeholderTextColor="#444" />
                  <TextInput style={styles.modalInput} placeholder="Protein (g)" value={customProtein} onChangeText={setCustomProtein} keyboardType="numeric" placeholderTextColor="#444" />
                  <TextInput style={styles.modalInput} placeholder="Carbs (g)" value={customCarbs} onChangeText={setCustomCarbs} keyboardType="numeric" placeholderTextColor="#444" />
                  <TextInput style={styles.modalInput} placeholder="Fat (g)" value={customFat} onChangeText={setCustomFat} keyboardType="numeric" placeholderTextColor="#444" />
                  <TextInput style={styles.modalInput} placeholder="Portion size" value={customPortion} onChangeText={setCustomPortion} placeholderTextColor="#444" />
                  <TouchableOpacity style={styles.confirmBtn} onPress={saveCustomFood}>
                    <Text style={styles.confirmBtnText}>Save & Add ⭐</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.cancelBtn} onPress={resetFoodModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WORKOUT MODAL */}
      <Modal visible={showWorkoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Log Workout 🏋️</Text>

              <Text style={styles.modalLabel}>Workout Type</Text>
              <View style={styles.typeGrid}>
                {WORKOUT_TYPES.map(wtype => (
                  <TouchableOpacity
                    key={wtype.name}
                    style={[styles.typeChip, selectedType.name === wtype.name && styles.typeChipActive]}
                    onPress={() => setSelectedType(wtype)}
                  >
                    <Text style={styles.typeEmoji}>{wtype.emoji}</Text>
                    <Text style={[styles.typeName, selectedType.name === wtype.name && styles.typeNameActive]}>{wtype.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedType.name === "Custom" && (
                <TextInput style={styles.modalInput} placeholder="Workout name" value={customWorkoutType} onChangeText={setCustomWorkoutType} placeholderTextColor="#444" />
              )}

              <Text style={styles.modalLabel}>Duration (minutes) *</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 45" value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor="#444" />

              <Text style={styles.modalLabel}>Calories Burned</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 320" value={wCalories} onChangeText={setWCalories} keyboardType="numeric" placeholderTextColor="#444" />

              <Text style={styles.modalLabel}>Avg Heart Rate (bpm)</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. 145" value={heartRate} onChangeText={setHeartRate} keyboardType="numeric" placeholderTextColor="#444" />

              <Text style={styles.modalLabel}>Intensity</Text>
              <View style={styles.intensityRow}>
                {INTENSITIES.map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.intensityChip, intensity === level && { backgroundColor: getIntensityColor(level) }]}
                    onPress={() => setIntensity(level)}
                  >
                    <Text style={[styles.intensityChipText, intensity === level && { color: "#fff" }]}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Notes</Text>
              <TextInput style={[styles.modalInput, { minHeight: 80, textAlignVertical: "top" }]} placeholder="How did it feel?" value={workoutNotes} onChangeText={setWorkoutNotes} multiline placeholderTextColor="#444" />

              <TouchableOpacity style={styles.confirmBtn} onPress={saveWorkout}>
                <Text style={styles.confirmBtnText}>Save Workout 💪</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowWorkoutModal(false); resetWorkoutForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
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
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerDate: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  shiftBadge: { backgroundColor: "#2a2a2a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "#333" },
  shiftBadgeText: { color: "#888", fontSize: 13, fontWeight: "bold" },
  netCard: { backgroundColor: "#1a1a1a", margin: 16, marginTop: 0, borderRadius: 16, padding: 16, borderLeftWidth: 3, borderWidth: 1, borderColor: "#2a2a2a" },
  netRow: { flexDirection: "row", alignItems: "center" },
  netItem: { flex: 1, alignItems: "center" },
  netDivider: { width: 1, height: 40, backgroundColor: "#2a2a2a" },
  netLabel: { fontSize: 11, color: "#666", marginBottom: 4 },
  netValue: { fontSize: 13, color: "#888", fontWeight: "bold" },
  netValueBig: { fontSize: 20, fontWeight: "bold" },
  netStatus: { fontSize: 11, marginTop: 2 },
  sectionCard: { backgroundColor: "#1a1a1a", margin: 16, marginTop: 0, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#2a2a2a" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#fff" },
  chevron: { fontSize: 12, color: "#555" },
  sectionSummary: { fontSize: 13, color: "#666", marginTop: 6 },
  preview: { fontSize: 13, color: "#555", marginTop: 6, fontStyle: "italic" },
  emptyHint: { fontSize: 13, color: "#333", marginTop: 6 },
  expandedContent: { backgroundColor: "#1a1a1a", marginHorizontal: 16, marginTop: -8, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 18, paddingTop: 12, borderWidth: 1, borderTopWidth: 0, borderColor: "#2a2a2a", marginBottom: 4 },
  noteInput: { borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 12, fontSize: 15, color: "#fff", minHeight: 120, textAlignVertical: "top", backgroundColor: "#222" },
  saveBtn: { backgroundColor: "#4A90E2", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 12 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  macroRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  macroItem: { alignItems: "center" },
  macroEmoji: { fontSize: 20, marginBottom: 2 },
  macroValue: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  macroLabel: { fontSize: 11, color: "#666" },
  progressBar: { height: 4, backgroundColor: "#222", borderRadius: 2, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 2 },
  progressLabel: { fontSize: 11, color: "#666", textAlign: "center", marginBottom: 12 },
  logBtn: { backgroundColor: "#4A90E2", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 12 },
  logBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  mealSection: { marginBottom: 10 },
  mealTitle: { fontSize: 13, fontWeight: "bold", color: "#666", marginBottom: 6 },
  foodCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 10, marginBottom: 6, backgroundColor: "#222" },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  foodPortion: { fontSize: 12, color: "#666" },
  foodRight: { alignItems: "flex-end" },
  foodCal: { fontSize: 14, fontWeight: "bold", color: "#4CAF50" },
  deleteText: { fontSize: 16, marginTop: 4 },
  syncBtn: { backgroundColor: "#111", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#4A90E2" },
  syncBtnText: { fontSize: 13, fontWeight: "bold", color: "#4A90E2" },
  syncSubText: { fontSize: 11, color: "#666", marginTop: 2 },
  workoutCard: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: "#222" },
  workoutEmoji: { fontSize: 28, marginRight: 12 },
  workoutInfo: { flex: 1 },
  workoutType: { fontSize: 15, fontWeight: "bold", color: "#fff" },
  workoutStats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  workoutStat: { fontSize: 12, color: "#666" },
  intensityBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  intensityText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  toggleRow: { flexDirection: "row", marginBottom: 12, gap: 10 },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#222" },
  toggleActive: { backgroundColor: "#7B68EE", borderColor: "#7B68EE" },
  toggleText: { fontSize: 14, color: "#666", fontWeight: "bold" },
  toggleTextActive: { color: "#fff" },
  input: { borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 12, fontSize: 15, color: "#fff", marginBottom: 10, backgroundColor: "#222" },
  repeatToggleBtn: { backgroundColor: "#222", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: "#2a2a2a" },
  repeatToggleActive: { backgroundColor: "#1a1a3a", borderColor: "#7B68EE" },
  repeatToggleText: { fontSize: 14, color: "#666", fontWeight: "bold" },
  repeatToggleTextActive: { color: "#7B68EE" },
  repeatPanel: { backgroundColor: "#111", borderRadius: 10, padding: 12, marginBottom: 10 },
  repeatChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#2a2a2a", marginRight: 8, backgroundColor: "#222" },
  repeatChipActive: { backgroundColor: "#7B68EE", borderColor: "#7B68EE" },
  repeatChipText: { fontSize: 13, color: "#666", fontWeight: "bold" },
  repeatChipTextActive: { color: "#fff" },
  addBtn: { backgroundColor: "#7B68EE", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 4 },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  itemCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 12, marginBottom: 8, marginTop: 8, backgroundColor: "#222" },
  itemInfo: { flex: 1 },
  itemType: { fontSize: 12, color: "#7B68EE", fontWeight: "bold" },
  itemTime: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  itemLabel: { fontSize: 13, color: "#888" },
  itemRepeat: { fontSize: 12, color: "#555", marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%", borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 20, textAlign: "center" },
  modalLabel: { fontSize: 14, fontWeight: "bold", color: "#888", marginBottom: 8, marginTop: 4 },
  modalInput: { borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 12, fontSize: 15, color: "#fff", marginBottom: 10, backgroundColor: "#222" },
  mealTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  mealChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#222" },
  mealChipActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  mealChipText: { fontSize: 13, color: "#666", fontWeight: "bold" },
  mealChipTextActive: { color: "#fff" },
  modeToggle: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#222" },
  modeBtnActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  modeBtnText: { fontSize: 14, color: "#666", fontWeight: "bold" },
  modeBtnTextActive: { color: "#fff" },
  voiceBtn: { backgroundColor: "#222", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#2a2a2a" },
  voiceBtnActive: { backgroundColor: "#FF3B30" },
  voiceBtnText: { fontSize: 16, fontWeight: "bold", color: "#888" },
  resultItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: "#222" },
  resultItemActive: { backgroundColor: "#1a2a3a", borderColor: "#4A90E2" },
  resultName: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  resultPortion: { fontSize: 12, color: "#666" },
  resultCalories: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  notFoundBtn: { padding: 12, alignItems: "center" },
  notFoundText: { fontSize: 14, color: "#4A90E2", fontWeight: "bold" },
  selectedCard: { backgroundColor: "#1a2a1a", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2a3a2a" },
  selectedTitle: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  macro: { fontSize: 13, color: "#888", fontWeight: "bold" },
  customNote: { fontSize: 13, color: "#7B68EE", backgroundColor: "#1a1a2a", borderRadius: 10, padding: 12, marginBottom: 12, textAlign: "center" },
  confirmBtn: { backgroundColor: "#4CAF50", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#555", fontSize: 16 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  typeChip: { alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 12, padding: 12, width: "28%", backgroundColor: "#222" },
  typeChipActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeName: { fontSize: 11, color: "#666", fontWeight: "bold" },
  typeNameActive: { color: "#fff" },
  intensityRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  intensityChip: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center", backgroundColor: "#222" },
  intensityChipText: { fontSize: 12, color: "#666", fontWeight: "bold" },
});