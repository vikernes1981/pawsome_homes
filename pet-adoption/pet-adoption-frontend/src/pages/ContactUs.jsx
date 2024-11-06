import React, { useState } from 'react';
import { useForm, ValidationError } from '@formspree/react';

const ContactUs = () => {
  const [state, handleSubmit] = useForm('mwpkllvq');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [successMessage, setSuccessMessage] = useState('');

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitWrapper = async (e) => {
    e.preventDefault();

    console.log('Form Data:', formData);

    try {
      // Attempt to submit the form data
      const response = await handleSubmit(formData);

      console.log('Response:', response); // Log the response for debugging

      // Check the response
      if (state.succeeded) {
        console.log('Form submitted successfully'); // Log successful submission
        setSuccessMessage('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', message: '' }); // Reset form fields
      } else {
        console.error('Form submission failed:', response); // Log errors if the submission failed
        alert('There was an error submitting the form. Please try again.'); // Alert the user about the error
      }
    } catch (error) {
      console.error('Submission error:', error); // Log any error that occurred during submission
      alert('There was an error submitting the form. Please try again.'); // Alert the user about the error
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-16 bg-gray-200 shadow-lg rounded-lg mt-20">
      <h2 className="text-3xl font-bold text-center mb-6 text-green-700">Contact Us</h2>

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-lg shadow-md">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmitWrapper} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-lg font-semibold text-gray-700">Your Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-lg font-semibold text-gray-700">Email Address</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-lg font-semibold text-gray-700">Your Message</label>
          <textarea
            name="message"
            id="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Write your message here"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            rows="5"
          />
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300"
            disabled={state.submitting}
          >
            Submit
          </button>
        </div>
      </form>

      {/* Show validation errors if any */}
      {state.errors && state.errors.length > 0 && (
        <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg shadow-md">
          {state.errors.map((error) => (
            <p key={error.field} className="text-sm">{error.message}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactUs;
