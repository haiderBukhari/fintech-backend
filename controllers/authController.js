import bcrypt from 'bcrypt'
import { supabase } from '../config/supabaseConfig.js'

// Signup controller
export const signup = async (req, res) => {
  try {
    const { full_name, email_address, password, company_name } = req.body

    // Validate required fields
    if (!full_name || !email_address || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email address, and password are required'
      })
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email_address', email_address)
      .single()

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          full_name,
          email_address,
          password: hashedPassword,
          company_name: company_name || null
        }
      ])
      .select('id, full_name, email_address, company_name, created_at, role')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        full_name: newUser.full_name,
        email_address: newUser.email_address,
        company_name: newUser.company_name,
        created_at: newUser.created_at,
        role: newUser.role
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email_address, password } = req.body

    // Validate required fields
    if (!email_address || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required'
      })
    }

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, email_address, password, company_name, created_at, role')
      .eq('email_address', email_address)
      .single()

    if (fetchError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Update last login time
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id)

    // Return user data (excluding password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        full_name: user.full_name,
        email_address: user.email_address,
        company_name: user.company_name,
        created_at: user.created_at,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params

    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email_address, company_name, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
} 