const express = require('express');
const router = express.Router();
const {
    createCourse, 
    getCourses, 
    getCourseById, 
    updateCourse, 
    deleteCourse, 
    enrollCourse, 
    getMyEnrollments,
    getInstructorCourses,
    getCourseStudents // <-- Added getCourseStudents import
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route (or you can add 'protect' if you want only logged-in users to see courses)
router.route('/')
    .get(protect, getCourses)
    .post(protect, authorize('instructor'), createCourse);

// Student only route - Must be defined BEFORE /:id routes to prevent conflict
router.get('/my-enrollments', protect, authorize('student'), getMyEnrollments);

// Instructor only route - Must be defined BEFORE /:id routes to prevent conflict
router.get('/my-courses', protect, authorize('instructor'), getInstructorCourses); 

// Instructor only route to view enrolled students for a specific course 
// Must be defined BEFORE /:id routes because both use GET method
router.get('/:id/students', protect, authorize('instructor'), getCourseStudents); // <-- Added here

// Routes for a specific course by ID
router.route('/:id')
    .get(protect, getCourseById)
    .put(protect, authorize('instructor'), updateCourse)
    .delete(protect, authorize('instructor'), deleteCourse);

// Student only route for enrollment
router.post('/:id/enroll', protect, authorize('student'), enrollCourse);

module.exports = router;