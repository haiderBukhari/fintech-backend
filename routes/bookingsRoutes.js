import express from 'express'
import { 
  createBooking, 
  getBookings, 
  getBookingById, 
  updateBookingStatus,
  generatePDF,
  sendEmail,
  sendBookingEmail
} from '../controllers/bookingsController.js'

const router = express.Router()

// Booking routes
router.post('/', createBooking)
router.get('/', getBookings)
router.get('/:id', getBookingById)
router.put('/:id/status', updateBookingStatus)
router.post('/:id/generate-pdf', generatePDF)
router.post('/:id/send-email', sendEmail) // Legacy endpoint
router.post('/:id/send-booking-email', sendBookingEmail) // New endpoint for sending booking emails

export default router 