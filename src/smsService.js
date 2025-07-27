// SMS Service for sending notifications through backend API
export class SMSService {
  constructor() {
    // Use environment variable for API URL, fallback to localhost for development
    this.apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    this.messageHistory = [];

    // Load message history from localStorage if available
    const storedHistory = localStorage.getItem("smsMessageHistory");
    if (storedHistory) {
      this.messageHistory = JSON.parse(storedHistory);
    }
  }

  // Format phone number to E.164 format
  formatPhoneNumber(phone) {
    if (!phone) {
      console.log("Phone number is empty or undefined");
      throw new Error("Phone number is required");
    }

    console.log("Formatting phone number:", {
      original: phone,
      type: typeof phone,
    });

    // Remove any non-digit characters and + symbol
    const cleaned = phone.replace(/[^\d+]/g, "");
    console.log("Cleaned phone number:", cleaned);

    // If the number has + at the end, move it to the start
    if (cleaned.endsWith("+")) {
      const formatted = "+" + cleaned.slice(0, -1);
      console.log("Moved + to start:", formatted);
      return formatted;
    }

    // If the number doesn't start with +, add it
    if (!cleaned.startsWith("+")) {
      console.log("Number doesn't start with +, adding it");
      // If it's a US number (10 digits), add +1
      if (cleaned.length === 10) {
        const formatted = "+1" + cleaned;
        console.log("Added +1 to US number:", formatted);
        return formatted;
      }
      // If it's a US number with country code (11 digits starting with 1)
      if (cleaned.length === 11 && cleaned.startsWith("1")) {
        const formatted = "+" + cleaned;
        console.log("Added + to US number with country code:", formatted);
        return formatted;
      }
      // If it's a Danish number (starts with 45)
      if (cleaned.startsWith("45")) {
        const formatted = "+" + cleaned;
        console.log("Added + to Danish number:", formatted);
        return formatted;
      }
      // If it's a Saudi number (starts with 966)
      if (cleaned.startsWith("966")) {
        const formatted = "+" + cleaned;
        console.log("Added + to Saudi number:", formatted);
        return formatted;
      }
      console.log("Invalid number format - no matching pattern");
      throw new Error(
        "Invalid phone number format. Must be a valid US (+1), Danish (+45), or Saudi (+966) number."
      );
    }

    // Validate the number after the +
    const numberWithoutPlus = cleaned.substring(1);
    console.log("Validating number without +:", numberWithoutPlus);

    if (numberWithoutPlus.startsWith("1")) {
      // US number validation (1 + 10 digits)
      if (numberWithoutPlus.length !== 11) {
        console.log("Invalid US number length:", numberWithoutPlus.length);
        throw new Error(
          "Invalid US number length. Must be 10 digits after country code (e.g., +1XXXXXXXXXX)"
        );
      }
    } else if (numberWithoutPlus.startsWith("45")) {
      // Danish number validation (45 + 8 digits)
      if (numberWithoutPlus.length !== 10) {
        console.log("Invalid Danish number length:", numberWithoutPlus.length);
        throw new Error(
          "Invalid Danish number length. Must be 8 digits after country code (e.g., +45XXXXXXXX)"
        );
      }
    } else if (numberWithoutPlus.startsWith("966")) {
      // Saudi number validation (966 + 9 digits)
      if (numberWithoutPlus.length !== 12) {
        console.log("Invalid Saudi number length:", numberWithoutPlus.length);
        throw new Error(
          "Invalid Saudi number length. Must be 9 digits after country code (e.g., +966XXXXXXXXX)"
        );
      }
    } else {
      console.log("Invalid country code:", numberWithoutPlus.substring(0, 3));
      throw new Error(
        "Invalid phone number format. Must be a valid US (+1), Danish (+45), or Saudi (+966) number."
      );
    }

    console.log("Phone number validation passed:", cleaned);
    return cleaned;
  }

  // Save message history to localStorage
  saveMessageHistory() {
    localStorage.setItem(
      "smsMessageHistory",
      JSON.stringify(this.messageHistory)
    );
  }

  // Send SMS through backend API
  async sendSMS(to, message) {
    try {
      console.log("SMS Request Details:", {
        originalPhone: to,
        messageLength: message?.length,
        messagePreview:
          message?.substring(0, 50) + (message?.length > 50 ? "..." : ""),
      });

      const formattedPhone = this.formatPhoneNumber(to);
      console.log("Phone Number Formatting:", {
        original: to,
        formatted: formattedPhone,
        hasPlusPrefix: formattedPhone.startsWith("+"),
        length: formattedPhone.length,
      });

      const requestBody = { to: formattedPhone, message };
      console.log("Request Details:", {
        url: `${this.apiUrl}/send-sms`,
        method: "POST",
        body: requestBody,
      });

      const response = await fetch(`${this.apiUrl}/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("Server Response:", {
        status: response.status,
        ok: response.ok,
        result,
      });

      if (!response.ok) {
        if (
          result.error?.includes(
            "Permission to send an SMS has not been enabled"
          )
        ) {
          throw new Error(
            "This number needs to be verified in your Twilio console first. Please go to Twilio Console → Phone Numbers → Verified Caller IDs and add this number."
          );
        }
        throw new Error(result.error || "Failed to send SMS");
      }

      // Add to message history
      const historyEntry = {
        to: formattedPhone,
        from: "Mission of Palestine",
        message,
        status: result.status || "failed",
        deliveryStatus: result.deliveryStatus || "unknown",
        sentAt: new Date().toISOString(),
        error: result.error || null,
      };

      this.messageHistory.push(historyEntry);
      this.saveMessageHistory();

      return {
        success: result.success,
        error: result.error,
        messageId: result.messageId,
        from: "Mission of Palestine",
      };
    } catch (error) {
      console.error("Error sending SMS:", error);

      // Add failed attempt to history
      const historyEntry = {
        to,
        from: "Mission of Palestine",
        message,
        status: "failed",
        deliveryStatus: "failed",
        sentAt: new Date().toISOString(),
        error: error.message,
      };

      this.messageHistory.push(historyEntry);
      this.saveMessageHistory();

      throw error;
    }
  }

  // Send status notification
  async sendStatusNotification(person) {
    try {
      if (!person.phone) {
        throw new Error("لم يتم تحديد رقم الهاتف");
      }

      const message = `إلى السيد/ة ${person.name}نعلمكم بأنه جواز السفر جاهز . و بإمكانكم استلامه ضمن أوقات الدوام الرسمية`;

      const result = await this.sendSMS(person.phone, message);

      // If it's a duplicate message, we'll consider it a success
      if (result.isDuplicate) {
        return {
          success: true,
          error: result.error,
        };
      }

      return result;
    } catch (error) {
      console.error("Error sending status notification:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get message history
  getMessageHistory() {
    return this.messageHistory;
  }
}
