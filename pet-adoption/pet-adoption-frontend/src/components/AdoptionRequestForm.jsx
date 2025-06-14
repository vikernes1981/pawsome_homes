import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createRequest } from '../services/PostServicesPostRequest';
import { getPetById } from '../services/PostServicesPets';

const AdoptionRequestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');

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

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const petResponse = await getPetById(id);
        if (!petResponse) throw new Error('Failed to fetch pet data');

        setPetName(petResponse.name);
        setFormData(prev => ({
          ...prev,
          petType: petResponse.type,
        }));
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    fetchPet();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!userId || !formData.email.trim()) {
      navigate('/login');
      return;
    }

    try {
      const requestData = {
        user: userId,
        pet: id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          region: formData.region,
          zip: formData.zip,
        },
        petType: formData.petType,
        message: formData.why,
        when: new Date(formData.when).toISOString(),
        status: 'Pending',
      };

      await createRequest(requestData);
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
        petType: formData.petType,
        why: '',
        when: '',
      });
    } catch {
      setErrorMessage('There was an issue submitting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 p-16 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-semibold mb-8 text-center text-green-600">
        Pet Adoption Form for {petName}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-100">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="firstName" className="block text-lg font-semibold mb-2">First Name</label>
            <input
              id="firstName"
              type="text"
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
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        {/* ✅ Email Field */}
        <div>
          <label htmlFor="email" className="block text-lg font-semibold mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-lg font-semibold mb-2">Phone</label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="street" className="block text-lg font-semibold mb-2">Street Address</label>
            <input
              id="street"
              type="text"
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
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full p-4 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="zip" className="block text-lg font-semibold mb-2">Zip Code</label>
            <input
              id="zip"
              type="text"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="why" className="block text-lg font-semibold mb-2">Why do you want to adopt?</label>
          <textarea
            id="why"
            value={formData.why}
            onChange={(e) => setFormData({ ...formData, why: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label htmlFor="when" className="block text-lg font-semibold mb-2">When can you adopt?</label>
          <input
            id="when"
            type="date"
            value={formData.when}
            onChange={(e) => setFormData({ ...formData, when: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <button type="submit" className="w-full py-3 px-6 bg-green-600 text-white rounded-lg" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>

        {successMessage && <p className="text-green-600 mt-4">{successMessage}</p>}
        {errorMessage && <p className="text-red-600 mt-4">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default AdoptionRequestForm;
