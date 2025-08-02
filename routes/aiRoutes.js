import express from 'express'
import { extractBookingData } from '../controllers/aiController.js'

const router = express.Router()

// Extract booking data from text using Gemini AI
router.post('/extract-booking-data', extractBookingData)

export default router 