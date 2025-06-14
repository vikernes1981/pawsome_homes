import { useState } from 'react';
import PetFoodMap from './PetFoodMap';
import { generateRecommendation } from '../utils/foodUtils';

const FoodRecommendation = () => {
  const [form, setForm] = useState({
    petType: '',
    age: '',
    ageInMonths: '',
    size: '',
    activityLevel: '',
    healthCondition: '',
  });

  const [foodRecommendation, setFoodRecommendation] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const findFoodRecommendation = () => {
    const recommendation = generateRecommendation(form);
    setFoodRecommendation(recommendation);
  };

  return (
    <div className="max-w-3xl mx-auto p-16 bg-gray-200 shadow-lg rounded-lg mt-20">
      <h2 className="text-3xl font-bold text-center mb-6 text-green-700">Food Recommendation</h2>

      <form className="space-y-6">
        <div>
          <label htmlFor="petType" className="block text-lg font-semibold text-gray-700">Select your pet type:</label>
          <select id="petType" name="petType" value={form.petType} onChange={handleChange} className="w-full p-3 border rounded-lg">
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
          <input type="number" name="age" id="age" value={form.age} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        </div>

        {form.age < 1 && (
          <div>
            <label htmlFor="ageInMonths" className="block text-lg font-semibold text-gray-700">Enter age (in months):</label>
            <input type="number" name="ageInMonths" id="ageInMonths" value={form.ageInMonths} onChange={handleChange} className="w-full p-3 border rounded-lg" />
          </div>
        )}

        {(form.petType === 'Dog' || form.petType === 'Cat') && (
          <div>
            <label htmlFor="size" className="block text-lg font-semibold text-gray-700">Select size:</label>
            <select name="size" id="size" value={form.size} onChange={handleChange} className="w-full p-3 border rounded-lg">
              <option value="">Select...</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="activityLevel" className="block text-lg font-semibold text-gray-700">Select activity level:</label>
          <select name="activityLevel" id="activityLevel" value={form.activityLevel} onChange={handleChange} className="w-full p-3 border rounded-lg">
            <option value="">Select...</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="healthCondition" className="block text-lg font-semibold text-gray-700">Health condition:</label>
          <select name="healthCondition" id="healthCondition" value={form.healthCondition} onChange={handleChange} className="w-full p-3 border rounded-lg">
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
          <button type="button" onClick={findFoodRecommendation} className="px-6 py-3 bg-green-600 text-white rounded-lg">
            Get Recommendation
          </button>
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
