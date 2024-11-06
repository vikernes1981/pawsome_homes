import Pet from '../models/Pet.js';

export const getAllPets = async (req, res) => {
  const { breed, location, age } = req.query;
  const filter = {};
  if (breed) filter.breed = breed;
  if (location) filter.location = location;
  if (age) filter.age = age;

  try {
    const pets = await Pet.find(filter);
    res.json(pets);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

export const createPet = async (req, res) => {
  const { name, age, breed, type, description, image, link } = req.body;
  try {
    const pet = new Pet({ name, age, breed, type, description, image , link});
    await pet.save();
    res.json(pet);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

export const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    res.json(pet);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePet = async (req, res) => {
  const { id } = req.params;
  const { name, age, breed, location, description, image, link } = req.body;

  try {
    const pet = await Pet.findByIdAndUpdate(
      id,
      { name, age, breed, location, description, image, link },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    res.json(pet);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

export const submitInquiry = async (req, res) => {
  const { petId } = req.params;
  const { name, email, message } = req.body;

  res.json({ msg: 'Inquiry submitted successfully' });
};
