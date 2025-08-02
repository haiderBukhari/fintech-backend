import { GoogleGenAI } from "@google/genai";

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// Extract booking data from text using Gemini AI
export const extractBookingData = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text input is required"
      });
    }

    // Create a detailed prompt for Gemini to extract structured data
    const prompt = `
    Extract booking information from the following text and return it as a valid JSON object with the exact structure shown below. 
    If a field is not found in the text, use null for that field.
    
    Required JSON structure:
    {
      "clientName": "string",
      "contactName": "string", 
      "contactEmail": "string",
      "contactPhone": "string",
      "address": "string",
      "industrySegment": "string",
      "taxRegistrationNo": "string",
      "campaignName": "string",
      "campaignRef": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD", 
      "creativeDeliveryDate": "YYYY-MM-DD",
      "mediaType": "string",
      "placementPreferences": "string",
      "grossAmount": number,
      "partnerDiscount": number,
      "additionalCharges": number,
      "netAmount": number,
      "creativeFileLink": "string",
      "creativeSpecs": "string",
      "specialInstructions": "string",
      "signatoryName": "string",
      "signatoryTitle": "string",
      "signatureDate": "YYYY-MM-DD"
    }

    Text to analyze:
    ${text}

    Return only the JSON object, no additional text or explanations.
    `;

    // Generate content using Gemini AI
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1, // Low temperature for more consistent output
        systemInstruction: "You are a data extraction specialist. Extract booking information from text and return it as a valid JSON object with the exact structure specified. Ensure all dates are in YYYY-MM-DD format and numbers are numeric values."
      }
    });

    // Parse the response text as JSON
    let extractedData;
    try {
      extractedData = JSON.parse(response.text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', response.text);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response",
        error: "Invalid JSON format returned by AI"
      });
    }

    // Validate the extracted data structure
    const requiredFields = [
      'clientName', 'contactName', 'contactEmail', 'contactPhone', 'address',
      'industrySegment', 'taxRegistrationNo', 'campaignName', 'campaignRef',
      'startDate', 'endDate', 'creativeDeliveryDate', 'mediaType',
      'placementPreferences', 'grossAmount', 'partnerDiscount', 'additionalCharges',
      'netAmount', 'creativeFileLink', 'creativeSpecs', 'specialInstructions',
      'signatoryName', 'signatoryTitle', 'signatureDate'
    ];

    const missingFields = requiredFields.filter(field => !(field in extractedData));
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Incomplete data extracted",
        missingFields: missingFields,
        extractedData: extractedData
      });
    }

    // Validate date formats
    const dateFields = ['startDate', 'endDate', 'creativeDeliveryDate', 'signatureDate'];
    const invalidDates = dateFields.filter(field => {
      const date = extractedData[field];
      if (date === null) return false; // null is acceptable
      return !/^\d{4}-\d{2}-\d{2}$/.test(date);
    });

    if (invalidDates.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid date formats detected",
        invalidDates: invalidDates,
        extractedData: extractedData
      });
    }

    // Validate numeric fields
    const numericFields = ['grossAmount', 'partnerDiscount', 'additionalCharges', 'netAmount'];
    const invalidNumbers = numericFields.filter(field => {
      const value = extractedData[field];
      return value !== null && (typeof value !== 'number' || isNaN(value));
    });

    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid numeric values detected",
        invalidNumbers: invalidNumbers,
        extractedData: extractedData
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: "Booking data extracted successfully",
      data: extractedData,
      originalText: text
    });

  } catch (error) {
    console.error('AI extraction error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to extract booking data",
      error: error.message
    });
  }
};

// Validate extracted data against business rules
export const validateExtractedData = async (req, res) => {
  try {
    const { extractedData } = req.body;

    if (!extractedData) {
      return res.status(400).json({
        success: false,
        message: "Extracted data is required"
      });
    }

    const validationErrors = [];

    // Validate required fields
    const requiredFields = ['clientName', 'contactEmail', 'campaignName', 'startDate', 'endDate', 'grossAmount'];
    requiredFields.forEach(field => {
      if (!extractedData[field]) {
        validationErrors.push(`${field} is required`);
      }
    });

    // Validate email format
    if (extractedData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(extractedData.contactEmail)) {
      validationErrors.push('Invalid email format');
    }

    // Validate phone format (basic validation)
    if (extractedData.contactPhone && !/^[\+]?[0-9\s\-\(\)]+$/.test(extractedData.contactPhone)) {
      validationErrors.push('Invalid phone number format');
    }

    // Validate date logic
    if (extractedData.startDate && extractedData.endDate) {
      const startDate = new Date(extractedData.startDate);
      const endDate = new Date(extractedData.endDate);
      
      if (startDate >= endDate) {
        validationErrors.push('End date must be after start date');
      }
    }

    // Validate financial calculations
    if (extractedData.grossAmount && extractedData.partnerDiscount && extractedData.additionalCharges && extractedData.netAmount) {
      const calculatedNet = extractedData.grossAmount - (extractedData.grossAmount * extractedData.partnerDiscount / 100) + extractedData.additionalCharges;
      const difference = Math.abs(calculatedNet - extractedData.netAmount);
      
      if (difference > 1) { // Allow for small rounding differences
        validationErrors.push('Net amount calculation mismatch');
      }
    }

    // Validate campaign reference format
    if (extractedData.campaignRef && !/^[A-Z]{2}-\d{4}-\d{3}$/.test(extractedData.campaignRef)) {
      validationErrors.push('Campaign reference should be in format: XX-YYYY-ZZZ');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Data validation failed",
        errors: validationErrors,
        data: extractedData
      });
    }

    res.status(200).json({
      success: true,
      message: "Data validation passed",
      data: extractedData
    });

  } catch (error) {
    console.error('Data validation error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to validate data",
      error: error.message
    });
  }
}; 