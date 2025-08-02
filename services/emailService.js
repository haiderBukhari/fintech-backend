import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Create transporter for Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD // Use App Password for Gmail
    }
  })
}

// Send booking confirmation email with PDF attachment
export const sendBookingEmail = async (bookingData, emailRecipients, pdfUrl) => {
  try {
    const transporter = createTransporter()

    // Format booking details for email
    const bookingDetails = `
      <h2>New Booking Created</h2>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Campaign Name:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${bookingData.campaign_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Campaign Reference:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${bookingData.campaign_ref}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Client Name:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${bookingData.client_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Contact Email:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${bookingData.contact_email}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Contact Phone:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${bookingData.contact_phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Start Date:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(bookingData.start_date).toLocaleDateString()}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>End Date:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(bookingData.end_date).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Media Type:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${bookingData.media_type}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Gross Amount:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">$${bookingData.gross_amount?.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Net Amount:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">$${bookingData.net_amount?.toLocaleString()}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Status:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">
            <span style="background-color: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${bookingData.status}
            </span>
          </td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
        <h3 style="margin-top: 0;">Campaign Description</h3>
        <p style="margin-bottom: 0;">${bookingData.campaign_description || 'No description provided'}</p>
      </div>

      ${bookingData.creative_specs ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
          <h3 style="margin-top: 0;">Creative Specifications</h3>
          <p style="margin-bottom: 0;">${bookingData.creative_specs}</p>
        </div>
      ` : ''}

      ${bookingData.special_instructions ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #d1ecf1; border-radius: 5px;">
          <h3 style="margin-top: 0;">Special Instructions</h3>
          <p style="margin-bottom: 0;">${bookingData.special_instructions}</p>
        </div>
      ` : ''}
    `

    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: emailRecipients.join(', '),
      subject: `New Booking: ${bookingData.campaign_name} - ${bookingData.campaign_ref}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Booking Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          ${bookingDetails}
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
            <h3>PDF Attachment</h3>
            <p>A PDF version of this booking has been generated and is available at:</p>
            <a href="${pdfUrl}" style="color: #007bff; text-decoration: none;">${pdfUrl}</a>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-radius: 5px;">
            <h3>Next Steps</h3>
            <ul style="margin-bottom: 0;">
              <li>Review the booking details above</li>
              <li>Check the attached PDF for complete information</li>
              <li>Update the booking status in the system</li>
              <li>Contact the client if additional information is needed</li>
            </ul>
          </div>

          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This email was automatically generated by the booking system.</p>
            <p style="margin: 5px 0 0 0;">Booking ID: ${bookingData.id}</p>
            <p style="margin: 5px 0 0 0;">Created: ${new Date(bookingData.created_at).toLocaleString()}</p>
          </div>
        </body>
        </html>
      `,
      attachments: pdfUrl ? [
        {
          filename: `booking-${bookingData.campaign_ref}.pdf`,
          path: pdfUrl,
          contentType: 'application/pdf'
        }
      ] : []
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', info.messageId)
    return {
      success: true,
      messageId: info.messageId,
      recipients: emailRecipients
    }

  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

// Send status update email
export const sendStatusUpdateEmail = async (bookingData, newStatus, emailRecipients) => {
  try {
    const transporter = createTransporter()

    const statusColors = {
      'submitted': '#007bff',
      'in_progress': '#ffc107',
      'confirmed': '#28a745',
      'rejected': '#dc3545',
      'pdf_generated': '#17a2b8',
      'sent': '#6f42c1'
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: emailRecipients.join(', '),
      subject: `Booking Status Update: ${bookingData.campaign_name} - ${newStatus.toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Booking Status Update</h2>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
            <h3>Booking Details</h3>
            <p><strong>Campaign:</strong> ${bookingData.campaign_name}</p>
            <p><strong>Reference:</strong> ${bookingData.campaign_ref}</p>
            <p><strong>Client:</strong> ${bookingData.client_name}</p>
            <p><strong>Previous Status:</strong> ${bookingData.status}</p>
            <p><strong>New Status:</strong> 
              <span style="background-color: ${statusColors[newStatus] || '#6c757d'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${newStatus.toUpperCase()}
              </span>
            </p>
          </div>

          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This email was automatically generated by the booking system.</p>
            <p style="margin: 5px 0 0 0;">Updated: ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log('Status update email sent successfully:', info.messageId)
    return {
      success: true,
      messageId: info.messageId,
      recipients: emailRecipients
    }

  } catch (error) {
    console.error('Status update email error:', error)
    throw new Error(`Failed to send status update email: ${error.message}`)
  }
}

export default {
  sendBookingEmail,
  sendStatusUpdateEmail
} 