const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        minlength: [2, 'Company name must be at least 2 characters'],
        maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    name: {
        type: String,
        required: [true, 'Contact person name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\d\s\+\-\(\)]+$/, 'Please provide a valid phone number']
    },
    interest: {
        type: String,
        required: [true, 'Product interest is required'],
        enum: {
            values: ['biofertilizer', 'reactor', 'bioplastic', 'multiple', 'custom'],
            message: '{VALUE} is not a valid product interest'
        }
    },
    volume: {
        type: Number,
        min: [0, 'Volume cannot be negative'],
        max: [100000000, 'Volume value is too large']
    },
    message: {
        type: String,
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'in-progress', 'converted', 'closed'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    source: {
        type: String,
        default: 'website'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: [{
        text: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    followUpDate: {
        type: Date
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    adminNotified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
inquirySchema.index({ email: 1 });
inquirySchema.index({ company: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ interest: 1 });

// Virtual for inquiry age in days
inquirySchema.virtual('ageInDays').get(function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Method to add a note
inquirySchema.methods.addNote = function(text, userId) {
    this.notes.push({
        text,
        addedBy: userId,
        addedAt: new Date()
    });
    return this.save();
};

// Static method to get inquiries by status
inquirySchema.statics.getByStatus = function(status) {
    return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get recent inquiries
inquirySchema.statics.getRecent = function(limit = 10) {
    return this.find().sort({ createdAt: -1 }).limit(limit);
};

// Pre-save middleware to set priority based on volume
inquirySchema.pre('save', function(next) {
    if (this.isNew && this.volume) {
        if (this.volume > 100000) {
            this.priority = 'urgent';
        } else if (this.volume > 50000) {
            this.priority = 'high';
        } else if (this.volume > 10000) {
            this.priority = 'medium';
        }
    }
    next();
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
