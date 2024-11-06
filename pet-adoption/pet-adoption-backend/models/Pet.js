import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  breed: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Dog', 'Cat', 'Bird', 'Fish', 'Turtle'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['Available', 'Adopted'],
    default: 'Available',
    required: true,
  },
  adoptionDate: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  link: {
    type: String,
    required: false,
  }
});

export default mongoose.model('Pet', petSchema);
