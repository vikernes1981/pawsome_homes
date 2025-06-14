import { useState } from 'react';
import { useEffect } from 'react';
import { quizQuestions } from '../data/quizQuestions';
import { calculateBestPets } from '../utils/quizLogic';

const QuizPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const pets = calculateBestPets(answers);
    setResult(pets);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 mt-20 bg-white rounded-lg shadow-lg">
      <p className="text-sm text-gray-600 mb-4 border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-100 rounded">
        <strong>Note:</strong> This quiz does not save your data anywhere. Questions about children, travel, and time away are <strong>optional</strong> and only used to refine suggestions.
      </p>
      <h2 className="text-3xl font-bold mb-6 text-center text-green-700">Find Your Ideal Pet</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {quizQuestions.map((q) => (
          <div key={q.name}>
            <label className="block text-xl font-semibold text-gray-700 mb-2">{q.label}</label>
            <select
              name={q.name}
              value={answers[q.name] || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            >
              <option value="">Select...</option>
              {q.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Get Results
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 bg-green-100 p-4 rounded shadow">
          <h3 className="text-xl font-bold text-green-800">Your Best Matches:</h3>
          <p className="mt-2 text-green-900">
            <strong>Primary Recommendation:</strong> {result.primaryPet}
          </p>
          <p className="text-green-900">
            <strong>Secondary Option:</strong> {result.secondaryPet}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
