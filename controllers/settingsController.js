import { supabase } from '../config/supabaseConfig.js'

// Get user settings
export const getSettings = async (req, res) => {
  try {
    // Get user_id from query parameter
    const user_id = req.query.user_id
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required in query parameters'
      })
    }

    const { data: settings, error } = await supabase
      .from('settings')
      .select('email_recipients')
      .eq('user_id', user_id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Get settings error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error fetching settings',
        error: error.message
      })
    }

    // If no settings exist, create default settings
    if (!settings) {
      const { data: newSettings, error: createError } = await supabase
        .from('settings')
        .insert([{
          user_id,
          email_recipients: ['salesrep@mediaco.test', 'team@company.com']
        }])
        .select('email_recipients')
        .single()

      if (createError) {
        console.error('Create settings error:', createError)
        return res.status(500).json({
          success: false,
          message: 'Error creating settings',
          error: createError.message
        })
      }

      return res.status(200).json({
        success: true,
        data: {
          email_recipients: newSettings.email_recipients
        }
      })
    }

    res.status(200).json({
      success: true,
      data: {
        email_recipients: settings.email_recipients
      }
    })

  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Update user settings
export const updateSettings = async (req, res) => {
  try {
    const { email_recipients } = req.body
    const user_id = req.query.user_id || req.body.user_id
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required in query parameters or request body'
      })
    }

    if (!email_recipients || !Array.isArray(email_recipients)) {
      return res.status(400).json({
        success: false,
        message: 'Email recipients must be an array'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = email_recipients.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        invalid_emails: invalidEmails
      })
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', user_id)
      .single()

    let result
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({ 
          email_recipients,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .select('email_recipients')
        .single()

      if (error) {
        console.error('Update settings error:', error)
        return res.status(500).json({
          success: false,
          message: 'Error updating settings',
          error: error.message
        })
      }

      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('settings')
        .insert([{
          user_id,
          email_recipients
        }])
        .select('email_recipients')
        .single()

      if (error) {
        console.error('Create settings error:', error)
        return res.status(500).json({
          success: false,
          message: 'Error creating settings',
          error: error.message
        })
      }

      result = data
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        email_recipients: result.email_recipients
      }
    })

  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
} 