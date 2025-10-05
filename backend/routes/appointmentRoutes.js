const express = require('express');
const router = express.Router();
const multer = require('multer'); // [ISSUE-178 FIX START] Added multer for file upload
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;// [ISSUE-178 FIX END]

// Import all the necessary controller functions
const {
  createAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  getAppointmentSummary,
  saveVoiceNote,
  scheduleFollowUp,
  updateRelayNote
} = require('../controllers/appointmentController');

const { protect } = require("../middleware/authMiddleware");
const {
  validate,
  validateObjectId,
  appointmentSchemas,
  limitRequestSize,
  detectXSS,
} = require("../middleware/validation");

// [ISSUE-178 FIX START] Configure cloudinary + multer
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "appointments",
    allowed_formats: ["jpg", "png", "pdf"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
// [ISSUE-178 FIX END]

// Apply comprehensive security middleware to all appointment routes
router.use(limitRequestSize);
router.use(detectXSS);

// All routes in this file are protected and require a user to be logged in.

// GET /api/appointments/my-appointments
// Fetches all appointments related to the logged-in user (as either patient or professional)
router.route('/my-appointments').get(protect, getMyAppointments);
router.route('/my-appointments').get(protect, getMyAppointments);

// GET /api/appointments/:id/summary
// Gets a smart summary for a specific appointment with ID validation
router
  .route("/:id/summary")
  .get(protect, validateObjectId("id"), getAppointmentSummary);

// PUT /api/appointments/:id
// Updates the status of a specific appointment with comprehensive validation
router
  .route("/:id")
  .put(
    protect,
    validateObjectId("id"),
    validate(appointmentSchemas.updateStatus),
    updateAppointmentStatus
  );

// POST /api/appointments/
// Creates a new appointment with comprehensive input validation
router.route("/").post(
  protect,
  upload.single("reportImage"),// added as part of #178 issue
  //validate(appointmentSchemas.create),
  createAppointment
);

//POST /:id/voicenote
//Creates a voice note for the appointment
router.post("/:id/voice-note", protect, saveVoiceNote);

//PUT /:id/relay-note
//Updates the relay note for the appointment
router.put("/:id/relay-note", protect, updateRelayNote);

// POST /api/appointments/:id/schedule-follow-up
// Schedules a follow-up for a specific appointment
router.route('/:id/schedule-follow-up')
    .post(protect, 
        validateObjectId('id'), 
        validate(appointmentSchemas.scheduleFollowUp), 
        scheduleFollowUp);

module.exports = router;
