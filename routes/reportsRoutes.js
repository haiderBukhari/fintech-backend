import express from 'express'
import { getReports } from '../controllers/reportsController.js'

const router = express.Router()

// Reports routes
router.get('/', getReports)

export default router 