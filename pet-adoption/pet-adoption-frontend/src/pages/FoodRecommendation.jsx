import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import LocationServicesMap from '../components/LocationServicesMap';
import { generateRecommendation } from '../utils/foodUtils';

const FoodRecommendation = () => {
  const [form, setForm] = useState({
    petType: '',
    age: '',
    ageInMonths: '',
    size: '',
    activityLevel: '',
    healthCondition: '',
    weight: '',
    allergies: '',
    currentFood: ''
  });

  const [foodRecommendation, setFoodRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [showNutritionTips, setShowNutritionTips] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!form.petType) errors.petType = 'Please select a pet type';
    if (!form.age && !form.ageInMonths) errors.age = 'Please enter your pet\'s age';
    if ((form.petType === 'Dog' || form.petType === 'Cat') && !form.size) {
      errors.size = 'Please select your pet\'s size';
    }
    if (!form.activityLevel) errors.activityLevel = 'Please select activity level';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  const findFoodRecommendation = useCallback(async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      const recommendation = generateRecommendation(form);
      setFoodRecommendation(recommendation);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('recommendation-results')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
    } catch (error) {
      console.error('Error generating recommendation:', error);
    } finally {
      setLoading(false);
    }
  }, [form, validateForm]);

  const resetForm = useCallback(() => {
    setForm({
      petType: '',
      age: '',
      ageInMonths: '',
      size: '',
      activityLevel: '',
      healthCondition: '',
      weight: '',
      allergies: '',
      currentFood: ''
    });
    setFoodRecommendation(null);
    setFormErrors({});
    setCurrentStep(1);
  }, []);

  // Get pet type emoji
  const getPetEmoji = (petType) => {
    const emojis = {
      'Dog': '🐕',
      'Cat': '🐱',
      'Bird': '🦜',
      'Fish': '🐠',
      'Small Mammal': '🐹',
      'Reptile': '🦎'
    };
    return emojis[petType] || '🐾';
  };

  // Get age display
  const getAgeDisplay = () => {
    if (form.age) return `${form.age} year${form.age !== '1' ? 's' : ''}`;
    if (form.ageInMonths) return `${form.ageInMonths} month${form.ageInMonths !== '1' ? 's' : ''}`;
    return 'Not specified';
  };

  const nutritionTips = [
    {
      icon: '🥗',
      title: 'Balanced Diet',
      tip: 'Look for foods with a good balance of protein, fats, and carbohydrates appropriate for your pet\'s life stage.'
    },
    {
      icon: '💧',
      title: 'Fresh Water',
      tip: 'Always provide fresh, clean water. Some pets prefer running water from fountains.'
    },
    {
      icon: '⏰',
      title: 'Regular Feeding',
      tip: 'Establish consistent feeding times. Most adult pets do well with 2 meals per day.'
    },
    {
      icon: '📏',
      title: 'Portion Control',
      tip: 'Follow feeding guidelines on the food package, but adjust based on your pet\'s body condition.'
    },
    {
      icon: '🚫',
      title: 'Avoid Harmful Foods',
      tip: 'Never feed chocolate, grapes, onions, or other toxic foods to pets. When in doubt, ask your vet.'
    },
    {
      icon: '🏥',
      title: 'Vet Consultation',
      tip: 'Regular check-ups help ensure your pet\'s nutritional needs are being met as they age.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-16 mt-20">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            🍽️ Pet Nutrition Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get personalized food recommendations for your beloved companion based on their unique needs and characteristics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Tell Us About Your Pet</h2>
                {foodRecommendation && (
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    🔄 Start Over
                  </button>
                )}
              </div>

              <form className="space-y-6">
                {/* Pet Type */}
                <div>
                  <label htmlFor="petType" className="block text-lg font-semibold text-gray-700 mb-2">
                    What type of pet do you have? *
                  </label>
                  <select 
                    id="petType" 
                    name="petType" 
                    value={form.petType} 
                    onChange={handleChange}
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-colors ${
                      formErrors.petType ? 'border-red-300' : 'border-gray-300 focus:border-green-500'
                    }`}
                  >
                    <option value="">Select your pet type...</option>
                    <option value="Dog">🐕 Dog</option>
                    <option value="Cat">🐱 Cat</option>
                    <option value="Bird">🦜 Bird</option>
                    <option value="Fish">🐠 Fish</option>
                    <option value="Small Mammal">🐹 Small Mammal (Rabbit, Guinea Pig, etc.)</option>
                    <option value="Reptile">🦎 Reptile</option>
                  </select>
                  {formErrors.petType && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.petType}</p>
                  )}
                </div>

                {/* Age */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-lg font-semibold text-gray-700 mb-2">
                      Age (years) *
                    </label>
                    <input 
                      type="number" 
                      name="age" 
                      id="age" 
                      value={form.age} 
                      onChange={handleChange}
                      min="0"
                      max="30"
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-colors ${
                        formErrors.age ? 'border-red-300' : 'border-gray-300 focus:border-green-500'
                      }`}
                      placeholder="e.g., 3"
                    />
                  </div>

                  {form.age < 1 && (
                    <div>
                      <label htmlFor="ageInMonths" className="block text-lg font-semibold text-gray-700 mb-2">
                        Age (months)
                      </label>
                      <input 
                        type="number" 
                        name="ageInMonths" 
                        id="ageInMonths" 
                        value={form.ageInMonths} 
                        onChange={handleChange}
                        min="1"
                        max="12"
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                        placeholder="e.g., 6"
                      />
                    </div>
                  )}
                </div>
                {formErrors.age && (
                  <p className="text-red-500 text-sm">{formErrors.age}</p>
                )}

                {/* Size - Only for Dogs and Cats */}
                {(form.petType === 'Dog' || form.petType === 'Cat') && (
                  <div>
                    <label htmlFor="size" className="block text-lg font-semibold text-gray-700 mb-2">
                      Size *
                    </label>
                    <select 
                      name="size" 
                      id="size" 
                      value={form.size} 
                      onChange={handleChange}
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-colors ${
                        formErrors.size ? 'border-red-300' : 'border-gray-300 focus:border-green-500'
                      }`}
                    >
                      <option value="">Select size...</option>
                      <option value="Small">Small (under 25 lbs)</option>
                      <option value="Medium">Medium (25-60 lbs)</option>
                      <option value="Large">Large (over 60 lbs)</option>
                    </select>
                    {formErrors.size && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.size}</p>
                    )}
                  </div>
                )}

                {/* Weight */}
                <div>
                  <label htmlFor="weight" className="block text-lg font-semibold text-gray-700 mb-2">
                    Current Weight (optional)
                  </label>
                  <input 
                    type="text" 
                    name="weight" 
                    id="weight" 
                    value={form.weight} 
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                    placeholder="e.g., 45 lbs or 20 kg"
                  />
                </div>

                {/* Activity Level */}
                <div>
                  <label htmlFor="activityLevel" className="block text-lg font-semibold text-gray-700 mb-2">
                    Activity Level *
                  </label>
                  <select 
                    name="activityLevel" 
                    id="activityLevel" 
                    value={form.activityLevel} 
                    onChange={handleChange}
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-colors ${
                      formErrors.activityLevel ? 'border-red-300' : 'border-gray-300 focus:border-green-500'
                    }`}
                  >
                    <option value="">Select activity level...</option>
                    <option value="Low">🛋️ Low (Indoor, minimal exercise)</option>
                    <option value="Moderate">🚶 Moderate (Regular walks, some playtime)</option>
                    <option value="High">🏃 High (Very active, lots of exercise)</option>
                  </select>
                  {formErrors.activityLevel && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.activityLevel}</p>
                  )}
                </div>

                {/* Health Condition */}
                <div>
                  <label htmlFor="healthCondition" className="block text-lg font-semibold text-gray-700 mb-2">
                    Special Health Considerations
                  </label>
                  <select 
                    name="healthCondition" 
                    id="healthCondition" 
                    value={form.healthCondition} 
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  >
                    <option value="">None</option>
                    <option value="Weight Management">⚖️ Weight Management</option>
                    <option value="Sensitive Stomach">🤢 Sensitive Stomach</option>
                    <option value="Urinary Health">💧 Urinary Health</option>
                    <option value="Joint Support">🦴 Joint Support</option>
                    <option value="Feather Health">🪶 Feather Health (Birds)</option>
                    <option value="Color Enhancement">🌈 Color Enhancement (Fish)</option>
                    <option value="Dental Health">🦷 Dental Health</option>
                    <option value="Shell Health">🐢 Shell Health (Reptiles)</option>
                  </select>
                </div>

                {/* Allergies */}
                <div>
                  <label htmlFor="allergies" className="block text-lg font-semibold text-gray-700 mb-2">
                    Known Allergies or Food Sensitivities
                  </label>
                  <input 
                    type="text" 
                    name="allergies" 
                    id="allergies" 
                    value={form.allergies} 
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                    placeholder="e.g., chicken, beef, grains"
                  />
                </div>

                {/* Current Food */}
                <div>
                  <label htmlFor="currentFood" className="block text-lg font-semibold text-gray-700 mb-2">
                    Current Food Brand (optional)
                  </label>
                  <input 
                    type="text" 
                    name="currentFood" 
                    id="currentFood" 
                    value={form.currentFood} 
                    onChange={handleChange}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                    placeholder="What food are they currently eating?"
                  />
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <button 
                    type="button" 
                    onClick={findFoodRecommendation}
                    disabled={loading}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 transform hover:-translate-y-1 hover:shadow-lg'
                    } text-white`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Analyzing...
                      </span>
                    ) : (
                      '🍽️ Get Food Recommendation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Pet Summary */}
            {form.petType && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Pet Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getPetEmoji(form.petType)}</span>
                    <div>
                      <p className="font-medium">{form.petType}</p>
                      <p className="text-sm text-gray-600">{getAgeDisplay()} old</p>
                    </div>
                  </div>
                  {form.size && (
                    <p className="text-sm text-gray-600">Size: {form.size}</p>
                  )}
                  {form.activityLevel && (
                    <p className="text-sm text-gray-600">Activity: {form.activityLevel}</p>
                  )}
                  {form.healthCondition && (
                    <p className="text-sm text-gray-600">Health: {form.healthCondition}</p>
                  )}
                </div>
              </div>
            )}

            {/* Nutrition Tips */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Nutrition Tips</h3>
                <button
                  onClick={() => setShowNutritionTips(!showNutritionTips)}
                  className="text-green-600 hover:text-green-700"
                >
                  {showNutritionTips ? '−' : '+'}
                </button>
              </div>
              
              {showNutritionTips ? (
                <div className="space-y-4">
                  {nutritionTips.slice(0, 3).map((tip, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">{tip.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800">{tip.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{tip.tip}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link to="/nutrition-guide" className="block text-center text-green-600 hover:text-green-700 font-medium mt-4">
                    View All Tips →
                  </Link>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">
                  Get expert nutrition tips to keep your pet healthy and happy!
                </p>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-red-800 mb-2">🚨 Emergency</h3>
              <p className="text-sm text-red-700 mb-3">
                If your pet has eaten something toxic, contact your vet immediately.
              </p>
              <a 
                href="tel:+1234567890" 
                className="block text-center bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Emergency Vet Line
              </a>
            </div>
          </div>
        </div>

        {/* Recommendation Results */}
        {foodRecommendation && (
          <div id="recommendation-results" className="mt-12">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  🎯 Your Personalized Recommendation
                </h2>
                <p className="text-gray-600">
                  Based on your {form.petType?.toLowerCase()}'s specific needs and characteristics
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-green-800 mb-3">
                  Recommended Food Type:
                </h3>
                <p className="text-green-700 text-lg leading-relaxed">
                  {foodRecommendation}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h4 className="font-bold text-blue-800 mb-3">🛒 Shopping Tips</h4>
                  <ul className="text-blue-700 text-sm space-y-2">
                    <li>• Look for AAFCO certification on the label</li>
                    <li>• Check the first 5 ingredients carefully</li>
                    <li>• Consider your pet's taste preferences</li>
                    <li>• Transition gradually to new food</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h4 className="font-bold text-yellow-800 mb-3">⚠️ Important Notes</h4>
                  <ul className="text-yellow-700 text-sm space-y-2">
                    <li>• Consult your vet before major diet changes</li>
                    <li>• Monitor your pet's response to new food</li>
                    <li>• Adjust portions based on body condition</li>
                    <li>• Keep fresh water available always</li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <Link to="/suggested-items">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mr-4">
                    🛍️ Shop Pet Supplies
                  </button>
                </Link>
                <button
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  🔄 New Recommendation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pet Food Stores Map */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🛒 Find Pet Food Stores Near You
              </h2>
              <p className="text-gray-600">
                Locate nearby pet supply stores to purchase your recommended food
              </p>
            </div>
            
            <LocationServicesMap 
              initialType="petshop"
              height="h-80"
              showTypeSelector={false}
              showStats={true}
              className=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodRecommendation;