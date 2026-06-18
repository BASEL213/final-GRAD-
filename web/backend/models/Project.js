const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
        maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    location: {
        type: String,
        required: [true, 'Project location is required'],
        trim: true,
        maxlength: [200, 'Location cannot exceed 200 characters']
    },
    totalUnits: {
        type: Number,
        required: [true, 'Total units is required'],
        min: [1, 'Total units must be at least 1']
    },
    availableUnits: {
        type: Number,
        required: [true, 'Available units is required'],
        min: [0, 'Available units cannot be negative']
    },
    priceRange: {
        type: String,
        required: [true, 'Price range is required'],
        trim: true,
        maxlength: [50, 'Price range cannot exceed 50 characters']
    },
    type: {
        type: String,
        enum: ['Apartments', 'Villas', 'Mixed'],
        default: 'Apartments'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'planning'],
        default: 'active'
    },
    completionDate: {
        type: Date,
        required: [true, 'Completion date is required']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    imageUrl: {
        type: String,
        trim: true,
        default: null
    }
}, {
    timestamps: true
});

// Index for better query performance
projectSchema.index({ status: 1 });
projectSchema.index({ completionDate: 1 });

module.exports = mongoose.model('Project', projectSchema);
