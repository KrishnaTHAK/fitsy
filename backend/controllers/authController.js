const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT and set it in an httpOnly cookie
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      const token = generateTokenAndSetCookie(res, user._id);
      res.status(201).json({
        token, // Optionally return the token for the frontend if needed, though cookie is set
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          shippingAddresses: user.shippingAddresses || [],
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateTokenAndSetCookie(res, user._id);
      res.json({
        token, // Optionally return the token
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          shippingAddresses: user.shippingAddresses || [],
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          shippingAddresses: user.shippingAddresses || [],
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user shipping address
// @route   PUT /api/auth/address
// @access  Private
const updateUserAddress = async (req, res) => {
  const { fullName, address, city, state, postalCode, country, phoneNumber } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (!user.shippingAddresses) {
        user.shippingAddresses = [];
      }
      user.shippingAddresses.push({
        fullName,
        address,
        city,
        state,
        postalCode,
        country,
        phoneNumber,
      });

      const updatedUser = await user.save();

      res.json({
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          shippingAddresses: updatedUser.shippingAddresses,
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserAddress,
};
