const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Applicant name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    nationalId: {
        type: String,
        required: [true, 'National ID is required'],
        trim: true,
        match: [/^[0-9]{14}$/, 'National ID must be exactly 14 digits']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^01[0-9]{9}$/, 'Phone number must start with 01 and be 11 digits']
    },
    projectId: {
        type: String,
        required: [true, 'Project ID is required']
    },
    projectName: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    income: {
        type: Number,
        required: [true, 'Monthly income is required'],
        min: [0, 'Income cannot be negative']
    },
    familySize: {
        type: Number,
        required: [true, 'Family size is required'],
        min: [1, 'Family size must be at least 1'],
        max: [20, 'Family size cannot exceed 20']
    },
    currentHousing: {
        type: String,
        required: [true, 'Current housing information is required'],
        trim: true,
        maxlength: [200, 'Current housing description cannot exceed 200 characters']
    },
    unitType: {
        type: String,
        trim: true,
        maxlength: [100, 'Unit type cannot exceed 100 characters']
    },
    preferredFloor: {
        type: String,
        trim: true,
        maxlength: [50, 'Preferred floor cannot exceed 50 characters']
    },
    paymentMethod: {
        type: String,
        trim: true,
        maxlength: [100, 'Payment method cannot exceed 100 characters']
    },
    specialRequirements: {
        type: String,
        trim: true,
        maxlength: [500, 'Special requirements cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    reviewedBy: {
        type: String,
        trim: true
    },
    reviewedAt: {
        type: Date
    },
    documents: {
        nationalIdCopy: {
            type: String,
            default: null
        },
        incomeCertificate: {
            type: String,
            default: null
        },
        birthCertificate: {
            type: String,
            default: null
        }
    }
}, {
    timestamps: true
});

applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ nationalId: 1 });
applicationSchema.index({ projectId: 1 });

// Virtual for formatted creation date
applicationSchema.virtual('createdFormatted').get(function() {
    return this.createdAt ? this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
});

module.exports = mongoose.model('Application', applicationSchema);
