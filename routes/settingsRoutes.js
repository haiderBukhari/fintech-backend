import express from 'express'
import { getSettings, updateSettings } from '../controllers/settingsController.js'

const router = express.Router()

// Settings routes
router.get('/', getSettings)
router.put('/', updateSettings)

export default router 