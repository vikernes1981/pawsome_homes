import  { useState } from 'react';
import PetFoodMap from './PetFoodMap';

const FoodRecommendation = () => {
  const [petType, setPetType] = useState('');
  const [age, setAge] = useState('');
  const [ageInMonths, setAgeInMonths] = useState('');
  const [size, setSize] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [healthCondition, setHealthCondition] = useState('');
  const [foodRecommendation, setFoodRecommendation] = useState(null);

  // Determine life stage based on age
  const getLifeStage = (petType, age) => {
    age = parseFloat(age);
    if (petType === 'Dog') {
      if (age < 1) return 'Puppy';
      if (age >= 1 && age < 7) return 'Adult';
      return age >= 10 ? 'Very Senior' : 'Senior';
    }
    if (petType === 'Cat') {
      if (age < 1) return 'Kitten';
      if (age >= 1 && age < 10) return 'Adult';
      return age >= 15 ? 'Very Senior' : 'Senior';
    }
    return 'Adult';
  };

  // Generate food recommendation based on inputs
  const findFoodRecommendation = () => {
    let finalAge = age;
    if (age < 1 && ageInMonths) finalAge = (parseFloat(ageInMonths) / 12).toFixed(2);

    const lifeStage = getLifeStage(petType, finalAge);
    let recommendation = '';

    if (petType === 'Dog') {
      if (lifeStage === 'Puppy') {
        recommendation = 'High-protein puppy food with DHA for development and immune support.';
      } else if (lifeStage === 'Adult') {
        recommendation = size === 'Small'
          ? 'Small breed adult dog food high in protein and calories for energy.'
          : size === 'Large'
          ? 'Large breed dog food with joint support and controlled calcium for bone health.'
          : 'Balanced adult dog food with essential vitamins.';

        if (activityLevel === 'High') recommendation += ' Choose high-calorie food to sustain energy needs.';
        if (healthCondition === 'Weight Management') recommendation += ' Opt for a weight-control formula with low fat.';
        if (healthCondition === 'Sensitive Stomach') recommendation += ' Select a limited-ingredient food with easy-to-digest proteins.';
      } else if (lifeStage === 'Senior') {
        recommendation = 'Senior dog food with added antioxidants, reduced calories, and joint support.';
        if (activityLevel === 'Low') recommendation += ' Choose lower-calorie options to prevent weight gain.';
        if (healthCondition === 'Joint Support') recommendation += ' Look for glucosamine-rich food for joints.';
      } else if (lifeStage === 'Very Senior') {
        recommendation = 'Very senior dog food with easily digestible proteins and ingredients to support kidney function.';
        if (healthCondition === 'Weight Management') recommendation += ' Opt for lower-calorie senior formulas.';
      }
    } else if (petType === 'Cat') {
      if (lifeStage === 'Kitten') {
        recommendation = 'High-calorie kitten food with taurine for eye and heart health.';
      } else if (lifeStage === 'Adult') {
        recommendation = 'Protein-rich adult cat food with essential nutrients.';
        if (healthCondition === 'Urinary Health') recommendation += ' Choose urinary-support formulas with balanced minerals.';
        if (healthCondition === 'Hairball Control') recommendation += ' Select food with added fiber to manage hairballs.';
        if (activityLevel === 'High') recommendation += ' Opt for nutrient-dense food for active cats.';
      } else if (lifeStage === 'Senior' || lifeStage === 'Very Senior') {
        recommendation = 'Senior cat food with kidney and heart support, plus high digestibility.';
        if (healthCondition === 'Urinary Health') recommendation += ' Look for formulas that support kidney health.';
      }
    } else if (petType === 'Bird') {
      recommendation = 'Species-specific bird seed with fruits and vegetables for balanced nutrition.';
      if (healthCondition === 'Feather Health') recommendation += ' Choose food rich in omega-3 fatty acids.';
      if (healthCondition === 'Digestive Health') recommendation += ' Opt for high-fiber options like fruit supplements.';
    } else if (petType === 'Fish') {
      recommendation = 'Fish-specific flakes or pellets with vitamins and minerals.';
      if (healthCondition === 'Color Enhancement') recommendation += ' Look for food that enhances color with natural pigments.';
    } else if (petType === 'Small Mammal') {
      recommendation = 'High-fiber pellets with fresh vegetables for balanced nutrition.';
      if (healthCondition === 'Dental Health') recommendation += ' Include hay for dental maintenance.';
    } else if (petType === 'Reptile') {
      recommendation = 'Live insects and greens based on reptile species, supplemented with calcium powder.';
      if (healthCondition === 'Shell Health' && petType === 'Turtle') recommendation += ' Add calcium and vitamin D supplements for shell strength.';
    }

    setFoodRecommendation(recommendation);
  };

  return (
    <div className="max-w-3xl mx-auto p-16 bg-gray-200 shadow-lg rounded-lg mt-20">
      <h2 className="text-3xl font-bold text-center mb-6 text-green-700">Food Recommendation</h2>
      <form className="space-y-6">
        <div>
          <label htmlFor="petType" className="block text-lg font-semibold text-gray-700">Select your pet type:</label>
          <select id="petType" value={petType} onChange={(e) => setPetType(e.target.value)} className="w-full p-3 border rounded-lg">
            <option value="">Select...</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
            <option value="Bird">Bird</option>
            <option value="Fish">Fish</option>
            <option value="Small Mammal">Small Mammal</option>
            <option value="Reptile">Reptile</option>
          </select>
        </div>
        <div>
          <label htmlFor="age" className="block text-lg font-semibold text-gray-700">Enter pet's age (in years):</label>
          <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-3 border rounded-lg" />
        </div>
        {age < 1 && (
          <div>
            <label htmlFor="ageInMonths" className="block text-lg font-semibold text-gray-700">Enter age (in months):</label>
            <input type="number" id="ageInMonths" value={ageInMonths} onChange={(e) => setAgeInMonths(e.target.value)} className="w-full p-3 border rounded-lg" />
          </div>
        )}
        {(petType === 'Dog' || petType === 'Cat') && (
          <div>
            <label htmlFor="size" className="block text-lg font-semibold text-gray-700">Select size:</label>
            <select id="size" value={size} onChange={(e) => setSize(e.target.value)} className="w-full p-3 border rounded-lg">
              <option value="">Select...</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="activityLevel" className="block text-lg font-semibold text-gray-700">Select activity level:</label>
          <select id="activityLevel" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full p-3 border rounded-lg">
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label htmlFor="healthCondition" className="block text-lg font-semibold text-gray-700">Health condition:</label>
          <select id="healthCondition" value={healthCondition} onChange={(e) => setHealthCondition(e.target.value)} className="w-full p-3 border rounded-lg">
            <option value="">None</option>
            <option value="Weight Management">Weight Management</option>
            <option value="Sensitive Stomach">Sensitive Stomach</option>
            <option value="Urinary Health">Urinary Health</option>
            <option value="Joint Support">Joint Support</option>
            <option value="Feather Health">Feather Health</option>
            <option value="Color Enhancement">Color Enhancement (for fish)</option>
            <option value="Dental Health">Dental Health (for small mammals)</option>
            <option value="Shell Health">Shell Health (for reptiles)</option>
          </select>
        </div>
        <div className="text-center">
          <button type="button" onClick={findFoodRecommendation} className="px-6 py-3 bg-green-600 text-white rounded-lg">Get Recommendation</button>
        </div>
      </form>
      <br />
      <PetFoodMap />
      {foodRecommendation && (
        <div className="bg-green-100 text-green-700 p-4 mt-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Recommended Food:</h3>
          <p>{foodRecommendation}</p>
        </div>
      )}
    </div>
  );
};

export default FoodRecommendation;
