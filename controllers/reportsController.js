import { supabase } from '../config/supabaseConfig.js'

// Get overall metrics and reports
export const getReports = async (req, res) => {
  try {
    // Get user_id from query parameter
    const user_id = req.query.user_id
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required in query parameters'
      })
    }

    // Get all bookings with status and revenue data for this user only
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('net_amount, status, client_name, created_at')
      .eq('user_id', user_id)

    if (bookingsError) {
      console.error('Bookings data error:', bookingsError)
    }

    // Calculate total revenue
    const total_revenue = bookingsData?.reduce((sum, booking) => sum + parseFloat(booking.net_amount || 0), 0) || 0

    // Get total bookings count
    const total_bookings = bookingsData?.length || 0

    // Get unique clients count
    const uniqueClients = new Set(bookingsData?.map(booking => booking.client_name) || [])
    const active_clients = uniqueClients.size

    // Calculate average booking value based on confirmed bookings only
    const confirmedBookings = bookingsData?.filter(booking => booking.status === 'confirmed') || []
    const confirmedRevenue = confirmedBookings.reduce((sum, booking) => sum + parseFloat(booking.net_amount || 0), 0)
    const avg_booking_value = confirmedBookings.length > 0 ? Math.round(confirmedRevenue / confirmedBookings.length) : 0

    // Get status distribution with all statuses pre-filled
    const statusDistribution = {
      submitted: 0,
      in_progress: 0,
      confirmed: 0,
      rejected: 0
    }
    
    bookingsData?.forEach(booking => {
      if (statusDistribution.hasOwnProperty(booking.status)) {
        statusDistribution[booking.status] = (statusDistribution[booking.status] || 0) + 1
      }
    })

    // Get monthly performance (last 6 months) for this user only
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('bookings')
      .select('net_amount, created_at')
      .eq('user_id', user_id)
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (monthlyError) {
      console.error('Monthly performance error:', monthlyError)
    }

    // Group by month
    const monthlyPerformance = []
    const monthMap = {}
    
    monthlyData?.forEach(booking => {
      const date = new Date(booking.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthName,
          revenue: 0,
          bookings: 0
        }
      }
      
      monthMap[monthKey].revenue += parseFloat(booking.net_amount || 0)
      monthMap[monthKey].bookings += 1
    })

    Object.values(monthMap).forEach(month => {
      monthlyPerformance.push({
        month: month.month,
        revenue: Math.round(month.revenue),
        bookings: month.bookings
      })
    })

    // Get top clients
    const clientRevenue = {}
    bookingsData?.forEach(booking => {
      if (!clientRevenue[booking.client_name]) {
        clientRevenue[booking.client_name] = {
          revenue: 0,
          bookings: 0
        }
      }
      clientRevenue[booking.client_name].revenue += parseFloat(booking.net_amount || 0)
      clientRevenue[booking.client_name].bookings += 1
    })

    const top_clients = Object.entries(clientRevenue)
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        bookings: data.bookings
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Get recent activity (confirmed bookings in last 7 days) for this user only
    const { data: recentBookings, error: recentError } = await supabase
      .from('bookings')
      .select('net_amount')
      .eq('user_id', user_id)
      .eq('status', 'confirmed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (recentError) {
      console.error('Recent activity error:', recentError)
    }

    const recentConfirmedCount = recentBookings?.length || 0
    const recentConfirmedValue = recentBookings?.reduce((sum, booking) => sum + parseFloat(booking.net_amount || 0), 0) || 0

    res.status(200).json({
      success: true,
      data: {
        total_revenue: Math.round(total_revenue),
        total_bookings: total_bookings || 0,
        active_clients,
        avg_booking_value,
        status_distribution: statusDistribution,
        monthly_performance: monthlyPerformance,
        top_clients,
        recent_activity: {
          confirmed_bookings: recentConfirmedCount,
          total_value: Math.round(recentConfirmedValue)
        }
      }
    })

  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
} 