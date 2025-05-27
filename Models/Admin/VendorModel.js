const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const vendorSchema = new mongoose.Schema({
    ownername: {
        type: String,
        required: [true, "ownername is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please enter a valid email address"
        ],
    },
    businessname: {
        type: String,
        required: [true, "business name is required"],
    },
    businesslocation: {
        type: String,
        required: [true, "business location is required"],
    },
    businesslandmark: {
        type: String,
        required: [true, "business landmark is required"],
    },
    number: {
        type: String,
        required: [true, "phone number is required"],
        match: [
            /^\d{10}$/,
            "Please enter a valid 10-digit phone number"
        ],
    },
    address: {
        type: String,
        required: [true, "address is required"],
    },
    city: {
        type: String,
        required: [true, "city is required"],
    },
    state: {
        type: String,
        required: [true, "state is required"],
    },
    pincode: {
        type: Number,
        required: [true, "pincode is required"],
    },
    storelogo: {
        type: String,
        required: [true, "store logo is required"],
        validate: {
            validator: function (value) {
                return /\.(png|jpg|jpeg)$/i.test(value);
            },
            message: "Store logo must be a PNG, JPG, or JPEG file",
        },
    },
    license: {
        type: String,
        required: [true, "license is required"],
        validate: {
            validator: function (value) {
                return /\.(pdf|doc|docx|jpg|jpeg)$/i.test(value);
            },
            message: "License must be a PDF, DOC, DOCX, JPG, or JPEG file",
        },
    },
    images: {
        type: [String],
        required: [true, "At least one display image is required"],
    },
    description: {
        type: String,
        required: [true, "description is required"],
    },
    storetype: {
        type: String,
    },
    password: {
        type: String, 
        required: [true, "password is required"],
        minlength: [6, 'Password must be at least 6 characters long'],
    },
    ratingsAverage: { 
        type: Number,  
        default: 0, 
        min: 0, 
        max: 5
    },
    role: {
        type: String,
        default: "vendor"
    },
    bankDetails: {
        bankName: {
            type: String,
            required: [true, "Bank name is required"],
        },
        accountNumber: {
            type: String,
            required: [true, "Account number is required"],
            match: [
                /^\d{9,18}$/,
                "Please enter a valid account number"
            ]
        },
        accountHolderName: {
            type: String,
            required: [true, "Account holder name is required"],
        },
        ifscCode: {
            type: String,
            required: [true, "IFSC code is required"],
            match: [
                /^[A-Za-z]{4}\d{7}$/,
                "Please enter a valid IFSC code"
            ]
        }
    },
    gstNumber: {
        type: String,
        required: [true, "GST number is required"],
        match: [
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
            "Please enter a valid 15-character GST number"
        ],
    },
    passbookImage: {
        type: String,
        required: [true, "Passbook image is required"],
        validate: {
            validator: function (value) {
                return /\.(png|jpg|jpeg)$/i.test(value);
            },
            message: "Passbook image must be a PNG, JPG, or JPEG file",
        },
    }
}, { timestamps: true });

vendorSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
