import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'User',
    required: true,
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
  }],
  adoptedPets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});


export default mongoose.model('User', userSchema);