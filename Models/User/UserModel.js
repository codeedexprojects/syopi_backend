const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Counter = require('./counterModel'); 
const CoinHistory = require('./coinHistoryModel'); 

const userSchema = new mongoose.Schema({
    userId: { type: Number, unique: true },
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
          const phoneRegex = /^[0-9]{10,15}$/;
          return phoneRegex.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    image: { type: String },
    gender: {
      type: String,
      enum: ['male', 'female', 'others']
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
    externalUserId: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ✅ Pre-save hook to assign userId
userSchema.pre('save', async function(next) {
    if (!this.isNew) return next();

    try {
        const counter = await Counter.findOneAndUpdate(
            { name: 'userId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        this.userId = counter.seq;
        next();
    } catch (error) {
        next(error);
    }
});

// ✅ Methods to credit and spend coins
userSchema.methods.creditCoins = async function(amount, referenceId, referenceType, description) {
    this.coins += amount;
    await this.save();

    await CoinHistory.create({
        userId: this._id,
        amount: amount,
        referenceId: referenceId,
        referenceType: referenceType,
        description: description,
        type: 'credit'
    });
};

userSchema.methods.spendCoins = async function(amount, referenceId, referenceType, description) {
    if (this.coins < amount) throw new Error('Insufficient coins');

    this.coins -= amount;
    await this.save();

    await CoinHistory.create({
        userId: this._id,
        amount: amount,
        referenceId: referenceId,
        referenceType: referenceType,
        description: description,
        type: 'debit'
    });
};

module.exports = mongoose.model('User', userSchema);
