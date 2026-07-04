// Global State to store calculation results
let calcResults = {
  gender: '',
  age: 0,
  weight: 0,
  height: 0,
  activity: '',
  bmr: 0,
  tdee: 0,
  multiplier: 1.2
};

document.getElementById('calorie-form').addEventListener('submit', function(e){
  document.getElementById('results').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  
  // Smooth scroll to loading section
  document.querySelector('.calc').scrollIntoView({ behavior: 'smooth' });

  setTimeout(calculateCalories, 1500);
  e.preventDefault();
});

function calculateCalories() {
  const ageEl = document.getElementById('age');
  const genderEl = document.querySelector('input[name="gender"]:checked');
  const weightEl = document.getElementById('weight');
  const heightEl = document.getElementById('height');
  const activityEl = document.getElementById('list').value;
  
  if (!genderEl) {
    errorMessage('Please select your gender');
    return;
  }
  
  const age = parseFloat(ageEl.value);
  const weight = parseFloat(weightEl.value);
  const height = parseFloat(heightEl.value);

  if (isNaN(age) || isNaN(weight) || isNaN(height) || age < 15 || age > 80) {
    errorMessage('Please make sure the values you entered are correct (Age must be between 15 and 80)');
    return;
  }

  // Calculate BMR using Harris-Benedict formula
  let bmr = 0;
  let formulaStr = '';
  
  if (genderEl.id === 'male') {
    bmr = 66.47 + (13.75 * weight) + (5.003 * height) - (6.755 * age);
    formulaStr = `BMR = 66.47 + (13.75 × ${weight}kg) + (5.00 × ${height}cm) - (6.76 × ${age}yrs) = ${Math.round(bmr)} kcal`;
  } else {
    bmr = 655.1 + (9.563 * weight) + (1.85 * height) - (4.676 * age);
    formulaStr = `BMR = 655.1 + (9.56 × ${weight}kg) + (1.85 × ${height}cm) - (4.68 × ${age}yrs) = ${Math.round(bmr)} kcal`;
  }

  // Multipliers
  let multiplier = 1.2;
  let activityStr = 'Sedentary';
  if (activityEl === "2") { multiplier = 1.375; activityStr = 'Lightly Active'; }
  else if (activityEl === "3") { multiplier = 1.55; activityStr = 'Moderately Active'; }
  else if (activityEl === "4") { multiplier = 1.725; activityStr = 'Very Active'; }
  else if (activityEl === "5") { multiplier = 1.9; activityStr = 'Extra Active'; }

  const tdee = bmr * multiplier;

  // Save to global state
  calcResults = {
    gender: genderEl.id,
    age,
    weight,
    height,
    activity: activityEl,
    bmr,
    tdee,
    multiplier
  };

  // Render mathematical details
  document.getElementById('bmr-formula-text').textContent = formulaStr;
  document.getElementById('tdee-formula-text').textContent = `TDEE = BMR × ${multiplier} (${activityStr}) = ${Math.round(tdee)} kcal`;

  // Render dashboard with maintenance goal initially
  changeGoal('maintain');

  document.getElementById('results').style.display = 'block';
  document.getElementById('loading').style.display = 'none';

  // Smooth scroll to results
  document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Handles switching fitness goals
function changeGoal(goal) {
  // Toggle active button class
  document.querySelectorAll('.goal-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`goal-${goal}`).classList.add('active');

  let targetCalories = Math.round(calcResults.tdee);
  let pRatio = 2.0; // g of protein per kg of bodyweight
  let fPct = 0.25; // 25% fat

  if (goal === 'lose') {
    targetCalories = Math.round(calcResults.tdee - 500);
    pRatio = 2.2; // higher protein for muscle retention
    fPct = 0.20; // 20% fat
  } else if (goal === 'gain') {
    targetCalories = Math.round(calcResults.tdee + 400);
    pRatio = 2.0;
    fPct = 0.25;
  }

  // Prevent calories going too low
  if (targetCalories < 1200) targetCalories = 1200;

  // Render calories target
  document.getElementById('display-calories').textContent = targetCalories.toLocaleString();

  // Macros Calculation
  const weight = calcResults.weight;
  
  // 1. Protein: 4 kcal/g
  const proteinGrams = Math.round(weight * pRatio);
  const proteinKcal = proteinGrams * 4;

  // 2. Fat: 9 kcal/g
  const fatKcal = targetCalories * fPct;
  const fatGrams = Math.round(fatKcal / 9);

  // 3. Carbs: Remaining calories, 4 kcal/g
  const carbsKcal = targetCalories - (proteinKcal + (fatGrams * 9));
  const carbsGrams = Math.max(0, Math.round(carbsKcal / 4));

  // Render values
  document.getElementById('macro-protein-val').textContent = `${proteinGrams}g`;
  document.getElementById('macro-carbs-val').textContent = `${carbsGrams}g`;
  document.getElementById('macro-fats-val').textContent = `${fatGrams}g`;

  // Visual Progress bar widths
  const proteinPct = Math.min(100, Math.round((proteinKcal / targetCalories) * 100));
  const fatPct = Math.min(100, Math.round(((fatGrams * 9) / targetCalories) * 100));
  const carbsPct = Math.min(100, Math.round((carbsKcal / targetCalories) * 100));

  document.getElementById('macro-protein-bar').style.width = `${proteinPct}%`;
  document.getElementById('macro-carbs-bar').style.width = `${carbsPct}%`;
  document.getElementById('macro-fats-bar').style.width = `${fatPct}%`;

  // Inject Recommendations based on calculations
  generateMealSuggestions(targetCalories, proteinGrams, carbsGrams, fatGrams);
  generateWorkoutSuggestions(calcResults.activity);
}

// Generates dynamic meal suggestions
function generateMealSuggestions(totalKcal, p, c, f) {
  const list = document.getElementById('diet-suggestions-list');
  list.innerHTML = ''; // clear

  const meals = [
    {
      name: 'Breakfast (30% Daily Target)',
      kcal: Math.round(totalKcal * 0.3),
      desc: 'Oatmeal with whey protein, chia seeds, and fresh berries.',
      macros: `P: ${Math.round(p * 0.3)}g | C: ${Math.round(c * 0.3)}g | F: ${Math.round(f * 0.3)}g`
    },
    {
      name: 'Lunch (35% Daily Target)',
      kcal: Math.round(totalKcal * 0.35),
      desc: 'Grilled chicken breast with basmati rice, broccoli, and olive oil dressing.',
      macros: `P: ${Math.round(p * 0.35)}g | C: ${Math.round(c * 0.35)}g | F: ${Math.round(f * 0.35)}g`
    },
    {
      name: 'Dinner (25% Daily Target)',
      kcal: Math.round(totalKcal * 0.25),
      desc: 'Baked salmon fillet with sweet potato mash and asparagus salad.',
      macros: `P: ${Math.round(p * 0.25)}g | C: ${Math.round(c * 0.25)}g | F: ${Math.round(f * 0.25)}g`
    },
    {
      name: 'Snack (10% Daily Target)',
      kcal: Math.round(totalKcal * 0.1),
      desc: 'Low-fat Greek yogurt with almond slices and honey.',
      macros: `P: ${Math.round(p * 0.1)}g | C: ${Math.round(c * 0.1)}g | F: ${Math.round(f * 0.1)}g`
    }
  ];

  meals.forEach(meal => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="sugg-header">
        <strong>${meal.name}</strong>
        <span class="sugg-kcal">${meal.kcal} kcal</span>
      </div>
      <p class="sugg-desc">${meal.desc}</p>
      <span class="sugg-macros">${meal.macros}</span>
    `;
    list.appendChild(li);
  });
}

// Generates dynamic workout recommendations
function generateWorkoutSuggestions(activity) {
  const list = document.getElementById('workout-suggestions-list');
  list.innerHTML = ''; // clear

  let routine = [];
  if (activity === "1") {
    routine = [
      { day: 'Mon/Wed/Fri', title: 'Active Mobility & Walking', desc: '45 mins brisk walking + 10 mins dynamic body stretching.' },
      { day: 'Tue/Thu', title: 'Home Bodyweight Circuit', desc: '3 sets of: 10 body squats, 8 wall pushups, 15s plank.' }
    ];
  } else if (activity === "2") {
    routine = [
      { day: 'Mon/Wed/Fri', title: 'Full Body Resistance', desc: 'Squats, Pushups, Dumbbell rows, Planks (3 sets x 12 reps).' },
      { day: 'Tue/Thu', title: 'LISS Cardio', desc: '30 mins light cycling or swimming at 60-70% max heart rate.' }
    ];
  } else if (activity === "3") {
    routine = [
      { day: 'Mon/Thu', title: 'Upper Body Hypertrophy', desc: 'Dumbbell bench press, Pullups, Overhead press, Lateral raises.' },
      { day: 'Tue/Fri', title: 'Lower Body Strength', desc: 'Romanian deadlifts, Bulgarian split squats, Calf raises, Core work.' },
      { day: 'Wed', title: 'Active Recovery', desc: 'Foam rolling, mobility yoga, or active stretching session.' }
    ];
  } else if (activity === "4") {
    routine = [
      { day: 'Mon/Thu', title: 'Push / Pull Splits', desc: 'Heavy bench press, incline flys, rows, lat pulldowns (4 sets).' },
      { day: 'Tue/Fri', title: 'Legs / Core strength', desc: 'Barbell squats, leg presses, hamstring curls, hanging leg raises.' },
      { day: 'Sat', title: 'HIIT Conditioning', desc: '20 mins sprint intervals (30s sprint, 60s jog) + agility drills.' }
    ];
  } else {
    routine = [
      { day: 'Mon/Wed/Fri', title: 'Heavy Compound Lift Split', desc: 'Deadlifts, squats, bench press targeting 85% 1-Rep-Max strength.' },
      { day: 'Tue/Thu/Sat', title: 'Conditioning & Secondary Hypertrophy', desc: 'Olympic lifting variations, kettlebell complexes, rowing intervals.' }
    ];
  }

  routine.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="sugg-header">
        <strong>${item.title}</strong>
        <span class="sugg-kcal">${item.day}</span>
      </div>
      <p class="sugg-desc">${item.desc}</p>
    `;
    list.appendChild(li);
  });
}

// Switches between Diet and Workout recommendation panes
function switchAdvice(pane) {
  document.querySelectorAll('.advice-tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`tab-${pane}`).classList.add('active');

  if (pane === 'diet') {
    document.getElementById('advice-diet-pane').style.display = 'block';
    document.getElementById('advice-workout-pane').style.display = 'none';
  } else {
    document.getElementById('advice-diet-pane').style.display = 'none';
    document.getElementById('advice-workout-pane').style.display = 'block';
  }
}

// Global hookups so HTML buttons can trigger them
window.changeGoal = changeGoal;
window.switchAdvice = switchAdvice;

function errorMessage(error) {
  document.getElementById('results').style.display = 'none';
  document.getElementById('loading').style.display = 'none';
  
  const existingAlert = document.querySelector('.alert');
  if (existingAlert) {
    existingAlert.remove();
  }

  const errorDiv = document.createElement('div');
  const card = document.querySelector('.calorie');
  const heading = card.querySelector('h2');
  errorDiv.className = 'alert alert-danger';
  errorDiv.style.color = 'red';
  errorDiv.style.marginBottom = '15px';
  errorDiv.style.fontWeight = 'bold';
  errorDiv.appendChild(document.createTextNode(error));

  card.insertBefore(errorDiv, heading.nextSibling);

  setTimeout(clearError, 4000);
}

function clearError() {
  const alert = document.querySelector('.alert');
  if (alert) {
    alert.remove();
  }
}