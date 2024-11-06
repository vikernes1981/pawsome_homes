import User from '../models/User.js';

// Register or retrieve a user by their user ID
const registerUser = async (userId) => {
    let user = await User.findOne({ userId });

    if (!user) {
        user = new User({ userId });
        await user.save();
    }

    return user;
};

// Get user by their user ID
const getUserById = async (userId) => {
    return await User.findOne({ userId });
};

export default {
    registerUser,
    getUserById
};
