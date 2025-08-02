import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

export const extractBookingData = async (req, res) => {
  try {
    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        message: "PDF URL is required"
      });
    }

    if (!pdfUrl.match(/^https?:\/\/.+/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF URL format"
      });
    }

    try {
      console.log('Fetching PDF from URL:', pdfUrl);
      const pdfResponse = await fetch(pdfUrl);
      
      if (!pdfResponse.ok) {
        console.error('PDF fetch failed with status:', pdfResponse.status);
        return res.status(400).json({
          success: false,
          message: "Failed to fetch PDF from URL",
          status: pdfResponse.status
        });
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfData = Buffer.from(pdfBuffer);
      
      console.log('PDF fetched successfully, size:', pdfData.length, 'bytes');
      
      const pdfHeader = pdfData.slice(0, 4).toString('ascii');
      console.log('PDF header:', pdfHeader);
      if (pdfHeader !== '%PDF') {
        console.warn('Warning: File may not be a valid PDF');
        const textContent = pdfData.toString('utf8');
        if (textContent.includes('Booking Details')) {
          console.log('Detected text file from frontend fallback');
        }
      }

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

      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfData.toString("base64")
          }
        }
      ];

      console.log('Generating content with Gemini AI...');
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          temperature: 0.1,
          systemInstruction: "You are a data extraction specialist. Extract booking information from PDF documents and return it as a valid JSON object with the exact structure specified. Ensure all dates are in YYYY-MM-DD format and numbers are numeric values."
        }
      });
      
      console.log('AI response received, length:', response.text.length);

      let extractedData;
      try {
        let jsonText = response.text.trim();
        
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        extractedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', response.text);
        return res.status(500).json({
          success: false,
          message: "Failed to parse AI response",
          error: "Invalid JSON format returned by AI"
        });
      }

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

      const dateFields = ['startDate', 'endDate', 'creativeDeliveryDate', 'signatureDate'];
      const invalidDates = dateFields.filter(field => {
        const date = extractedData[field];
        if (date === null) return false;
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

      console.log('Booking data extracted successfully:', {
        clientName: extractedData.clientName,
        campaignName: extractedData.campaignName,
        netAmount: extractedData.netAmount
      });
      
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

 