const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor only)
const createCourse = async (req, res) => {
    try {
        const { title, description, content } = req.body;

        const course = await Course.create({
            title,
            description,
            content,
            instructor: req.user._id // The logged-in instructor's ID from token
        });

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all available courses
// @route   GET /api/courses
// @access  Public or Private
const getCourses = async (req, res) => {
    try {
        // Fetch all courses and populate instructor details (only username and email)
        const courses = await Course.find().populate('instructor', 'username email');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Instructor only)
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if the logged-in instructor is the owner of this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedCourse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor only)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check ownership
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }

        await course.deleteOne();
        res.status(200).json({ message: 'Course removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student only)
const enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const studentId = req.user._id;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if the student is already enrolled
        const alreadyEnrolled = await Enrollment.findOne({ course: courseId, student: studentId });
        if (alreadyEnrolled) {
            return res.status(400).json({ message: 'You are already enrolled in this course' });
        }

        // Create new enrollment
        const enrollment = await Enrollment.create({
            course: courseId,
            student: studentId
        });

        res.status(201).json({ message: 'Successfully enrolled', enrollment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get enrolled courses for a student
// @route   GET /api/courses/my-enrollments
// @access  Private (Student only)
const getMyEnrollments = async (req, res) => {
    try {
        // Find enrollments for this student and populate course details
        const enrollments = await Enrollment.find({ student: req.user._id }).populate('course');
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCourse,
    getCourses,
    updateCourse,
    deleteCourse,
    enrollCourse,
    getMyEnrollments
};