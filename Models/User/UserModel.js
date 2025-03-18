const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [3, 'Name must be at least 3 characters long'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          const phoneRegex = /^[0-9]{10,15}$/; // International phone format
          return phoneRegex.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    password: {
      type: String,
      required: false, // Default to false
      minlength: [6, 'Password must be at least 6 characters long'],
      validate: {
        validator: function (value) {
          // Ensure password is present if googleId is missing
          if (!this.googleId && (!value || value.length < 6)) {
            return false;
          }
          return true;
        },
        message: 'Password is required and must be at least 6 characters long unless Google login is used.',
      },
    },
    image: {
      type:String,
    },
    gender: {
      type:String,
      enum: ['male','female']
    },
    referralCode: {
      type: String,
      unique: true,
      default: function () {
        return `SYOPI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      },
    },
    referredBy: {
      type: String,
      validate: {
        validator: async function (v) {
          if (!v) return true; // Allow null or empty referredBy
          const user = await mongoose.model('User').findOne({ referralCode: v });
          return !!user;
        },
        message: (props) => `Invalid referral code: ${props.value}`,
      },
    },
    coins: {
      type: Number,
      default: 0
    },
    role: { type: String, default: 'customer' },
    appleId: { type:String, default: "user"},
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
