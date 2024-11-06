import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const QuizPage = () => {
  const [answers, setAnswers] = useState({
    activityHours: '', // Hours available for pet activity
    activityLevel: '', 
    space: '',
    allergies: '',
    experience: '',
    timeAvailability: '',
    grooming: '',
    children: '',
    petSize: '',
    noiseTolerance: '',
    commitmentLevel: '',
    vacationFrequency: '',
    exerciseRequirements: '',
    costTolerance: '',
    petSociability: '',
    messTolerance: '',
    allergySensitivity: '',
  });

  const [recommendedPet, setRecommendedPet] = useState(null);
  const [secondaryPet, setSecondaryPet] = useState(null);

  // Handle changes in quiz answers
  const handleChange = (e) => {
    setAnswers({
      ...answers,
      [e.target.name]: e.target.value,
    });
  };

  // Calculate the recommended pet based on expanded logic
  const calculatePet = () => {
    const petScores = {
      Dog: 0,
      Cat: 0,
      Fish: 0,
      Rabbit: 0,
      Bird: 0,
      Hamster: 0,
      Reptile: 0,
      Turtle: 0,
      Ferret: 0,
      GuineaPig: 0,
    };

    // Adjust scores based on answers
    if (answers.allergies === 'Yes' || answers.allergySensitivity === 'High') {
      petScores.Fish += 10;
      petScores.Turtle += 8;
      petScores.Reptile += 7;
    }
    if (answers.children === 'Yes') {
      petScores.Dog += 10;
      petScores.Cat += 7;
      petScores.GuineaPig += 6;
    }
    if (answers.activityLevel === 'High' || answers.activityHours >= 4) {
      petScores.Dog += 10;
      petScores.Bird += 8;
      petScores.Ferret += 5;
    } else if (answers.activityLevel === 'Low' || answers.activityHours < 2) {
      petScores.Cat += 7;
      petScores.Fish += 10;
      petScores.Hamster += 8;
    }
    if (answers.space === 'Large') {
      petScores.Dog += 8;
      petScores.Cat += 6;
      petScores.Ferret += 5;
    } else if (answers.space === 'Small') {
      petScores.Fish += 8;
      petScores.Hamster += 7;
      petScores.Turtle += 6;
    }
    if (answers.timeAvailability === 'Low') {
      petScores.Fish += 10;
      petScores.Hamster += 8;
      petScores.Turtle += 6;
    } else if (answers.timeAvailability === 'High') {
      petScores.Dog += 10;
      petScores.Rabbit += 7;
    }
    if (answers.grooming === 'Yes') {
      petScores.Cat += 7;
      petScores.Dog += 5;
    } else if (answers.grooming === 'No') {
      petScores.Fish += 10;
      petScores.Bird += 5;
      petScores.Reptile += 6;
    }
    if (answers.noiseTolerance === 'Low') {
      petScores.Fish += 10;
      petScores.Cat += 7;
      petScores.Reptile += 6;
    } else if (answers.noiseTolerance === 'High') {
      petScores.Dog += 8;
      petScores.Bird += 9;
    }
    if (answers.commitmentLevel === 'Short') {
      petScores.Hamster += 10;
      petScores.Fish += 7;
      petScores.GuineaPig += 5;
    } else if (answers.commitmentLevel === 'Long') {
      petScores.Dog += 10;
      petScores.Cat += 8;
      petScores.Turtle += 6;
    }
    if (answers.vacationFrequency === 'Often') {
      petScores.Fish += 10;
      petScores.Reptile += 8;
    } else if (answers.vacationFrequency === 'Rarely') {
      petScores.Dog += 8;
      petScores.Cat += 6;
    }
    if (answers.exerciseRequirements === 'High') {
      petScores.Dog += 10;
      petScores.Ferret += 6;
      petScores.Bird += 5;
    } else if (answers.exerciseRequirements === 'Low') {
      petScores.Fish += 8;
      petScores.Turtle += 7;
    }
    if (answers.costTolerance === 'High') {
      petScores.Dog += 10;
      petScores.Cat += 7;
    } else if (answers.costTolerance === 'Low') {
      petScores.Fish += 8;
      petScores.Hamster += 7;
    }
    if (answers.petSociability === 'Social') {
      petScores.Dog += 10;
      petScores.GuineaPig += 7;
      petScores.Bird += 5;
    } else if (answers.petSociability === 'Independent') {
      petScores.Cat += 8;
      petScores.Reptile += 7;
    }
    if (answers.messTolerance === 'High') {
      petScores.Dog += 8;
      petScores.Bird += 7;
    } else if (answers.messTolerance === 'Low') {
      petScores.Fish += 10;
      petScores.Turtle += 8;
      petScores.Cat += 5;
    }
    if (answers.petSize === 'Large') {
      petScores.Dog += 10;
      petScores.Rabbit += 6;
    } else if (answers.petSize === 'Small') {
      petScores.Cat += 8;
      petScores.Hamster += 7;
      petScores.Reptile += 6;
    }

    // Find the highest score for primary recommendation
    const primaryPet = Object.keys(petScores).reduce((a, b) =>
      petScores[a] > petScores[b] ? a : b
    );

    // Remove primary pet and find second highest score for secondary recommendation
    delete petScores[primaryPet];
    const secondaryPetOption = Object.keys(petScores).reduce((a, b) =>
      petScores[a] > petScores[b] ? a : b
    );

    setRecommendedPet(primaryPet);
    setSecondaryPet(secondaryPetOption);
  };

  return (
    <div className="min-h-screen  flex items-center justify-center py-20">
      <div className="max-w-3xl w-full bg-gray-200 rounded-lg shadow-lg p-14">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-700">Find Out Which Pet is Right for You!</h1>

        {/* Quiz Form */}
        <form className="space-y-6">
          {/* Activity Hours per Day Question */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-2">How many hours per day can you spend on pet activities?</label>
            <select name="activityHours" value={answers.activityHours} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="">Select...</option>
              <option value="1">0-1 hours</option>
              <option value="2">2-3 hours</option>
              <option value="4">4+ hours</option>
            </select>
          </div>

          {/* Activity Level Question */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-2">What is your general activity level?</label>
            <select name="activityLevel" value={answers.activityLevel} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="">Select...</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Exercise Requirements Question */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-2">Do you prefer a pet with high or low exercise needs?</label>
            <select name="exerciseRequirements" value={answers.exerciseRequirements} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="">Select...</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Cost Tolerance Question */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-2">Are you open to higher pet care costs?</label>
            <select name="costTolerance" value={answers.costTolerance} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="">Select...</option>
              <option value="High">Yes</option>
              <option value="Low">No</option>
            </select>
          </div>

          {/* Pet Sociability Question */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-2">Would you prefer a social or independent pet?</label>
            <select name="petSociability" value={answers.petSociability} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="">Select...</option>
              <option value="Social">Social</option>
              <option value="Independent">Independent</option>
            </select>
          </div>

          {/* Mess Tolerance Question */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-2">Are you okay with pets that may make a mess?</label>
            <select name="messTolerance" value={answers.messTolerance} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="">Select...</option>
              <option value="High">Yes</option>
              <option value="Low">No</option>
            </select>
          </div>

          {/* Allergy Sensitivity Question */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-2">Do you have high sensitivity to pet allergens?</label>
            <select name="allergySensitivity" value={answers.allergySensitivity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="">Select...</option>
              <option value="High">Yes</option>
              <option value="Low">No</option>
            </select>
          </div>

          {/* Other existing quiz questions can go here */}

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <button
              type="button"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-500 focus:outline-none transition"
              onClick={calculatePet}
            >
              Find Out Now!
            </button>
          </div>
        </form>

        {/* Display Recommended Pet */}
        {recommendedPet && (
          <div className="mt-10 text-center">
            <h2 className="text-3xl font-bold text-green-600 animate-fade-in">
              We recommend: {recommendedPet}!
            </h2>
            <p className="mt-4 text-gray-700">
              Based on your answers, a {recommendedPet} would be a great match for you.
            </p>
            {secondaryPet && (
              <p className="mt-4 text-gray-700">
                You might also consider a {secondaryPet} as an alternative.
              </p>
            )}
            <Link to="/pets">
              <button className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-500 transition">
                Browse {recommendedPet}s
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
