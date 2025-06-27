import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPaw, 
  FaHeart, 
  FaCheckCircle, 
  FaArrowLeft, 
  FaArrowRight,
  FaRedo,
  FaStar,
  FaInfoCircle
} from 'react-icons/fa';
import { quizQuestions } from '../data/quizQuestions';
import { calculateBestPets } from '../utils/quizLogic';

const QuizPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update progress
  useEffect(() => {
    const completedQuestions = Object.keys(answers).length;
    const progressPercentage = (completedQuestions / quizQuestions.length) * 100;
    setProgress(progressPercentage);
  }, [answers]);

  const handleAnswerSelect = useCallback((questionName, value) => {
    setAnswers(prev => ({ ...prev, [questionName]: value }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < quizQuestions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  }, [currentStep]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Check if all required questions are answered
    const requiredQuestions = quizQuestions.filter(q => q.required !== false);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.name]);
    
    if (missingAnswers.length > 0) {
      alert(`Please answer all required questions. Missing: ${missingAnswers.map(q => q.label).join(', ')}`);
      return;
    }

    const pets = calculateBestPets(answers);
    setResult(pets);
    setShowResults(true);
    window.scrollTo(0, 0);
  }, [answers]);

  const restartQuiz = useCallback(() => {
    setAnswers({});
    setResult(null);
    setShowResults(false);
    setCurrentStep(0);
    setProgress(0);
    window.scrollTo(0, 0);
  }, []);

  const currentQuestion = quizQuestions[currentStep];
  const isQuestionAnswered = answers[currentQuestion?.name];
  const isLastQuestion = currentStep === quizQuestions.length - 1;

  // Results view
  if (showResults && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          
          {/* Results Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <FaHeart className="text-3xl text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Perfect Pet Matches!</h1>
            <p className="text-xl text-gray-600">Based on your lifestyle and preferences</p>
          </div>

          {/* Results Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            
            {/* Primary Match */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-l-4 border-green-500 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <FaStar className="mr-1" />
                  Best Match
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Primary Recommendation</h3>
              <div className="text-6xl mb-4">
                {result.primaryPet === 'Dog' ? '🐕' : 
                 result.primaryPet === 'Cat' ? '🐱' : 
                 result.primaryPet === 'Bird' ? '🦜' : 
                 result.primaryPet === 'Fish' ? '🐠' : 
                 result.primaryPet === 'Small Mammal' ? '🐹' : 
                 result.primaryPet === 'Reptile' ? '🦎' : '🐾'}
              </div>
              <p className="text-3xl font-bold text-green-600 mb-4">{result.primaryPet}</p>
              <p className="text-gray-600 mb-6">
                This pet type best matches your lifestyle, activity level, and living situation.
              </p>
              <Link to="/pet-list">
                <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  Browse {result.primaryPet}s for Adoption
                </button>
              </Link>
            </div>

            {/* Secondary Match */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-l-4 border-blue-500">
              <div className="absolute top-4 right-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Alternative
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Secondary Option</h3>
              <div className="text-6xl mb-4">
                {result.secondaryPet === 'Dog' ? '🐕' : 
                 result.secondaryPet === 'Cat' ? '🐱' : 
                 result.secondaryPet === 'Bird' ? '🦜' : 
                 result.secondaryPet === 'Fish' ? '🐠' : 
                 result.secondaryPet === 'Small Mammal' ? '🐹' : 
                 result.secondaryPet === 'Reptile' ? '🦎' : '🐾'}
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-4">{result.secondaryPet}</p>
              <p className="text-gray-600 mb-6">
                Another great option that could work well with your preferences and situation.
              </p>
              <Link to="/pet-list">
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                  Browse {result.secondaryPet}s for Adoption
                </button>
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Next Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPaw className="text-2xl text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Browse Pets</h4>
                <p className="text-sm text-gray-600">Look through available pets that match your quiz results</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaInfoCircle className="text-2xl text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Learn More</h4>
                <p className="text-sm text-gray-600">Research care requirements for your recommended pet types</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHeart className="text-2xl text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Start Adoption</h4>
                <p className="text-sm text-gray-600">Contact shelters and begin the adoption process</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={restartQuiz}
              className="px-8 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <FaRedo className="mr-2" />
              Retake Quiz
            </button>
            <Link to="/pet-list">
              <button className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                Browse All Pets
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quiz view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <FaPaw className="text-3xl text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Find Your Ideal Pet</h1>
          <p className="text-xl text-gray-600">Answer a few questions to discover your perfect companion</p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-8">
          <div className="flex items-start">
            <FaInfoCircle className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Privacy Notice</h3>
              <p className="text-yellow-700 text-sm">
                This quiz does not save your data anywhere. Questions about children, travel, and time away are 
                <strong> optional</strong> and only used to refine suggestions. Your privacy is important to us.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-600">
              {Object.keys(answers).length} of {quizQuestions.length} questions
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 mb-8 transition-all duration-300 ${isAnimating ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'}`}>
          
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                Question {currentStep + 1} of {quizQuestions.length}
              </span>
              {currentQuestion?.required === false && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Optional
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
              {currentQuestion?.label}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion?.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswerSelect(currentQuestion.name, option.value)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                  answers[currentQuestion.name] === option.value
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.label}</span>
                  {answers[currentQuestion.name] === option.value && (
                    <FaCheckCircle className="text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <FaArrowLeft className="mr-2" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < quizQuestions.filter(q => q.required !== false).length}
                className={`px-8 py-3 rounded-xl font-semibold transition-colors flex items-center ${
                  Object.keys(answers).length < quizQuestions.filter(q => q.required !== false).length
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <FaHeart className="mr-2" />
                Get My Results
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={currentQuestion?.required !== false && !isQuestionAnswered}
                className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center ${
                  currentQuestion?.required !== false && !isQuestionAnswered
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Next
                <FaArrowRight className="ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Question Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Overview</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {quizQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  index === currentStep
                    ? 'bg-green-600 text-white'
                    : answers[question.name]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
                title={`Question ${index + 1}: ${question.label}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;