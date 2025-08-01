import { supabase } from '../config/supabaseConfig.js'

// Get overall metrics and reports
export const getReports = async (req, res) => {
  try {
    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('bookings')
      .select('net_amount')

    if (revenueError) {
      console.error('Revenue calculation error:', revenueError)
    }

    const total_revenue = revenueData?.reduce((sum, booking) => sum + parseFloat(booking.net_amount || 0), 0) || 0

    // Get total bookings count
    const { count: total_bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    if (bookingsError) {
      console.error('Bookings count error:', bookingsError)
    }

    // Get unique clients count
    const { data: clientsData, error: clientsError } = await supabase
      .from('bookings')
      .select('client_name')

    if (clientsError) {
      console.error('Clients count error:', clientsError)
    }

    const uniqueClients = new Set(clientsData?.map(booking => booking.client_name) || [])
    const active_clients = uniqueClients.size

    // Calculate average booking value
    const avg_booking_value = total_bookings > 0 ? Math.round(total_revenue / total_bookings) : 0

    // Get status distribution
    const { data: statusData, error: statusError } = await supabase
      .from('bookings')
      .select('status')

    if (statusError) {
      console.error('Status distribution error:', statusError)
    }

    const statusDistribution = {}
    statusData?.forEach(booking => {
      statusDistribution[booking.status] = (statusDistribution[booking.status] || 0) + 1
    })

    // Get monthly performance (last 6 months)
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('bookings')
      .select('net_amount, created_at')
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
    const { data: topClientsData, error: topClientsError } = await supabase
      .from('bookings')
      .select('client_name, net_amount')

    if (topClientsError) {
      console.error('Top clients error:', topClientsError)
    }

    const clientRevenue = {}
    topClientsData?.forEach(booking => {
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

    res.status(200).json({
      success: true,
      data: {
        total_revenue: Math.round(total_revenue),
        total_bookings: total_bookings || 0,
        active_clients,
        avg_booking_value,
        status_distribution: statusDistribution,
        monthly_performance: monthlyPerformance,
        top_clients
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