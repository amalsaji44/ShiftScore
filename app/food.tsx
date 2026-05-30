import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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
};

const FOOD_DATABASE: FoodDBItem[] = [
  // =================== FRUITS ===================
  { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Orange", calories: 62, protein: 1, carbs: 15, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Grapes", calories: 104, protein: 1, carbs: 27, fat: 0, portion: "1 cup", category: "Fruits" },
  { name: "Strawberries", calories: 49, protein: 1, carbs: 12, fat: 0, portion: "1 cup", category: "Fruits" },
  { name: "Blueberries", calories: 84, protein: 1, carbs: 21, fat: 0, portion: "1 cup", category: "Fruits" },
  { name: "Mango", calories: 201, protein: 3, carbs: 50, fat: 1, portion: "1 whole", category: "Fruits" },
  { name: "Pineapple", calories: 82, protein: 1, carbs: 22, fat: 0, portion: "1 cup", category: "Fruits" },
  { name: "Watermelon", calories: 86, protein: 2, carbs: 22, fat: 0, portion: "2 cups", category: "Fruits" },
  { name: "Peach", calories: 59, protein: 1, carbs: 14, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Pear", calories: 101, protein: 1, carbs: 27, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Kiwi", calories: 42, protein: 1, carbs: 10, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Pomegranate", calories: 144, protein: 3, carbs: 33, fat: 2, portion: "1 cup seeds", category: "Fruits" },
  { name: "Cherries", calories: 87, protein: 1, carbs: 22, fat: 0, portion: "1 cup", category: "Fruits" },
  { name: "Lemon", calories: 17, protein: 1, carbs: 5, fat: 0, portion: "1 medium", category: "Fruits" },
  { name: "Avocado", calories: 234, protein: 3, carbs: 12, fat: 21, portion: "1 whole", category: "Fruits" },
  { name: "Coconut", calories: 283, protein: 3, carbs: 12, fat: 27, portion: "1 cup shredded", category: "Fruits" },
  { name: "Dates", calories: 277, protein: 2, carbs: 75, fat: 0, portion: "100g", category: "Fruits" },
  { name: "Figs", calories: 74, protein: 1, carbs: 19, fat: 0, portion: "2 medium", category: "Fruits" },
  { name: "Papaya", calories: 55, protein: 1, carbs: 14, fat: 0, portion: "1 cup", category: "Fruits" },

  // =================== VEGETABLES ===================
  { name: "Broccoli", calories: 55, protein: 4, carbs: 11, fat: 1, portion: "1 cup", category: "Vegetables" },
  { name: "Spinach", calories: 7, protein: 1, carbs: 1, fat: 0, portion: "1 cup raw", category: "Vegetables" },
  { name: "Carrots", calories: 52, protein: 1, carbs: 12, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Tomato", calories: 22, protein: 1, carbs: 5, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Cucumber", calories: 16, protein: 1, carbs: 4, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Bell pepper", calories: 31, protein: 1, carbs: 7, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Onion", calories: 44, protein: 1, carbs: 10, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Garlic", calories: 13, protein: 1, carbs: 3, fat: 0, portion: "3 cloves", category: "Vegetables" },
  { name: "Potato", calories: 161, protein: 4, carbs: 37, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Sweet potato", calories: 103, protein: 2, carbs: 24, fat: 0, portion: "1 medium", category: "Vegetables" },
  { name: "Corn", calories: 132, protein: 5, carbs: 29, fat: 2, portion: "1 ear", category: "Vegetables" },
  { name: "Peas", calories: 118, protein: 8, carbs: 21, fat: 1, portion: "1 cup", category: "Vegetables" },
  { name: "Mushrooms", calories: 15, protein: 2, carbs: 2, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Cauliflower", calories: 25, protein: 2, carbs: 5, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Cabbage", calories: 22, protein: 1, carbs: 5, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Lettuce", calories: 5, protein: 0, carbs: 1, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Celery", calories: 16, protein: 1, carbs: 3, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Zucchini", calories: 20, protein: 1, carbs: 4, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Eggplant", calories: 35, protein: 1, carbs: 8, fat: 0, portion: "1 cup", category: "Vegetables" },
  { name: "Kale", calories: 33, protein: 3, carbs: 6, fat: 1, portion: "1 cup", category: "Vegetables" },

  // =================== PROTEINS ===================
  { name: "Chicken breast grilled", calories: 165, protein: 31, carbs: 0, fat: 4, portion: "100g", category: "Proteins" },
  { name: "Chicken thigh grilled", calories: 209, protein: 26, carbs: 0, fat: 11, portion: "100g", category: "Proteins" },
  { name: "Chicken wings", calories: 290, protein: 27, carbs: 0, fat: 19, portion: "100g", category: "Proteins" },
  { name: "Salmon grilled", calories: 208, protein: 28, carbs: 0, fat: 10, portion: "100g", category: "Proteins" },
  { name: "Tuna canned", calories: 132, protein: 29, carbs: 0, fat: 1, portion: "100g", category: "Proteins" },
  { name: "Shrimp cooked", calories: 99, protein: 24, carbs: 0, fat: 1, portion: "100g", category: "Proteins" },
  { name: "Beef ground cooked", calories: 250, protein: 26, carbs: 0, fat: 16, portion: "100g", category: "Proteins" },
  { name: "Steak grilled", calories: 271, protein: 26, carbs: 0, fat: 18, portion: "100g", category: "Proteins" },
  { name: "Pork chop grilled", calories: 231, protein: 28, carbs: 0, fat: 13, portion: "100g", category: "Proteins" },
  { name: "Turkey breast", calories: 135, protein: 30, carbs: 0, fat: 1, portion: "100g", category: "Proteins" },
  { name: "Eggs 2 scrambled", calories: 180, protein: 12, carbs: 2, fat: 14, portion: "2 eggs", category: "Proteins" },
  { name: "Eggs boiled", calories: 155, protein: 13, carbs: 1, fat: 11, portion: "2 eggs", category: "Proteins" },
  { name: "Egg white", calories: 52, protein: 11, carbs: 1, fat: 0, portion: "3 whites", category: "Proteins" },
  { name: "Tofu firm", calories: 144, protein: 17, carbs: 3, fat: 9, portion: "100g", category: "Proteins" },
  { name: "Lentils cooked", calories: 230, protein: 18, carbs: 40, fat: 1, portion: "1 cup", category: "Proteins" },
  { name: "Chickpeas cooked", calories: 269, protein: 15, carbs: 45, fat: 4, portion: "1 cup", category: "Proteins" },
  { name: "Black beans", calories: 227, protein: 15, carbs: 41, fat: 1, portion: "1 cup", category: "Proteins" },
  { name: "Protein shake whey", calories: 200, protein: 30, carbs: 10, fat: 5, portion: "1 scoop", category: "Proteins" },

  // =================== GRAINS & CARBS ===================
  { name: "White rice cooked", calories: 206, protein: 4, carbs: 45, fat: 0, portion: "1 cup", category: "Grains" },
  { name: "Brown rice cooked", calories: 216, protein: 5, carbs: 45, fat: 2, portion: "1 cup", category: "Grains" },
  { name: "Pasta cooked", calories: 220, protein: 8, carbs: 43, fat: 1, portion: "1 cup", category: "Grains" },
  { name: "White bread", calories: 79, protein: 3, carbs: 15, fat: 1, portion: "1 slice", category: "Grains" },
  { name: "Whole wheat bread", calories: 69, protein: 4, carbs: 12, fat: 1, portion: "1 slice", category: "Grains" },
  { name: "Bagel plain", calories: 270, protein: 11, carbs: 53, fat: 2, portion: "1 bagel", category: "Grains" },
  { name: "Oatmeal cooked", calories: 150, protein: 5, carbs: 27, fat: 3, portion: "1 cup", category: "Grains" },
  { name: "Quinoa cooked", calories: 222, protein: 8, carbs: 39, fat: 4, portion: "1 cup", category: "Grains" },
  { name: "Tortilla flour", calories: 146, protein: 4, carbs: 25, fat: 4, portion: "1 medium", category: "Grains" },
  { name: "Pita bread", calories: 165, protein: 5, carbs: 33, fat: 1, portion: "1 pita", category: "Grains" },
  { name: "Naan bread", calories: 262, protein: 9, carbs: 45, fat: 5, portion: "1 piece", category: "Grains" },
  { name: "Roti whole wheat", calories: 120, protein: 3, carbs: 18, fat: 4, portion: "1 roti", category: "Grains" },
  { name: "Croissant", calories: 272, protein: 5, carbs: 30, fat: 15, portion: "1 medium", category: "Grains" },
  { name: "English muffin", calories: 134, protein: 4, carbs: 26, fat: 1, portion: "1 muffin", category: "Grains" },
  { name: "Granola", calories: 597, protein: 18, carbs: 65, fat: 29, portion: "1 cup", category: "Grains" },

  // =================== DAIRY ===================
  { name: "Whole milk", calories: 149, protein: 8, carbs: 12, fat: 8, portion: "1 cup", category: "Dairy" },
  { name: "Skim milk", calories: 83, protein: 8, carbs: 12, fat: 0, portion: "1 cup", category: "Dairy" },
  { name: "Greek yogurt plain", calories: 130, protein: 17, carbs: 9, fat: 0, portion: "1 cup", category: "Dairy" },
  { name: "Cheddar cheese", calories: 113, protein: 7, carbs: 0, fat: 9, portion: "30g", category: "Dairy" },
  { name: "Mozzarella cheese", calories: 85, protein: 6, carbs: 1, fat: 6, portion: "30g", category: "Dairy" },
  { name: "Cottage cheese", calories: 206, protein: 28, carbs: 8, fat: 9, portion: "1 cup", category: "Dairy" },
  { name: "Butter", calories: 102, protein: 0, carbs: 0, fat: 12, portion: "1 tbsp", category: "Dairy" },
  { name: "Cream cheese", calories: 99, protein: 2, carbs: 2, fat: 10, portion: "2 tbsp", category: "Dairy" },
  { name: "Almond milk", calories: 39, protein: 1, carbs: 3, fat: 3, portion: "1 cup", category: "Dairy" },
  { name: "Oat milk", calories: 120, protein: 3, carbs: 16, fat: 5, portion: "1 cup", category: "Dairy" },

  // =================== DRINKS ===================
  { name: "Water", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "1 glass", category: "Drinks" },
  { name: "Coffee black", calories: 5, protein: 0, carbs: 0, fat: 0, portion: "1 cup", category: "Drinks" },
  { name: "Coffee with milk sugar", calories: 80, protein: 1, carbs: 14, fat: 2, portion: "1 cup", category: "Drinks" },
  { name: "Green tea", calories: 2, protein: 0, carbs: 0, fat: 0, portion: "1 cup", category: "Drinks" },
  { name: "Orange juice", calories: 112, protein: 2, carbs: 26, fat: 0, portion: "1 cup", category: "Drinks" },
  { name: "Apple juice", calories: 114, protein: 0, carbs: 28, fat: 0, portion: "1 cup", category: "Drinks" },
  { name: "Coca Cola", calories: 140, protein: 0, carbs: 39, fat: 0, portion: "355ml can", category: "Drinks" },
  { name: "Diet Coke", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "355ml can", category: "Drinks" },
  { name: "Energy drink Red Bull", calories: 110, protein: 1, carbs: 28, fat: 0, portion: "250ml can", category: "Drinks" },
  { name: "Monster energy drink", calories: 210, protein: 0, carbs: 54, fat: 0, portion: "473ml can", category: "Drinks" },
  { name: "Gatorade", calories: 140, protein: 0, carbs: 36, fat: 0, portion: "591ml bottle", category: "Drinks" },
  { name: "Protein shake mixed", calories: 200, protein: 30, carbs: 10, fat: 5, portion: "1 shake", category: "Drinks" },
  { name: "Smoothie fruit", calories: 250, protein: 3, carbs: 55, fat: 1, portion: "1 cup", category: "Drinks" },
  { name: "Beer regular", calories: 154, protein: 1, carbs: 13, fat: 0, portion: "355ml can", category: "Drinks" },
  { name: "Wine red", calories: 125, protein: 0, carbs: 4, fat: 0, portion: "150ml glass", category: "Drinks" },

  // =================== TIM HORTONS ===================
  { name: "Tim Hortons Double Double", calories: 170, protein: 4, carbs: 28, fat: 5, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Black Coffee", calories: 5, protein: 0, carbs: 1, fat: 0, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Bagel plain", calories: 280, protein: 10, carbs: 55, fat: 2, portion: "1 bagel", category: "Tim Hortons" },
  { name: "Tim Hortons Bagel with cream cheese", calories: 430, protein: 14, carbs: 58, fat: 16, portion: "1 bagel", category: "Tim Hortons" },
  { name: "Tim Hortons Muffin blueberry", calories: 390, protein: 5, carbs: 64, fat: 14, portion: "1 muffin", category: "Tim Hortons" },
  { name: "Tim Hortons Timbits glazed", calories: 60, protein: 1, carbs: 9, fat: 2, portion: "1 piece", category: "Tim Hortons" },
  { name: "Tim Hortons Donut", calories: 260, protein: 3, carbs: 36, fat: 12, portion: "1 donut", category: "Tim Hortons" },
  { name: "Tim Hortons Chicken wrap", calories: 510, protein: 30, carbs: 55, fat: 19, portion: "1 wrap", category: "Tim Hortons" },
  { name: "Tim Hortons BELT sandwich", calories: 470, protein: 22, carbs: 44, fat: 22, portion: "1 sandwich", category: "Tim Hortons" },
  { name: "Tim Hortons Chili", calories: 300, protein: 22, carbs: 40, fat: 6, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Soup", calories: 140, protein: 8, carbs: 22, fat: 3, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Iced Capp", calories: 460, protein: 6, carbs: 63, fat: 22, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons French Vanilla", calories: 240, protein: 4, carbs: 42, fat: 7, portion: "1 medium", category: "Tim Hortons" },
  { name: "Tim Hortons Hash brown", calories: 120, protein: 1, carbs: 14, fat: 7, portion: "1 piece", category: "Tim Hortons" },

  // =================== MCDONALDS ===================
  { name: "McDonalds Big Mac", calories: 550, protein: 25, carbs: 46, fat: 30, portion: "1 burger", category: "McDonalds" },
  { name: "McDonalds Quarter Pounder", calories: 520, protein: 30, carbs: 42, fat: 26, portion: "1 burger", category: "McDonalds" },
  { name: "McDonalds McChicken", calories: 400, protein: 20, carbs: 42, fat: 17, portion: "1 burger", category: "McDonalds" },
  { name: "McDonalds Filet-O-Fish", calories: 380, protein: 15, carbs: 39, fat: 18, portion: "1 burger", category: "McDonalds" },
  { name: "McDonalds French Fries medium", calories: 320, protein: 4, carbs: 44, fat: 15, portion: "1 medium", category: "McDonalds" },
  { name: "McDonalds French Fries large", calories: 490, protein: 7, carbs: 66, fat: 23, portion: "1 large", category: "McDonalds" },
  { name: "McDonalds McNuggets 6pc", calories: 280, protein: 14, carbs: 18, fat: 17, portion: "6 pieces", category: "McDonalds" },
  { name: "McDonalds McNuggets 10pc", calories: 470, protein: 24, carbs: 30, fat: 28, portion: "10 pieces", category: "McDonalds" },
  { name: "McDonalds Egg McMuffin", calories: 300, protein: 18, carbs: 30, fat: 12, portion: "1 sandwich", category: "McDonalds" },
  { name: "McDonalds Big Breakfast", calories: 760, protein: 28, carbs: 67, fat: 44, portion: "1 meal", category: "McDonalds" },
  { name: "McDonalds McFlurry Oreo", calories: 510, protein: 13, carbs: 80, fat: 17, portion: "1 regular", category: "McDonalds" },
  { name: "McDonalds Vanilla Shake medium", calories: 520, protein: 13, carbs: 84, fat: 15, portion: "1 medium", category: "McDonalds" },

  // =================== SUBWAY ===================
  { name: "Subway 6 inch Turkey", calories: 280, protein: 18, carbs: 46, fat: 4, portion: "6 inch", category: "Subway" },
  { name: "Subway 6 inch Chicken", calories: 310, protein: 23, carbs: 47, fat: 5, portion: "6 inch", category: "Subway" },
  { name: "Subway 6 inch Tuna", calories: 480, protein: 22, carbs: 45, fat: 24, portion: "6 inch", category: "Subway" },
  { name: "Subway 6 inch Veggie", calories: 230, protein: 9, carbs: 44, fat: 3, portion: "6 inch", category: "Subway" },
  { name: "Subway Footlong Turkey", calories: 560, protein: 36, carbs: 92, fat: 8, portion: "12 inch", category: "Subway" },
  { name: "Subway Footlong Chicken", calories: 620, protein: 46, carbs: 94, fat: 10, portion: "12 inch", category: "Subway" },
  { name: "Subway Cookies", calories: 220, protein: 2, carbs: 30, fat: 10, portion: "1 cookie", category: "Subway" },

  // =================== KFC ===================
  { name: "KFC Original chicken piece", calories: 320, protein: 28, carbs: 10, fat: 19, portion: "1 piece", category: "KFC" },
  { name: "KFC Crispy chicken piece", calories: 370, protein: 27, carbs: 17, fat: 22, portion: "1 piece", category: "KFC" },
  { name: "KFC Chicken sandwich", calories: 490, protein: 28, carbs: 51, fat: 20, portion: "1 sandwich", category: "KFC" },
  { name: "KFC Coleslaw", calories: 180, protein: 1, carbs: 22, fat: 10, portion: "1 small", category: "KFC" },
  { name: "KFC Mashed potato gravy", calories: 130, protein: 3, carbs: 20, fat: 4, portion: "1 small", category: "KFC" },
  { name: "KFC Poutine", calories: 500, protein: 12, carbs: 60, fat: 25, portion: "1 small", category: "KFC" },
  { name: "KFC Popcorn chicken", calories: 400, protein: 22, carbs: 26, fat: 23, portion: "1 medium", category: "KFC" },

  // =================== BURGER KING ===================
  { name: "Burger King Whopper", calories: 660, protein: 28, carbs: 49, fat: 40, portion: "1 burger", category: "Burger King" },
  { name: "Burger King Chicken Sandwich", calories: 660, protein: 36, carbs: 52, fat: 34, portion: "1 sandwich", category: "Burger King" },
  { name: "Burger King Fries medium", calories: 380, protein: 4, carbs: 54, fat: 17, portion: "1 medium", category: "Burger King" },
  { name: "Burger King Onion Rings", calories: 410, protein: 5, carbs: 50, fat: 22, portion: "1 medium", category: "Burger King" },

  // =================== HARVEYS ===================
  { name: "Harveys Original Burger", calories: 470, protein: 25, carbs: 44, fat: 21, portion: "1 burger", category: "Harveys" },
  { name: "Harveys Chicken Burger", calories: 490, protein: 28, carbs: 50, fat: 19, portion: "1 burger", category: "Harveys" },
  { name: "Harveys Veggie Burger", calories: 420, protein: 14, carbs: 60, fat: 15, portion: "1 burger", category: "Harveys" },
  { name: "Harveys Poutine", calories: 620, protein: 18, carbs: 72, fat: 30, portion: "1 regular", category: "Harveys" },
  { name: "Harveys Onion Rings", calories: 370, protein: 5, carbs: 48, fat: 18, portion: "1 regular", category: "Harveys" },

  // =================== SWISS CHALET ===================
  { name: "Swiss Chalet Quarter Chicken", calories: 360, protein: 42, carbs: 1, fat: 20, portion: "1 quarter", category: "Swiss Chalet" },
  { name: "Swiss Chalet Half Chicken", calories: 720, protein: 84, carbs: 2, fat: 40, portion: "1 half", category: "Swiss Chalet" },
  { name: "Swiss Chalet Fries", calories: 380, protein: 5, carbs: 55, fat: 16, portion: "1 regular", category: "Swiss Chalet" },
  { name: "Swiss Chalet Coleslaw", calories: 130, protein: 1, carbs: 18, fat: 6, portion: "1 side", category: "Swiss Chalet" },
  { name: "Swiss Chalet Sauce", calories: 40, protein: 1, carbs: 6, fat: 1, portion: "1 dipping cup", category: "Swiss Chalet" },

  // =================== A&W ===================
  { name: "A&W Teen Burger", calories: 500, protein: 26, carbs: 45, fat: 24, portion: "1 burger", category: "A&W" },
  { name: "A&W Mama Burger", calories: 390, protein: 19, carbs: 40, fat: 17, portion: "1 burger", category: "A&W" },
  { name: "A&W Chicken Burger", calories: 510, protein: 29, carbs: 55, fat: 20, portion: "1 burger", category: "A&W" },
  { name: "A&W Onion Rings medium", calories: 370, protein: 5, carbs: 50, fat: 17, portion: "1 medium", category: "A&W" },
  { name: "A&W Root Beer float", calories: 330, protein: 3, carbs: 66, fat: 6, portion: "1 medium", category: "A&W" },

  // =================== PIZZA ===================
  { name: "Pizza Hut Pepperoni slice", calories: 340, protein: 15, carbs: 38, fat: 14, portion: "1 slice", category: "Pizza" },
  { name: "Pizza Hut Cheese slice", calories: 300, protein: 13, carbs: 38, fat: 11, portion: "1 slice", category: "Pizza" },
  { name: "Dominos Pepperoni slice", calories: 290, protein: 13, carbs: 34, fat: 12, portion: "1 slice", category: "Pizza" },
  { name: "Dominos Cheese slice", calories: 260, protein: 11, carbs: 33, fat: 10, portion: "1 slice", category: "Pizza" },
  { name: "Pizza Nova slice", calories: 310, protein: 14, carbs: 36, fat: 12, portion: "1 slice", category: "Pizza" },
  { name: "Homemade pizza slice", calories: 285, protein: 12, carbs: 36, fat: 10, portion: "1 slice", category: "Pizza" },

  // =================== SOUTH ASIAN FOODS ===================
  { name: "Chicken biryani", calories: 520, protein: 28, carbs: 65, fat: 15, portion: "1 plate", category: "South Asian" },
  { name: "Lamb biryani", calories: 580, protein: 30, carbs: 65, fat: 20, portion: "1 plate", category: "South Asian" },
  { name: "Dal tadka", calories: 180, protein: 10, carbs: 25, fat: 5, portion: "1 cup", category: "South Asian" },
  { name: "Dal makhani", calories: 250, protein: 12, carbs: 30, fat: 10, portion: "1 cup", category: "South Asian" },
  { name: "Butter chicken", calories: 380, protein: 28, carbs: 15, fat: 22, portion: "1 cup", category: "South Asian" },
  { name: "Chicken tikka masala", calories: 350, protein: 30, carbs: 12, fat: 20, portion: "1 cup", category: "South Asian" },
  { name: "Palak paneer", calories: 280, protein: 15, carbs: 12, fat: 20, portion: "1 cup", category: "South Asian" },
  { name: "Roti whole wheat", calories: 120, protein: 3, carbs: 18, fat: 4, portion: "1 roti", category: "South Asian" },
  { name: "Paratha", calories: 200, protein: 4, carbs: 28, fat: 8, portion: "1 paratha", category: "South Asian" },
  { name: "Naan butter", calories: 320, protein: 9, carbs: 48, fat: 10, portion: "1 piece", category: "South Asian" },
  { name: "Samosa", calories: 150, protein: 3, carbs: 18, fat: 8, portion: "1 piece", category: "South Asian" },
  { name: "Pakora", calories: 120, protein: 3, carbs: 14, fat: 6, portion: "4 pieces", category: "South Asian" },
  { name: "Idli", calories: 130, protein: 4, carbs: 25, fat: 1, portion: "2 pieces", category: "South Asian" },
  { name: "Dosa plain", calories: 170, protein: 4, carbs: 30, fat: 4, portion: "1 dosa", category: "South Asian" },
  { name: "Masala dosa", calories: 280, protein: 6, carbs: 45, fat: 8, portion: "1 dosa", category: "South Asian" },
  { name: "Chicken curry", calories: 300, protein: 28, carbs: 10, fat: 18, portion: "1 cup", category: "South Asian" },
  { name: "Mutton curry", calories: 380, protein: 30, carbs: 8, fat: 25, portion: "1 cup", category: "South Asian" },
  { name: "Vegetable curry", calories: 180, protein: 5, carbs: 22, fat: 9, portion: "1 cup", category: "South Asian" },
  { name: "Raita", calories: 80, protein: 4, carbs: 8, fat: 3, portion: "1 cup", category: "South Asian" },
  { name: "Lassi sweet", calories: 250, protein: 8, carbs: 38, fat: 8, portion: "1 glass", category: "South Asian" },
  { name: "Mango lassi", calories: 290, protein: 7, carbs: 48, fat: 8, portion: "1 glass", category: "South Asian" },
  { name: "Chai tea with milk", calories: 120, protein: 4, carbs: 18, fat: 4, portion: "1 cup", category: "South Asian" },
  { name: "Khichdi", calories: 300, protein: 10, carbs: 55, fat: 6, portion: "1 cup", category: "South Asian" },
  { name: "Aloo gobi", calories: 150, protein: 4, carbs: 22, fat: 6, portion: "1 cup", category: "South Asian" },
  { name: "Chana masala", calories: 270, protein: 14, carbs: 40, fat: 8, portion: "1 cup", category: "South Asian" },

  // =================== MIDDLE EASTERN ===================
  { name: "Shawarma chicken wrap", calories: 550, protein: 35, carbs: 55, fat: 20, portion: "1 wrap", category: "Middle Eastern" },
  { name: "Shawarma beef wrap", calories: 620, protein: 38, carbs: 55, fat: 26, portion: "1 wrap", category: "Middle Eastern" },
  { name: "Falafel wrap", calories: 480, protein: 18, carbs: 60, fat: 18, portion: "1 wrap", category: "Middle Eastern" },
  { name: "Falafel plate", calories: 520, protein: 20, carbs: 65, fat: 20, portion: "1 plate", category: "Middle Eastern" },
  { name: "Hummus", calories: 166, protein: 8, carbs: 18, fat: 8, portion: "100g", category: "Middle Eastern" },
  { name: "Pita with hummus", calories: 330, protein: 13, carbs: 51, fat: 9, portion: "1 pita", category: "Middle Eastern" },
  { name: "Kebab plate", calories: 580, protein: 40, carbs: 50, fat: 22, portion: "1 plate", category: "Middle Eastern" },
  { name: "Lamb kebab", calories: 350, protein: 30, carbs: 5, fat: 24, portion: "2 skewers", category: "Middle Eastern" },
  { name: "Chicken kebab", calories: 280, protein: 32, carbs: 5, fat: 15, portion: "2 skewers", category: "Middle Eastern" },
  { name: "Tabbouleh", calories: 100, protein: 3, carbs: 14, fat: 5, portion: "1 cup", category: "Middle Eastern" },
  { name: "Fattoush salad", calories: 120, protein: 3, carbs: 18, fat: 5, portion: "1 bowl", category: "Middle Eastern" },
  { name: "Baklava", calories: 180, protein: 3, carbs: 22, fat: 10, portion: "1 piece", category: "Middle Eastern" },

  // =================== CHINESE ===================
  { name: "Fried rice chicken", calories: 430, protein: 18, carbs: 58, fat: 14, portion: "1 cup", category: "Chinese" },
  { name: "Chow mein", calories: 380, protein: 16, carbs: 52, fat: 12, portion: "1 cup", category: "Chinese" },
  { name: "Sweet and sour chicken", calories: 400, protein: 22, carbs: 48, fat: 12, portion: "1 cup", category: "Chinese" },
  { name: "General Tso chicken", calories: 480, protein: 26, carbs: 45, fat: 20, portion: "1 cup", category: "Chinese" },
  { name: "Spring roll", calories: 140, protein: 4, carbs: 16, fat: 7, portion: "1 piece", category: "Chinese" },
  { name: "Dim sum dumplings", calories: 180, protein: 10, carbs: 20, fat: 6, portion: "4 pieces", category: "Chinese" },
  { name: "Wonton soup", calories: 200, protein: 12, carbs: 24, fat: 6, portion: "1 bowl", category: "Chinese" },
  { name: "Beef with broccoli", calories: 330, protein: 26, carbs: 18, fat: 18, portion: "1 cup", category: "Chinese" },
  { name: "Kung pao chicken", calories: 410, protein: 28, carbs: 22, fat: 24, portion: "1 cup", category: "Chinese" },

  // =================== ITALIAN ===================
  { name: "Spaghetti bolognese", calories: 530, protein: 28, carbs: 65, fat: 16, portion: "1 plate", category: "Italian" },
  { name: "Pasta carbonara", calories: 600, protein: 25, carbs: 65, fat: 28, portion: "1 plate", category: "Italian" },
  { name: "Lasagna", calories: 480, protein: 28, carbs: 45, fat: 20, portion: "1 serving", category: "Italian" },
  { name: "Caesar salad", calories: 180, protein: 8, carbs: 12, fat: 12, portion: "1 bowl", category: "Italian" },
  { name: "Minestrone soup", calories: 180, protein: 8, carbs: 28, fat: 4, portion: "1 bowl", category: "Italian" },
  { name: "Tiramisu", calories: 450, protein: 8, carbs: 50, fat: 24, portion: "1 serving", category: "Italian" },
  { name: "Risotto", calories: 420, protein: 12, carbs: 68, fat: 12, portion: "1 cup", category: "Italian" },

  // =================== MEXICAN ===================
  { name: "Burrito chicken", calories: 680, protein: 38, carbs: 75, fat: 22, portion: "1 burrito", category: "Mexican" },
  { name: "Taco chicken", calories: 280, protein: 18, carbs: 25, fat: 12, portion: "2 tacos", category: "Mexican" },
  { name: "Quesadilla cheese", calories: 480, protein: 20, carbs: 46, fat: 24, portion: "1 quesadilla", category: "Mexican" },
  { name: "Nachos with cheese", calories: 580, protein: 14, carbs: 62, fat: 32, portion: "1 plate", category: "Mexican" },
  { name: "Guacamole", calories: 150, protein: 2, carbs: 8, fat: 13, portion: "100g", category: "Mexican" },
  { name: "Salsa", calories: 20, protein: 1, carbs: 4, fat: 0, portion: "100g", category: "Mexican" },

  // =================== JAPANESE ===================
  { name: "Sushi roll salmon 6pc", calories: 300, protein: 16, carbs: 44, fat: 8, portion: "6 pieces", category: "Japanese" },
  { name: "Sushi roll tuna 6pc", calories: 280, protein: 18, carbs: 42, fat: 6, portion: "6 pieces", category: "Japanese" },
  { name: "Ramen bowl", calories: 550, protein: 28, carbs: 65, fat: 18, portion: "1 bowl", category: "Japanese" },
  { name: "Miso soup", calories: 40, protein: 3, carbs: 5, fat: 1, portion: "1 bowl", category: "Japanese" },
  { name: "Teriyaki chicken", calories: 380, protein: 32, carbs: 28, fat: 14, portion: "1 plate", category: "Japanese" },
  { name: "Edamame", calories: 120, protein: 11, carbs: 9, fat: 5, portion: "1 cup", category: "Japanese" },

  // =================== SNACKS ===================
  { name: "Lays chips regular", calories: 160, protein: 2, carbs: 15, fat: 10, portion: "28g bag", category: "Snacks" },
  { name: "Doritos", calories: 140, protein: 2, carbs: 18, fat: 7, portion: "28g bag", category: "Snacks" },
  { name: "Popcorn salted", calories: 110, protein: 3, carbs: 22, fat: 2, portion: "3 cups", category: "Snacks" },
  { name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, portion: "28g", category: "Snacks" },
  { name: "Peanuts", calories: 166, protein: 7, carbs: 6, fat: 14, portion: "28g", category: "Snacks" },
  { name: "Cashews", calories: 157, protein: 5, carbs: 9, fat: 12, portion: "28g", category: "Snacks" },
  { name: "Peanut butter", calories: 190, protein: 8, carbs: 6, fat: 16, portion: "2 tbsp", category: "Snacks" },
  { name: "Granola bar", calories: 190, protein: 4, carbs: 30, fat: 6, portion: "1 bar", category: "Snacks" },
  { name: "Protein bar", calories: 220, protein: 20, carbs: 25, fat: 7, portion: "1 bar", category: "Snacks" },
  { name: "Kind bar", calories: 200, protein: 6, carbs: 22, fat: 11, portion: "1 bar", category: "Snacks" },
  { name: "Rice cakes", calories: 70, protein: 1, carbs: 15, fat: 0, portion: "2 cakes", category: "Snacks" },
  { name: "Crackers", calories: 130, protein: 2, carbs: 20, fat: 5, portion: "10 crackers", category: "Snacks" },
  { name: "Chocolate bar", calories: 235, protein: 3, carbs: 30, fat: 13, portion: "1 bar", category: "Snacks" },
  { name: "Kit Kat", calories: 210, protein: 3, carbs: 27, fat: 11, portion: "1 bar", category: "Snacks" },
  { name: "Oreo cookies", calories: 160, protein: 1, carbs: 25, fat: 7, portion: "3 cookies", category: "Snacks" },
  { name: "Ice cream vanilla", calories: 273, protein: 5, carbs: 31, fat: 15, portion: "1 cup", category: "Snacks" },

  // =================== HOSPITAL/SHIFT WORKER ===================
  { name: "Hospital cafeteria sandwich", calories: 380, protein: 18, carbs: 45, fat: 12, portion: "1 sandwich", category: "Hospital" },
  { name: "Hospital soup", calories: 150, protein: 8, carbs: 22, fat: 4, portion: "1 bowl", category: "Hospital" },
  { name: "Vending machine chips", calories: 160, protein: 2, carbs: 17, fat: 10, portion: "1 bag", category: "Hospital" },
  { name: "Vending machine chocolate", calories: 250, protein: 4, carbs: 32, fat: 13, portion: "1 bar", category: "Hospital" },
  { name: "Instant noodles", calories: 380, protein: 8, carbs: 52, fat: 16, portion: "1 pack", category: "Hospital" },
  { name: "Microwave meal", calories: 350, protein: 18, carbs: 45, fat: 10, portion: "1 tray", category: "Hospital" },
  { name: "Night shift snack mix", calories: 200, protein: 4, carbs: 25, fat: 10, portion: "1 handful", category: "Hospital" },
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function Food() {
  const router = useRouter();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<FoodDBItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mealType, setMealType] = useState("Breakfast");
  const [portion, setPortion] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodDBItem | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const today = new Date().toDateString();

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const saved = await AsyncStorage.getItem(`food_${today}`);
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) { console.log(e); }
  }

  async function saveEntries(updated: FoodEntry[]) {
    try {
      await AsyncStorage.setItem(`food_${today}`, JSON.stringify(updated));
    } catch (e) { console.log(e); }
  }

  function handleSearch(text: string) {
    setSearchText(text);
    setSelectedFood(null);
    if (text.length < 2) { setSearchResults([]); return; }
    const results = FOOD_DATABASE.filter((f) =>
      f.name.toLowerCase().includes(text.toLowerCase()) ||
      f.category.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 8);
    setSearchResults(results);
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
    try {
      setIsRecording(false);
      await recordingRef.current?.stopAndUnloadAsync();
    } catch (e) { console.log(e); }
  }

  function selectFood(food: FoodDBItem) {
    setSelectedFood(food);
    setPortion(food.portion);
    setSearchResults([]);
    setSearchText(food.name);
  }

  async function addEntry() {
    let entry: FoodEntry;
    if (manualMode) {
      if (!manualName || !manualCalories) return;
      entry = {
        id: Date.now().toString(),
        name: manualName,
        calories: parseInt(manualCalories) || 0,
        protein: parseInt(manualProtein) || 0,
        carbs: parseInt(manualCarbs) || 0,
        fat: parseInt(manualFat) || 0,
        portion: portion || "1 serving",
        mealType,
      };
    } else {
      if (!selectedFood) return;
      entry = {
        id: Date.now().toString(),
        name: selectedFood.name,
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
        portion: portion || selectedFood.portion,
        mealType,
      };
    }
    const updated = [...entries, entry];
    setEntries(updated);
    saveEntries(updated);
    resetModal();
  }

  function resetModal() {
    setShowModal(false);
    setSelectedFood(null);
    setSearchText("");
    setSearchResults([]);
    setPortion("");
    setManualMode(false);
    setManualName("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
  }

  async function deleteEntry(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = entries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = entries.reduce((sum, e) => sum + e.fat, 0);

  function getMealEntries(meal: string) {
    return entries.filter((e) => e.mealType === meal);
  }

  function getMealCalories(meal: string) {
    return getMealEntries(meal).reduce((sum, e) => sum + e.calories, 0);
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🍎 Food & Calories</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Nutrition</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🔥</Text>
            <Text style={styles.summaryValue}>{totalCalories}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🥩</Text>
            <Text style={styles.summaryValue}>{totalProtein}g</Text>
            <Text style={styles.summaryLabel}>Protein</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🍞</Text>
            <Text style={styles.summaryValue}>{totalCarbs}g</Text>
            <Text style={styles.summaryLabel}>Carbs</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🥑</Text>
            <Text style={styles.summaryValue}>{totalFat}g</Text>
            <Text style={styles.summaryLabel}>Fat</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min((totalCalories / 2000) * 100, 100)}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{totalCalories} / 2000 cal daily goal</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.addBtnText}>+ Add Food</Text>
      </TouchableOpacity>

      {MEAL_TYPES.map((meal) => (
        getMealEntries(meal).length > 0 && (
          <View key={meal} style={styles.section}>
            <View style={styles.mealHeader}>
              <Text style={styles.sectionTitle}>
                {meal === "Breakfast" ? "🌅" : meal === "Lunch" ? "☀️" : meal === "Dinner" ? "🌙" : "🍿"} {meal}
              </Text>
              <Text style={styles.mealCalories}>{getMealCalories(meal)} cal</Text>
            </View>
            {getMealEntries(meal).map((entry) => (
              <View key={entry.id} style={styles.foodCard}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{entry.name}</Text>
                  <Text style={styles.foodPortion}>{entry.portion}</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macro}>🥩 {entry.protein}g</Text>
                    <Text style={styles.macro}>🍞 {entry.carbs}g</Text>
                    <Text style={styles.macro}>🥑 {entry.fat}g</Text>
                  </View>
                </View>
                <View style={styles.foodRight}>
                  <Text style={styles.foodCalories}>{entry.calories}</Text>
                  <Text style={styles.foodCalLabel}>cal</Text>
                  <TouchableOpacity onPress={() => deleteEntry(entry.id)}>
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )
      ))}

      {entries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyText}>No food logged yet!</Text>
          <Text style={styles.emptySubText}>Tap "+ Add Food" to get started</Text>
        </View>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Food 🍎</Text>

              <Text style={styles.modalLabel}>Meal Type</Text>
              <View style={styles.mealTypeRow}>
                {MEAL_TYPES.map((meal) => (
                  <TouchableOpacity
                    key={meal}
                    style={[styles.mealChip, mealType === meal && styles.mealChipActive]}
                    onPress={() => setMealType(meal)}
                  >
                    <Text style={[styles.mealChipText, mealType === meal && styles.mealChipTextActive]}>
                      {meal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeBtn, !manualMode && styles.modeBtnActive]}
                  onPress={() => setManualMode(false)}
                >
                  <Text style={[styles.modeBtnText, !manualMode && styles.modeBtnTextActive]}>🔍 Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, manualMode && styles.modeBtnActive]}
                  onPress={() => setManualMode(true)}
                >
                  <Text style={[styles.modeBtnText, manualMode && styles.modeBtnTextActive]}>✏️ Manual</Text>
                </TouchableOpacity>
              </View>

              {!manualMode ? (
                <>
                  <TouchableOpacity
                    style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Text style={styles.voiceBtnText}>
                      {isRecording ? "⏹️ Stop Recording" : "🎤 Speak food name"}
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.input}
                    placeholder="Search food (e.g. chicken, tim hortons...)"
                    value={searchText}
                    onChangeText={handleSearch}
                    placeholderTextColor="#aaa"
                  />

                  {searchResults.map((food) => (
                    <TouchableOpacity
                      key={food.name}
                      style={[styles.resultItem, selectedFood?.name === food.name && styles.resultItemActive]}
                      onPress={() => selectFood(food)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{food.name}</Text>
                        <Text style={styles.resultPortion}>{food.portion} · {food.category}</Text>
                      </View>
                      <Text style={styles.resultCalories}>{food.calories} cal</Text>
                    </TouchableOpacity>
                  ))}

                  {searchText.length >= 2 && searchResults.length === 0 && (
                    <TouchableOpacity style={styles.notFoundBtn} onPress={() => setManualMode(true)}>
                      <Text style={styles.notFoundText}>Food not found — add manually ✏️</Text>
                    </TouchableOpacity>
                  )}

                  {selectedFood && (
                    <View style={styles.selectedCard}>
                      <Text style={styles.selectedTitle}>✅ {selectedFood.name}</Text>
                      <View style={styles.macroRow}>
                        <Text style={styles.macro}>🔥 {selectedFood.calories} cal</Text>
                        <Text style={styles.macro}>🥩 {selectedFood.protein}g</Text>
                        <Text style={styles.macro}>🍞 {selectedFood.carbs}g</Text>
                        <Text style={styles.macro}>🥑 {selectedFood.fat}g</Text>
                      </View>
                      <TextInput
                        style={[styles.input, { marginTop: 10 }]}
                        placeholder="Portion size (e.g. 1 cup, 200g)"
                        value={portion}
                        onChangeText={setPortion}
                        placeholderTextColor="#aaa"
                      />
                    </View>
                  )}
                </>
              ) : (
                <>
                  <TextInput style={styles.input} placeholder="Food name *" value={manualName} onChangeText={setManualName} placeholderTextColor="#aaa" />
                  <TextInput style={styles.input} placeholder="Calories *" value={manualCalories} onChangeText={setManualCalories} keyboardType="numeric" placeholderTextColor="#aaa" />
                  <TextInput style={styles.input} placeholder="Protein (g)" value={manualProtein} onChangeText={setManualProtein} keyboardType="numeric" placeholderTextColor="#aaa" />
                  <TextInput style={styles.input} placeholder="Carbs (g)" value={manualCarbs} onChangeText={setManualCarbs} keyboardType="numeric" placeholderTextColor="#aaa" />
                  <TextInput style={styles.input} placeholder="Fat (g)" value={manualFat} onChangeText={setManualFat} keyboardType="numeric" placeholderTextColor="#aaa" />
                  <TextInput style={styles.input} placeholder="Portion size" value={portion} onChangeText={setPortion} placeholderTextColor="#aaa" />
                </>
              )}

              <TouchableOpacity
                style={[styles.confirmBtn, (!selectedFood && !manualMode) || (manualMode && !manualName) ? styles.confirmBtnDisabled : null]}
                onPress={addEntry}
              >
                <Text style={styles.confirmBtnText}>Add to Log ✅</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={resetModal}>
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { fontSize: 16, color: "#4A90E2", fontWeight: "bold" },
  title: { fontSize: 28, fontWeight: "bold", color: "#2d2d2d", textAlign: "center", marginBottom: 20 },
  summaryCard: { backgroundColor: "#fff", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryTitle: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d", marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  summaryItem: { alignItems: "center" },
  summaryEmoji: { fontSize: 24, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  summaryLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  progressBar: { height: 8, backgroundColor: "#f0f0f0", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 4 },
  progressLabel: { fontSize: 12, color: "#888", marginTop: 6, textAlign: "center" },
  addBtn: { backgroundColor: "#4CAF50", margin: 16, marginTop: 0, borderRadius: 16, padding: 18, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  section: { backgroundColor: "#fff", margin: 16, marginTop: 0, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  mealCalories: { fontSize: 14, color: "#888", fontWeight: "bold" },
  foodCard: { flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, marginBottom: 8 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: "bold", color: "#2d2d2d" },
  foodPortion: { fontSize: 12, color: "#888", marginTop: 2 },
  macroRow: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  macro: { fontSize: 12, color: "#555" },
  foodRight: { alignItems: "center" },
  foodCalories: { fontSize: 20, fontWeight: "bold", color: "#4CAF50" },
  foodCalLabel: { fontSize: 11, color: "#888" },
  deleteText: { fontSize: 18, marginTop: 4 },
  emptyState: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#2d2d2d" },
  emptySubText: { fontSize: 14, color: "#888", marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#2d2d2d", marginBottom: 20, textAlign: "center" },
  modalLabel: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 8, marginTop: 4 },
  mealTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  mealChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#eee" },
  mealChipActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  mealChipText: { fontSize: 13, color: "#888", fontWeight: "bold" },
  mealChipTextActive: { color: "#fff" },
  modeToggle: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#eee", alignItems: "center" },
  modeBtnActive: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  modeBtnText: { fontSize: 14, color: "#888", fontWeight: "bold" },
  modeBtnTextActive: { color: "#fff" },
  voiceBtn: { backgroundColor: "#f0f0f0", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 12 },
  voiceBtnActive: { backgroundColor: "#FF3B30" },
  voiceBtnText: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d" },
  input: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, fontSize: 15, color: "#2d2d2d", marginBottom: 10 },
  resultItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, marginBottom: 8 },
  resultItemActive: { backgroundColor: "#e8f4ff", borderColor: "#4A90E2" },
  resultName: { fontSize: 14, fontWeight: "bold", color: "#2d2d2d" },
  resultPortion: { fontSize: 12, color: "#888" },
  resultCalories: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  notFoundBtn: { padding: 12, alignItems: "center" },
  notFoundText: { fontSize: 14, color: "#4A90E2", fontWeight: "bold" },
  selectedCard: { backgroundColor: "#f0f7ff", borderRadius: 12, padding: 16, marginBottom: 12 },
  selectedTitle: { fontSize: 16, fontWeight: "bold", color: "#2d2d2d", marginBottom: 8 },
  confirmBtn: { backgroundColor: "#4CAF50", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  confirmBtnDisabled: { backgroundColor: "#ccc" },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#888", fontSize: 16 },
});