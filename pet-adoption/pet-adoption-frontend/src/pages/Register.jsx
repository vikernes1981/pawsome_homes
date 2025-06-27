import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthProvider';
import apiClient from '../services/apiClient';
import { validateRegistrationForm } from '../utils/validation';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, XCircle } from 'lucide-react';

/**
 * Enterprise-grade Registration Component
 * Features: Client-side validation, accessibility, security, UX enhancements
 */
const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    privacyAccepted: false,
    marketingConsent: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    suggestions: []
  });

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  /**
   * Password strength checker
   */
  const checkPasswordStrength = (password) => {
    const checks = [
      { test: password.length >= 8, message: 'At least 8 characters' },
      { test: /[a-z]/.test(password), message: 'Lowercase letter' },
      { test: /[A-Z]/.test(password), message: 'Uppercase letter' },
      { test: /\d/.test(password), message: 'Number' },
      { test: /[@$!%*?&]/.test(password), message: 'Special character' }
    ];

    const score = checks.filter(check => check.test).length;
    const suggestions = checks.filter(check => !check.test).map(check => check.message);

    return { score, suggestions };
  };

  /**
   * Real-time form validation
   */
  const validateField = (name, value) => {
    const fieldErrors = {};

    switch (name) {
      case 'username':
        if (!value.trim()) {
          fieldErrors.username = 'Username is required';
        } else if (value.length < 3) {
          fieldErrors.username = 'Username must be at least 3 characters';
        } else if (value.length > 30) {
          fieldErrors.username = 'Username must be less than 30 characters';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          fieldErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
        }
        break;

      case 'email':
        if (!value.trim()) {
          fieldErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors.email = 'Please enter a valid email address';
        }
        break;

      case 'password':
        const strength = checkPasswordStrength(value);
        setPasswordStrength(strength);
        if (!value) {
          fieldErrors.password = 'Password is required';
        } else if (strength.score < 5) {
          fieldErrors.password = 'Password does not meet security requirements';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          fieldErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          fieldErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 'termsAccepted':
        if (!value) {
          fieldErrors.termsAccepted = 'You must accept the Terms of Service';
        }
        break;

      case 'privacyAccepted':
        if (!value) {
          fieldErrors.privacyAccepted = 'You must accept the Privacy Policy';
        }
        break;
    }

    return fieldErrors;
  };

  /**
   * Handle input changes with real-time validation
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation
    const fieldErrors = validateField(name, newValue);
    setErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Clear error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Client-side validation
      const validationErrors = validateRegistrationForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        toast.error('Please correct the errors below');
        return;
      }

      // Prepare data for API (matching your backend expectations)
      const registrationData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        termsAccepted: formData.termsAccepted,
        privacyAccepted: formData.privacyAccepted,
        marketingConsent: formData.marketingConsent,
        profile: {
          // Add any additional profile fields here if needed
        }
      };

      // Make API call
      const response = await apiClient.post('/auth/register', registrationData);

      // Handle successful registration
      if (response.data.success) {
        toast.success('Registration successful! Welcome to Pawsome Homes!');
        
        // Auto-login user with returned tokens
        if (response.data.tokens) {
          login(response.data.user, response.data.tokens);
        }

        // Redirect to home or dashboard
        navigate('/', { 
          state: { message: 'Welcome! Please check your email to verify your account.' }
        });
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error responses
      if (error.response?.data?.details) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.details.forEach(err => {
          backendErrors[err.path || 'general'] = err.msg || err.message;
        });
        setErrors(backendErrors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Password strength indicator component
   */
  const PasswordStrengthIndicator = () => {
    if (!formData.password) return null;

    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

    return (
      <div className="mt-2">
        <div className="flex space-x-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                i < passwordStrength.score ? strengthColors[passwordStrength.score - 1] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Password Strength: {strengthLabels[passwordStrength.score - 1] || 'Very Weak'}
        </p>
        {passwordStrength.suggestions.length > 0 && (
          <ul className="text-xs text-gray-500 mt-1">
            {passwordStrength.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center">
                <XCircle className="w-3 h-3 text-red-400 mr-1" />
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Register - Create Your Pawsome Homes Account</title>
        <meta name="description" content="Join Pawsome Homes to find your perfect pet companion. Create your account to browse pets and submit adoption requests." />
        <meta name="keywords" content="pet adoption, register, create account, dog adoption, cat adoption" />
        <link rel="canonical" href={`${window.location.origin}/register`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">
              Join Pawsome Homes and find your perfect companion
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white shadow-xl rounded-lg p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Choose a username"
                    aria-describedby={errors.username ? 'username-error' : undefined}
                  />
                </div>
                {errors.username && (
                  <p id="username-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="your@email.com"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Create a strong password"
                    aria-describedby={errors.password ? 'password-error' : 'password-help'}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                <PasswordStrengthIndicator />
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms and Privacy Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    aria-describedby={errors.termsAccepted ? 'terms-error' : undefined}
                  />
                  <label htmlFor="termsAccepted" className="ml-3 text-sm text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className="text-green-600 hover:text-green-500 underline">
                      Terms of Service
                    </Link>{' '}
                    *
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p id="terms-error" className="text-sm text-red-600" role="alert">
                    {errors.termsAccepted}
                  </p>
                )}

                <div className="flex items-start">
                  <input
                    id="privacyAccepted"
                    name="privacyAccepted"
                    type="checkbox"
                    checked={formData.privacyAccepted}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    aria-describedby={errors.privacyAccepted ? 'privacy-error' : undefined}
                  />
                  <label htmlFor="privacyAccepted" className="ml-3 text-sm text-gray-700">
                    I agree to the{' '}
                    <Link to="/privacy" className="text-green-600 hover:text-green-500 underline">
                      Privacy Policy
                    </Link>{' '}
                    *
                  </label>
                </div>
                {errors.privacyAccepted && (
                  <p id="privacy-error" className="text-sm text-red-600" role="alert">
                    {errors.privacyAccepted}
                  </p>
                )}

                <div className="flex items-start">
                  <input
                    id="marketingConsent"
                    name="marketingConsent"
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="marketingConsent" className="ml-3 text-sm text-gray-700">
                    I would like to receive updates about new pets and adoption events (optional)
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || Object.keys(errors).some(key => errors[key])}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors duration-200 ${
                  loading || Object.keys(errors).some(key => errors[key])
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
                aria-describedby="submit-help"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-green-600 hover:text-green-500 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;