import express from 'express'
import { getSalesRepInbox, updateSalesRepStatus } from '../controllers/salesRepInboxController.js'

const router = express.Router()

// Sales rep inbox routes
router.get('/', getSalesRepInbox)
router.put('/:id', updateSalesRepStatus)

export default router 