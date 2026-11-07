// Alongside: built-in meal library and menu planner.
// No AI and no internet needed. Portions follow typical UK eating-disorder
// service starting portions; the family's treatment team plan always comes first.
//
// Each meal has:
//   keys  - words used to match the child's liked / feared / allergy foods
//   tags  - diet facts: meat, pork, fish, egg, dairy, gluten, nuts
"use strict";

const MEAL_LIBRARY = {
  breakfast: [
    { name: "Cereal with whole milk and toast", keys: ["cereal","cornflakes","milk","toast","bread","butter","jam"], tags: ["dairy","gluten"],
      items: [["Cereal","1 mug (200 ml)"],["Whole milk","1 mug (200 ml)"],["Toast with butter and jam","2 slices"],["Orange juice","1 glass"]],
      recipe: [] },
    { name: "Boiled eggs with buttered soldiers", keys: ["egg","eggs","boiled egg","boiled eggs","toast","bread","butter"], tags: ["egg","dairy","gluten"],
      items: [["Boiled eggs","2"],["Toast with butter","2 slices"],["Full-fat yoghurt","1 pot"],["Orange juice","1 glass"]],
      recipe: ["Lower eggs into boiling water and cook 7 minutes.","Toast the bread and spread generously with butter.","Cut toast into strips and serve with the eggs."] },
    { name: "Ham and cheese toastie", keys: ["ham","cheese","toast","bread","sandwich"], tags: ["pork","meat","dairy","gluten"],
      items: [["Toastie (2 slices bread, butter, ham, cheese)","1 whole"],["Whole milk or hot chocolate","1 mug"],["Banana","1"]],
      recipe: ["Butter the outside of two slices of bread.","Fill with 2 slices of ham and a good handful of grated cheese.","Cook in a pan 3 minutes each side until golden."] },
    { name: "Cottage cheese on toast with honey", keys: ["cottage cheese","cheese","toast","bread","honey"], tags: ["dairy","gluten"],
      items: [["Thick toast with butter","2 slices"],["Full-fat cottage cheese","4 heaped tablespoons"],["Honey drizzle","1 tablespoon"],["Orange juice","1 glass"]],
      recipe: ["Toast and butter the bread.","Spread cottage cheese on top and drizzle with honey."] },
    { name: "Scrambled eggs on buttered toast", keys: ["egg","eggs","scrambled","toast","bread","butter"], tags: ["egg","dairy","gluten"],
      items: [["Eggs scrambled with butter and a splash of milk","2"],["Toast with butter","2 slices"],["Whole milk","1 glass"]],
      recipe: ["Whisk eggs with a splash of whole milk.","Melt a knob of butter and stir eggs gently on low heat until just set.","Serve on buttered toast."] },
    { name: "Porridge with banana and honey", keys: ["porridge","oats","banana","honey","milk"], tags: ["dairy","gluten"],
      items: [["Porridge oats made with whole milk","1 large bowl"],["Sliced banana","1"],["Honey or syrup","1 tablespoon"],["Toast with butter","1 slice"]],
      recipe: ["Simmer oats with whole milk for 4–5 minutes, stirring.","Top with banana and honey."] },
    { name: "Yoghurt, granola and croissant", keys: ["yoghurt","yogurt","granola","croissant","fruit"], tags: ["dairy","gluten","nuts"],
      items: [["Full-fat Greek yoghurt","1 large pot"],["Granola","4 tablespoons"],["Berries","1 handful"],["Croissant with butter","1"]],
      recipe: [] },
    { name: "Pancakes with Nutella or syrup", keys: ["pancake","pancakes","nutella","syrup","chocolate"], tags: ["egg","dairy","gluten","nuts"],
      items: [["Pancakes","2 medium"],["Nutella or maple syrup","2 tablespoons"],["Whole milk","1 glass"]],
      recipe: ["Warm ready-made pancakes, or make a simple batter of egg, flour and milk.","Spread with Nutella or drizzle with syrup."] },
    { name: "Tostada with tomato, olive oil and ham", keys: ["tostada","tomato","olive oil","ham","jamón","bread","spanish"], tags: ["pork","meat","gluten"],
      items: [["Toasted baguette or thick toast","2 large slices"],["Grated tomato and olive oil","generous"],["Ham (jamón or cooked)","3 slices"],["Café con leche or whole milk","1 mug"]],
      recipe: ["Toast the bread.","Grate a ripe tomato, mix with a pinch of salt.","Drizzle bread with olive oil, spread tomato, top with ham."] },
    { name: "Bagel with cream cheese", keys: ["bagel","cream cheese","cheese","salmon"], tags: ["dairy","gluten"],
      items: [["Bagel","1 whole"],["Full-fat cream cheese","2 tablespoons"],["Orange juice","1 glass"],["Full-fat yoghurt","1 pot"]],
      recipe: [] },
    { name: "Weetabix with whole milk and toast", keys: ["weetabix","cereal","milk","toast"], tags: ["dairy","gluten"],
      items: [["Weetabix","2 biscuits"],["Whole milk","1 mug (200 ml)"],["Toast with peanut butter","2 slices"]],
      recipe: [] },
    { name: "Omelette with cheese and ham", keys: ["omelette","egg","eggs","cheese","ham"], tags: ["egg","dairy","pork","meat"],
      items: [["Omelette (2 eggs, cheese, ham)","1"],["Toast with butter","2 slices"],["Orange juice","1 glass"]],
      recipe: ["Beat 2 eggs, cook in butter on medium heat.","Add grated cheese and chopped ham, fold and serve."] }
  ],

  main: [
    { name: "Pasta bolognese", keys: ["pasta","spaghetti","bolognese","mince","beef","tomato"], tags: ["meat","gluten","dairy"],
      items: [["Spaghetti or pasta","4 heaped serving spoons"],["Beef bolognese sauce","2 ladles"],["Grated cheese","1 handful"],["Garlic bread","1 slice"]],
      recipe: ["Brown mince in olive oil with onion and garlic.","Add chopped tomatoes, simmer 20 minutes.","Cook pasta, drain, toss with a knob of butter.","Serve topped with sauce and cheese."] },
    { name: "Ham, cheese and egg salad baguette", keys: ["ham","cheese","egg","eggs","boiled egg","baguette","sandwich","mayonnaise"], tags: ["pork","meat","egg","dairy","gluten"],
      items: [["Baguette half with butter","1"],["Ham","3 slices"],["Cheese","matchbox-size slices"],["Boiled egg with mayonnaise","1"],["Crisps","1 bag"]],
      recipe: ["Butter the baguette.","Fill with ham, cheese and sliced egg mixed with mayonnaise."] },
    { name: "Baked potato with cottage cheese and ham", keys: ["baked potato","potato","cottage cheese","ham","cheese","butter"], tags: ["dairy","pork","meat"],
      items: [["Baked potato with butter","1 large"],["Full-fat cottage cheese","4 heaped tablespoons"],["Ham","3 slices"],["Side salad with dressing","small bowl"]],
      recipe: ["Prick potato and bake at 200°C for about an hour (or microwave 8–10 minutes, then oven 15).","Split, add butter, top with cottage cheese and chopped ham."] },
    { name: "Spanish tortilla with bread", keys: ["tortilla","omelette","egg","eggs","potato","spanish"], tags: ["egg","gluten"],
      items: [["Tortilla de patatas","1 large wedge (¼ of a 4-egg tortilla)"],["Crusty bread with olive oil","2 slices"],["Tomato salad with olive oil","2 serving spoons"]],
      recipe: ["Slice potatoes and onion, cook slowly in plenty of olive oil until soft.","Drain, mix with beaten eggs and salt.","Cook in a pan on low heat, flip with a plate, cook the other side."] },
    { name: "Chicken, chips and peas", keys: ["chicken","chips","fries","peas"], tags: ["meat"],
      items: [["Breaded chicken breast or 6 nuggets","1"],["Oven chips","15"],["Peas with butter","2 serving spoons"],["Mayonnaise or ketchup","1 tablespoon"]],
      recipe: ["Oven-cook chicken and chips together per packet times.","Boil peas, toss with butter."] },
    { name: "Fish fingers, mash and beans", keys: ["fish","fish fingers","mash","potato","beans"], tags: ["fish","dairy","gluten"],
      items: [["Fish fingers","5"],["Mash made with butter and whole milk","2 scoops"],["Baked beans","4 tablespoons"]],
      recipe: ["Grill or oven-cook fish fingers.","Boil potatoes, mash with butter and whole milk.","Heat beans."] },
    { name: "Chicken and chorizo paella", keys: ["paella","rice","chicken","chorizo","spanish"], tags: ["meat","pork","fish"],
      items: [["Paella rice","4 heaped serving spoons"],["Chicken pieces","1 breast's worth"],["Chorizo slices","4–5"],["Peas and peppers","2 serving spoons"]],
      recipe: ["Fry chicken and chorizo in olive oil.","Add onion, pepper, paprika and saffron, then rice and hot stock.","Simmer without stirring for 18 minutes, add peas at the end."] },
    { name: "Lentejas with chorizo and bread", keys: ["lentils","lentejas","chorizo","stew","spanish","bread"], tags: ["pork","meat","gluten"],
      items: [["Lentil stew with chorizo and potato","1 large bowl"],["Crusty bread with butter","2 slices"]],
      recipe: ["Fry onion, garlic and chorizo in olive oil.","Add lentils, diced potato, paprika and water or stock.","Simmer 35–40 minutes until thick."] },
    { name: "Cheese and tomato pizza", keys: ["pizza","cheese","tomato"], tags: ["dairy","gluten"],
      items: [["Pizza","3 slices"],["Garlic bread","1 slice"],["Coleslaw","2 tablespoons"]],
      recipe: [] },
    { name: "Beef burger in a bun with chips", keys: ["burger","beef","chips","bun","cheese"], tags: ["meat","gluten","dairy"],
      items: [["Beef burger with cheese slice","1 medium"],["Bun with mayonnaise","1"],["Oven chips","15"]],
      recipe: ["Grill or fry the burger 4–5 minutes each side.","Top with cheese to melt; serve in buttered bun with chips."] },
    { name: "Macaroni cheese with ham", keys: ["macaroni","pasta","cheese","ham"], tags: ["dairy","gluten","pork","meat"],
      items: [["Macaroni cheese","4 heaped serving spoons"],["Chopped ham stirred through","3 slices"],["Garlic bread","1 slice"]],
      recipe: ["Cook macaroni.","Make a sauce with butter, flour, whole milk and lots of grated cheese.","Mix with pasta and ham, top with cheese and grill until golden."] },
    { name: "Roast chicken dinner", keys: ["roast","chicken","potatoes","gravy","carrots"], tags: ["meat","gluten"],
      items: [["Roast chicken with skin","1 full breast or 2 thighs"],["Roast potatoes in oil","4–5"],["Carrots and peas with butter","2 serving spoons"],["Gravy","generous"]],
      recipe: ["Roast chicken at 190°C until cooked through.","Parboil potatoes, roast in hot oil 45 minutes.","Serve with buttered veg and gravy."] },
    { name: "Salmon with buttery new potatoes", keys: ["salmon","fish","potatoes"], tags: ["fish","dairy"],
      items: [["Salmon fillet","1"],["New potatoes with butter","4–5 small"],["Green beans with butter","2 serving spoons"],["Mayonnaise or tartare sauce","1 tablespoon"]],
      recipe: ["Bake salmon at 200°C for 12–15 minutes.","Boil potatoes, toss with butter and salt."] },
    { name: "Tuna mayo jacket potato", keys: ["tuna","mayonnaise","baked potato","potato","sweetcorn","cheese"], tags: ["fish","dairy"],
      items: [["Baked potato with butter","1 large"],["Tuna mixed with mayonnaise and sweetcorn","1 small tin"],["Grated cheese","1 handful"]],
      recipe: ["Bake the potato.","Mix tuna with 2 tablespoons mayonnaise and sweetcorn.","Split potato, butter it, top with tuna and cheese."] },
    { name: "Chicken wrap with cheese and guacamole", keys: ["wrap","chicken","cheese","avocado","guacamole"], tags: ["meat","dairy","gluten"],
      items: [["Large tortilla wrap","1"],["Chicken strips","1 breast"],["Grated cheese and guacamole","generous"],["Tortilla chips","1 handful"]],
      recipe: ["Fry chicken strips in oil with fajita spice.","Fill wrap with chicken, cheese and guacamole, roll and toast in a pan."] },
    { name: "Egg fried rice with chicken", keys: ["rice","fried rice","egg","chicken","peas"], tags: ["egg","meat"],
      items: [["Egg fried rice","4 heaped serving spoons"],["Chicken pieces","1 breast"],["Prawn crackers","1 handful"]],
      recipe: ["Fry cooked rice in oil, push aside, scramble 1 egg and mix in.","Add peas, soy sauce and cooked chicken."] },
    { name: "Sausages, mash and gravy", keys: ["sausage","sausages","mash","potato","gravy"], tags: ["pork","meat","dairy","gluten"],
      items: [["Sausages","3 regular"],["Mash with butter and whole milk","2 scoops"],["Peas","2 serving spoons"],["Gravy","generous"]],
      recipe: ["Oven-cook sausages 20–25 minutes.","Boil and mash potatoes with butter and milk.","Serve with peas and gravy."] },
    { name: "Vegetable lasagne", keys: ["lasagne","lasagna","pasta","cheese","vegetarian"], tags: ["dairy","gluten"],
      items: [["Lasagne","1 rectangle about 15 × 10 cm"],["Garlic bread","1 slice"],["Side salad with dressing","small bowl"]],
      recipe: [] },
    { name: "Cheese and bean quesadilla", keys: ["quesadilla","cheese","beans","wrap","vegetarian"], tags: ["dairy","gluten"],
      items: [["Tortilla wraps with cheese and refried beans","2 wraps, folded"],["Soured cream and guacamole","2 tablespoons"],["Rice","2 serving spoons"]],
      recipe: ["Fill wraps with beans and cheese, fold.","Cook in a dry pan until crisp and the cheese melts."] },
    { name: "Halloumi, couscous and roasted veg", keys: ["halloumi","couscous","vegetarian","cheese"], tags: ["dairy","gluten"],
      items: [["Couscous with olive oil","4 heaped serving spoons"],["Grilled halloumi","4 slices"],["Roasted vegetables in oil","2 serving spoons"],["Pitta bread","1"]],
      recipe: ["Pour boiling stock over couscous, cover 5 minutes, fork in olive oil.","Fry halloumi slices until golden."] },
    { name: "Cottage cheese and ham pasta salad", keys: ["cottage cheese","ham","pasta","salad","egg","boiled egg"], tags: ["dairy","pork","meat","gluten","egg"],
      items: [["Pasta shapes with olive oil and mayonnaise","4 heaped serving spoons"],["Ham, chopped","3 slices"],["Full-fat cottage cheese","3 tablespoons"],["Boiled egg","1"],["Bread roll with butter","1"]],
      recipe: ["Cook pasta, cool, mix with olive oil and mayonnaise.","Stir in ham and cottage cheese, top with halved boiled egg."] }
  ],

  dessert: [
    { name: "Ice cream", keys: ["ice cream","icecream"], tags: ["dairy"], items: [["Ice cream","2 scoops"]] },
    { name: "Apple pie and custard", keys: ["apple pie","pie","custard"], tags: ["dairy","gluten","egg"], items: [["Apple pie","¼ pie"],["Custard","5 tablespoons"]] },
    { name: "Cheesecake", keys: ["cheesecake"], tags: ["dairy","gluten","egg"], items: [["Cheesecake","1 individual slice"]] },
    { name: "Flan or natillas", keys: ["flan","natillas","custard"], tags: ["dairy","egg"], items: [["Flan or natillas","1 pot"],["Biscuit","1–2"]] },
    { name: "Fruit crumble and cream", keys: ["crumble","fruit","cream"], tags: ["dairy","gluten"], items: [["Fruit crumble","2 serving spoons"],["Cream or custard","3 tablespoons"]] },
    { name: "Yoghurt with honey and granola", keys: ["yoghurt","yogurt","granola","honey"], tags: ["dairy","gluten","nuts"], items: [["Full-fat yoghurt","1 pot"],["Granola","3 tablespoons"],["Honey","1 teaspoon"]] },
    { name: "Chocolate brownie", keys: ["brownie","chocolate","cake"], tags: ["dairy","gluten","egg"], items: [["Chocolate brownie","1 square"],["Ice cream","1 scoop"]] },
    { name: "Sponge pudding", keys: ["sponge","pudding","cake"], tags: ["dairy","gluten","egg"], items: [["Sponge pudding","1 single pot"],["Custard","3 tablespoons"]] },
    { name: "Rice pudding with jam", keys: ["rice pudding","arroz con leche"], tags: ["dairy"], items: [["Rice pudding (arroz con leche)","1 bowl"],["Jam","1 teaspoon"]] },
    { name: "Tinned peaches and cream", keys: ["peaches","fruit","cream"], tags: ["dairy"], items: [["Tinned fruit","3 tablespoons"],["Cream or ice cream","1 scoop"],["Shortbread","1"]] }
  ],

  snack: [
    { name: "Cottage cheese with crackers", keys: ["cottage cheese","crackers","cheese"], tags: ["dairy","gluten"], items: [["Full-fat cottage cheese","3 tablespoons"],["Cream crackers","4"]] },
    { name: "Boiled egg and buttered toast", keys: ["egg","boiled egg","boiled eggs","toast"], tags: ["egg","dairy","gluten"], items: [["Boiled egg","1"],["Toast with butter","1 slice"]] },
    { name: "Ham and cheese roll-ups with crackers", keys: ["ham","cheese","crackers"], tags: ["pork","meat","dairy","gluten"], items: [["Ham rolled around cheese","2 slices"],["Crackers","3"]] },
    { name: "Cereal bar and nuts", keys: ["cereal bar","nuts"], tags: ["nuts","gluten"], items: [["Nut-based cereal bar","1"],["Nuts","1 small handful"]] },
    { name: "Chocolate bar and milk", keys: ["chocolate","milk"], tags: ["dairy","nuts"], items: [["Chocolate bar","1 normal size"],["Whole milk","1 glass"]] },
    { name: "Biscuits and yoghurt", keys: ["biscuits","yoghurt","yogurt","ginger nuts","jaffa"], tags: ["dairy","gluten"], items: [["Biscuits (ginger nuts or Jaffa Cakes)","4"],["Full-fat yoghurt","1 pot"]] },
    { name: "Scone with butter and jam", keys: ["scone","jam"], tags: ["dairy","gluten","egg"], items: [["Scone with butter and jam","1 medium"],["Whole milk","1 glass"]] },
    { name: "Crackers and cheese triangles", keys: ["crackers","cheese"], tags: ["dairy","gluten"], items: [["Cream crackers","4"],["Cheese triangles","2"]] },
    { name: "Apple with peanut butter", keys: ["apple","peanut butter","fruit"], tags: ["nuts"], items: [["Apple","1"],["Peanut butter","2 tablespoons"]] },
    { name: "Banana and a milkshake", keys: ["banana","milkshake","milk"], tags: ["dairy"], items: [["Banana","1"],["Milkshake made with whole milk","1 glass"]] },
    { name: "Crisps and a cheese stick", keys: ["crisps","cheese"], tags: ["dairy"], items: [["Crisps","1 bag"],["Cheese stick or babybel","1"]] },
    { name: "Toast with peanut butter", keys: ["toast","peanut butter"], tags: ["gluten","nuts"], items: [["Toast with peanut butter","2 slices"]] },
    { name: "Pancakes with butter", keys: ["pancakes","pancake"], tags: ["dairy","gluten","egg"], items: [["Pancakes with butter","2 medium"],["Juice","1 glass"]] },
    { name: "Hummus, pitta and cheese", keys: ["hummus","pitta","cheese"], tags: ["gluten","dairy"], items: [["Hummus","3 tablespoons"],["Pitta bread","1"],["Cheese cubes","matchbox size"]] },
    { name: "Granola with yoghurt", keys: ["granola","yoghurt","yogurt"], tags: ["dairy","gluten","nuts"], items: [["Full-fat yoghurt","1 pot"],["Granola","3 tablespoons"]] },
    { name: "Hot chocolate and a biscuit", keys: ["hot chocolate","chocolate","biscuits"], tags: ["dairy","gluten"], items: [["Hot chocolate made with whole milk","1 mug"],["Biscuits","2"]] },
    { name: "Bread with olive oil and ham", keys: ["bread","olive oil","ham","spanish"], tags: ["gluten","pork","meat"], items: [["Crusty bread with olive oil","1 large slice"],["Ham","2 slices"]] },
    { name: "Fruit with yoghurt and nuts", keys: ["fruit","yoghurt","yogurt","nuts"], tags: ["dairy","nuts"], items: [["Fruit","1 piece"],["Full-fat yoghurt","1 pot"],["Nuts","1 small handful"]] },
    { name: "Dried fruit and nut mix with milk", keys: ["dried fruit","raisins","nuts","milk"], tags: ["nuts","dairy"], items: [["Dried fruit and nuts","1 handful"],["Whole milk","1 glass"]] },
    { name: "Cake slice and milk", keys: ["cake","milk"], tags: ["dairy","gluten","egg"], items: [["Cake","1 slice"],["Whole milk","1 glass"]] },
    { name: "Ice cream cone", keys: ["ice cream"], tags: ["dairy","gluten"], items: [["Ice cream in a cone","2 scoops"]] },
    { name: "Bedtime toast and milk", keys: ["toast","milk","jam","bedtime"], tags: ["dairy","gluten"], items: [["Toast with butter and jam","2 slices"],["Milk","200 ml"]] }
  ]
};

// ---------- planner ----------
const AlongsidePlanner = (() => {
  const words = s => String(s || "").toLowerCase().split(/[,;\n]+/).map(w => w.trim()).filter(Boolean);
  function matches(meal, list){ return list.filter(w => meal.keys.some(k => k.includes(w) || w.includes(k))); }

  // simple deterministic random so "Make menu" for a day is stable until you swap
  function rng(seed){ let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }

  function allowed(meal, p){
    const avoid = words(p.allergy);
    if (avoid.some(a => meal.keys.some(k => k.includes(a)) || meal.tags.includes(a) || (a.includes("nut") && meal.tags.includes("nuts")) || (a.includes("gluten") && meal.tags.includes("gluten")) || (a.includes("dairy") || a.includes("lactose")) && meal.tags.includes("dairy") || (a.includes("egg") && meal.tags.includes("egg")) || (a.includes("fish") && meal.tags.includes("fish")))) return false;
    const diet = String(p.diet || "").toLowerCase();
    if (diet.includes("vegetarian") || diet.includes("vegan")) { if (meal.tags.includes("meat") || meal.tags.includes("fish") || meal.tags.includes("pork")) return false; }
    if (diet.includes("vegan") && (meal.tags.includes("dairy") || meal.tags.includes("egg"))) return false;
    if (diet.includes("halal") || diet.includes("kosher") || diet.includes("no pork")) { if (meal.tags.includes("pork")) return false; }
    if (diet.includes("pescatarian") && (meal.tags.includes("meat") && !meal.tags.includes("fish"))) return false;
    return true;
  }

  // score: liked foods up, recent repeats down, feared foods handled separately
  function pick(kind, p, ctx, r){
    const likes = words(p.likes), fear = words(p.fear);
    const pool = MEAL_LIBRARY[kind].filter(m => allowed(m, p) && !ctx.used.has(m.name));
    if (!pool.length) return null;
    const scored = pool.map(m => {
      const likedWords = matches(m, likes);
      const feared = matches(m, fear).length;
      // liked foods count less each time they've already appeared today, for variety
      let likeScore = likedWords.reduce((t, w) => t + 3 / (1 + (ctx.likeUse[w] || 0)), 0);
      let s = 1 + likeScore + r() * 2.5;
      if (ctx.recent.has(m.name)) s -= 7;
      if (feared){
        // one gentle "feared food" step per day, only in a snack or dessert
        if (ctx.fearUsed || (kind !== "snack" && kind !== "dessert")) s -= 50; else s += 2.5;
      }
      return { m, s, feared: feared > 0, liked: likedWords.length, likedWords };
    }).sort((a,b) => b.s - a.s);
    const best = scored[0];
    if (best.feared) ctx.fearUsed = true;
    best.likedWords.forEach(w => ctx.likeUse[w] = (ctx.likeUse[w] || 0) + 1);
    ctx.used.add(best.m.name);
    return best;
  }

  function mealFrom(slot, main, dessert, extra){
    const items = main.m.items.map(([food, portion]) => ({ food, portion }));
    if (dessert) dessert.m.items.forEach(([food, portion]) => items.push({ food: "Dessert: " + food, portion }));
    if (extra) items.push(extra);
    let tip = "";
    if (main.feared || (dessert && dessert.feared)) tip = "This includes a food the illness finds hard. Serve it calmly alongside the rest, without comment. Tell your team how it went.";
    else if (main.liked) tip = "Built around foods your child likes, which can make this meal a little easier.";
    return { slot, title: main.m.name + (dessert ? " + " + dessert.m.name.toLowerCase() : ""), items, recipe: (main.m.recipe || []).slice(), tip, source: "planner" };
  }

  // slots: array of slot names. recentTitles: titles from the last 3 days.
  function plan(dateISO, slots, profile, recentTitles, salt){
    const p = profile || {};
    const r = rng(dateISO + "|" + (salt || 0) + "|" + (p.likes || ""));
    const ctx = { used: new Set(), recent: new Set((recentTitles || []).map(t => String(t).split(" + ")[0])), fearUsed: false, likeUse: {} };
    const meals = [];
    for (const slot of slots){
      const s = slot.toLowerCase();
      if (s.includes("breakfast")) { const b = pick("breakfast", p, ctx, r); if (b) meals.push(mealFrom(slot, b)); }
      else if (s.includes("lunch") || s.includes("dinner")) {
        const m = pick("main", p, ctx, r), d = pick("dessert", p, ctx, r);
        if (m) meals.push(mealFrom(slot, m, d, { food: "Drink: whole milk or juice", portion: "1 glass" }));
      }
      else if (s.includes("evening") || s.includes("bedtime")) {
        const bed = MEAL_LIBRARY.snack.find(x => x.name === "Bedtime toast and milk");
        const sn = bed && allowed(bed, p) ? { m: bed, feared: false, liked: matches(bed, words(p.likes)).length } : pick("snack", p, ctx, r);
        if (sn) { ctx.used.add(sn.m.name); meals.push(mealFrom(slot, sn)); }
      }
      else { const sn = pick("snack", p, ctx, r); if (sn) meals.push(mealFrom(slot, sn)); }
    }
    return { meals, made: new Date().toISOString(), source: "planner" };
  }

  function swapOne(dateISO, slot, profile, current, salt){
    const others = (current.meals || []).filter(m => m.slot !== slot).map(m => m.title);
    for (let i = 1; i < 12; i++){
      const alt = plan(dateISO, [slot], profile, others.concat((current.meals || []).filter(m => m.slot === slot).map(m => m.title.split(" + ")[0])), (salt || 0) + i * 7);
      const m = alt.meals[0];
      const cur = (current.meals || []).find(x => x.slot === slot);
      if (m && (!cur || m.title !== cur.title)) return m;
    }
    return null;
  }

  return { plan, swapOne };
})();
