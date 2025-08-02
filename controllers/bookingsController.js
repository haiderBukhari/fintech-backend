import { supabase } from '../config/supabaseConfig.js'

// Create new booking
export const createBooking = async (req, res) => {
  try {
    const {
      campaign_name,
      campaign_description,
      campaign_reference,
      client_name,
      client_email,
      client_phone,
      client_company,
      address,
      industry_segment,
      tax_registration_no,
      start_date,
      end_date,
      creative_delivery_date,
      media_type,
      placement_preferences,
      gross_amount,
      commission_percentage = 0,
      commission_amount = 0,
      vat_percentage = 0,
      vat_amount = 0,
      net_amount,
      creative_file_link,
      creative_specifications,
      special_instructions,
      signatory_name,
      signatory_title,
      signature_date,
      pdf_url,
      authorization_required = false
    } = req.body

    // Get user_id from query parameter
    const user_id = req.query.user_id || req.body.user_id

    // Validate required fields
    if (!campaign_name || !campaign_reference || !client_name || !client_email || !start_date || !end_date || !gross_amount || !net_amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: campaign_name, campaign_reference, client_name, client_email, start_date, end_date, gross_amount, net_amount'
      })
    }

    // Validate numeric fields
    if (isNaN(parseFloat(gross_amount)) || isNaN(parseFloat(net_amount))) {
      return res.status(400).json({
        success: false,
        message: 'gross_amount and net_amount must be valid numbers'
      })
    }

    // Check if campaign_reference already exists
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('campaign_ref', campaign_reference)
      .single()

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Campaign reference already exists'
      })
    }

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        user_id,
        campaign_name,
        campaign_description,
        campaign_ref: campaign_reference,
        client_name,
        contact_name: client_company || client_name,
        contact_email: client_email,
        contact_phone: client_phone,
        address: address || null,
        industry_segment,
        tax_registration_no: tax_registration_no || null,
        start_date,
        end_date,
        creative_delivery_date: creative_delivery_date || null,
        media_type,
        placement_preferences: placement_preferences || null,
        gross_amount: parseFloat(gross_amount),
        partner_discount: parseFloat(commission_amount || 0),
        additional_charges: parseFloat(vat_amount || 0),
        net_amount: parseFloat(net_amount),
        creative_file_link: creative_file_link || null,
        creative_specs: creative_specifications,
        special_instructions: special_instructions || null,
        signatory_name: signatory_name || null,
        signatory_title: signatory_title || null,
        signature_date: signature_date || null,
        status: 'submitted',
        progress: 50,
        pdf_url: pdf_url || null
      }])
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return res.status(500).json({
        success: false,
        message: 'Error creating booking',
        error: bookingError.message
      })
    }

    // Determine priority based on amount
    let priority = 'Medium'
    if (net_amount > 10000) priority = 'High'
    else if (net_amount < 5000) priority = 'Low'

    // Insert into sales rep inbox
    await supabase
      .from('sales_rep_inbox')
      .insert([{
        booking_id: booking.id,
        priority,
        rep_status: 'pending'
      }])

    // Add initial status history
    await supabase
      .from('booking_status_history')
      .insert([{
        booking_id: booking.id,
        status: 'submitted',
        notes: 'Booking submitted successfully'
      }])

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking_id: booking.id
    })

  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Get all bookings for user
export const getBookings = async (req, res) => {
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
      .from('bookings')
      .select(`
        id,
        campaign_name,
        status,
        progress,
        net_amount,
        start_date,
        end_date,
        created_at
      `)
      .order('created_at', { ascending: false })

    // If user role is 'user', filter by user_id. If 'sales', get all bookings
    if (userData.role === 'user') {
      query = query.eq('user_id', user_id)
    }
    // If role is 'sales', no filter needed - get all bookings

    const { data: bookings, error } = await query

    if (error) {
      console.error('Get bookings error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error fetching bookings',
        error: error.message
      })
    }

    res.status(200).json({
      success: true,
      data: bookings
    })

  } catch (error) {
    console.error('Get bookings error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Get single booking details
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    // Get status history
    const { data: timeline, error: timelineError } = await supabase
      .from('booking_status_history')
      .select('status, created_at')
      .eq('booking_id', id)
      .order('created_at', { ascending: true })

    if (timelineError) {
      console.error('Timeline error:', timelineError)
    }

    res.status(200).json({
      success: true,
      data: {
        ...booking,
        timeline: timeline || []
      }
    })

  } catch (error) {
    console.error('Get booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      })
    }

    // Calculate progress based on status
    let progress = 0
    switch (status) {
      case 'submitted': progress = 0; break
      case 'pdf_generated': progress = 25; break
      case 'sent': progress = 50; break
      case 'confirmed': progress = 100; break
      case 'rejected': progress = 0; break
      default: progress = 0
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status, progress, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      console.error('Update booking error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Error updating booking',
        error: updateError.message
      })
    }

    // Add to status history
    await supabase
      .from('booking_status_history')
      .insert([{
        booking_id: id,
        status,
        notes: `Status updated to ${status}`
      }])

    res.status(200).json({
      success: true,
      message: 'Status updated successfully'
    })

  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Generate PDF
export const generatePDF = async (req, res) => {
  try {
    const { id } = req.params

    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    // Simulate PDF generation
    const pdf_url = `/pdfs/booking-${booking.campaign_ref}.pdf`

    // Update status to pdf_generated
    await supabase
      .from('bookings')
      .update({ 
        status: 'pdf_generated', 
        progress: 25,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    // Add to status history
    await supabase
      .from('booking_status_history')
      .insert([{
        booking_id: id,
        status: 'pdf_generated',
        notes: 'PDF generated successfully'
      }])

    res.status(200).json({
      success: true,
      pdf_url
    })

  } catch (error) {
    console.error('Generate PDF error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Send email
export const sendEmail = async (req, res) => {
  try {
    const { id } = req.params

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    // Get email recipients from settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('email_recipients')
      .eq('user_id', booking.user_id)
      .single()

    const recipients = settings?.email_recipients || ['default@example.com']

    // Simulate email sending
    console.log(`Sending email to: ${recipients.join(', ')}`)
    console.log(`Subject: Booking ${booking.campaign_ref} - ${booking.campaign_name}`)
    console.log(`Attachment: /pdfs/booking-${booking.campaign_ref}.pdf`)

    // Update status to sent
    await supabase
      .from('bookings')
      .update({ 
        status: 'sent', 
        progress: 50,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    // Add to status history
    await supabase
      .from('booking_status_history')
      .insert([{
        booking_id: id,
        status: 'sent',
        notes: `Email sent to ${recipients.join(', ')}`
      }])

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
} 