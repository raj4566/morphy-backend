const Inquiry = require('../models/inquiry.model.js');
const { sendInquiryConfirmation, sendAdminNotification } = require('../config/mail.js');

/**
 * @desc    Create new inquiry
 * @route   POST /api/inquiries
 * @access  Public
 */
exports.createInquiry = async (req, res) => {
    try {
        const { company, name, email, phone, interest, volume, message } = req.body;

        // Get IP address and user agent
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        // Create inquiry
        const inquiry = await Inquiry.create({
            company,
            name,
            email,
            phone,
            interest,
            volume,
            message,
            ipAddress,
            userAgent
        });

        // Send confirmation email to customer (async, don't wait)
        if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
            sendInquiryConfirmation({
                company,
                name,
                email,
                phone,
                interest,
                volume,
                message
            }).then(result => {
                if (result.success) {
                    inquiry.emailSent = true;
                    inquiry.save();
                }
            }).catch(err => {
                console.error('Error sending confirmation email:', err);
            });
        }

        // Send notification to admin (async, don't wait)
        if (process.env.SEND_ADMIN_NOTIFICATIONS === 'true') {
            sendAdminNotification({
                company,
                name,
                email,
                phone,
                interest,
                volume,
                message
            }).then(result => {
                if (result.success) {
                    inquiry.adminNotified = true;
                    inquiry.save();
                }
            }).catch(err => {
                console.error('Error sending admin notification:', err);
            });
        }

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully',
            data: {
                id: inquiry._id,
                company: inquiry.company,
                email: inquiry.email,
                interest: inquiry.interest
            }
        });

    } catch (error) {
        console.error('Error creating inquiry:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

/**
 * @desc    Get all inquiries (paginated)
 * @route   GET /api/inquiries
 * @access  Private (Admin)
 */
exports.getAllInquiries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.interest) filter.interest = req.query.interest;
        if (req.query.priority) filter.priority = req.query.priority;

        // Search by company or email
        if (req.query.search) {
            filter.$or = [
                { company: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { name: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const total = await Inquiry.countDocuments(filter);
        const inquiries = await Inquiry.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-userAgent -ipAddress');

        res.status(200).json({
            success: true,
            data: inquiries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Get single inquiry by ID
 * @route   GET /api/inquiries/:id
 * @access  Private (Admin)
 */
exports.getInquiryById = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('notes.addedBy', 'name');

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Inquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            data: inquiry
        });

    } catch (error) {
        console.error('Error fetching inquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Update inquiry status
 * @route   PATCH /api/inquiries/:id
 * @access  Private (Admin)
 */
exports.updateInquiry = async (req, res) => {
    try {
        const allowedUpdates = ['status', 'priority', 'assignedTo', 'followUpDate'];
        const updates = {};

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Inquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Inquiry updated successfully',
            data: inquiry
        });

    } catch (error) {
        console.error('Error updating inquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Add note to inquiry
 * @route   POST /api/inquiries/:id/notes
 * @access  Private (Admin)
 */
exports.addNote = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Note text is required'
            });
        }

        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Inquiry not found'
            });
        }

        // Add note (userId can come from auth middleware in production)
        inquiry.notes.push({
            text: text.trim(),
            addedBy: req.user?._id, // Will be null if no auth middleware
            addedAt: new Date()
        });

        await inquiry.save();

        res.status(200).json({
            success: true,
            message: 'Note added successfully',
            data: inquiry
        });

    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Delete inquiry
 * @route   DELETE /api/inquiries/:id
 * @access  Private (Admin)
 */
exports.deleteInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Inquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Inquiry deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting inquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Get inquiry statistics
 * @route   GET /api/inquiries/stats
 * @access  Private (Admin)
 */
exports.getStats = async (req, res) => {
    try {
        const totalInquiries = await Inquiry.countDocuments();
        const newInquiries = await Inquiry.countDocuments({ status: 'new' });
        const inProgress = await Inquiry.countDocuments({ status: 'in-progress' });
        const converted = await Inquiry.countDocuments({ status: 'converted' });

        // Group by product interest
        const byProduct = await Inquiry.aggregate([
            { $group: { _id: '$interest', count: { $sum: 1 } } }
        ]);

        // Group by status
        const byStatus = await Inquiry.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Recent inquiries (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentInquiries = await Inquiry.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        res.status(200).json({
            success: true,
            data: {
                total: totalInquiries,
                new: newInquiries,
                inProgress,
                converted,
                recentWeek: recentInquiries,
                byProduct,
                byStatus
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
