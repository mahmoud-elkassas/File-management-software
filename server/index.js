import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";
import { DbService } from "./db.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from both root and server directories
dotenv.config(); // Load from root .env
dotenv.config({ path: join(__dirname, ".env") }); // Load from server/.env

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Twilio client only if credentials are available
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    console.log("Initializing Twilio client with:", {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authTokenPrefix: process.env.TWILIO_AUTH_TOKEN.substring(0, 5) + "...",
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    });

    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log("Twilio client initialized successfully");
  } catch (error) {
    console.error("Error initializing Twilio client:", {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });
  }
}

const db = new DbService();
const PORT = process.env.PORT || 3000;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message });
});

// Generate message ID
const generateMessageId = (phone, status) => {
  return `${phone}-${status}-${new Date().toISOString().split("T")[0]}`;
};

// Person endpoints
app.get("/api/persons", async (req, res) => {
  try {
    console.log("GET /api/persons request received");
    const persons = await db.getAllPersons();
    console.log("Successfully retrieved persons:", persons.length);
    res.json(persons);
  } catch (error) {
    console.error("Error in GET /api/persons:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.get("/api/persons/search", async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.json([]);
    }
    const results = await db.searchPersons(term);
    res.json(results || []);
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/persons/:id", async (req, res) => {
  try {
    const person = await db.getPersonById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: "Person not found" });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/persons", async (req, res) => {
  try {
    const person = await db.addPerson(req.body);
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/persons", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required for PUT' });
    }
    console.log(`🔧 Updating person with ID: ${id}`);
    const updatedPerson = await db.updatePerson({ ...req.body, id });
    res.json(updatedPerson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/persons/status", async (req, res) => {
  try {
    const { criteria, value, status } = req.body;
    const updatedPersons = await db.updateStatus(criteria, value, status);
    res.json(updatedPersons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/persons", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required for DELETE' });
    }
    console.log(`🔧 Deleting person with ID: ${id}`);
    await db.deletePerson(id);
    res.json({ success: true, message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new endpoint for updating person status
app.put("/api/persons/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updatedPerson = await db.updatePersonStatus(id, status);
    if (!updatedPerson) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json(updatedPerson);
  } catch (error) {
    console.error("Error in PUT /api/persons/:id/status:", error);
    res.status(500).json({ error: error.message });
  }
});

// SMS endpoints
app.post("/api/send-sms", async (req, res) => {
  try {
    const { to, message } = req.body;

    // Validate Twilio configuration
    console.log("Validating Twilio Configuration:", {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasMessagingServiceSid: !!process.env.TWILIO_MESSAGING_SERVICE_SID,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      accountSidPrefix: process.env.TWILIO_ACCOUNT_SID?.substring(0, 5) + "...",
      messagingServiceSidFormat:
        process.env.TWILIO_MESSAGING_SERVICE_SID?.startsWith("MG")
          ? "valid"
          : "invalid",
      messagingServiceSidLength:
        process.env.TWILIO_MESSAGING_SERVICE_SID?.length,
    });

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

    console.log("SMS Request received:", {
      to,
      messageLength: message?.length,
      messagePreview:
        message?.substring(0, 50) + (message?.length > 50 ? "..." : ""),
    });

    if (!to || !message) {
      console.log("Missing required parameters:", {
        to: !!to,
        message: !!message,
      });
      return res.status(400).json({
        success: false,
        error: "Phone number and message are required",
      });
    }

    // Validate phone number format
    if (!to.startsWith("+")) {
      console.log("Invalid phone number format - missing + prefix:", to);
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

    try {
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

      res.json({
        success: true,
        messageId: result.sid,
        status: result.status,
        deliveryStatus: result.status,
        from: "Mission of Palestine",
      });
    } catch (twilioError) {
      console.error("Twilio API Error:", {
        name: twilioError.name,
        message: twilioError.message,
        code: twilioError.code,
        status: twilioError.status,
        moreInfo: twilioError.moreInfo,
        details: twilioError.details,
      });

      // Handle specific Twilio errors
      if (twilioError.code === 21211) {
        return res.status(400).json({
          success: false,
          error: "Invalid phone number format",
        });
      } else if (twilioError.code === 21214) {
        return res.status(400).json({
          success: false,
          error:
            "This number needs to be verified in your Twilio console first. Please go to Twilio Console → Phone Numbers → Verified Caller IDs and add this number.",
        });
      } else if (twilioError.code === 21608) {
        return res.status(400).json({
          success: false,
          error:
            "Your Twilio account is not verified. Please verify your account in the Twilio console.",
        });
      } else if (twilioError.code === 20003) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid Twilio credentials. Please check your Account SID and Auth Token.",
        });
      } else if (twilioError.code === 21215) {
        return res.status(400).json({
          success: false,
          error:
            "Your Twilio account doesn't have sufficient funds to send SMS.",
        });
      } else if (twilioError.code === 21614) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid Messaging Service SID. Please check your configuration.",
        });
      }

      throw twilioError; // Re-throw if not handled above
    }
  } catch (error) {
    console.error("Error sending SMS:", {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      details: error.details,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || "Failed to send SMS",
      details: error.moreInfo || error.details,
    });
  }
});

app.get("/api/sms-history", (req, res) => {
  try {
    const history = db.getSmsHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
