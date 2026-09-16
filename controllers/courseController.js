const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor only)
const createCourse = async (req, res) => {
    try {
        const { title, description, content, category } = req.body;

        if (!title || !description || !content || !category) {
            return res.status(400).json({ message: 'Please provide all required fields (title, description, content, category)' });
        }

        const course = await Course.create({
            title,
            description,
            content,
            category,
            instructor: req.user._id
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
        const courses = await Course.find().populate('instructor', 'username email');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get courses created by the logged-in instructor
// @route   GET /api/courses/my-courses
// @access  Private (Instructor only)
const getInstructorCourses = async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id }).populate('instructor', 'username email');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'username email');
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json(course);
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

        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
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

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const alreadyEnrolled = await Enrollment.findOne({ course: courseId, student: studentId });
        if (alreadyEnrolled) {
            return res.status(400).json({ message: 'You are already enrolled in this course' });
        }

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
        // Find enrollments and nested populate instructor details inside the course
        const enrollments = await Enrollment.find({ student: req.user._id })
            .populate({
                path: 'course',
                populate: {
                    path: 'instructor',
                    select: 'username email'
                }
            });
            
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCourse,
    getCourses,
    getInstructorCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    enrollCourse,
    getMyEnrollments
};