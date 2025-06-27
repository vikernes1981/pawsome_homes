import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaClock, 
  FaPaperPlane,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    // Category validation
    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    // Message validation
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      setErrorMessage('Please correct the errors below');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/contact`, {
        ...formData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      setSuccessMessage('Thank you for your message! We will get back to you within 24 hours.');
      setFormData({ 
        name: '', 
        email: '', 
        subject: '', 
        category: '', 
        message: '' 
      });
      setFormErrors({});
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      let errorMsg = 'There was an error submitting the form. Please try again.';
      
      if (error.response?.status === 429) {
        errorMsg = 'Too many requests. Please wait a moment before submitting again.';
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again later or contact us directly.';
      } else if (!navigator.onLine) {
        errorMsg = 'No internet connection. Please check your connection and try again.';
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: <FaEnvelope className="text-2xl text-green-600" />,
      title: "Email Us",
      details: "support@pawsomehomes.com",
      description: "For general inquiries and support"
    },
    {
      icon: <FaPhone className="text-2xl text-green-600" />,
      title: "Call Us",
      details: "+1 (555) 123-PETS",
      description: "Monday - Friday, 9:00 AM - 6:00 PM EST"
    },
    {
      icon: <FaMapMarkerAlt className="text-2xl text-green-600" />,
      title: "Visit Us",
      details: "123 Pet Haven Street, Animal City, AC 12345",
      description: "By appointment only"
    },
    {
      icon: <FaClock className="text-2xl text-green-600" />,
      title: "Response Time",
      details: "Within 24 hours",
      description: "We aim to respond to all inquiries quickly"
    }
  ];

  const categories = [
    { value: '', label: 'Select a category...' },
    { value: 'adoption', label: 'Pet Adoption Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'shelter', label: 'Shelter Partnership' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'press', label: 'Press & Media' },
    { value: 'other', label: 'Other' }
  ];

  const socialLinks = [
    { icon: <FaFacebook />, url: "#", label: "Facebook" },
    { icon: <FaTwitter />, url: "#", label: "Twitter" },
    { icon: <FaInstagram />, url: "#", label: "Instagram" },
    { icon: <FaLinkedin />, url: "#", label: "LinkedIn" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center mb-16 mt-4">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about adoption, need support, or want to partner with us? 
            We're here to help and would love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{method.title}</h3>
                      <p className="text-gray-600 font-medium">{method.details}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media & Additional Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Follow Us</h3>
              <div className="flex space-x-4 mb-6">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    aria-label={social.label}
                    className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Quick Tip!</h4>
                <p className="text-sm text-green-700">
                  For urgent adoption inquiries, call us directly. For general questions, 
                  email us and we'll respond within 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Send us a Message</h2>

              {/* Success/Error Messages */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 mb-6 rounded-xl flex items-start space-x-3">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Message Sent Successfully!</p>
                    <p className="text-sm">{successMessage}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-xl flex items-start space-x-3">
                  <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Submission Error</p>
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        formErrors.name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                      } focus:ring-2 focus:ring-opacity-20`}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        formErrors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                      } focus:ring-2 focus:ring-opacity-20`}
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject and Category Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief description of your inquiry"
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        formErrors.subject 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                      } focus:ring-2 focus:ring-opacity-20`}
                    />
                    {formErrors.subject && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        {formErrors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      id="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        formErrors.category 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                      } focus:ring-2 focus:ring-opacity-20`}
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        {formErrors.category}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please provide details about your inquiry..."
                    rows="6"
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all duration-300 resize-vertical ${
                      formErrors.message 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                    } focus:ring-2 focus:ring-opacity-20`}
                  />
                  <div className="flex justify-between items-center mt-2">
                    {formErrors.message ? (
                      <p className="text-red-500 text-sm flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        {formErrors.message}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Minimum 10 characters required
                      </p>
                    )}
                    <p className="text-gray-400 text-sm">
                      {formData.message.length} characters
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-300 ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 hover:-translate-y-1 hover:shadow-xl'
                    } text-white flex items-center space-x-2 mx-auto`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: "How long does the adoption process take?",
                answer: "The adoption process typically takes 3-7 days, depending on the shelter's requirements and background checks."
              },
              {
                question: "What documents do I need for adoption?",
                answer: "You'll need a valid ID, proof of residence, and sometimes references. Each shelter may have specific requirements."
              },
              {
                question: "Can I return a pet if it doesn't work out?",
                answer: "Most shelters have return policies. We recommend discussing this with the shelter before adoption."
              },
              {
                question: "How do I become a shelter partner?",
                answer: "Contact us through this form or email us directly. We'll guide you through our partnership program."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;