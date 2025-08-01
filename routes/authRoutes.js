import express from 'express'
import { signup, login, getUserProfile } from '../controllers/authController.js'

const router = express.Router()

// Authentication routes
router.post('/signup', signup)
router.post('/login', login)
router.get('/profile/:userId', getUserProfile)

export default router 