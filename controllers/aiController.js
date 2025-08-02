import { GoogleGenAI, createPartFromUri } from "@google/genai";

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// Extract booking data from PDF using Gemini AI
export const extractBookingData = async (req, res) => {
  try {
    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        message: "PDF URL is required"
      });
    }

    // Validate PDF URL format
    if (!pdfUrl.match(/^https?:\/\/.+/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF URL format"
      });
    }

    try {
      // Fetch PDF from URL
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        return res.status(400).json({
          success: false,
          message: "Failed to fetch PDF from URL"
        });
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      // Upload PDF to Gemini File API
      const file = await ai.files.upload({
        file: fileBlob,
        config: {
          displayName: 'booking-document.pdf',
        },
      });

      // Wait for the file to be processed
      let getFile = await ai.files.get({ name: file.name });
      while (getFile.state === 'PROCESSING') {
        getFile = await ai.files.get({ name: file.name });
        console.log(`Current file status: ${getFile.state}`);
        
        // Wait 2 seconds before checking again
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }

      if (getFile.state === 'FAILED') {
        return res.status(500).json({
          success: false,
          message: "PDF processing failed"
        });
      }

      // Create a detailed prompt for Gemini to extract structured data
      const prompt = `
      Extract booking information from this PDF document and return it as a valid JSON object with the exact structure shown below. 
      If a field is not found in the document, use null for that field.
      
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

      Return only the JSON object, no additional text or explanations.
      `;

      // Prepare content with PDF file
      const content = [prompt];
      if (file.uri && file.mimeType) {
        const fileContent = createPartFromUri(file.uri, file.mimeType);
        content.push(fileContent);
      }

      // Generate content using Gemini AI
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: content,
        config: {
          temperature: 0.1, // Low temperature for more consistent output
          systemInstruction: "You are a data extraction specialist. Extract booking information from PDF documents and return it as a valid JSON object with the exact structure specified. Ensure all dates are in YYYY-MM-DD format and numbers are numeric values."
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
      pdfUrl: pdfUrl
    });

    } catch (fetchError) {
      console.error('PDF fetch error:', fetchError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch PDF from URL",
        error: fetchError.message
      });
    }

  } catch (error) {
    console.error('AI extraction error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to extract booking data",
      error: error.message
    });
  }
};

 