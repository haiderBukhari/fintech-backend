import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Create transporter for Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
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
      <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">New Booking Created</h2>
      
      <!-- Campaign Information -->
      <div style="margin: 20px 0; padding: 20px; background-color: #ecf0f1; border-radius: 8px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Campaign Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 150px;">Name</td>
            <td style="padding: 8px;">${bookingData.campaign_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Description</td>
            <td style="padding: 8px;">${bookingData.campaign_description || 'No description provided'}</td>
          </tr>
        </table>
      </div>

      <!-- Client Details -->
      <div style="margin: 20px 0; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Client Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 150px;">Client</td>
            <td style="padding: 8px;">${bookingData.client_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Contact</td>
            <td style="padding: 8px;">${bookingData.contact_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Email</td>
            <td style="padding: 8px;">${bookingData.contact_email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Phone</td>
            <td style="padding: 8px;">${bookingData.contact_phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Address</td>
            <td style="padding: 8px;">${bookingData.address || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Industry Segment</td>
            <td style="padding: 8px;">${bookingData.industry_segment || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Tax Registration No</td>
            <td style="padding: 8px;">${bookingData.tax_registration_no || 'N/A'}</td>
          </tr>
        </table>
      </div>

      <!-- Campaign Details -->
      <div style="margin: 20px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Campaign Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 150px;">Campaign</td>
            <td style="padding: 8px;">${bookingData.campaign_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Reference</td>
            <td style="padding: 8px;">${bookingData.campaign_ref}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Start Date</td>
            <td style="padding: 8px;">${new Date(bookingData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">End Date</td>
            <td style="padding: 8px;">${new Date(bookingData.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Creative Delivery Date</td>
            <td style="padding: 8px;">${bookingData.creative_delivery_date ? new Date(bookingData.creative_delivery_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Media Type</td>
            <td style="padding: 8px;">${bookingData.media_type}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Placement Preferences</td>
            <td style="padding: 8px;">${bookingData.placement_preferences || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Creative Specifications</td>
            <td style="padding: 8px;">${bookingData.creative_specs || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Special Instructions</td>
            <td style="padding: 8px;">${bookingData.special_instructions || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Creative File Link</td>
            <td style="padding: 8px;">${bookingData.creative_file_link || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Signatory Name</td>
            <td style="padding: 8px;">${bookingData.signatory_name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Signatory Title</td>
            <td style="padding: 8px;">${bookingData.signatory_title || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Signature Date</td>
            <td style="padding: 8px;">${bookingData.signature_date ? new Date(bookingData.signature_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td>
          </tr>
        </table>
      </div>

      <!-- Financial Summary -->
      <div style="margin: 20px 0; padding: 20px; background-color: #d4edda; border-radius: 8px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Financial Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 150px;">Gross Amount:</td>
            <td style="padding: 8px; font-weight: bold; color: #27ae60;">$${parseFloat(bookingData.gross_amount).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Partner Discount:</td>
            <td style="padding: 8px; color: #e74c3c;">$${parseFloat(bookingData.partner_discount || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Additional Charges:</td>
            <td style="padding: 8px; color: #f39c12;">$${parseFloat(bookingData.additional_charges || 0).toLocaleString()}</td>
          </tr>
          <tr style="background-color: #c8e6c9;">
            <td style="padding: 8px; font-weight: bold;">Net Amount:</td>
            <td style="padding: 8px; font-weight: bold; color: #2e7d32; font-size: 16px;">$${parseFloat(bookingData.net_amount).toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Status Information -->
      <div style="margin: 20px 0; padding: 20px; background-color: #e3f2fd; border-radius: 8px;">
        <h3 style="color: #2c3e50; margin-top: 0;">Status Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 150px;">Status</td>
            <td style="padding: 8px;">
              <span style="background-color: #007bff; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                ${bookingData.status.toUpperCase()}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Progress</td>
            <td style="padding: 8px;">
              <div style="width: 100%; background-color: #e9ecef; border-radius: 10px; height: 20px;">
                <div style="width: ${bookingData.progress}%; background-color: #28a745; height: 100%; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                  ${bookingData.progress}%
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
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