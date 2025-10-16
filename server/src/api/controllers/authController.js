const User = require('../../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, expiresIn = '30d') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// --- PUBLIC CONTROLLERS ---

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
// @body    { "username": "testuser", "email": "test@example.com", "password": "password123" }
// @returns { "token": "JWT_TOKEN", ...userData }
exports.signupUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
// @body    { "email": "test@example.com", "password": "password123" }
// @returns { "token": "JWT_TOKEN", ...userData }
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate a temporary guest account
// @route   POST /api/auth/guest
// @access  Public
// @returns { "token": "JWT_TOKEN", ...guestUserData }
exports.guestLogin = async (req, res) => {
    const adjectives = ["Swift", "Brave", "Mellow", "Bright", "Calm", "Gentle", "Mighty", "Silent", "Lively", "Bold", "Shiny", "Fierce", "Clever", "Happy", "Lucky", "Wild", "Cool", "Epic", "Nimble", "Strong", "Quiet", "Fast", "Witty", "Jolly", "Fresh", "Smart", "Daring", "Chill", "Glowing", "Fearless", "Cosmic", "Sunny", "Kind", "Radiant", "Stormy", "Cheerful", "Playful", "Dynamic", "Peaceful", "Magical"];
    const nouns = ["Tiger", "Eagle", "Panda", "Falcon", "Wolf", "Lion", "Hawk", "Shark", "Bear", "Dolphin", "Fox", "Dragon", "Leopard", "Cheetah", "Whale", "Horse", "Rabbit", "Phoenix", "Turtle", "Crow", "Stallion", "Panther", "Otter", "Owl", "Butterfly", "Raven", "Koala", "Penguin", "Lynx", "Moose", "Elephant", "Giraffe", "Cobra", "Jaguar", "Frog", "Zebra", "Camel", "Rhino", "Hippo", "Monkey"];
    
    try {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const number = Math.floor(1000 + Math.random() * 9000);
        const guestUsername = `${adj}${noun}${number}`;
        const guestEmail = `${guestUsername}@devstudio.guest`;

        const guestUser = await User.create({
            username: guestUsername,
            email: guestEmail,
            isGuest: true,
        });

        res.status(201).json({
            _id: guestUser._id,
            username: guestUser.username,
            email: guestUser.email,
            isGuest: true,
            token: generateToken(guestUser._id, '2h'),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- PRIVATE CONTROLLERS ---

// @desc    Get current user's profile
// @route   GET /api/auth/me
// @access  Private
// @returns { ...userData }
exports.getUserProfile = async (req, res) => {
  // req.user is populated by the 'protect' middleware
  res.status(200).json(req.user);
};

// @desc    Update user profile (username, email)
// @route   PUT /api/auth/me
// @access  Private
// @body    { "username": "newUsername", "email": "new@email.com" }
// @returns { "token": "NEW_JWT_TOKEN", ...updatedUserData }
exports.updateUserProfile = async (req, res) => {
  const { username, email } = req.body;
  
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = username || user.username;
      user.email = email || user.email;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        token: generateToken(updatedUser._id), // Re-issue token in case payload needs update
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    // Handle potential duplicate key error for email/username
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email is already taken.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/me/change-password
// @access  Private
// @body    { "currentPassword": "password123", "newPassword": "newPassword456" }
// @returns { "message": "Password updated successfully" }
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both current and new passwords.' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ message: 'Invalid current password.' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete user account
// @route   DELETE /api/auth/me
// @access  Private
// @body    { "password": "password123" }
// @returns { "message": "User account deleted successfully" }
exports.deleteUser = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required to delete account.' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        await User.findByIdAndDelete(req.user._id);

        res.status(200).json({ message: 'User account deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};