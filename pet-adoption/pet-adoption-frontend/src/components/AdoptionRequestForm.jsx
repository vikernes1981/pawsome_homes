import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createRequest, AdoptionRequestError } from '../services/PostServicesPostRequest';
import { getPetById } from '../services/PostServicesPets';

const AdoptionRequestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');

  const [formData, setFormData] = useState({
    // Personal Information
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    
    // Address Information
    street: '',
    city: '',
    region: '',
    zip: '',
    country: 'United States',
    
    // Housing Information
    housingType: '',
    hasYard: false,
    yardDetails: '',
    hasPets: false,
    currentPets: '',
    
    // Application Details
    reason: '',
    petExperience: '',
    preferredMeetingTime: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingPet, setLoadingPet] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [petData, setPetData] = useState(null);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return cleanPhone.length >= 10 && /^[\+]?[1-9][\d]{9,14}$/.test(cleanPhone);
  };

  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!formData.applicantName.trim()) {
      errors.applicantName = 'Full name is required';
    } else if (formData.applicantName.length > 100) {
      errors.applicantName = 'Name must be less than 100 characters';
    }

    if (!formData.applicantEmail.trim()) {
      errors.applicantEmail = 'Email is required';
    } else if (!validateEmail(formData.applicantEmail)) {
      errors.applicantEmail = 'Please enter a valid email address';
    }

    if (!formData.applicantPhone.trim()) {
      errors.applicantPhone = 'Phone number is required';
    } else if (!validatePhone(formData.applicantPhone)) {
      errors.applicantPhone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    if (!formData.street.trim()) {
      errors.street = 'Street address is required';
    } else if (formData.street.length < 5) {
      errors.street = 'Please provide a complete street address';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.region.trim()) {
      errors.region = 'State/Province is required';
    }

    if (!formData.zip.trim()) {
      errors.zip = 'ZIP/Postal code is required';
    }

    if (!formData.housingType) {
      errors.housingType = 'Housing type is required';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Reason for adoption is required';
    } else if (formData.reason.length < 20) {
      errors.reason = 'Please provide at least 20 characters explaining why you want to adopt';
    } else if (formData.reason.length > 2000) {
      errors.reason = 'Reason must be less than 2000 characters';
    }

    // Conditional validation
    if (formData.hasYard && !formData.yardDetails.trim()) {
      errors.yardDetails = 'Please describe your yard since you indicated you have one';
    }

    if (formData.hasPets && !formData.currentPets.trim()) {
      errors.currentPets = 'Please describe your current pets';
    }

    if (formData.preferredMeetingTime) {
      const meetingDate = new Date(formData.preferredMeetingTime);
      if (meetingDate <= new Date()) {
        errors.preferredMeetingTime = 'Meeting time must be in the future';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoadingPet(true);
        const petResponse = await getPetById(id);
        if (!petResponse) {
          throw new Error('Pet not found');
        }

        setPetData(petResponse);
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching pet:', error);
        setErrorMessage('Unable to load pet information. Please try again.');
      } finally {
        setLoadingPet(false);
      }
    };

    if (id) {
      fetchPet();
    }
  }, [id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Check authentication
    if (!userId) {
      setErrorMessage('Please log in to submit an adoption request.');
      navigate('/login');
      return;
    }

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      setErrorMessage('Please correct the errors below and try again.');
      return;
    }

    try {
      // Prepare request data to match API expectations
      const requestData = {
        petId: id,
        applicantName: formData.applicantName.trim(),
        applicantEmail: formData.applicantEmail.trim().toLowerCase(),
        applicantPhone: formData.applicantPhone.replace(/[\s\-\(\)\.]/g, ''),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          region: formData.region.trim(),
          zip: formData.zip.trim(),
          country: formData.country.trim()
        },
        housingType: formData.housingType,
        hasYard: formData.hasYard,
        ...(formData.hasYard && { yardDetails: formData.yardDetails.trim() }),
        hasPets: formData.hasPets,
        ...(formData.hasPets && { currentPets: formData.currentPets.trim() }),
        reason: formData.reason.trim(),
        ...(formData.petExperience && { petExperience: formData.petExperience.trim() }),
        ...(formData.preferredMeetingTime && { 
          preferredMeetingTime: new Date(formData.preferredMeetingTime).toISOString() 
        })
      };

      console.log('Submitting adoption request:', requestData);

      const result = await createRequest(requestData);
      
      setSuccessMessage(
        `Your adoption request for ${petData?.name || 'this pet'} has been submitted successfully! ` +
        'You will receive a confirmation email shortly. Our team will review your application and contact you within 2-3 business days.'
      );
      
      // Reset form on success
      setFormData({
        applicantName: '',
        applicantEmail: '',
        applicantPhone: '',
        street: '',
        city: '',
        region: '',
        zip: '',
        country: 'United States',
        housingType: '',
        hasYard: false,
        yardDetails: '',
        hasPets: false,
        currentPets: '',
        reason: '',
        petExperience: '',
        preferredMeetingTime: '',
      });

      // Scroll to success message
      setTimeout(() => {
        document.querySelector('.success-message')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);

    } catch (error) {
      console.error('Error submitting adoption request:', error);
      
      if (error instanceof AdoptionRequestError) {
        setErrorMessage(error.message);
        
        // Handle specific error types
        if (error.statusCode === 409) {
          setErrorMessage(
            `You have already submitted an application for ${petData?.name || 'this pet'}. ` +
            'Please check your email for updates or contact us if you need to make changes.'
          );
        } else if (error.statusCode === 401) {
          navigate('/login');
          return;
        }
      } else {
        setErrorMessage(
          'We encountered an unexpected error while submitting your request. ' +
          'Please try again in a few moments or contact us for assistance.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingPet) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-16 bg-gray-100 rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pet information...</p>
        </div>
      </div>
    );
  }

  if (!petData) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-16 bg-gray-100 rounded-lg shadow-md">
        <div className="text-center">
          <p className="text-red-600">Unable to load pet information.</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 text-green-600">
          Adopt {petData.name}
        </h1>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-gray-700">
            Thank you for your interest in adopting {petData.name}! 
            Please fill out this application completely and accurately. 
            All information will be kept confidential.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-semibold">Success!</p>
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-semibold">Error</p>
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="applicantName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="applicantName"
                type="text"
                value={formData.applicantName}
                onChange={(e) => handleInputChange('applicantName', e.target.value)}
                className={`w-full p-3 border rounded-lg ${validationErrors.applicantName ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                placeholder="Enter your full name"
                maxLength={100}
              />
              {validationErrors.applicantName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.applicantName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="applicantEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="applicantEmail"
                  type="email"
                  value={formData.applicantEmail}
                  onChange={(e) => handleInputChange('applicantEmail', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${validationErrors.applicantEmail ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                  placeholder="your.email@example.com"
                />
                {validationErrors.applicantEmail && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.applicantEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor="applicantPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  id="applicantPhone"
                  type="tel"
                  value={formData.applicantPhone}
                  onChange={(e) => handleInputChange('applicantPhone', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${validationErrors.applicantPhone ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                  placeholder="(555) 123-4567"
                />
                {validationErrors.applicantPhone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.applicantPhone}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Address Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                id="street"
                type="text"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className={`w-full p-3 border rounded-lg ${validationErrors.street ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                placeholder="123 Main Street"
              />
              {validationErrors.street && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.street}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${validationErrors.city ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                  placeholder="Your city"
                />
                {validationErrors.city && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <input
                  id="region"
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${validationErrors.region ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                  placeholder="State/Province"
                />
                {validationErrors.region && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.region}</p>
                )}
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP/Postal Code *
                </label>
                <input
                  id="zip"
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  className={`w-full p-3 border rounded-lg ${validationErrors.zip ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                  placeholder="12345"
                />
                {validationErrors.zip && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.zip}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Housing Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Housing Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="housingType" className="block text-sm font-medium text-gray-700 mb-1">
                Type of Housing *
              </label>
              <select
                id="housingType"
                value={formData.housingType}
                onChange={(e) => handleInputChange('housingType', e.target.value)}
                className={`w-full p-3 border rounded-lg ${validationErrors.housingType ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
              >
                <option value="">Select housing type</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="mobile_home">Mobile Home</option>
                <option value="other">Other</option>
              </select>
              {validationErrors.housingType && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.housingType}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="hasYard"
                  type="checkbox"
                  checked={formData.hasYard}
                  onChange={(e) => handleInputChange('hasYard', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="hasYard" className="ml-2 block text-sm text-gray-700">
                  I have a yard
                </label>
              </div>

              {formData.hasYard && (
                <div>
                  <label htmlFor="yardDetails" className="block text-sm font-medium text-gray-700 mb-1">
                    Describe your yard *
                  </label>
                  <textarea
                    id="yardDetails"
                    value={formData.yardDetails}
                    onChange={(e) => handleInputChange('yardDetails', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${validationErrors.yardDetails ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                    rows={3}
                    placeholder="Describe the size, fencing, and any other relevant details about your yard"
                  />
                  {validationErrors.yardDetails && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.yardDetails}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="hasPets"
                  type="checkbox"
                  checked={formData.hasPets}
                  onChange={(e) => handleInputChange('hasPets', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="hasPets" className="ml-2 block text-sm text-gray-700">
                  I currently have pets
                </label>
              </div>

              {formData.hasPets && (
                <div>
                  <label htmlFor="currentPets" className="block text-sm font-medium text-gray-700 mb-1">
                    Describe your current pets *
                  </label>
                  <textarea
                    id="currentPets"
                    value={formData.currentPets}
                    onChange={(e) => handleInputChange('currentPets', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${validationErrors.currentPets ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                    rows={3}
                    placeholder="Please list all current pets, their ages, breeds, and vaccination status"
                  />
                  {validationErrors.currentPets && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.currentPets}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Application Details Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Application Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Why do you want to adopt {petData.name}? *
              </label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className={`w-full p-3 border rounded-lg ${validationErrors.reason ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                rows={4}
                placeholder="Please explain why you want to adopt this pet and how you will care for them..."
                maxLength={2000}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>
                  {validationErrors.reason ? (
                    <span className="text-red-500">{validationErrors.reason}</span>
                  ) : (
                    'Minimum 20 characters required'
                  )}
                </span>
                <span>{formData.reason.length}/2000</span>
              </div>
            </div>

            <div>
              <label htmlFor="petExperience" className="block text-sm font-medium text-gray-700 mb-1">
                Previous pet experience (optional)
              </label>
              <textarea
                id="petExperience"
                value={formData.petExperience}
                onChange={(e) => handleInputChange('petExperience', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Describe any previous experience with pets..."
                maxLength={1000}
              />
              <div className="text-sm text-gray-500 mt-1 text-right">
                {formData.petExperience.length}/1000
              </div>
            </div>

            <div>
              <label htmlFor="preferredMeetingTime" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred meeting time (optional)
              </label>
              <input
                id="preferredMeetingTime"
                type="datetime-local"
                value={formData.preferredMeetingTime}
                onChange={(e) => handleInputChange('preferredMeetingTime', e.target.value)}
                className={`w-full p-3 border rounded-lg ${validationErrors.preferredMeetingTime ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`}
                min={new Date().toISOString().slice(0, 16)}
              />
              {validationErrors.preferredMeetingTime && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.preferredMeetingTime}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              By submitting this application, you agree to our terms and conditions. 
              We will review your application and contact you within 2-3 business days.
            </p>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Application...
                </span>
              ) : (
                'Submit Adoption Application'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdoptionRequestForm;
