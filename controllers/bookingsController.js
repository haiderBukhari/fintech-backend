import { supabase } from '../config/supabaseConfig.js'

// Create new booking
export const createBooking = async (req, res) => {
  try {
    const {
      campaign_name,
      campaign_description,
      campaign_ref,
      client_name,
      contact_name,
      contact_email,
      contact_phone,
      address,
      industry_segment,
      tax_registration_no,
      start_date,
      end_date,
      creative_delivery_date,
      media_type,
      placement_preferences,
      gross_amount,
      partner_discount = 0,
      additional_charges = 0,
      net_amount,
      creative_file_link,
      creative_specs,
      special_instructions,
      signatory_name,
      signatory_title,
      signature_date
    } = req.body

    // For now, we'll use a mock user_id - in production, get from JWT token
    const user_id = req.user?.id || 'mock-user-id'

    // Validate required fields
    if (!campaign_name || !campaign_ref || !client_name || !contact_name || !contact_email || !start_date || !end_date || !gross_amount || !net_amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      })
    }

    // Check if campaign_ref already exists
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('campaign_ref', campaign_ref)
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
        campaign_ref,
        client_name,
        contact_name,
        contact_email,
        contact_phone,
        address,
        industry_segment,
        tax_registration_no,
        start_date,
        end_date,
        creative_delivery_date,
        media_type,
        placement_preferences,
        gross_amount,
        partner_discount,
        additional_charges,
        net_amount,
        creative_file_link,
        creative_specs,
        special_instructions,
        signatory_name,
        signatory_title,
        signature_date,
        status: 'submitted',
        progress: 0
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
    // For now, we'll get all bookings - in production, filter by user_id from JWT
    const { data: bookings, error } = await supabase
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