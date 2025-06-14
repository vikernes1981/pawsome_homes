// data/quizQuestions.js

export const quizQuestions = [
  {
    name: 'activityHours',
    label: 'How many hours per day can you spend on pet activities?',
    options: [
      { value: '1', label: '0-1 hours' },
      { value: '2', label: '2-3 hours' },
      { value: '4', label: '4+ hours' },
    ]
  },
  {
    name: 'activityLevel',
    label: 'What is your general activity level?',
    options: [
      { value: 'High', label: 'High' },
      { value: 'Medium', label: 'Medium' },
      { value: 'Low', label: 'Low' },
    ]
  },
  {
    name: 'allergies',
    label: 'Do you have pet allergies?',
    options: [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' },
    ]
  },
  {
    name: 'homeSpace',
    label: 'What is the size of your living space?',
    options: [
      { value: 'Small', label: 'Small' },
      { value: 'Medium', label: 'Medium' },
      { value: 'Large', label: 'Large' },
    ]
  },
  {
    name: 'budget',
    label: 'What is your pet care budget?',
    options: [
      { value: 'Low', label: 'Low' },
      { value: 'Medium', label: 'Medium' },
      { value: 'High', label: 'High' },
    ]
  },
 {
    name: 'children',
    label: 'Do you have young children at home?',
    required: false,
    options: [
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' },
    ]
  },
  {
    name: 'timeAway',
    label: 'How often are you away from home?',
    required: false,
    options: [
        { value: 'Often', label: 'Often' },
        { value: 'Sometimes', label: 'Sometimes' },
        { value: 'Rarely', label: 'Rarely' },
    ]
  },
  {
    name: 'travelFrequency',
    label: 'How often do you travel?',
    required: false,
    options: [
        { value: 'Frequent', label: 'Frequently' },
        { value: 'Occasional', label: 'Occasionally' },
        { value: 'Rare', label: 'Rarely' },
    ]
  },
  {
    name: 'groomingPreference',
    label: 'What is your grooming preference?',
    options: [
      { value: 'Low', label: 'Low Maintenance' },
      { value: 'Moderate', label: 'Moderate' },
      { value: 'High', label: 'High Maintenance' },
    ]
  },
  {
    name: 'petSize',
    label: 'What size pet do you prefer?',
    options: [
      { value: 'Small', label: 'Small' },
      { value: 'Medium', label: 'Medium' },
      { value: 'Large', label: 'Large' },
    ]
  },
  {
    name: 'lifespan',
    label: 'Do you prefer a pet with a longer lifespan?',
    options: [
      { value: 'Short', label: 'Short' },
      { value: 'Moderate', label: 'Moderate' },
      { value: 'Long', label: 'Long' },
    ]
  },
  {
    name: 'social',
    label: 'How social would you like your pet to be?',
    options: [
      { value: 'High', label: 'Very Social' },
      { value: 'Medium', label: 'Moderately Social' },
      { value: 'Low', label: 'Independent' },
    ]
  },
];
