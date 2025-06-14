export const getLifeStage = (petType, age) => {
  age = parseFloat(age);
  if (petType === 'Dog') {
    if (age < 1) return 'Puppy';
    if (age < 7) return 'Adult';
    return age >= 10 ? 'Very Senior' : 'Senior';
  }
  if (petType === 'Cat') {
    if (age < 1) return 'Kitten';
    if (age < 10) return 'Adult';
    return age >= 15 ? 'Very Senior' : 'Senior';
  }
  return 'Adult';
};

export const generateRecommendation = (form) => {
  const { petType, age, ageInMonths, size, activityLevel, healthCondition } = form;
  let finalAge = age;
  if (age < 1 && ageInMonths) finalAge = (parseFloat(ageInMonths) / 12).toFixed(2);

  const lifeStage = getLifeStage(petType, finalAge);
  let r = '';

  switch (petType) {
    case 'Dog':
      if (lifeStage === 'Puppy') r = 'High-protein puppy food with DHA for development and immune support.';
      else if (lifeStage === 'Adult') {
        r = size === 'Small'
          ? 'Small breed adult dog food high in protein and calories for energy.'
          : size === 'Large'
          ? 'Large breed dog food with joint support and controlled calcium for bone health.'
          : 'Balanced adult dog food with essential vitamins.';
        if (activityLevel === 'High') r += ' Choose high-calorie food to sustain energy needs.';
        if (healthCondition === 'Weight Management') r += ' Opt for a weight-control formula with low fat.';
        if (healthCondition === 'Sensitive Stomach') r += ' Select a limited-ingredient food with easy-to-digest proteins.';
      } else if (lifeStage === 'Senior') {
        r = 'Senior dog food with added antioxidants, reduced calories, and joint support.';
        if (activityLevel === 'Low') r += ' Choose lower-calorie options to prevent weight gain.';
        if (healthCondition === 'Joint Support') r += ' Look for glucosamine-rich food for joints.';
      } else if (lifeStage === 'Very Senior') {
        r = 'Very senior dog food with easily digestible proteins and ingredients to support kidney function.';
        if (healthCondition === 'Weight Management') r += ' Opt for lower-calorie senior formulas.';
      }
      break;
    case 'Cat':
      if (lifeStage === 'Kitten') r = 'High-calorie kitten food with taurine for eye and heart health.';
      else if (lifeStage === 'Adult') {
        r = 'Protein-rich adult cat food with essential nutrients.';
        if (healthCondition === 'Urinary Health') r += ' Choose urinary-support formulas with balanced minerals.';
        if (healthCondition === 'Hairball Control') r += ' Select food with added fiber to manage hairballs.';
        if (activityLevel === 'High') r += ' Opt for nutrient-dense food for active cats.';
      } else {
        r = 'Senior cat food with kidney and heart support, plus high digestibility.';
        if (healthCondition === 'Urinary Health') r += ' Look for formulas that support kidney health.';
      }
      break;
    case 'Bird':
      r = 'Species-specific bird seed with fruits and vegetables for balanced nutrition.';
      if (healthCondition === 'Feather Health') r += ' Choose food rich in omega-3 fatty acids.';
      if (healthCondition === 'Digestive Health') r += ' Opt for high-fiber options like fruit supplements.';
      break;
    case 'Fish':
      r = 'Fish-specific flakes or pellets with vitamins and minerals.';
      if (healthCondition === 'Color Enhancement') r += ' Look for food that enhances color with natural pigments.';
      break;
    case 'Small Mammal':
      r = 'High-fiber pellets with fresh vegetables for balanced nutrition.';
      if (healthCondition === 'Dental Health') r += ' Include hay for dental maintenance.';
      break;
    case 'Reptile':
      r = 'Live insects and greens based on reptile species, supplemented with calcium powder.';
      if (healthCondition === 'Shell Health') r += ' Add calcium and vitamin D supplements for shell strength.';
      break;
    default:
      r = 'Balanced food for your pet’s specific needs.';
  }

  return r;
};
