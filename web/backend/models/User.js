const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        select: false
    },
    isGoogleUser: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        trim: true,
        match: [/^01[0-9]{9}$/, 'Phone number must start with 01 and be 11 digits']
    },
    nationalId: {
        type: String,
        unique: true,
        sparse: true,   // allows multiple null values for Google-only users
        trim: true,
        match: [/^[0-9]{14}$/, 'National ID must be exactly 14 digits']
    },
    role: {
        type: String,
        enum: ['citizen', 'employee', 'admin'],
        default: 'citizen'
    },
    department: {
        type: String,
        enum: [
            'Housing Review',
            'Finance',
            'Complaints',
            'Support',
            'Administration',
            'General'
        ],
        required: false,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    profile: {
        address: {
            type: String,
            maxlength: [200, 'Address cannot exceed 200 characters']
        },
        dateOfBirth: {
            type: Date
        },
        occupation: {
            type: String,
            maxlength: [100, 'Occupation cannot exceed 100 characters']
        },
        familySize: {
            type: Number,
            min: [1, 'Family size must be at least 1'],
            max: [20, 'Family size cannot exceed 20']
        }
    }
}, {
    timestamps: true
});

// Citizens have no department; admins default to Administration
userSchema.pre('save', function(next) {
    if (this.role === 'citizen') {
        this.department = undefined;
    } else if (this.role === 'admin' && !this.department) {
        this.department = 'Administration';
    } else if (this.role === 'employee' && !this.department) {
        this.department = 'Housing Review';
    }
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false; // Google-only users have no password
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken; // Return unhashed token for email
};

// Index for better query performance
// Note: email and nationalId already have unique indexes from schema definition
userSchema.index({ role: 1 });

// Virtual for formatted creation date
userSchema.virtual('createdFormatted').get(function() {
    return this.createdAt ? this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
});

module.exports = mongoose.model('User', userSchema);
