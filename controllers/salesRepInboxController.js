import { supabase } from '../config/supabaseConfig.js'

// Get all sales rep inbox items
export const getSalesRepInbox = async (req, res) => {
  try {
    // Get user_id from query parameter
    const user_id = req.query.user_id
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required in query parameters'
      })
    }

    // Check user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user_id)
      .single()

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Build query based on role
    let query = supabase
      .from('sales_rep_inbox')
      .select(`
        id,
        booking_id,
        priority,
        rep_status,
        created_at,
        bookings!inner(
          campaign_name,
          client_name,
          net_amount
        )
      `)
      .order('created_at', { ascending: false })

    // If user role is 'user', filter by user_id. If 'sales', get all inbox items
    if (userData.role === 'user') {
      query = query.eq('bookings.user_id', user_id)
    }
    // If role is 'sales', no filter needed - get all inbox items

    const { data: inboxItems, error } = await query

    if (error) {
      console.error('Get sales rep inbox error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error fetching sales rep inbox',
        error: error.message
      })
    }

    // Transform data to match expected format
    const transformedData = inboxItems.map(item => ({
      rep_status_id: item.id,
      booking_id: item.booking_id,
      campaign_name: item.bookings.campaign_name,
      priority: item.priority,
      rep_status: item.rep_status,
      client_name: item.bookings.client_name,
      net_amount: item.bookings.net_amount
    }))

    res.status(200).json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Get sales rep inbox error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Update sales rep status
export const updateSalesRepStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { rep_status } = req.body

    if (!rep_status) {
      return res.status(400).json({
        success: false,
        message: 'Rep status is required'
      })
    }

    // Validate rep_status values
    const validStatuses = ['pending', 'reviewed', 'confirmed', 'rejected']
    if (!validStatuses.includes(rep_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rep_status. Must be one of: pending, reviewed, confirmed, rejected',
        received_status: rep_status
      })
    }

    // Check if sales rep inbox item exists and get booking_id
    const { data: existingItem, error: checkError } = await supabase
      .from('sales_rep_inbox')
      .select('id, booking_id')
      .eq('id', id)
      .single()

    if (checkError || !existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Sales rep inbox item not found',
        item_id: id
      })
    }

    // Update sales rep inbox status
    const { error: updateError } = await supabase
      .from('sales_rep_inbox')
      .update({ 
        rep_status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update sales rep status error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Error updating sales rep status',
        error: updateError.message
      })
    }

    // Update booking status based on rep_status
    let bookingStatus = 'submitted'
    let bookingProgress = 0

    if (rep_status === 'rejected') {
      bookingStatus = 'rejected'
      bookingProgress = 0
    } else if (rep_status === 'confirmed') {
      bookingStatus = 'confirmed'
      bookingProgress = 100
    }

    // Update booking status and progress
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({ 
        status: bookingStatus,
        progress: bookingProgress,
        updated_at: new Date().toISOString() 
      })
      .eq('id', existingItem.booking_id)

    if (bookingUpdateError) {
      console.error('Update booking status error:', bookingUpdateError)
      return res.status(500).json({
        success: false,
        message: 'Error updating booking status',
        error: bookingUpdateError.message
      })
    }

    // Add to booking status history
    await supabase
      .from('booking_status_history')
      .insert([{
        booking_id: existingItem.booking_id,
        status: bookingStatus,
        notes: `Sales rep ${rep_status} the booking`
      }])

    res.status(200).json({
      success: true,
      message: 'Sales rep status updated successfully',
      booking_status: bookingStatus,
      booking_progress: bookingProgress
    })

  } catch (error) {
    console.error('Update sales rep status error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
} 