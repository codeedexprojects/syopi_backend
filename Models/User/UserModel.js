const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
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
    image: { type: String },
    gender: {
      type: String,
      enum: ['male', 'female']
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
          if (!v) return true;
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
    appleId: { type: String, default: "user" },
    playerId: { type: String, default: null },

    // ✅ New field
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);



module.exports = mongoose.model('User', userSchema);
