/* ============================================================
   SWATI FITNESS APP v2 — Complete Rewrite
   PIN-locked, auto-syncing, level-tracking PWA
   ============================================================ */
var app = (function () {
  'use strict';

  // ===== PIN =====
  var PIN_HASH = '8f14e45fceea167a5a36dedd4bea2543'; // md5 of 1408
  var pinBuffer = '';

  function simpleMD5(s) {
    // Simple hash for PIN comparison (not cryptographic — sufficient for personal lock screen)
    var h = 0, i, len;
    for (i = 0, len = s.length; i < len; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function pinKey(n) {
    if (pinBuffer.length >= 4) return;
    pinBuffer += n;
    updatePinDots();
    if (pinBuffer.length === 4) {
      if (pinBuffer === '1408') {
        $('pin-lock').classList.add('hidden');
        saveJSON('pin_ok', Date.now());
      } else {
        $('pin-error').classList.remove('hidden');
        vibrate([200, 100, 200]);
        setTimeout(function () {
          pinBuffer = '';
          updatePinDots();
          $('pin-error').classList.add('hidden');
        }, 800);
      }
    }
  }

  function pinDel() {
    pinBuffer = pinBuffer.slice(0, -1);
    updatePinDots();
  }

  function updatePinDots() {
    for (var i = 0; i < 4; i++) {
      $('d' + i).className = i < pinBuffer.length ? 'filled' : '';
    }
  }

  function checkPinSession() {
    var ts = loadJSON('pin_ok', 0);
    // Session lasts 4 hours
    if (ts && Date.now() - ts < 4 * 3600000) {
      $('pin-lock').classList.add('hidden');
    }
  }

  // ===== CONSTANTS =====
  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var REST_EX = 10, REST_ROUND = 30;

  // ===== EXERCISE TIPS =====
  var TIPS = {
    'Incline Pushups': { breathing: 'Inhale going down, exhale pushing up', posture: 'Straight line from head to heels — don\'t let hips sag or pike up', muscles: 'Chest · Shoulders · Triceps', demo: 'incline+pushup+correct+form' },
    'Wall Pushups': { breathing: 'Inhale toward wall, exhale pushing away', posture: 'Hands shoulder-width, elbows at 45°, core tight', muscles: 'Chest · Shoulders', demo: 'wall+pushup+tutorial' },
    'Knee Pushups': { breathing: 'Inhale down, exhale up', posture: 'Hips forward, don\'t bend at waist. Lower chest to floor.', muscles: 'Chest · Shoulders · Triceps', demo: 'knee+pushup+proper+form' },
    'Backpack Rows': { breathing: 'Exhale pulling up, inhale lowering', posture: 'Hinge at hips 45°, pull elbows back, squeeze shoulder blades', muscles: 'Upper back · Biceps · Rear delts', demo: 'backpack+bent+over+row' },
    'Towel Rows (door)': { breathing: 'Exhale pulling, inhale releasing', posture: 'Lean back, pull chest to hands, keep core engaged', muscles: 'Back · Biceps', demo: 'towel+door+row+exercise' },
    'Slow Negative Rows': { breathing: 'Exhale up (1s), inhale down (3s slow)', posture: 'Same as rows but 3-second lowering phase', muscles: 'Back · Biceps', demo: 'slow+negative+row' },
    'Shoulder Press': { breathing: 'Exhale pressing up, inhale lowering', posture: 'Core tight, don\'t arch lower back, press straight up', muscles: 'Shoulders · Triceps', demo: 'overhead+shoulder+press+form' },
    'Lateral Raises': { breathing: 'Exhale raising, inhale lowering', posture: 'Slight bend in elbows, lift to shoulder height only, control the movement', muscles: 'Side delts', demo: 'lateral+raise+form' },
    'Biceps Curls': { breathing: 'Exhale curling up, inhale lowering', posture: 'Elbows pinned to sides, don\'t swing — only forearms move', muscles: 'Biceps', demo: 'bicep+curl+proper+form' },
    'Hammer Curls': { breathing: 'Exhale up, inhale down', posture: 'Palms facing each other, elbows stay at sides', muscles: 'Biceps · Forearms', demo: 'hammer+curl+form' },
    'Plank': { breathing: 'Breathe steadily — don\'t hold breath. Short inhale, long exhale.', posture: 'Elbows under shoulders, body straight, squeeze glutes, look at floor', muscles: 'Core · Shoulders · Back', demo: 'plank+correct+form+beginner' },
    'Knee Plank': { breathing: 'Steady breathing throughout', posture: 'Knees on ground, straight line from head to knees', muscles: 'Core', demo: 'knee+plank+tutorial' },
    'Squats': { breathing: 'Inhale going down, exhale standing up', posture: 'Feet shoulder-width, push hips back, knees track over toes, chest up', muscles: 'Quads · Glutes · Hamstrings', demo: 'bodyweight+squat+form' },
    'Chair Squats': { breathing: 'Inhale sitting, exhale standing', posture: 'Touch the chair lightly — don\'t fully sit. Control the descent.', muscles: 'Quads · Glutes', demo: 'chair+squat+beginner' },
    'Pause Squats (3s hold)': { breathing: 'Inhale down, hold breath at bottom briefly, exhale up', posture: 'Hold at bottom for 3 seconds — build strength at weakest point', muscles: 'Quads · Glutes', demo: 'pause+squat+tutorial' },
    'Lunges': { breathing: 'Inhale stepping forward, exhale pushing back', posture: 'Front knee over ankle (not past toes), back knee toward floor, upright torso', muscles: 'Quads · Glutes · Hamstrings', demo: 'lunge+correct+form' },
    'Reverse Lunges': { breathing: 'Inhale stepping back, exhale returning', posture: 'Step back (easier on knees), same knee alignment as forward lunges', muscles: 'Quads · Glutes', demo: 'reverse+lunge+form' },
    'Walking Lunges': { breathing: 'Exhale on each step forward', posture: 'Continuous forward movement, maintain upright posture', muscles: 'Quads · Glutes · Balance', demo: 'walking+lunge+form' },
    'Glute Bridge': { breathing: 'Exhale lifting hips, inhale lowering', posture: 'Feet flat, knees bent, squeeze glutes hard at top, don\'t hyperextend back', muscles: 'Glutes · Hamstrings · Core', demo: 'glute+bridge+form' },
    'Single-Leg Bridge': { breathing: 'Exhale lifting, inhale lowering', posture: 'One leg extended, drive through planted heel', muscles: 'Glutes · Core · Balance', demo: 'single+leg+glute+bridge' },
    'Wall Sit': { breathing: 'Steady breathing — don\'t hold breath even when burning', posture: 'Back flat against wall, thighs parallel to floor, knees at 90°', muscles: 'Quads · Glutes', demo: 'wall+sit+correct+form' },
    'Dead Bug': { breathing: 'Exhale extending arm+leg, inhale returning', posture: 'Lower back MUST stay pressed into floor — this is the key', muscles: 'Core · Stability', demo: 'dead+bug+exercise+form' },
    'Shoulder Taps': { breathing: 'Steady breathing, don\'t hold', posture: 'Plank position, tap opposite shoulder, minimize hip rotation', muscles: 'Core · Shoulders · Stability', demo: 'shoulder+tap+plank' },
    'Side Plank': { breathing: 'Steady controlled breathing', posture: 'Elbow under shoulder, hips stacked, straight line head to feet', muscles: 'Obliques · Core · Shoulders', demo: 'side+plank+form+beginner' },
    'Chin Tucks': { breathing: 'Normal breathing', posture: 'Pull chin straight back (make double chin), hold 2 sec, release', muscles: 'Neck · Posture', demo: 'chin+tuck+exercise+posture' },
    'Shoulder Blade Squeezes': { breathing: 'Exhale squeezing, inhale releasing', posture: 'Pull shoulder blades together and down, hold 2 sec', muscles: 'Upper back · Posture', demo: 'shoulder+blade+squeeze+posture' },
    'Wall Posture Hold': { breathing: 'Steady breathing', posture: 'Head, shoulders, butt, heels all touching wall — hold position', muscles: 'Posture · Back', demo: 'wall+posture+hold+exercise' },
    'Jump Squats': { breathing: 'Inhale down, exhale on jump', posture: 'Land softly on balls of feet, control the landing', muscles: 'Quads · Glutes · Cardio', demo: 'jump+squat+form' }
  };

  function getTip(name) { return TIPS[name] || { breathing: 'Breathe steadily', posture: 'Maintain good form', muscles: '', demo: name.replace(/\s+/g, '+') + '+exercise' }; }

  // ===== WORKOUTS =====
  var WORKOUTS = {
    monday: {
      name: 'Back + Arms (Strength A)', type: 'strength', rounds: 3,
      exercises: [
        { name: 'Incline Pushups', reps: '6–10', timed: false, easier: { name: 'Wall Pushups', reps: '10–15' }, harder: { name: 'Knee Pushups', reps: '4–6' } },
        { name: 'Backpack Rows', reps: '12–15', timed: false, easier: { name: 'Towel Rows (door)', reps: '10–12' }, harder: { name: 'Slow Negative Rows', reps: '8–10' } },
        { name: 'Shoulder Press', reps: '10–12', timed: false, easier: { name: 'Lateral Raises', reps: '12–15' }, harder: { name: 'Shoulder Press', reps: '8 (3s up)' } },
        { name: 'Biceps Curls', reps: '12', timed: false, easier: { name: 'Hammer Curls', reps: '12' }, harder: { name: 'Biceps Curls', reps: '8 (3s down)' } },
        { name: 'Plank', reps: '20–30s', timed: true, timerSec: 25, easier: { name: 'Knee Plank', reps: '20s', timerSec: 20 }, harder: { name: 'Plank', reps: '40s', timerSec: 40 } }
      ]
    },
    wednesday: {
      name: 'Lower Body + Core (Strength B)', type: 'strength', rounds: 3,
      exercises: [
        { name: 'Squats', reps: '12–20', timed: false, easier: { name: 'Chair Squats', reps: '10–15' }, harder: { name: 'Pause Squats (3s hold)', reps: '10' } },
        { name: 'Lunges', reps: '8–10 each leg', timed: false, easier: { name: 'Reverse Lunges', reps: '6 each' }, harder: { name: 'Walking Lunges', reps: '12 each' } },
        { name: 'Glute Bridge', reps: '15', timed: false, easier: { name: 'Glute Bridge', reps: '10 (slow)' }, harder: { name: 'Single-Leg Bridge', reps: '8 each' } },
        { name: 'Wall Sit', reps: '20–40s', timed: true, timerSec: 30, easier: { name: 'Wall Sit', reps: '15s', timerSec: 15 }, harder: { name: 'Wall Sit', reps: '50s', timerSec: 50 } },
        { name: 'Dead Bug', reps: '10 each side', timed: false, easier: { name: 'Dead Bug', reps: '6 each (slow)' }, harder: { name: 'Dead Bug', reps: '12 each (3s)' } },
        { name: 'Chin Tucks', reps: '10', timed: false, easier: null, harder: { name: 'Chin Tucks', reps: '15' } },
        { name: 'Shoulder Blade Squeezes', reps: '15', timed: false, easier: { name: 'Shoulder Blade Squeezes', reps: '10' }, harder: { name: 'Shoulder Blade Squeezes', reps: '20' } },
        { name: 'Wall Posture Hold', reps: '30s', timed: true, timerSec: 30, easier: { name: 'Wall Posture Hold', reps: '20s', timerSec: 20 }, harder: { name: 'Wall Posture Hold', reps: '45s', timerSec: 45 } }
      ]
    },
    friday: {
      name: 'Full Body + Back (Strength C)', type: 'strength', rounds: 3,
      exercises: [
        { name: 'Incline Pushups', reps: '8–10', timed: false, easier: { name: 'Wall Pushups', reps: '12' }, harder: { name: 'Knee Pushups', reps: '6–8' } },
        { name: 'Backpack Rows', reps: '15', timed: false, easier: { name: 'Towel Rows (door)', reps: '12' }, harder: { name: 'Slow Negative Rows', reps: '10' } },
        { name: 'Squats', reps: '15', timed: false, easier: { name: 'Chair Squats', reps: '12' }, harder: { name: 'Jump Squats', reps: '10' } },
        { name: 'Shoulder Taps', reps: '10 each', timed: false, easier: { name: 'Shoulder Taps', reps: '10 (knees)' }, harder: { name: 'Shoulder Taps', reps: '8 (2s hold)' } },
        { name: 'Side Plank', reps: '20s each', timed: true, timerSec: 20, easier: { name: 'Side Plank', reps: '15s (knees)', timerSec: 15 }, harder: { name: 'Side Plank', reps: '30s each', timerSec: 30 } }
      ]
    },
    tuesday: { name: 'Morning Jog + Cardio', type: 'cardio', description: '🏃‍♀️ Morning jog (use interval timer below)\n\nAfter jog, do 5 min:\n• Chin tucks × 10\n• Shoulder blade squeezes × 15\n• Wall posture hold × 30s × 2' },
    thursday: { name: 'Morning Jog + Cardio', type: 'cardio', description: '🏃‍♀️ Morning jog (use interval timer below)\n\nPosture finisher:\n• Chin tucks × 10\n• Shoulder blade squeezes × 15\n• Neck rolls × 10 each direction' },
    saturday: { name: 'Morning Jog + Cardio (Sat)', type: 'cardio', description: '🏃‍♀️ Morning jog (use interval timer below)\n\nOr do a Chloe Ting video instead.\n\nPosture finisher:\n• Chin tucks × 10\n• Shoulder blade squeezes × 15\n• Wall posture hold × 30s × 2' },
    sunday: { name: 'Active Rest', type: 'rest', description: 'Light walk 20–30 min + stretching.\n\nOptional:\n• Gentle mobility\n• Foam rolling\n\nRest is part of the plan.' }
  };

  var CARDIO_WEEKS = {
    1: { warmup: 300, intervals: [{ type: 'jog', dur: 30 }, { type: 'walk', dur: 90 }], repeats: 5, cooldown: 300 },
    2: { warmup: 300, intervals: [{ type: 'jog', dur: 45 }, { type: 'walk', dur: 75 }], repeats: 6, cooldown: 300 },
    3: { warmup: 300, intervals: [{ type: 'jog', dur: 60 }, { type: 'walk', dur: 60 }], repeats: 8, cooldown: 300 },
    4: { warmup: 300, intervals: [{ type: 'jog', dur: 75 }, { type: 'walk', dur: 45 }], repeats: 9, cooldown: 300 }
  };

  var MORNING_ROUTINE = ['Glass of water', 'Sunlight (window/balcony)', 'Neck rolls × 10', 'Shoulder rolls × 10', 'Cat-cow × 10', 'Hip circles × 10', 'Toe touch stretch × 20s'];

  var INGREDIENTS = ['Eggs', 'Chicken', 'Sardine', 'Curd', 'Greek Yogurt', 'Chapathi', 'Dosa Batter', 'Onion', 'Tomato', 'Cucumber', 'Carrot', 'Capsicum', 'Beans', 'Cabbage', 'Dal', 'Green Gram', 'Oats', 'Milk', 'Roasted Chana', 'Almonds', 'Rice', 'Bread', 'Butter'];

  var RECIPES = [
    { name: 'Egg Bhurji + Chapathi', time: 12, totalCal: 350, serves: 1, protein: 18, need: ['Eggs', 'Onion', 'Chapathi'],
      ingredients: [{ item: 'Eggs', qty: 2, unit: 'pcs' }, { item: 'Onion', qty: 0.5, unit: 'medium' }, { item: 'Tomato', qty: 0.5, unit: 'medium' }, { item: 'Oil', qty: 1, unit: 'tsp' }, { item: 'Chapathi', qty: 1, unit: 'pc' }],
      steps: ['Heat 1 tsp oil, add chopped onion+tomato (2 min)', 'Add salt, turmeric, pepper', 'Crack 2 eggs, scramble (3 min)', 'Serve with 1 chapathi'] },
    { name: '2-Egg Omelette + Veggies', time: 10, totalCal: 250, serves: 1, protein: 14, need: ['Eggs', 'Onion'],
      ingredients: [{ item: 'Eggs', qty: 2, unit: 'pcs' }, { item: 'Onion', qty: 0.25, unit: 'medium' }, { item: 'Oil', qty: 1, unit: 'tsp' }, { item: 'Cucumber', qty: 0.5, unit: 'medium' }],
      steps: ['Beat 2 eggs with salt+pepper', 'Add chopped onion', 'Cook on medium both sides', 'Serve with sliced cucumber'] },
    { name: 'Chicken Stir Fry', time: 15, totalCal: 400, serves: 2, protein: 50, need: ['Chicken', 'Onion', 'Capsicum'],
      ingredients: [{ item: 'Chicken', qty: 250, unit: 'g' }, { item: 'Onion', qty: 1, unit: 'medium' }, { item: 'Capsicum', qty: 0.5, unit: 'medium' }, { item: 'Oil', qty: 2, unit: 'tsp' }, { item: 'Chilli powder', qty: 0.5, unit: 'tsp' }],
      steps: ['Heat 2 tsp oil, add 250g sliced chicken', 'Add 1 onion + half capsicum sliced', 'Salt, pepper, chilli — stir fry 8–10 min', 'Serve with cucumber/carrot salad'] },
    { name: 'Dosa + Egg Roll', time: 10, totalCal: 300, serves: 1, protein: 10, need: ['Dosa Batter', 'Eggs'],
      ingredients: [{ item: 'Dosa Batter', qty: 100, unit: 'ml' }, { item: 'Eggs', qty: 1, unit: 'pc' }, { item: 'Onion', qty: 0.25, unit: 'medium' }, { item: 'Oil', qty: 1, unit: 'tsp' }],
      steps: ['Pour 100ml batter, spread thin', 'Crack 1 egg on top, spread', 'Salt, pepper, chopped onion', 'Roll and serve'] },
    { name: 'Curd Bowl + Chana', time: 5, totalCal: 280, serves: 1, protein: 14, need: ['Curd', 'Roasted Chana'],
      ingredients: [{ item: 'Curd', qty: 300, unit: 'g' }, { item: 'Roasted Chana', qty: 30, unit: 'g' }, { item: 'Cucumber', qty: 0.5, unit: 'medium' }, { item: 'Carrot', qty: 0.5, unit: 'medium' }],
      steps: ['300g curd in a bowl', 'Add 30g roasted chana', 'Chop half cucumber + half carrot', 'Salt or chaat masala'] },
    { name: 'Greek Yogurt Bowl', time: 5, totalCal: 250, serves: 1, protein: 15, need: ['Greek Yogurt'],
      ingredients: [{ item: 'Greek Yogurt', qty: 150, unit: 'g' }, { item: 'Almonds', qty: 5, unit: 'pcs' }, { item: 'Roasted Chana', qty: 15, unit: 'g' }],
      steps: ['150g yogurt in a bowl', 'Add 5 almonds + 15g chana', 'Optional: honey 1 tsp'] },
    { name: 'Egg Curry + Chapathi', time: 15, totalCal: 450, serves: 2, protein: 24, need: ['Eggs', 'Onion', 'Tomato', 'Chapathi'],
      ingredients: [{ item: 'Eggs', qty: 3, unit: 'pcs' }, { item: 'Onion', qty: 1, unit: 'medium' }, { item: 'Tomato', qty: 1, unit: 'medium' }, { item: 'Oil', qty: 2, unit: 'tsp' }, { item: 'Chapathi', qty: 2, unit: 'pcs' }, { item: 'Chilli powder', qty: 0.5, unit: 'tsp' }, { item: 'Turmeric', qty: 0.25, unit: 'tsp' }],
      steps: ['Boil 3 eggs, peel, halve', 'Heat 2 tsp oil, fry 1 onion + 1 tomato chopped', 'Add chilli + turmeric, cook 3 min', 'Add eggs, simmer 3 min — serve with 2 chapathi'] },
    { name: 'Quick Dal + Chapathi', time: 15, totalCal: 400, serves: 2, protein: 16, need: ['Dal', 'Onion', 'Tomato', 'Chapathi'],
      ingredients: [{ item: 'Dal', qty: 100, unit: 'g dry' }, { item: 'Onion', qty: 0.5, unit: 'medium' }, { item: 'Tomato', qty: 0.5, unit: 'medium' }, { item: 'Oil', qty: 1, unit: 'tsp' }, { item: 'Chapathi', qty: 2, unit: 'pcs' }],
      steps: ['Cook 100g dal in pressure cooker (or use leftover)', 'Temper: 1 tsp oil, mustard, cumin, half onion, half tomato', 'Mix into dal', 'Serve with 2 chapathi'] },
    { name: 'Boiled Eggs + Curd (no-cook)', time: 5, totalCal: 250, serves: 1, protein: 22, need: ['Eggs', 'Curd'],
      ingredients: [{ item: 'Eggs', qty: 3, unit: 'pcs' }, { item: 'Curd', qty: 200, unit: 'g' }],
      steps: ['Boil 3 eggs (or pre-boiled)', '200g curd in bowl', 'Salt, pepper on eggs', 'Zero cooking fallback'] },
    { name: 'Chicken Rice Bowl', time: 15, totalCal: 500, serves: 2, protein: 40, need: ['Chicken', 'Rice', 'Onion'],
      ingredients: [{ item: 'Chicken', qty: 200, unit: 'g' }, { item: 'Rice', qty: 150, unit: 'g cooked' }, { item: 'Onion', qty: 1, unit: 'medium' }, { item: 'Oil', qty: 2, unit: 'tsp' }, { item: 'Curd', qty: 100, unit: 'g' }],
      steps: ['Heat 2 tsp oil, cook 200g chicken with 1 onion + spices (8 min)', '150g cooked rice on plate', 'Top rice with chicken', '100g curd on side'] },
    { name: 'Sardine Fry', time: 10, totalCal: 240, serves: 1, protein: 30, need: ['Sardine'],
      ingredients: [{ item: 'Sardine', qty: 3, unit: 'pcs' }, { item: 'Chilli powder', qty: 0.5, unit: 'tsp' }, { item: 'Onion', qty: 0.25, unit: 'medium' }, { item: 'Garlic', qty: 2, unit: 'cloves' }, { item: 'Oil', qty: 1, unit: 'tsp' }],
      steps: ['Coat 3 sardines with chilli powder + salt', 'Heat 1 tsp oil, fry with sliced onion + garlic', 'Cook 3–4 min each side', 'Serve with chapathi or rice'] },
    { name: 'Kanjipayar (Green Gram)', time: 15, totalCal: 200, serves: 2, protein: 14, need: ['Green Gram'],
      ingredients: [{ item: 'Green Gram', qty: 100, unit: 'g dry' }, { item: 'Coconut', qty: 2, unit: 'tbsp grated' }, { item: 'Shallots', qty: 3, unit: 'pcs' }, { item: 'Coconut oil', qty: 1, unit: 'tsp' }],
      steps: ['Boil 100g green gram till soft (10 min)', 'Drain, add grated coconut + sliced shallots', 'Temper with 1 tsp coconut oil + mustard', 'Salt to taste'] }
  ];

  var OFFICE_BF = [
    { name: '2 Omelettes', desc: 'Great protein start. Add toast/dosa if hungry.', protein: 'high' },
    { name: '1–2 Dosa + Egg/Curd', desc: 'Pair dosa with protein anchor always.', protein: 'medium' },
    { name: '2 Idli + Sambar + Egg', desc: 'Balanced. Sambar adds lentil protein.', protein: 'medium' },
    { name: 'Oats + Milk + Fruit', desc: '40g oats, milk, apple/orange. Chia seeds optional.', protein: 'medium' },
    { name: '2 Chapathi + Egg Curry', desc: 'Filling and protein-rich.', protein: 'high' }
  ];

  var OFFICE_LUNCH = [
    { name: 'Rice + Chicken/Egg + Veg', desc: '1 fist rice, 1 palm protein, 1–2 fists vegetables.', protein: 'high' },
    { name: 'Curd Rice + Protein Side', desc: '1–1.5 bowls curd rice + 2 eggs/chicken + cucumber/carrot.', protein: 'medium' },
    { name: 'Chapathi + Dal + Veg', desc: '2 chapathi, dal, any vegetable.', protein: 'medium' },
    { name: 'Rice + Dal + Veg', desc: 'Controlled rice + protein + greens.', protein: 'medium' }
  ];

  var SNACKS = ['Apple / Orange', 'Buttermilk', 'Roasted chana (30g — 110 cal, 7g protein)', 'Boiled eggs (1–2)', 'Greek yogurt (150g — 130 cal, 15g protein)', 'Almonds (10 pcs — 70 cal)', 'Seed laddus (3cm — 65 cal each)', 'Sprouts'];

  // ===== STATE =====
  var st = {
    exIdx: 0, round: 1, wo: null, exTimer: null, exTimeLeft: 0,
    resting: false, restTimer: null,
    cardioIv: null, cardioPaused: false, cardioPI: 0, cardioPhases: [],
    cardioTL: 0, cardioTE: 0, cardioTD: 0,
    moveIv: null, selIng: new Set(), charts: {}, overDay: null
  };

  // ===== AUDIO =====
  var aCtx = null;
  function getACtx() { if (!aCtx) aCtx = new (window.AudioContext || window.webkitAudioContext)(); return aCtx; }

  function beep(f, d, t) {
    try {
      var c = getACtx(), o = c.createOscillator(), g = c.createGain();
      o.type = t || 'sine'; o.frequency.value = f || 440; g.gain.value = 0.3;
      o.connect(g); g.connect(c.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (d || 0.3));
      o.stop(c.currentTime + (d || 0.3));
    } catch (e) {}
  }

  function beepStart() { beep(660, 0.2); setTimeout(function () { beep(880, 0.3); }, 250); }
  function beepDone() { beep(520, 0.15); setTimeout(function () { beep(660, 0.15); }, 180); setTimeout(function () { beep(880, 0.25); }, 360); }
  function beepSwitch() { beep(440, 0.15); setTimeout(function () { beep(660, 0.2); }, 200); }
  function beepTick() { beep(330, 0.1); }
  function beepWin() { var i = 0, iv = setInterval(function () { beep(440 + i * 110, 0.2); if (++i > 4) clearInterval(iv); }, 200); }

  function say(t) { try { if ('speechSynthesis' in window) { var u = new SpeechSynthesisUtterance(t); u.rate = 1; u.volume = 0.8; speechSynthesis.speak(u); } } catch (e) {} }
  function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  // ===== HELPERS =====
  function $(id) { return document.getElementById(id); }
  function todayKey() { return DAYS[new Date().getDay()]; }
  function todayLabel() { return DAY_LABELS[new Date().getDay()]; }
  function ds() { return new Date().toISOString().slice(0, 10); }
  function fmt(s) { var m = Math.floor(s / 60), sec = s % 60; return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec; }
  function loadJSON(k, fb) { try { var d = localStorage.getItem('sf_' + k); return d ? JSON.parse(d) : fb; } catch (e) { return fb; } }
  function saveJSON(k, v) { try { localStorage.setItem('sf_' + k, JSON.stringify(v)); } catch (e) {} }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast show'; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 400); }, 2000);
  }

  function copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied!'); });
    } else {
      var ta = document.createElement('textarea'); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); toast('Copied!');
    }
  }

  // ===== LEVEL TRACKING =====
  function logLevel(exercise, choice) {
    // choice: 'easier', 'harder', 'standard', 'skipped'
    var log = loadJSON('level_log', []);
    log.push({ date: ds(), exercise: exercise, choice: choice, ts: Date.now() });
    saveJSON('level_log', log);
  }

  function logCooking(recipeName) {
    var log = loadJSON('cook_log', []);
    log.push({ date: ds(), recipe: recipeName, ts: Date.now() });
    saveJSON('cook_log', log);
  }

  function getLevelProfile() {
    var log = loadJSON('level_log', []);
    var profile = {};
    var i, len;
    for (i = 0, len = log.length; i < len; i++) {
      var ex = log[i].exercise;
      if (!profile[ex]) profile[ex] = { easier: 0, harder: 0, standard: 0, skipped: 0 };
      profile[ex][log[i].choice]++;
    }
    return profile;
  }

  function renderLevelSummary() {
    var profile = getLevelProfile();
    var el = $('level-summary');
    if (!el) return;
    var keys = Object.keys(profile);
    if (keys.length === 0) { el.innerHTML = '<p class="small-text">No data yet. Complete workouts to see your level profile.</p>'; return; }
    var html = '';
    var i, len;
    for (i = 0, len = keys.length; i < len; i++) {
      var p = profile[keys[i]];
      var total = p.easier + p.harder + p.standard + p.skipped;
      var level = p.harder > p.easier ? '↑ Strong' : p.easier > p.harder ? '↓ Building' : '→ On track';
      html += '<div class="level-row"><span class="label">' + keys[i] + '</span><span class="value">' + level + ' (' + total + ' sessions)</span></div>';
    }
    el.innerHTML = html;
  }

  // ===== TABS =====
  function switchTab(tab) {
    var c = document.querySelectorAll('.tab-content'), b = document.querySelectorAll('.nav-btn'), i, len;
    for (i = 0, len = c.length; i < len; i++) c[i].classList.remove('active');
    for (i = 0, len = b.length; i < len; i++) b[i].classList.remove('active');
    $('tab-' + tab).classList.add('active');
    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    var t = { workout: 'Workout', cardio: 'Cardio Timer', food: 'Food & Recipes', progress: 'Progress', config: 'Settings' };
    $('topbar-title').textContent = t[tab] || tab;
    if (tab === 'config') renderLevelSummary();
  }

  // ===== WORKOUT =====
  function loadWorkout(dayKey) {
    var wo = WORKOUTS[dayKey];
    if (!wo || wo.type !== 'strength') {
      $('exercise-card').classList.add('hidden');
      $('workout-complete').classList.add('hidden');
      $('rest-day-card').classList.remove('hidden');
      $('rest-day-title').textContent = wo ? wo.name : 'Rest Day';
      $('rest-day-desc').innerHTML = wo ? wo.description.replace(/\n/g, '<br>') : 'Take it easy today.';
      return;
    }
    st.wo = JSON.parse(JSON.stringify(wo));
    st.exIdx = 0; st.round = 1; st.resting = false;
    $('exercise-card').classList.remove('hidden');
    $('workout-complete').classList.add('hidden');
    $('rest-day-card').classList.add('hidden');
    renderEx();
  }

  function initWorkout() {
    $('topbar-day').textContent = todayLabel();
    buildDaySel();
    loadWorkout(st.overDay || todayKey());
  }

  function buildDaySel() {
    var sel = $('day-override'); if (!sel) return;
    sel.innerHTML = '';
    var today = new Date().getDay();
    var i, len;
    for (i = 0, len = DAY_LABELS.length; i < len; i++) {
      var o = document.createElement('option');
      o.value = DAYS[i];
      o.textContent = DAY_LABELS[i] + ' — ' + (WORKOUTS[DAYS[i]] ? WORKOUTS[DAYS[i]].name : 'Rest');
      if (i === today && !st.overDay) o.selected = true;
      if (st.overDay === DAYS[i]) o.selected = true;
      sel.appendChild(o);
    }
  }

  function overrideDay(d) { st.overDay = d; loadWorkout(d); }

  function renderEx() {
    var wo = st.wo; if (!wo) return;
    var ex = wo.exercises[st.exIdx]; if (!ex) return;
    $('workout-name').textContent = wo.name;
    $('workout-round').textContent = 'Round ' + st.round + '/' + wo.rounds;
    $('exercise-name').textContent = ex.name;
    $('exercise-reps').textContent = ex.reps;

    // Tips
    var tip = getTip(ex.name);
    $('exercise-muscles').textContent = tip.muscles;
    $('tip-breathing-text').textContent = tip.breathing;
    $('tip-posture-text').textContent = tip.posture;
    $('exercise-tips').classList.remove('hidden');
    $('btn-demo').classList.remove('hidden');
    $('btn-demo').dataset.demo = tip.demo;

    // Easier/Harder buttons
    $('btn-easier').style.display = ex.easier ? '' : 'none';
    $('btn-harder').style.display = ex.harder ? '' : 'none';

    // Timer
    $('rest-banner').classList.add('hidden');
    if (ex.timed) {
      $('exercise-timer-display').classList.remove('hidden');
      st.exTimeLeft = ex.timerSec || 30;
      $('exercise-countdown').textContent = fmt(st.exTimeLeft);
      $('btn-start-exercise').classList.remove('hidden');
    } else {
      $('exercise-timer-display').classList.add('hidden');
      $('btn-start-exercise').classList.add('hidden');
    }

    // Progress
    var total = wo.exercises.length * wo.rounds;
    var done = (st.round - 1) * wo.exercises.length + st.exIdx;
    var pct = Math.round((done / total) * 100);
    $('exercise-progress-bar').style.setProperty('--progress', pct + '%');
    $('exercise-progress-text').textContent = done + '/' + total;
  }

  function watchDemo() {
    var q = $('btn-demo').dataset.demo || 'exercise+form';
    window.open('https://www.youtube.com/results?search_query=' + q, '_blank');
  }

  function startExerciseTimer() {
    var ex = st.wo.exercises[st.exIdx];
    if (!ex || !ex.timed) return;
    beepStart(); say(ex.name + '. Go!'); vib(200);
    clearInterval(st.exTimer);
    st.exTimer = setInterval(function () {
      st.exTimeLeft--;
      $('exercise-countdown').textContent = fmt(st.exTimeLeft);
      if (st.exTimeLeft <= 3 && st.exTimeLeft > 0) beepTick();
      if (st.exTimeLeft <= 0) { clearInterval(st.exTimer); beepDone(); say('Done!'); vib([200, 100, 200]); }
    }, 1000);
    $('btn-start-exercise').classList.add('hidden');
  }

  function markDone() {
    if (st.resting) { clearInterval(st.restTimer); endRest(); return; }
    clearInterval(st.exTimer);
    logLevel(st.wo.exercises[st.exIdx].name, 'standard');
    advanceEx();
  }

  function advanceEx() {
    var wo = st.wo;
    var endOfRound = (st.exIdx + 1) >= wo.exercises.length;
    var restSec = endOfRound ? REST_ROUND : REST_EX;
    st.exIdx++;
    if (st.exIdx >= wo.exercises.length) {
      st.exIdx = 0; st.round++;
      if (st.round > wo.rounds) { completeWorkout(); return; }
    }
    showRest(restSec, endOfRound);
  }

  function showRest(sec, isRound) {
    st.resting = true;
    var label = isRound ? 'Round rest — ' + sec + 's' : 'Rest — ' + sec + 's';
    $('rest-banner').classList.remove('hidden');
    $('rest-label').textContent = label;
    $('rest-countdown').textContent = fmt(sec);
    $('exercise-tips').classList.add('hidden');
    $('btn-demo').classList.add('hidden');
    $('exercise-name').textContent = isRound ? '🔄 Round ' + st.round + ' next' : 'Rest';
    $('exercise-reps').textContent = 'Next: ' + st.wo.exercises[st.exIdx].name;
    $('exercise-muscles').textContent = '';
    $('btn-start-exercise').classList.add('hidden');
    $('exercise-timer-display').classList.add('hidden');
    $('btn-done').textContent = '⏩ Skip Rest';
    say(isRound ? 'Round rest. ' + sec + ' seconds.' : 'Rest.');
    vib(100);
    st.exTimeLeft = sec;
    clearInterval(st.restTimer);
    st.restTimer = setInterval(function () {
      st.exTimeLeft--;
      $('rest-countdown').textContent = fmt(st.exTimeLeft);
      if (st.exTimeLeft <= 3 && st.exTimeLeft > 0) beepTick();
      if (st.exTimeLeft <= 0) { clearInterval(st.restTimer); endRest(); }
    }, 1000);
  }

  function endRest() {
    st.resting = false; clearInterval(st.restTimer);
    $('rest-banner').classList.add('hidden');
    $('btn-done').textContent = '✓ Done';
    var ex = st.wo.exercises[st.exIdx];
    beepStart(); say(ex.name); vib(150);
    renderEx();
  }

  function skipExercise() {
    clearInterval(st.exTimer);
    logLevel(st.wo.exercises[st.exIdx].name, 'skipped');
    advanceEx();
  }

  function swapEasier() {
    var ex = st.wo.exercises[st.exIdx];
    if (!ex.easier) return;
    logLevel(ex.name, 'easier');
    ex.name = ex.easier.name; ex.reps = ex.easier.reps;
    if (ex.easier.timerSec) ex.timerSec = ex.easier.timerSec;
    ex.easier = null;
    say('Switched to ' + ex.name); renderEx();
  }

  function swapHarder() {
    var ex = st.wo.exercises[st.exIdx];
    if (!ex.harder) return;
    logLevel(ex.name, 'harder');
    ex.name = ex.harder.name; ex.reps = ex.harder.reps;
    if (ex.harder.timerSec) ex.timerSec = ex.harder.timerSec;
    ex.harder = null;
    say('Switched to ' + ex.name); renderEx();
  }

  function completeWorkout() {
    $('exercise-card').classList.add('hidden');
    $('workout-complete').classList.remove('hidden');
    $('workout-summary').textContent = st.wo.rounds + ' rounds × ' + st.wo.exercises.length + ' exercises — done!';
    var profile = getLevelProfile();
    var keys = Object.keys(profile);
    var easierCount = 0, harderCount = 0;
    var i, len;
    for (i = 0, len = keys.length; i < len; i++) { easierCount += profile[keys[i]].easier; harderCount += profile[keys[i]].harder; }
    $('workout-level-summary').textContent = 'Today: ' + easierCount + ' easier, ' + harderCount + ' harder swaps total across sessions';
    beepWin(); say('Workout complete! Great job!'); vib([200, 100, 200, 100, 400]);
    var log = loadJSON('workout_log', []);
    log.push({ date: ds(), workout: st.wo.name, rounds: st.wo.rounds });
    saveJSON('workout_log', log);
    autoSync();
  }

  function resetWorkout() { initWorkout(); }

  // ===== CARDIO =====
  function buildPhases(w) {
    var c = CARDIO_WEEKS[w]; if (!c) return [];
    var p = [{ type: 'warmup', label: 'WARM UP', dur: c.warmup }];
    var i, j, len, jLen;
    for (i = 0, len = c.repeats; i < len; i++)
      for (j = 0, jLen = c.intervals.length; j < jLen; j++)
        p.push({ type: c.intervals[j].type, label: c.intervals[j].type.toUpperCase(), dur: c.intervals[j].dur, round: i + 1 });
    p.push({ type: 'cooldown', label: 'COOL DOWN', dur: c.cooldown });
    return p;
  }

  function updateCardioPreview() {
    var w = parseInt($('cardio-week').value), c = CARDIO_WEEKS[w]; if (!c) return;
    var t = c.warmup + c.cooldown, i, len;
    for (i = 0, len = c.intervals.length; i < len; i++) t += c.intervals[i].dur * c.repeats;
    var d = 'Warmup: ' + fmt(c.warmup) + ' walk\n';
    for (i = 0, len = c.intervals.length; i < len; i++) d += c.intervals[i].type + ': ' + c.intervals[i].dur + 's × ' + c.repeats + '\n';
    d += 'Cooldown: ' + fmt(c.cooldown) + '\nTotal: ~' + fmt(t);
    $('cardio-preview').textContent = d;
  }

  function startCardio() {
    var w = parseInt($('cardio-week').value);
    st.cardioPhases = buildPhases(w); st.cardioPI = 0; st.cardioPaused = false;
    st.cardioTE = 0; st.cardioTD = 0;
    var i, len;
    for (i = 0, len = st.cardioPhases.length; i < len; i++) st.cardioTD += st.cardioPhases[i].dur;
    st.cardioTL = st.cardioPhases[0].dur;
    $('cardio-start-card').classList.add('hidden'); $('cardio-active').classList.remove('hidden');
    announcePhase();
    st.cardioIv = setInterval(tickCardio, 1000);
  }

  function announcePhase() {
    var p = st.cardioPhases[st.cardioPI], el = $('cardio-phase');
    el.textContent = p.label; el.className = 'cardio-phase ' + p.type;
    $('cardio-time').textContent = fmt(st.cardioTL);
    $('cardio-round-info').textContent = 'Phase ' + (st.cardioPI + 1) + '/' + st.cardioPhases.length;
    var nxt = st.cardioPhases[st.cardioPI + 1];
    $('cardio-next').textContent = nxt ? 'Next: ' + nxt.label + ' (' + nxt.dur + 's)' : 'Last phase!';
    say(p.label.toLowerCase());
    if (p.type === 'jog') { vib([300, 100, 300]); beepSwitch(); }
    else if (p.type === 'walk') { vib(200); beepSwitch(); }
    else beepStart();
  }

  function tickCardio() {
    if (st.cardioPaused) return;
    st.cardioTL--; st.cardioTE++;
    $('cardio-time').textContent = fmt(st.cardioTL);
    var pct = Math.round((st.cardioTE / st.cardioTD) * 100);
    $('cardio-total-bar').style.setProperty('--progress', pct + '%');
    $('cardio-total-text').textContent = fmt(st.cardioTE) + ' / ' + fmt(st.cardioTD);
    if (st.cardioTL <= 3 && st.cardioTL > 0) beepTick();
    if (st.cardioTL <= 0) {
      st.cardioPI++;
      if (st.cardioPI >= st.cardioPhases.length) { stopCardio(); beepWin(); say('Cardio complete!'); vib([200, 100, 200, 100, 400]); return; }
      st.cardioTL = st.cardioPhases[st.cardioPI].dur;
      announcePhase();
    }
  }

  function toggleCardioPause() { st.cardioPaused = !st.cardioPaused; $('btn-cardio-pause').textContent = st.cardioPaused ? '▶ Resume' : '⏸ Pause'; }
  function stopCardio() { clearInterval(st.cardioIv); $('cardio-active').classList.add('hidden'); $('cardio-start-card').classList.remove('hidden'); }

  // ===== FOOD =====
  function initFood() {
    var grid = $('ingredient-grid'); grid.innerHTML = '';
    var i, len;
    for (i = 0, len = INGREDIENTS.length; i < len; i++) {
      var d = document.createElement('div');
      d.className = 'ingredient-item'; d.textContent = INGREDIENTS[i]; d.dataset.ing = INGREDIENTS[i];
      d.addEventListener('click', toggleIng);
      grid.appendChild(d);
    }
    renderAllRecipes(); renderMealRefs();
  }

  function toggleIng(e) {
    var ing = e.currentTarget.dataset.ing;
    if (st.selIng.has(ing)) { st.selIng.delete(ing); e.currentTarget.classList.remove('selected'); }
    else { st.selIng.add(ing); e.currentTarget.classList.add('selected'); }
    filterRecipes();
  }

  function filterRecipes() {
    if (st.selIng.size === 0) { $('recipe-results').classList.add('hidden'); return; }
    var matches = [], i, len, j, jLen;
    for (i = 0, len = RECIPES.length; i < len; i++) {
      var r = RECIPES[i], ok = true;
      for (j = 0, jLen = r.need.length; j < jLen; j++) { if (!st.selIng.has(r.need[j])) { ok = false; break; } }
      if (ok) matches.push(r);
    }
    var c = $('recipe-list'); c.innerHTML = '';
    if (matches.length === 0) c.innerHTML = '<p class="small-text">No matches. Select more ingredients.</p>';
    else for (i = 0, len = matches.length; i < len; i++) c.appendChild(recipeCard(matches[i], true));
    $('recipe-results').classList.remove('hidden');
  }

  function recipeCard(r, withCook) {
    var d = document.createElement('div'); d.className = 'recipe-card';
    var rIdx = RECIPES.indexOf(r);
    // Find the main scalable ingredient (first one with g/ml unit)
    var scaleIng = null, scaleIdx = -1, i, len;
    for (i = 0, len = r.ingredients.length; i < len; i++) {
      var u = r.ingredients[i].unit;
      if (u === 'g' || u === 'g dry' || u === 'g cooked' || u === 'ml') { scaleIng = r.ingredients[i]; scaleIdx = i; break; }
    }
    // Scale bar (only for recipes with a scalable main ingredient)
    var scaleHtml = '';
    if (scaleIng && withCook) {
      scaleHtml = '<div class="recipe-scale mt-8">' +
        '<label class="small-text">I have <input type="number" class="scale-input" value="' + scaleIng.qty + '" min="1" inputmode="numeric" data-ridx="' + rIdx + '" data-sidx="' + scaleIdx + '" onchange="app.scaleRecipe(this)"> ' + scaleIng.unit + ' ' + scaleIng.item + '</label>' +
        '</div>';
    }
    // Ingredient list with quantities
    var ingHtml = '<div class="recipe-ing" data-ridx="' + rIdx + '"><strong>You need:</strong> ';
    var parts = [];
    for (i = 0, len = r.ingredients.length; i < len; i++) {
      var ing = r.ingredients[i];
      parts.push('<span class="ing-item">' + ing.qty + ' ' + ing.unit + ' ' + ing.item + '</span>');
    }
    ingHtml += parts.join(', ') + '</div>';
    // Steps
    var s = '<ol>', i2, len2;
    for (i2 = 0, len2 = r.steps.length; i2 < len2; i2++) s += '<li>' + r.steps[i2] + '</li>';
    s += '</ol>';
    d.innerHTML = '<h3>' + r.name + '</h3>' +
      '<div class="recipe-meta"><span>\u23F1 ' + r.time + ' min</span><span class="rc-cal">\uD83D\uDD25 ' + r.totalCal + ' cal</span><span class="rc-prot">\uD83D\uDCAA ' + r.protein + 'g P</span><span class="rc-serves">Serves ' + r.serves + '</span></div>' +
      scaleHtml + ingHtml +
      '<div class="recipe-steps">' + s + '</div>' +
      (withCook ? '<div class="recipe-portion mt-8">' +
        '<label class="small-text">I ate <select class="portion-select" data-recipe="' + r.name.replace(/'/g, "\\'") + '" data-totalcal="' + r.totalCal + '" data-serves="' + r.serves + '" data-protein="' + r.protein + '">' +
        portionOptions(r.serves) +
        '</select> portion(s)</label> ' +
        '<button class="btn btn-success" style="font-size:.78rem;padding:6px 12px" onclick="app.logRecipePortion(this)">\uD83C\uDF73 Log it</button>' +
      '</div>' : '');
    return d;
  }

  function scaleRecipe(input) {
    var rIdx = parseInt(input.dataset.ridx);
    var sIdx = parseInt(input.dataset.sidx);
    var r = RECIPES[rIdx];
    var originalQty = r.ingredients[sIdx].qty;
    var newQty = parseFloat(input.value) || originalQty;
    var ratio = newQty / originalQty;
    var scaledCal = Math.round(r.totalCal * ratio);
    var scaledProtein = Math.round(r.protein * ratio);
    var scaledServes = Math.round(r.serves * ratio * 10) / 10;
    // Update the card's ingredient list
    var card = input.closest('.recipe-card');
    var ingEl = card.querySelector('.recipe-ing');
    var parts = [], i, len;
    for (i = 0, len = r.ingredients.length; i < len; i++) {
      var ing = r.ingredients[i];
      var q = i === sIdx ? newQty : Math.round(ing.qty * ratio * 10) / 10;
      parts.push('<span class="ing-item">' + q + ' ' + ing.unit + ' ' + ing.item + '</span>');
    }
    ingEl.innerHTML = '<strong>You need:</strong> ' + parts.join(', ');
    // Update meta
    card.querySelector('.rc-cal').textContent = '\uD83D\uDD25 ' + scaledCal + ' cal';
    card.querySelector('.rc-prot').textContent = '\uD83D\uDCAA ' + scaledProtein + 'g P';
    card.querySelector('.rc-serves').textContent = 'Serves ' + scaledServes;
    // Update portion selector data attributes
    var sel = card.querySelector('.portion-select');
    if (sel) {
      sel.dataset.totalcal = scaledCal;
      sel.dataset.serves = scaledServes;
      sel.dataset.protein = scaledProtein;
      sel.innerHTML = portionOptions(Math.max(scaledServes, 2));
    }
  }

  function portionOptions(serves) {
    var opts = '', options = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4], i, len;
    for (i = 0, len = options.length; i < len; i++) {
      if (options[i] <= serves) {
        opts += '<option value="' + options[i] + '"' + (options[i] === 1 ? ' selected' : '') + '>' + options[i] + '</option>';
      }
    }
    return opts;
  }

  function logRecipePortion(btn) {
    var sel = btn.parentNode.querySelector('.portion-select');
    var portion = parseFloat(sel.value);
    var totalCal = parseInt(sel.dataset.totalcal);
    var serves = parseFloat(sel.dataset.serves);
    var protein = parseInt(sel.dataset.protein);
    var name = sel.dataset.recipe;
    var cal = Math.round((totalCal / serves) * portion);
    var prot = Math.round((protein / serves) * portion);
    // Add to calorie log
    var log = loadJSON('cal_' + ds(), []);
    log.push({ name: name + ' (' + portion + ' portion)', cal: cal, qty: 1, protein: prot });
    saveJSON('cal_' + ds(), log);
    renderCalorieLog();
    logCooking(name);
    toast(name + ': ' + cal + ' cal, ' + prot + 'g protein logged');
  }

  function renderAllRecipes() {
    var c = $('all-recipes'); c.innerHTML = '';
    var i, len;
    for (i = 0, len = RECIPES.length; i < len; i++) c.appendChild(recipeCard(RECIPES[i], false));
  }

  function renderMealRefs() {
    var i, len, h;
    // Breakfast
    h = '';
    for (i = 0, len = OFFICE_BF.length; i < len; i++) h += '<div class="meal-item"><h3>' + OFFICE_BF[i].name + '</h3><p>' + OFFICE_BF[i].desc + '</p></div>';
    $('breakfast-ref').innerHTML = h;
    // Lunch
    h = '';
    for (i = 0, len = OFFICE_LUNCH.length; i < len; i++) h += '<div class="meal-item"><h3>' + OFFICE_LUNCH[i].name + '</h3><p>' + OFFICE_LUNCH[i].desc + '</p></div>';
    $('lunch-ref').innerHTML = h;
    // Snacks
    h = '<div style="columns:2;font-size:.85rem">';
    for (i = 0, len = SNACKS.length; i < len; i++) h += '<div style="padding:4px 0">• ' + SNACKS[i] + '</div>';
    h += '</div>';
    $('snack-ref').innerHTML = h;
  }

  // ===== PROGRESS =====
  function saveEntry() {
    var e = {
      date: ds(),
      weight: parseFloat($('inp-weight').value) || null,
      soreness: parseInt($('inp-soreness').value) || null,
      energy: parseInt($('inp-energy').value) || null,
      steps: parseInt($('inp-steps').value) || null,
      stairs: $('inp-stairs').value,
      sleep: parseFloat($('inp-sleep').value) || null,
      notes: $('inp-notes').value
    };
    var entries = loadJSON('entries', []);
    var found = false, i, len;
    for (i = 0, len = entries.length; i < len; i++) { if (entries[i].date === e.date) { entries[i] = e; found = true; break; } }
    if (!found) entries.push(e);
    entries.sort(function (a, b) { return a.date.localeCompare(b.date); });
    saveJSON('entries', entries);
    renderCharts(); renderHistory(); beepDone(); toast('Entry saved!');
    $('inp-weight').value = ''; $('inp-soreness').value = '';
    $('inp-energy').value = ''; $('inp-steps').value = '';
    $('inp-sleep').value = ''; $('inp-notes').value = '';
    autoSync();
  }

  function renderCharts() {
    var entries = loadJSON('entries', []);
    var meas = loadJSON('measurements', []);

    // Weight + Soreness/Energy from daily entries
    if (entries.length > 0) {
      var labels = [], wt = [], sor = [], eng = [], i, len;
      for (i = 0, len = entries.length; i < len; i++) {
        var e = entries[i]; labels.push(e.date.slice(5));
        wt.push(e.weight); sor.push(e.soreness); eng.push(e.energy);
      }
      chart('chart-weight', labels, [{ label: 'Weight', data: wt, borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.1)', fill: true, tension: 0.3 }]);
      chart('chart-soreness', labels, [{ label: 'Soreness', data: sor, borderColor: '#e74c3c', tension: 0.3 }, { label: 'Energy', data: eng, borderColor: '#74b9ff', tension: 0.3 }]);
    }

    // Body measurements from measurement entries
    if (meas.length > 0) {
      var mLabels = [], wa = [], st2 = [], hp = [], th = [], bf = [], i2, len2;
      for (i2 = 0, len2 = meas.length; i2 < len2; i2++) {
        var m = meas[i2]; mLabels.push(m.date.slice(5));
        wa.push(m.waist); st2.push(m.stomach); hp.push(m.hip); th.push(m.thigh);
        if (m.waist && m.hip && m.neck) bf.push(parseFloat(calcBodyFat(m.waist, m.hip, m.neck).toFixed(1)));
        else bf.push(null);
      }
      chart('chart-measurements', mLabels, [
        { label: 'Waist', data: wa, borderColor: '#fdcb6e', tension: 0.3 },
        { label: 'Stomach', data: st2, borderColor: '#e74c3c', tension: 0.3 },
        { label: 'Hip', data: hp, borderColor: '#a29bfe', tension: 0.3 },
        { label: 'Thigh', data: th, borderColor: '#74b9ff', tension: 0.3 }
      ]);
      if (bf.length > 0) {
        chart('chart-bodyfat', mLabels, [{ label: 'Body Fat %', data: bf, borderColor: '#ff7675', backgroundColor: 'rgba(255,118,117,0.1)', fill: true, tension: 0.3 }]);
      }
    }
  }

  function chart(id, labels, datasets) {
    if (typeof Chart === 'undefined') return;
    if (st.charts[id]) st.charts[id].destroy();
    st.charts[id] = new Chart($(id).getContext('2d'), {
      type: 'line', data: { labels: labels, datasets: datasets },
      options: { responsive: true, maintainAspectRatio: true,
        plugins: { legend: { labels: { color: '#e8e8f0', font: { size: 11 } } } },
        scales: { x: { ticks: { color: '#9999b3', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  y: { ticks: { color: '#9999b3', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } } }
      }
    });
  }

  function renderHistory() {
    var entries = loadJSON('entries', []), c = $('history-list'); c.innerHTML = '';
    var i = entries.length;
    while (i--) {
      var e = entries[i], s = [];
      if (e.weight) s.push(e.weight + 'kg');
      if (e.steps) s.push(e.steps + ' steps');
      if (e.soreness) s.push('sore:' + e.soreness);
      if (e.energy) s.push('⚡' + e.energy);
      var d = document.createElement('div'); d.className = 'history-entry';
      d.innerHTML = '<div><span class="date">' + e.date + '</span> <span class="stats">' + s.join(' · ') + '</span></div>' +
        '<button class="del-btn" onclick="app.deleteEntry(\'' + e.date + '\')" title="Delete">×</button>';
      c.appendChild(d);
    }
  }

  function deleteEntry(date) {
    if (!confirm('Delete ' + date + '?')) return;
    var entries = loadJSON('entries', []).filter(function (e) { return e.date !== date; });
    saveJSON('entries', entries); renderCharts(); renderHistory();
  }

  // ===== COPY REPORTS =====
  function copyCheckin() {
    var entries = loadJSON('entries', []);
    var today = entries.find(function (e) { return e.date === ds(); });
    if (!today) { toast('No entry saved today yet'); return; }
    var t = '## Check-in: ' + today.date + '\n';
    if (today.weight) t += '- Weight: ' + today.weight + ' kg\n';
    if (today.soreness) t += '- Soreness: ' + today.soreness + '/10\n';
    if (today.energy) t += '- Energy: ' + today.energy + '/10\n';
    if (today.steps) t += '- Steps: ' + today.steps + '\n';
    t += '- Stairs: ' + today.stairs + '\n';
    if (today.sleep) t += '- Sleep: ' + today.sleep + ' hrs\n';
    if (today.notes) t += '- Notes: ' + today.notes + '\n';
    // Calories
    var calLog = loadJSON('cal_' + ds(), []);
    var calTotal = 0, ci, cLen;
    for (ci = 0, cLen = calLog.length; ci < cLen; ci++) calTotal += calLog[ci].cal;
    if (calTotal > 0) t += '- Calories: ' + calTotal + ' / ' + getCalTarget() + '\n';
    // Walk checklist
    var wl = loadJSON('wl_' + ds(), {});
    var walksDone = 0;
    for (ci = 0, cLen = WALK_TIMES.length; ci < cLen; ci++) { if (wl[WALK_TIMES[ci].id]) walksDone++; }
    t += '- Walks: ' + walksDone + '/5 (' + (walksDone * 50) + ' cal)\n';
    // Add workout log
    var wl = loadJSON('workout_log', []).filter(function (w) { return w.date === ds(); });
    if (wl.length > 0) t += '- Workout: ' + wl[0].workout + '\n';
    copyText(t);
  }

  function copyWeeklyReport() {
    var entries = loadJSON('entries', []);
    var wl = loadJSON('workout_log', []);
    var ll = loadJSON('level_log', []);
    var cl = loadJSON('cook_log', []);
    var now = new Date(), weekAgo = new Date(now - 7 * 86400000);
    var wkStr = weekAgo.toISOString().slice(0, 10);

    var wkEntries = entries.filter(function (e) { return e.date >= wkStr; });
    var wkWorkouts = wl.filter(function (w) { return w.date >= wkStr; });
    var wkLevels = ll.filter(function (l) { return l.date >= wkStr; });
    var wkCooks = cl.filter(function (c) { return c.date >= wkStr; });

    var t = '# Weekly Report: ' + wkStr + ' to ' + ds() + '\n\n';

    // Measurements
    t += '## Measurements\n';
    if (wkEntries.length > 0) {
      var first = wkEntries[0], last = wkEntries[wkEntries.length - 1];
      if (first.weight && last.weight) t += '- Weight: ' + first.weight + ' → ' + last.weight + ' kg (' + (last.weight - first.weight > 0 ? '+' : '') + (last.weight - first.weight).toFixed(1) + ')\n';
      if (first.waist && last.waist) t += '- Waist: ' + first.waist + '" → ' + last.waist + '"\n';
      if (first.arm && last.arm) t += '- Arm: ' + first.arm + '" → ' + last.arm + '"\n';
    }

    // Workouts
    t += '\n## Workouts (' + wkWorkouts.length + ' sessions)\n';
    var i, len;
    for (i = 0, len = wkWorkouts.length; i < len; i++) t += '- ' + wkWorkouts[i].date + ': ' + wkWorkouts[i].workout + '\n';

    // Level profile
    t += '\n## Exercise Level Choices (this week)\n';
    var profile = {};
    for (i = 0, len = wkLevels.length; i < len; i++) {
      var ex = wkLevels[i].exercise;
      if (!profile[ex]) profile[ex] = { easier: 0, harder: 0, standard: 0, skipped: 0 };
      profile[ex][wkLevels[i].choice]++;
    }
    var pKeys = Object.keys(profile);
    for (i = 0, len = pKeys.length; i < len; i++) {
      var p = profile[pKeys[i]];
      t += '- ' + pKeys[i] + ': standard=' + p.standard + ' easier=' + p.easier + ' harder=' + p.harder + ' skipped=' + p.skipped + '\n';
    }

    // Cooking
    t += '\n## Dinners Cooked\n';
    if (wkCooks.length === 0) t += '- No cooking tracked\n';
    else {
      var counts = {};
      for (i = 0, len = wkCooks.length; i < len; i++) { counts[wkCooks[i].recipe] = (counts[wkCooks[i].recipe] || 0) + 1; }
      var cKeys = Object.keys(counts);
      for (i = 0, len = cKeys.length; i < len; i++) t += '- ' + cKeys[i] + ' × ' + counts[cKeys[i]] + '\n';
    }

    // Averages
    t += '\n## Daily Averages\n';
    if (wkEntries.length > 0) {
      var avg = function (key) { var s = 0, c = 0; for (var j = 0, jl = wkEntries.length; j < jl; j++) { if (wkEntries[j][key]) { s += wkEntries[j][key]; c++; } } return c > 0 ? (s / c).toFixed(1) : 'N/A'; };
      t += '- Steps: ' + avg('steps') + '\n';
      t += '- Soreness: ' + avg('soreness') + '/10\n';
      t += '- Energy: ' + avg('energy') + '/10\n';
      t += '- Sleep: ' + avg('sleep') + ' hrs\n';
    }

    copyText(t);
  }

  // ===== CHECKLIST =====
  function saveChecklist() {
    saveJSON('cl_' + ds(), {
      stairs: $('chk-stairs').checked, water: $('chk-water').checked,
      protein: $('chk-protein').checked, steps: $('chk-steps').checked
    });
  }

  function loadChecklist() {
    var d = loadJSON('cl_' + ds(), {});
    $('chk-stairs').checked = d.stairs || false;
    $('chk-water').checked = d.water || false;
    $('chk-protein').checked = d.protein || false;
    $('chk-steps').checked = d.steps || false;
  }

  // ===== MOVEMENT REMINDER =====
  function toggleMovementReminder() {
    if ($('chk-movement-reminder').checked) {
      if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
      st.moveIv = setInterval(function () {
        var h = new Date().getHours();
        if (h >= 9 && h < 18) {
          vib([200, 100, 200]); beepSwitch();
          if ('Notification' in window && Notification.permission === 'granted')
            new Notification('Movement Break!', { body: 'Walk, climb 1 floor, or 10 chair squats.', tag: 'move' });
        }
      }, 3600000);
      $('reminder-status').textContent = 'Active — hourly 9AM–6PM';
    } else { clearInterval(st.moveIv); $('reminder-status').textContent = ''; }
  }

  // ===== GOOGLE SHEETS SYNC =====
  function saveSheetURL() { saveJSON('sheet_url', $('inp-sheet-url').value); toast('Sheet URL saved'); }

  function autoSync() {
    var url = loadJSON('sheet_url', '');
    if (!url) return;
    syncToSheet(url);
  }

  function syncNow() {
    var url = $('inp-sheet-url').value || loadJSON('sheet_url', '');
    if (!url) { $('sync-status').textContent = 'No URL set'; return; }
    saveJSON('sheet_url', url);
    syncToSheet(url);
  }

  function syncToSheet(url) {
    var payload = {
      type: 'sync',
      date: ds(),
      entries: loadJSON('entries', []),
      workout_log: loadJSON('workout_log', []),
      level_log: loadJSON('level_log', []),
      cook_log: loadJSON('cook_log', []),
      measurements: loadJSON('measurements', []),
      calories: loadJSON('cal_' + ds(), [])
    };
    $('sync-status').textContent = 'Syncing...';
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () {
      $('sync-status').textContent = 'Synced at ' + new Date().toLocaleTimeString();
    }).catch(function (err) {
      $('sync-status').textContent = 'Sync failed: ' + err.message;
    });
  }

  // ===== MD CONFIG IMPORT =====
  function importMD() {
    var md = $('md-input').value;
    if (!md.trim()) { $('md-status').textContent = 'No content.'; return; }
    saveJSON('custom_md', md);
    $('md-status').textContent = 'Plan saved! Exercises/meals can be updated in future versions.';
    beepDone();
  }

  function loadMDFile(e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function (ev) { $('md-input').value = ev.target.result; importMD(); };
    r.readAsText(f);
  }

  // ===== DATA =====
  function exportData() {
    var d = { entries: loadJSON('entries', []), workout_log: loadJSON('workout_log', []), level_log: loadJSON('level_log', []), cook_log: loadJSON('cook_log', []), exported: new Date().toISOString() };
    var b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a'); a.href = u; a.download = 'swati-fitness-' + ds() + '.json'; a.click();
    URL.revokeObjectURL(u);
  }

  function clearData() {
    if (!confirm('Delete ALL data? Cannot undo.')) return;
    var keys = Object.keys(localStorage), i, len;
    for (i = 0, len = keys.length; i < len; i++) { if (keys[i].indexOf('sf_') === 0) localStorage.removeItem(keys[i]); }
    renderCharts(); renderHistory(); loadChecklist(); toast('Data cleared');
  }

  // ===== MORNING ROUTINE =====
  function renderMorning() {
    var c = $('morning-routine'); if (!c) return;
    var h = '', i, len;
    for (i = 0, len = MORNING_ROUTINE.length; i < len; i++)
      h += '<div style="padding:5px 0;border-bottom:1px solid var(--bg3);font-size:.88rem">• ' + MORNING_ROUTINE[i] + '</div>';
    c.innerHTML = h;
  }

  // ===== SORENESS CALCULATOR =====
  var SORENESS_LABELS = {
    1: 'Barely notice, muscles feel normal',
    2: 'Barely notice, muscles feel normal',
    3: 'Mild tightness, goes away once you move',
    4: 'Mild tightness, goes away once you move',
    5: 'Noticeable ache during movement',
    6: 'Noticeable ache during movement',
    7: 'Painful during normal activities',
    8: 'Painful during normal activities',
    9: 'Can barely move the area, sharp pain',
    10: 'Can barely move the area, sharp pain'
  };

  function updateSorenessCalc() {
    var legs = parseInt($('sore-legs').value);
    var arms = parseInt($('sore-arms').value);
    var stairs = parseInt($('sore-stairs').value);
    $('sore-legs-val').textContent = legs;
    $('sore-arms-val').textContent = arms;
    $('sore-stairs-val').textContent = stairs;
    var max = Math.max(legs, arms, stairs);
    $('soreness-score').textContent = max;
    $('soreness-label').textContent = SORENESS_LABELS[max] || '';
    // Color code
    var color = max <= 4 ? 'var(--accent)' : max <= 6 ? 'var(--warn)' : 'var(--danger)';
    $('soreness-score').style.color = color;
  }

  function applySoreness() {
    var max = parseInt($('soreness-score').textContent);
    $('inp-soreness').value = max;
    toast('Soreness set to ' + max + '/10');
  }

  // ===== CALORIE TRACKER =====
  var FOOD_DB = [
    // Breakfast
    { name: '2 Eggs (boiled/omelette)', cal: 155, protein: 12 },
    { name: '3 Eggs (boiled/omelette)', cal: 232, protein: 18 },
    { name: 'Egg Bhurji (2 eggs)', cal: 200, protein: 12 },
    { name: '1 Dosa (plain)', cal: 120, protein: 3 },
    { name: '1 Dosa (small 10cm)', cal: 70, protein: 2 },
    { name: '2 Dosa', cal: 240, protein: 6 },
    { name: '1 Idli', cal: 60, protein: 2 },
    { name: '2 Idli + Sambar', cal: 180, protein: 6 },
    { name: 'Oats + Milk', cal: 220, protein: 8 },
    { name: '1 Chapathi', cal: 100, protein: 3 },
    { name: '2 Chapathi', cal: 200, protein: 6 },
    { name: '1 Toast + Butter', cal: 130, protein: 3 },
    // Lunch
    { name: 'Rice (1 fist / small)', cal: 180, protein: 3 },
    { name: 'Rice (medium bowl)', cal: 280, protein: 5 },
    { name: 'Onion Pulao (1 bowl)', cal: 250, protein: 5 },
    { name: 'Curd Rice (1 bowl)', cal: 200, protein: 6 },
    { name: 'Curd Rice (1.5 bowl)', cal: 300, protein: 9 },
    { name: 'Dal (1 bowl)', cal: 150, protein: 8 },
    { name: 'Sambar (1 bowl)', cal: 120, protein: 4 },
    { name: 'Chicken curry (1 serving)', cal: 250, protein: 25 },
    { name: 'Egg curry (2 eggs)', cal: 220, protein: 14 },
    { name: 'Vegetable side (sautéed)', cal: 80, protein: 2 },
    { name: 'Beetroot Thoran', cal: 90, protein: 2 },
    { name: 'Kovakka Thoran', cal: 70, protein: 1 },
    { name: 'Gobi Curry', cal: 110, protein: 3 },
    { name: 'Fried rice (small)', cal: 350, protein: 8 },
    // Protein
    { name: 'Chicken (100g grilled/stir fry)', cal: 165, protein: 31 },
    { name: 'Sardine Fry (1 pc)', cal: 80, protein: 10 },
    { name: 'Sardine Fry (3 pcs)', cal: 240, protein: 30 },
    { name: 'Paneer (50g)', cal: 130, protein: 9 },
    { name: 'Curd (1 bowl / 200g)', cal: 100, protein: 6 },
    { name: 'Greek Yogurt (150g)', cal: 130, protein: 15 },
    { name: 'Buttermilk (1 glass)', cal: 40, protein: 2 },
    { name: 'Milk (1 glass)', cal: 120, protein: 6 },
    { name: 'Kanjipayar/Green Gram (1 bowl)', cal: 100, protein: 7 },
    // Snacks
    { name: 'Roasted Chana (30g)', cal: 110, protein: 7 },
    { name: 'Seed Laddu (1 pc, 3cm)', cal: 65, protein: 2 },
    { name: 'Apple', cal: 70, protein: 0 },
    { name: 'Orange', cal: 60, protein: 1 },
    { name: 'Watermelon (1 bowl)', cal: 50, protein: 1 },
    { name: 'Almonds (10 pcs)', cal: 70, protein: 3 },
    { name: 'Biscuits (2 pcs)', cal: 80, protein: 1 },
    { name: 'Dragon Chicken (1 serving)', cal: 280, protein: 22 },
    { name: 'Chai (with milk, sugar)', cal: 60, protein: 1 },
    { name: 'Chai (without sugar)', cal: 30, protein: 1 },
    { name: 'Coffee (black)', cal: 5, protein: 0 },
    { name: 'Coffee (milk, sugar)', cal: 70, protein: 1 },
    { name: 'Filter Coffee + Palm Sugar', cal: 50, protein: 1 },
    // Dinner combos
    { name: 'Dosa + Egg Roll', cal: 300, protein: 10 },
    // Misc
    { name: 'Juice (1 glass)', cal: 120, protein: 0 },
    { name: 'Soft Drink (1 can)', cal: 140, protein: 0 },
    { name: 'Outside Biryani (1 plate)', cal: 550, protein: 25 },
    { name: 'Outside Fried Rice', cal: 450, protein: 10 },
    { name: 'Outside Burger', cal: 400, protein: 15 },
    { name: 'Chocolate (small bar)', cal: 200, protein: 2 },
    { name: 'Ice Cream (1 scoop)', cal: 150, protein: 2 },
    { name: 'Custom (100 cal)', cal: 100, protein: 0 }
  ];

  // BMR: Mifflin-St Jeor for women: 10 * weight + 6.25 * height - 5 * age - 161
  var USER_HEIGHT = 163, USER_AGE = 26;

  function calcBMR(weightKg) {
    return Math.round(10 * weightKg + 6.25 * USER_HEIGHT - 5 * USER_AGE - 161);
  }

  function getCalTarget() {
    var day = todayKey();
    // Sunday = rest day (1200-1300), Mon-Sat = workout days (1400-1500)
    return day === 'sunday' ? 1250 : 1450;
  }

  function initCalorieTracker() {
    var sel = $('cal-food-select'); if (!sel) return;
    sel.innerHTML = '<option value="">— Add food item —</option>';
    var i, len;
    for (i = 0, len = FOOD_DB.length; i < len; i++) {
      var o = document.createElement('option');
      o.value = i;
      o.textContent = FOOD_DB[i].name + ' (' + FOOD_DB[i].cal + ' cal, ' + FOOD_DB[i].protein + 'g P)';
      sel.appendChild(o);
    }
    renderCalorieLog();
  }

  function addCalorie() {
    var idx = parseInt($('cal-food-select').value);
    if (isNaN(idx)) return;
    var qty = parseInt($('cal-qty').value) || 1;
    var food = FOOD_DB[idx];
    var log = loadJSON('cal_' + ds(), []);
    log.push({ name: food.name, cal: food.cal * qty, qty: qty, protein: (food.protein || 0) * qty });
    saveJSON('cal_' + ds(), log);
    $('cal-food-select').value = '';
    $('cal-qty').value = '1';
    renderCalorieLog();
    toast(food.name + ' added');
  }

  function removeCalorie(index) {
    var log = loadJSON('cal_' + ds(), []);
    log.splice(index, 1);
    saveJSON('cal_' + ds(), log);
    renderCalorieLog();
  }

  function renderCalorieLog() {
    var log = loadJSON('cal_' + ds(), []);
    var total = 0, totalProtein = 0, i, len;
    for (i = 0, len = log.length; i < len; i++) {
      total += log[i].cal;
      totalProtein += (log[i].protein || 0);
    }

    var weight = getLatestWeight();
    var bmr = calcBMR(weight);
    var target = getCalTarget();
    var remain = target - total;

    $('cal-bmr').textContent = bmr.toLocaleString();
    $('cal-target').textContent = target.toLocaleString();
    $('cal-eaten').textContent = total.toLocaleString();
    $('cal-remain').textContent = remain > 0 ? remain.toLocaleString() : 'OVER by ' + Math.abs(remain);
    $('cal-remain').parentNode.querySelector('span:last-child').style.color = remain >= 0 ? 'var(--accent)' : 'var(--danger)';
    var protEl = $('cal-protein');
    if (protEl) protEl.textContent = totalProtein + 'g / 80g';

    var pct = Math.min((total / target) * 100, 100);
    var bar = $('cal-bar');
    bar.style.width = pct + '%';
    bar.className = 'cal-bar' + (total > target ? ' over' : '');

    var c = $('cal-log'); c.innerHTML = '';
    for (i = 0, len = log.length; i < len; i++) {
      var d = document.createElement('div'); d.className = 'cal-log-item';
      var pStr = log[i].protein ? ' · ' + log[i].protein + 'g P' : '';
      d.innerHTML = '<span>' + log[i].name + (log[i].qty > 1 ? ' ×' + log[i].qty : '') + '</span><span>' + log[i].cal + ' cal' + pStr + ' <button onclick="app.removeCalorie(' + i + ')">×</button></span>';
      c.appendChild(d);
    }
  }

  function getLatestWeight() {
    var entries = loadJSON('entries', []);
    var i = entries.length;
    while (i--) { if (entries[i].weight) return entries[i].weight; }
    return 66; // default starting weight
  }

  // ===== MEASUREMENTS =====
  var STARTING_MEASUREMENTS = { bust: 98, upperarm: 32, armhole: 36, neck: 32, waist: 83, stomach: 94, hip: 108, thigh: 57 };

  function saveMeasurements() {
    var m = {
      date: ds(),
      bust: parseFloat($('inp-bust').value) || null,
      upperarm: parseFloat($('inp-upperarm').value) || null,
      armhole: parseFloat($('inp-armhole').value) || null,
      neck: parseFloat($('inp-neck').value) || null,
      waist: parseFloat($('inp-waist').value) || null,
      stomach: parseFloat($('inp-stomach').value) || null,
      hip: parseFloat($('inp-hip').value) || null,
      thigh: parseFloat($('inp-thigh').value) || null
    };
    var meas = loadJSON('measurements', []);
    var found = false, i, len;
    for (i = 0, len = meas.length; i < len; i++) { if (meas[i].date === m.date) { meas[i] = m; found = true; break; } }
    if (!found) meas.push(m);
    meas.sort(function (a, b) { return a.date.localeCompare(b.date); });
    saveJSON('measurements', meas);

    // Calculate body fat if waist, hip, neck available
    if (m.waist && m.hip && m.neck) {
      var bf = calcBodyFat(m.waist, m.hip, m.neck);
      $('bf-result').textContent = 'Estimated body fat: ' + bf.toFixed(1) + '% (Navy formula, pear-adjusted)';
    }

    // Clear inputs
    var fields = ['bust', 'upperarm', 'armhole', 'neck', 'waist', 'stomach', 'hip', 'thigh'];
    for (i = 0, len = fields.length; i < len; i++) { var inp = $('inp-' + fields[i]); if (inp) inp.value = ''; }

    renderCharts();
    beepDone(); toast('Measurements saved!');
    autoSync();
  }

  function calcBodyFat(waist, hip, neck) {
    // Navy formula for women: 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
    var bf = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(USER_HEIGHT) - 78.387;
    return Math.max(bf - 2.5, 5); // subtract 2-3% for pear shape overestimation, floor at 5%
  }

  // ===== WALK NOTIFICATIONS =====
  var WALK_TIMES = [
    { id: '1030', hour: 10, min: 30, label: '10:30 AM — Stair climb + walk' },
    { id: '1300', hour: 13, min: 0, label: '1:00 PM — Pre-lunch walk' },
    { id: '1330', hour: 13, min: 30, label: '1:30 PM — Post-lunch stair climb' },
    { id: '1500', hour: 15, min: 0, label: '3:00 PM — Snack break walk' },
    { id: '1830', hour: 18, min: 30, label: '6:30 PM — End-of-day walk' }
  ];

  var walkNotifIv = null;

  function enableWalkNotifications() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    if (walkNotifIv) clearInterval(walkNotifIv);
    walkNotifIv = setInterval(checkWalkNotifications, 60000);
    toast('Walk notifications enabled');
  }

  function checkWalkNotifications() {
    var now = new Date(), h = now.getHours(), m = now.getMinutes();
    var wl = loadJSON('wl_' + ds(), {});
    var i, len;
    for (i = 0, len = WALK_TIMES.length; i < len; i++) {
      var w = WALK_TIMES[i];
      if (h === w.hour && m === w.min && !wl[w.id]) {
        vib([200, 100, 200]); beepSwitch();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Walk Time!', { body: w.label + ' (10 min, ~50 cal)', tag: 'walk-' + w.id });
        }
      }
    }
  }

  function saveWalkChecklist() {
    var wl = {};
    var checked = 0, i, len;
    for (i = 0, len = WALK_TIMES.length; i < len; i++) {
      var chk = $('chk-walk-' + WALK_TIMES[i].id);
      if (chk) { wl[WALK_TIMES[i].id] = chk.checked; if (chk.checked) checked++; }
    }
    saveJSON('wl_' + ds(), wl);
    $('walk-cal-total').textContent = (checked * 50) + '/250 cal';
  }

  function loadWalkChecklist() {
    var wl = loadJSON('wl_' + ds(), {});
    var checked = 0, i, len;
    for (i = 0, len = WALK_TIMES.length; i < len; i++) {
      var chk = $('chk-walk-' + WALK_TIMES[i].id);
      if (chk) { chk.checked = wl[WALK_TIMES[i].id] || false; if (chk.checked) checked++; }
    }
    var el = $('walk-cal-total');
    if (el) el.textContent = (checked * 50) + '/250 cal';
  }

  // ===== INIT =====
  function init() {
    checkPinSession();
    $('topbar-day').textContent = todayLabel();
    initWorkout();
    renderMorning();
    updateCardioPreview();
    initFood();
    loadChecklist();
    loadWalkChecklist();
    initCalorieTracker();
    renderCharts();
    renderHistory();
    // Load saved sheet URL
    var savedURL = loadJSON('sheet_url', '');
    if (savedURL && $('inp-sheet-url')) $('inp-sheet-url').value = savedURL;
  }

  document.addEventListener('DOMContentLoaded', init);

  // ===== PUBLIC API =====
  return {
    pinKey: pinKey, pinDel: pinDel,
    switchTab: switchTab, overrideDay: overrideDay,
    startExerciseTimer: startExerciseTimer, markDone: markDone,
    swapEasier: swapEasier, swapHarder: swapHarder,
    skipExercise: skipExercise, resetWorkout: resetWorkout,
    watchDemo: watchDemo,
    startCardio: startCardio, toggleCardioPause: toggleCardioPause,
    stopCardio: stopCardio, updateCardioPreview: updateCardioPreview,
    saveEntry: saveEntry, deleteEntry: deleteEntry,
    copyCheckin: copyCheckin, copyWeeklyReport: copyWeeklyReport,
    saveChecklist: saveChecklist, toggleMovementReminder: toggleMovementReminder,
    saveSheetURL: saveSheetURL, syncNow: syncNow,
    importMD: importMD, loadMDFile: loadMDFile,
    exportData: exportData, clearData: clearData,
    updateSorenessCalc: updateSorenessCalc, applySoreness: applySoreness,
    addCalorie: addCalorie, removeCalorie: removeCalorie,
    saveMeasurements: saveMeasurements,
    saveWalkChecklist: saveWalkChecklist, enableWalkNotifications: enableWalkNotifications,
    logRecipePortion: logRecipePortion,
    scaleRecipe: scaleRecipe
  };
})();
