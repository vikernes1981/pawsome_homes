import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createRequest } from '../services/PostServicesPostRequest';
import { getAllUsers } from '../services/PostServicesUsers'; // Fetch all users
import { getPetById } from '../services/PostServicesPets'; // Fetch pet info

const AdoptionRequestForm = () => {
  const { id } = useParams(); // Get pet id from URL
  const navigate = useNavigate(); // For navigation
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    zip: '',
    petType: '',
    why: '',
    when: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [petName, setPetName] = useState('');
  const [users, setUsers] = useState([]); // Store all users

  // Fetch the pet info and all users
  useEffect(() => {
    const fetchPetAndUsers = async () => {
      try {
        // Fetch pet info
        const petResponse = await getPetById(id);
        if (petResponse) {
          setPetName(petResponse.name);
        } else {
          throw new Error('Failed to fetch pet data');
        }

        // Fetch all users
        const usersResponse = await getAllUsers();
        setUsers(usersResponse); // Store users in state
      } catch (error) {
        setErrorMessage(error.message);
      }
    };
    fetchPetAndUsers();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Check if the user exists with the provided email
    const user = users.find((user) => user.email === formData.email);

    if (!user) {
      // If user doesn't exist, redirect to login
      navigate('/login');
      return;
    }

    try {
      const requestData = {
        user: user._id, // Use the fetched user ID
        pet: id, // Pet ID from URL
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email, // Ensure email is being sent
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          region: formData.region,
          zip: formData.zip,
        },
        petType: formData.petType,
        message: formData.why,
        when: new Date(formData.when).toISOString(), // Format the date
        status: 'Pending',
      };

      await createRequest(requestData); // Submit the request
      setSuccessMessage('Your adoption request has been submitted successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        region: '',
        zip: '',
        petType: '',
        why: '',
        when: '',
      }); // Reset the form
    } catch (err) {
      setErrorMessage('There was an issue submitting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 p-16 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-semibold mb-8 text-center text-green-600">Pet Adoption Form for {petName}</h1>

      <form onSubmit={handleSubmit} className="space-y-6  bg-gray-100">
        {/* Name Field */}
        <div className="flex gap-4  bg-gray-100">
          <div className="flex-1">
            <label htmlFor="firstName" className="block text-lg font-semibold mb-2">First Name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="lastName" className="block text-lg font-semibold mb-2">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-lg font-semibold mb-2">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {/* Phone Number Field */}
        <div>
          <label htmlFor="phone" className="block text-lg font-semibold mb-2">Phone Number</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {/* Address Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="street" className="block text-lg font-semibold mb-2">Street Address</label>
            <input
              id="street"
              type="text"
              name="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="city" className="block text-lg font-semibold mb-2">City</label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-4 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="region" className="block text-lg font-semibold mb-2">Region</label>
              <input
                id="region"
                type="text"
                name="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full p-4 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="zip" className="block text-lg font-semibold mb-2">Postal/Zip Code</label>
            <input
              id="zip"
              type="text"
              name="zip"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        {/* Additional Fields */}
        <div>
          <label htmlFor="why" className="block text-lg font-semibold mb-2">Why do you want to adopt this pet?</label>
          <textarea
            id="why"
            name="why"
            value={formData.why}
            onChange={(e) => setFormData({ ...formData, why: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {/* When can you adopt */}
        <div>
          <label htmlFor="when" className="block text-lg font-semibold mb-2">When can you adopt?</label>
          <input
            id="when"
            type="date"
            name="when"
            value={formData.when}
            onChange={(e) => setFormData({ ...formData, when: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="w-full py-3 px-6 bg-green-600 text-white rounded-lg" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>

        {/* Success and Error Messages */}
        {successMessage && <p className="text-green-600 mt-4">{successMessage}</p>}
        {errorMessage && <p className="text-red-600 mt-4">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default AdoptionRequestForm;