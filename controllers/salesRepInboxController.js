import { supabase } from '../config/supabaseConfig.js'

// Get all sales rep inbox items
export const getSalesRepInbox = async (req, res) => {
  try {
    const { data: inboxItems, error } = await supabase
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

    res.status(200).json({
      success: true,
      message: 'Sales rep status updated successfully'
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