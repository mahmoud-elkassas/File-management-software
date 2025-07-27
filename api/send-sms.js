import twilio from 'twilio';
import { SupabaseDbService } from './supabase-db.js';

const db = new SupabaseDbService();

// Initialize Twilio client only if credentials are available
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    console.log("Initializing Twilio client with:", {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authTokenPrefix: process.env.TWILIO_AUTH_TOKEN.substring(0, 5) + "...",
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    });

    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log("Twilio client initialized successfully");
  } catch (error) {
    console.error("Error initializing Twilio client:", error);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { to, message } = req.body;

    // Validate Twilio configuration
    if (!twilioClient) {
      console.error("Twilio client not initialized");
      return res.status(401).json({
        success: false,
        error: "Twilio client not initialized. Please check your credentials.",
      });
    }

    if (!process.env.TWILIO_MESSAGING_SERVICE_SID) {
      console.error("Missing Messaging Service SID");
      return res.status(401).json({
        success: false,
        error: "Missing Messaging Service SID configuration.",
      });
    }

    // Validate Messaging Service SID format
    if (!process.env.TWILIO_MESSAGING_SERVICE_SID.startsWith("MG")) {
      console.error("Invalid Messaging Service SID format");
      return res.status(401).json({
        success: false,
        error: "Invalid Messaging Service SID format. Must start with 'MG'.",
      });
    }

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "Phone number and message are required",
      });
    }

    // Validate phone number format
    if (!to.startsWith("+")) {
      return res.status(400).json({
        success: false,
        error: "Phone number must start with +",
      });
    }

    console.log("Sending SMS with Twilio:", {
      to,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      messageLength: message.length,
      serviceName: "Mission of Palestine",
    });

    const result = await twilioClient.messages.create({
      body: message,
      to: to,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      from: "Mission of Palestine",
    });

    console.log("Twilio Response:", {
      status: result.status,
      sid: result.sid,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      messagingServiceSid: result.messagingServiceSid,
      from: "Mission of Palestine",
      to: result.to,
      direction: result.direction,
    });

    // Add to SMS history
    await db.addSmsHistory({
      to_number: to,
      message: message,
      status: result.status,
      delivery_status: result.status,
      error: null
    });

    res.json({
      success: true,
      messageId: result.sid,
      status: result.status,
      deliveryStatus: result.status,
      from: "Mission of Palestine",
    });

  } catch (error) {
    console.error("Error sending SMS:", error);

    // Handle specific Twilio errors
    if (error.code === 21211) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format",
      });
    } else if (error.code === 21214) {
      return res.status(400).json({
        success: false,
        error: "This number needs to be verified in your Twilio console first. Please go to Twilio Console → Phone Numbers → Verified Caller IDs and add this number.",
      });
    } else if (error.code === 21608) {
      return res.status(400).json({
        success: false,
        error: "Your Twilio account is not verified. Please verify your account in the Twilio console.",
      });
    } else if (error.code === 20003) {
      return res.status(401).json({
        success: false,
        error: "Invalid Twilio credentials. Please check your Account SID and Auth Token.",
      });
    } else if (error.code === 21215) {
      return res.status(400).json({
        success: false,
        error: "Your Twilio account doesn't have sufficient funds to send SMS.",
      });
    } else if (error.code === 21614) {
      return res.status(400).json({
        success: false,
        error: "Invalid Messaging Service SID. Please check your configuration.",
      });
    }

    // Add failed attempt to SMS history
    await db.addSmsHistory({
      to_number: to,
      message: message,
      status: 'failed',
      delivery_status: 'failed',
      error: error.message || "Failed to send SMS"
    });

    res.status(500).json({
      success: false,
      error: error.message || "Failed to send SMS",
      details: error.moreInfo || error.details,
    });
  }
} 