import React, { useState, useEffect } from 'react';
import { 
  Heart, Plus, Search, Edit3, Trash2, Eye, AlertTriangle, CheckCircle, Clock, RefreshCw, Save, X,
  Camera, User, MapPin, Calendar, Stethoscope, Shield, Activity, FileText, Star, Home, Settings, Users
} from 'lucide-react';
import { getAllPets, addPet, updatePet, deletePet } from '../services/PostServicesPets';

const ManagePets = () => {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('basic');

  // Comprehensive form state matching your Pet schema
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    age: '',
    ageUnit: 'years',
    breed: '',
    type: '',
    description: '',
    
    // Physical Characteristics
    size: '',
    weight: '',
    color: '',
    gender: '',
    
    // Images and Media
    image: '',
    
    // Health Information
    healthStatus: 'good',
    isSpayedNeutered: false,
    vaccinations: {
      current: false,
      lastUpdated: '',
      details: ''
    },
    medicalNotes: '',
    specialNeeds: '',
    
    // Adoption Status and Management
    status: 'available',
    currentLocation: 'shelter',
    kennelNumber: '',
    
    // Behavioral Information
    personality: [],
    goodWith: {
      children: null,
      dogs: null,
      cats: null,
      smallAnimals: null
    },
    
    // Care Requirements
    exerciseNeeds: '',
    groomingNeeds: '',
    trainingLevel: 'untrained',
    houseTrained: false,
    
    // Intake Information
    intakeDate: new Date().toISOString().split('T')[0],
    intakeSource: 'stray',
    intakeReason: '',
    previousOwner: {
      name: '',
      contact: '',
      reason: ''
    },
    
    // Adoption Requirements
    adoptionRequirements: {
      experienceRequired: false,
      fencedYardRequired: false,
      homeVisitRequired: true,
      childrenAgeMinimum: '',
      noOtherPets: false
    },
    
    // Adoption Fee
    adoptionFee: {
      amount: '',
      currency: 'USD',
      includesServices: []
    },
    
    // Management
    priority: 'normal',
    internalNotes: '',
    tags: [],
    isFeatured: false,
    urgentAdoption: false,
    urgentReason: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    console.log('🔄 Pets state changed:', {
      totalPets: pets.length,
      petNames: pets.map(p => p.name),
      petStatuses: pets.map(p => ({ name: p.name, status: p.status || p.adoptionStatus }))
    });
    filterPets();
  }, [pets, searchTerm, statusFilter]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching pets from API...');
      const data = await getAllPets();
      
      console.log('📥 Raw pets data received:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: data?.length,
        firstPet: data[0],
        allPetStatuses: data?.map(pet => ({
          name: pet.name,
          status: pet.status,
          adoptionStatus: pet.adoptionStatus,
          finalStatus: pet.status || pet.adoptionStatus
        }))
      });
      
      setPets(data);
      
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      if (error.message.includes('Authentication required')) {
        setError('Authentication required. Please log in again.');
      } else if (error.message.includes('Network error')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Failed to load pets: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterPets = () => {
    let filtered = pets;

    if (searchTerm) {
      filtered = filtered.filter(pet =>
        pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(pet => {
        const petStatus = pet.status || pet.adoptionStatus || 'available';
        return petStatus === statusFilter;
      });
    }

    console.log('Filtering pets:', {
      totalPets: pets.length,
      searchTerm,
      statusFilter,
      filteredCount: filtered.length,
      petStatuses: pets.map(pet => ({ 
        name: pet.name, 
        status: pet.status || pet.adoptionStatus || 'available' 
      }))
    });

    setFilteredPets(filtered);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.age || formData.age < 0) errors.age = 'Valid age is required';
    if (!formData.breed.trim()) errors.breed = 'Breed is required';
    if (!formData.type) errors.type = 'Type is required';
    if (!formData.description || formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      ageUnit: 'years',
      breed: '',
      type: '',
      description: '',
      size: '',
      weight: '',
      color: '',
      gender: '',
      image: '',
      healthStatus: 'good',
      isSpayedNeutered: false,
      vaccinations: { current: false, lastUpdated: '', details: '' },
      medicalNotes: '',
      specialNeeds: '',
      status: 'available',
      currentLocation: 'shelter',
      kennelNumber: '',
      personality: [],
      goodWith: { children: null, dogs: null, cats: null, smallAnimals: null },
      exerciseNeeds: '',
      groomingNeeds: '',
      trainingLevel: 'untrained',
      houseTrained: false,
      intakeDate: new Date().toISOString().split('T')[0],
      intakeSource: 'stray',
      intakeReason: '',
      previousOwner: { name: '', contact: '', reason: '' },
      adoptionRequirements: {
        experienceRequired: false,
        fencedYardRequired: false,
        homeVisitRequired: true,
        childrenAgeMinimum: '',
        noOtherPets: false
      },
      adoptionFee: { amount: '', currency: 'USD', includesServices: [] },
      priority: 'normal',
      internalNotes: '',
      tags: [],
      isFeatured: false,
      urgentAdoption: false,
      urgentReason: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        // Navigate to the nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Set the final value
        current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
        return newData;
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: Array.isArray(value) ? value : value.split(',').map(v => v.trim()).filter(v => v)
    }));
  };

  const handleCreatePet = async () => {
    if (!validateForm()) return;

    try {
      const petData = {
        ...formData,
        age: parseInt(formData.age),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        adoptionFee: {
          ...formData.adoptionFee,
          amount: formData.adoptionFee.amount ? parseFloat(formData.adoptionFee.amount) : undefined
        }
      };

      const result = await addPet(petData);
      await fetchPets();
      setIsModalOpen(false);
      resetForm();
      alert(`${petData.name} has been added successfully!`);
      
    } catch (error) {
      console.error('Create error:', error);
      alert(`Error adding pet: ${error.message}`);
    }
  };

  const handleUpdatePet = async () => {
    if (!validateForm()) return;

    try {
      const petData = {
        ...formData,
        age: parseInt(formData.age),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        adoptionFee: {
          ...formData.adoptionFee,
          amount: formData.adoptionFee.amount ? parseFloat(formData.adoptionFee.amount) : undefined
        }
      };

      console.log('🔄 Updating pet:', {
        petId: selectedPet._id,
        petName: petData.name,
        oldStatus: selectedPet.status || selectedPet.adoptionStatus,
        newStatus: petData.status,
        updateData: petData
      });

      const result = await updatePet(selectedPet._id, petData);
      
      console.log('✅ Pet updated successfully:', {
        updatedPet: result,
        newStatus: result.status || result.adoptionStatus
      });
      
      // Close modal first
      setIsModalOpen(false);
      setSelectedPet(null);
      resetForm();
      
      // Force refresh the pets list
      await fetchPets();
      
      // Show success message
      alert(`${petData.name} has been updated successfully!`);
      
      // Force re-filter to make sure updated pet shows up
      setTimeout(() => {
        filterPets();
      }, 100);
      
    } catch (error) {
      console.error('❌ Update error:', error);
      alert(`Error updating pet: ${error.message}`);
    }
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePet(petId);
      await fetchPets();
      alert('Pet deleted successfully.');
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Error deleting pet: ${error.message}`);
    }
  };

  const openModal = (mode, pet = null) => {
    setModalMode(mode);
    setSelectedPet(pet);
    setActiveTab('basic');
    
    if (mode === 'create') {
      resetForm();
    } else if (mode === 'edit' && pet) {
      setFormData({
        name: pet.name || '',
        age: pet.age || '',
        ageUnit: pet.ageUnit || 'years',
        breed: pet.breed || '',
        type: pet.type || '',
        description: pet.description || '',
        size: pet.size || '',
        weight: pet.weight || '',
        color: pet.color || '',
        gender: pet.gender || '',
        image: pet.image || '',
        healthStatus: pet.healthStatus || 'good',
        isSpayedNeutered: pet.isSpayedNeutered || false,
        vaccinations: pet.vaccinations || { current: false, lastUpdated: '', details: '' },
        medicalNotes: pet.medicalNotes || '',
        specialNeeds: pet.specialNeeds || '',
        status: pet.status || pet.adoptionStatus || 'available',
        currentLocation: pet.currentLocation || 'shelter',
        kennelNumber: pet.kennelNumber || '',
        personality: pet.personality || [],
        goodWith: pet.goodWith || { children: null, dogs: null, cats: null, smallAnimals: null },
        exerciseNeeds: pet.exerciseNeeds || '',
        groomingNeeds: pet.groomingNeeds || '',
        trainingLevel: pet.trainingLevel || 'untrained',
        houseTrained: pet.houseTrained || false,
        intakeDate: pet.intakeDate ? new Date(pet.intakeDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        intakeSource: pet.intakeSource || 'stray',
        intakeReason: pet.intakeReason || '',
        previousOwner: pet.previousOwner || { name: '', contact: '', reason: '' },
        adoptionRequirements: pet.adoptionRequirements || {
          experienceRequired: false,
          fencedYardRequired: false,
          homeVisitRequired: true,
          childrenAgeMinimum: '',
          noOtherPets: false
        },
        adoptionFee: pet.adoptionFee || { amount: '', currency: 'USD', includesServices: [] },
        priority: pet.priority || 'normal',
        internalNotes: pet.internalNotes || '',
        tags: pet.tags || [],
        isFeatured: pet.isFeatured || false,
        urgentAdoption: pet.urgentAdoption || false,
        urgentReason: pet.urgentReason || ''
      });
    }
    
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { bg: 'bg-green-100', text: 'text-green-800', label: 'Available' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      on_hold: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'On Hold' },
      adopted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Adopted' },
      fostered: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Fostered' },
      returned: { bg: 'bg-red-100', text: 'text-red-800', label: 'Returned' },
      unavailable: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unavailable' }
    };
    
    const config = statusConfig[status] || statusConfig.available;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Pet's name"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                    step="0.5"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.age ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Age"
                  />
                  <select
                    name="ageUnit"
                    value={formData.ageUnit}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
                {formErrors.age && <p className="text-red-500 text-xs mt-1">{formErrors.age}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formErrors.breed ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Pet's breed"
                />
                {formErrors.breed && <p className="text-red-500 text-xs mt-1">{formErrors.breed}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formErrors.type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Type</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="guinea_pig">Guinea Pig</option>
                  <option value="hamster">Hamster</option>
                  <option value="fish">Fish</option>
                  <option value="turtle">Turtle</option>
                  <option value="reptile">Reptile</option>
                  <option value="other">Other</option>
                </select>
                {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Size</option>
                  <option value="extra_small">Extra Small</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra_large">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Weight in kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Pet's color/markings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the pet (minimum 20 characters)"
              />
              {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/pet-image.jpg"
              />
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
                <select
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs_attention">Needs Attention</option>
                  <option value="special_needs">Special Needs</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isSpayedNeutered"
                    checked={formData.isSpayedNeutered}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Spayed/Neutered</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vaccinations</label>
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="vaccinations.current"
                    checked={formData.vaccinations.current}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Vaccinations Current</span>
                </label>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Updated</label>
                  <input
                    type="date"
                    name="vaccinations.lastUpdated"
                    value={formData.vaccinations.lastUpdated}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Vaccination Details</label>
                  <textarea
                    name="vaccinations.details"
                    value={formData.vaccinations.details}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    placeholder="Details about vaccinations..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes</label>
              <textarea
                name="medicalNotes"
                value={formData.medicalNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Any medical conditions, treatments, or notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs</label>
              <textarea
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Any special care requirements..."
              />
            </div>
          </div>
        );

      case 'status':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adoption Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="on_hold">On Hold</option>
                  <option value="adopted">Adopted</option>
                  <option value="fostered">Fostered</option>
                  <option value="returned">Returned</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                <select
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="shelter">Shelter</option>
                  <option value="foster">Foster</option>
                  <option value="medical">Medical</option>
                  <option value="quarantine">Quarantine</option>
                  <option value="adopted">Adopted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kennel Number</label>
                <input
                  type="text"
                  name="kennelNumber"
                  value={formData.kennelNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Kennel/cage number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Featured Pet</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="urgentAdoption"
                    checked={formData.urgentAdoption}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Urgent Adoption</span>
                </label>
              </div>

              {formData.urgentAdoption && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgent Reason</label>
                  <input
                    type="text"
                    name="urgentReason"
                    value={formData.urgentReason}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Why is urgent adoption needed?"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'behavior':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personality Traits</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['friendly', 'energetic', 'calm', 'playful', 'gentle', 'protective', 'independent', 'social', 'quiet', 'vocal', 'curious', 'loyal', 'intelligent', 'trainable', 'affectionate', 'shy', 'confident'].map(trait => (
                  <label key={trait} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.personality.includes(trait)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayChange('personality', [...formData.personality, trait]);
                        } else {
                          handleArrayChange('personality', formData.personality.filter(t => t !== trait));
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{trait}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Good With</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  children: 'Children',
                  dogs: 'Other Dogs',
                  cats: 'Cats',
                  smallAnimals: 'Small Animals'
                }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1">{label}</label>
                    <select
                      name={`goodWith.${key}`}
                      value={formData.goodWith[key] || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Unknown</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Needs</label>
                <select
                  name="exerciseNeeds"
                  value={formData.exerciseNeeds}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Level</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grooming Needs</label>
                <select
                  name="groomingNeeds"
                  value={formData.groomingNeeds}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Level</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Level</label>
                <select
                  name="trainingLevel"
                  value={formData.trainingLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="untrained">Untrained</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="houseTrained"
                  checked={formData.houseTrained}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">House Trained</span>
              </label>
            </div>
          </div>
        );

      case 'intake':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intake Date *</label>
                <input
                  type="date"
                  name="intakeDate"
                  value={formData.intakeDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intake Source *</label>
                <select
                  name="intakeSource"
                  value={formData.intakeSource}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="stray">Stray</option>
                  <option value="surrender">Surrender</option>
                  <option value="transfer">Transfer</option>
                  <option value="born_in_care">Born in Care</option>
                  <option value="confiscation">Confiscation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intake Reason</label>
              <textarea
                name="intakeReason"
                value={formData.intakeReason}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Reason for intake..."
              />
            </div>

            {formData.intakeSource === 'surrender' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Previous Owner Information</label>
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      name="previousOwner.name"
                      value={formData.previousOwner.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="Previous owner's name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contact</label>
                    <input
                      type="text"
                      name="previousOwner.contact"
                      value={formData.previousOwner.contact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="Phone or email"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Surrender Reason</label>
                    <textarea
                      name="previousOwner.reason"
                      value={formData.previousOwner.reason}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="Reason for surrender..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'adoption':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adoption Requirements</label>
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="adoptionRequirements.experienceRequired"
                      checked={formData.adoptionRequirements.experienceRequired}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Experience Required</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="adoptionRequirements.fencedYardRequired"
                      checked={formData.adoptionRequirements.fencedYardRequired}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Fenced Yard Required</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="adoptionRequirements.homeVisitRequired"
                      checked={formData.adoptionRequirements.homeVisitRequired}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Home Visit Required</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="adoptionRequirements.noOtherPets"
                      checked={formData.adoptionRequirements.noOtherPets}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">No Other Pets</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minimum Age for Children</label>
                  <input
                    type="number"
                    name="adoptionRequirements.childrenAgeMinimum"
                    value={formData.adoptionRequirements.childrenAgeMinimum}
                    onChange={handleInputChange}
                    min="0"
                    max="18"
                    className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    placeholder="Age"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adoption Fee</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Amount</label>
                  <div className="flex">
                    <select
                      name="adoptionFee.currency"
                      value={formData.adoptionFee.currency}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-300 rounded-l focus:ring-2 focus:ring-green-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                    <input
                      type="number"
                      name="adoptionFee.amount"
                      value={formData.adoptionFee.amount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Includes Services</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.adoptionFee.includesServices) ? formData.adoptionFee.includesServices.join(', ') : ''}
                    onChange={(e) => {
                      const services = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setFormData(prev => ({
                        ...prev,
                        adoptionFee: {
                          ...prev.adoptionFee,
                          includesServices: services
                        }
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., spay/neuter, vaccines, microchip"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Internal notes for staff (not visible to adopters)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleArrayChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., senior, special needs, friendly, good with kids"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated tags for easy searching</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="w-full h-48 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Pets</h2>
          <p className="text-gray-600">Add, edit, and manage all pets in your system</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={fetchPets}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => openModal('create')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Pet</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Pets</p>
              <p className="text-2xl font-bold text-gray-900">{pets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {pets.filter(pet => {
                  const status = pet.status || pet.adoptionStatus || 'available';
                  return ['available'].includes(status);
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {pets.filter(pet => {
                  const status = pet.status || pet.adoptionStatus || 'available';
                  return status === 'pending';
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Adopted</p>
              <p className="text-2xl font-bold text-gray-900">
                {pets.filter(pet => {
                  const status = pet.status || pet.adoptionStatus || 'available';
                  return status === 'adopted';
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pets..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="on_hold">On Hold</option>
              <option value="adopted">Adopted</option>
              <option value="fostered">Fostered</option>
              <option value="returned">Returned</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Pet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPets.map((pet) => (
          <div key={pet._id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 relative">
              <img
                src={pet.image || 'https://via.placeholder.com/300x200/e5e7eb/6b7280?text=No+Image'}
                alt={pet.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Image+Not+Found';
                }}
              />
              {pet.urgentAdoption && (
                <div className="absolute top-2 left-2">
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    URGENT
                  </span>
                </div>
              )}
              {pet.isFeatured && (
                <div className="absolute top-2 right-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                {getStatusBadge(pet.status || pet.adoptionStatus)}
              </div>
              <p className="text-sm text-gray-600 mb-2">{pet.breed} • {pet.age} {pet.ageUnit || 'years'} old</p>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{pet.description}</p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => openModal('view', pet)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => openModal('edit', pet)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeletePet(pet._id)}
                  className="flex items-center justify-center bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPets.length === 0 && !loading && (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pets found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first pet to the system.'}
          </p>
          <button
            onClick={() => openModal('create')}
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Pet</span>
          </button>
        </div>
      )}

      {/* Enhanced Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-hidden">
            <div className="flex flex-col h-full max-h-screen">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' ? 'Add New Pet' : 
                   modalMode === 'edit' ? `Edit ${selectedPet?.name}` : 
                   `Pet Details - ${selectedPet?.name}`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto">
                {modalMode === 'view' ? (
                  /* Enhanced View Mode */
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <img
                          src={selectedPet?.image || 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=No+Image'}
                          alt={selectedPet?.name}
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Image+Not+Found';
                          }}
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{selectedPet?.name}</h4>
                          <p className="text-gray-600">{selectedPet?.breed} • {selectedPet?.age} {selectedPet?.ageUnit || 'years'} old</p>
                          <div className="flex items-center space-x-2 mt-2">
                            {getStatusBadge(selectedPet?.status || selectedPet?.adoptionStatus)}
                            {selectedPet?.isFeatured && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </span>
                            )}
                            {selectedPet?.urgentAdoption && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                Urgent
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-2 text-gray-600 capitalize">{selectedPet?.type}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Size:</span>
                            <span className="ml-2 text-gray-600 capitalize">{selectedPet?.size?.replace('_', ' ') || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Gender:</span>
                            <span className="ml-2 text-gray-600 capitalize">{selectedPet?.gender || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="ml-2 text-gray-600 capitalize">{selectedPet?.currentLocation || 'Shelter'}</span>
                          </div>
                          {selectedPet?.weight && (
                            <div>
                              <span className="font-medium text-gray-700">Weight:</span>
                              <span className="ml-2 text-gray-600">{selectedPet.weight} kg</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Intake:</span>
                            <span className="ml-2 text-gray-600">{formatDate(selectedPet?.intakeDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                      <p className="text-gray-600">{selectedPet?.description}</p>
                    </div>

                    {selectedPet?.personality && selectedPet.personality.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Personality</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedPet.personality.map((trait, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs capitalize">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPet?.healthStatus && selectedPet.healthStatus !== 'good' && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Health Status</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          selectedPet.healthStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                          selectedPet.healthStatus === 'needs_attention' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedPet.healthStatus.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => openModal('edit', selectedPet)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Pet</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Enhanced Create/Edit Mode with Tabs */
                  <div className="flex flex-col h-full">
                    {/* Tab Navigation */}
                    <div className="flex overflow-x-auto border-b border-gray-200 px-6 py-2">
                      <div className="flex space-x-2 min-w-max">
                        <TabButton id="basic" label="Basic Info" icon={Heart} isActive={activeTab === 'basic'} onClick={setActiveTab} />
                        <TabButton id="health" label="Health" icon={Stethoscope} isActive={activeTab === 'health'} onClick={setActiveTab} />
                        <TabButton id="status" label="Status" icon={Activity} isActive={activeTab === 'status'} onClick={setActiveTab} />
                        <TabButton id="behavior" label="Behavior" icon={Users} isActive={activeTab === 'behavior'} onClick={setActiveTab} />
                        <TabButton id="intake" label="Intake" icon={Calendar} isActive={activeTab === 'intake'} onClick={setActiveTab} />
                        <TabButton id="adoption" label="Adoption" icon={Home} isActive={activeTab === 'adoption'} onClick={setActiveTab} />
                        <TabButton id="notes" label="Notes" icon={FileText} isActive={activeTab === 'notes'} onClick={setActiveTab} />
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        modalMode === 'create' ? handleCreatePet() : handleUpdatePet();
                      }}>
                        {renderTabContent()}
                      </form>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="text-sm text-gray-500">
                        {modalMode === 'create' ? 'Fill in the required fields to add a new pet' : 'Update any fields and save changes'}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            modalMode === 'create' ? handleCreatePet() : handleUpdatePet();
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                          <span>{modalMode === 'create' ? 'Add Pet' : 'Update Pet'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePets;