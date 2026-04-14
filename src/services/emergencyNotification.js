/**
 * Emergency Notification Service
 * Sends SMS notifications to emergency contacts when SOS is triggered
 */

/**
 * Format emergency details for SMS
 */
const formatEmergencySMS = (emergencyData) => {
  const {
    guestName,
    emergencyType,
    details,
    room,
    floor,
    location,
    priority,
    criticalScore
  } = emergencyData;

  const priorityLabel = {
    critical: '🔴 CRITICAL',
    high: '🟠 HIGH',
    medium: '🟡 MEDIUM',
    low: '🟢 LOW'
  }[priority] || 'URGENT';

  const timestamp = new Date().toLocaleTimeString('en-IN');

  // Build SMS message
  let message = `🚨 EMERGENCY ALERT 🚨\n\n`;
  message += `Guest: ${guestName}\n`;
  message += `Priority: ${priorityLabel}\n`;
  message += `Type: ${emergencyType || 'Assistance Needed'}\n`;
  message += `Location: Room ${room}${floor ? ', Floor ' + floor : ''}\n`;
  message += `Details: ${details || 'Emergency assistance requested'}\n`;
  message += `Time: ${timestamp}\n`;
  message += `Critical Score: ${(criticalScore * 100).toFixed(0)}%\n\n`;
  message += `⚠️ Emergency support is being dispatched.\n`;
  message += `🏨 Hotel Emergency Response Team has been notified.`;

  return message;
};

/**
 * Send emergency SMS to contact
 * In production, this would integrate with Twilio, AWS SNS, or similar service
 */
export const sendEmergencySMS = async (emergencyContactPhone, emergencyData) => {
  if (!emergencyContactPhone) {
    console.warn('No emergency contact phone provided');
    return { success: false, message: 'No emergency contact phone number' };
  }

  try {
    const smsMessage = formatEmergencySMS(emergencyData);

    // Mock SMS sending - in production, use actual SMS API
    console.log('📱 Sending Emergency SMS to:', emergencyContactPhone);
    console.log('� Message:', smsMessage);

    // Simulate API call
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        // Store notification in localStorage for demo purposes
        const notifications = JSON.parse(localStorage.getItem('emergencySMSLogs') || '[]');
        notifications.push({
          timestamp: new Date().toISOString(),
          phone: emergencyContactPhone,
          message: smsMessage,
          emergencyData: emergencyData,
          status: 'sent'
        });
        localStorage.setItem('emergencySMSLogs', JSON.stringify(notifications));

        // Dispatch event for UI to show confirmation
        window.dispatchEvent(new CustomEvent('emergencySMSSent', {
          detail: {
            phone: emergencyContactPhone,
            message: smsMessage
          }
        }));

        resolve({
          success: true,
          message: `SMS sent to ${emergencyContactPhone}`,
          messageId: `SMS_${Date.now()}`
        });
      }, 500); // Simulate network delay
    });

    return response;
  } catch (error) {
    console.error('Failed to send emergency SMS:', error);
    return {
      success: false,
      message: 'Failed to send SMS notification',
      error: error.message
    };
  }
};

/**
 * Send email notification to emergency contact
 * Fallback if SMS fails
 */
export const sendEmergencyEmail = async (emergencyContactEmail, emergencyData) => {
  if (!emergencyContactEmail) {
    console.warn('No emergency contact email provided');
    return { success: false, message: 'No emergency contact email' };
  }

  try {
    const subject = `🚨 EMERGENCY ALERT - Guest ${emergencyData.guestName} - Room ${emergencyData.room}`;
    
    const body = `
Dear Emergency Contact,

An emergency alert has been triggered by guest ${emergencyData.guestName}.

EMERGENCY DETAILS:
━━━━━━━━━━━━━━━━━━━━
• Guest Name: ${emergencyData.guestName}
• Location: Room ${emergencyData.room}${emergencyData.floor ? ', Floor ' + emergencyData.floor : ''}
• Emergency Type: ${emergencyData.emergencyType || 'Assistance Needed'}
• Details: ${emergencyData.details || 'Emergency assistance requested'}
• Priority Level: ${emergencyData.priority?.toUpperCase() || 'URGENT'}
• Critical Score: ${(emergencyData.criticalScore * 100).toFixed(0)}%
• Time: ${new Date().toLocaleString('en-IN')}

The hotel emergency response team has been notified and emergency support is being dispatched immediately.

If you need to contact the hotel directly:
📞 Hotel Main Number: +91-XXXXX-XXXXX
🏨 Emergency Contact: 24/7 Guest Services

This is an automated notification from the hotel emergency response system.

Best Regards,
ResQ
Hotel Emergency Response System
    `;

    console.log('📧 Sending Emergency Email to:', emergencyContactEmail);

    // Mock email sending
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        const emailLogs = JSON.parse(localStorage.getItem('emergencyEmailLogs') || '[]');
        emailLogs.push({
          timestamp: new Date().toISOString(),
          email: emergencyContactEmail,
          subject: subject,
          body: body,
          emergencyData: emergencyData,
          status: 'sent'
        });
        localStorage.setItem('emergencyEmailLogs', JSON.stringify(emailLogs));

        resolve({
          success: true,
          message: `Email sent to ${emergencyContactEmail}`,
          messageId: `EMAIL_${Date.now()}`
        });
      }, 500);
    });

    return response;
  } catch (error) {
    console.error('Failed to send emergency email:', error);
    return {
      success: false,
      message: 'Failed to send email notification',
      error: error.message
    };
  }
};

/**
 * Send all emergency notifications
 * Sends both SMS and email
 */
export const sendAllEmergencyNotifications = async (emergencyContactPhone, emergencyContactEmail, emergencyData) => {
  console.log('🔔 Starting emergency notifications...', {
    phone: emergencyContactPhone,
    email: emergencyContactEmail,
    data: emergencyData
  });

  const results = {
    sms: null,
    email: null,
    allSuccess: false
  };

  try {
    if (emergencyContactPhone) {
      console.log('📱 Sending SMS notification...');
      results.sms = await sendEmergencySMS(emergencyContactPhone, emergencyData);
      console.log('✅ SMS Result:', results.sms);
    } else {
      console.warn('⚠️ No emergency contact phone provided');
    }

    if (emergencyContactEmail) {
      console.log('📧 Sending email notification...');
      results.email = await sendEmergencyEmail(emergencyContactEmail, emergencyData);
      console.log('✅ Email Result:', results.email);
    } else {
      console.warn('⚠️ No emergency contact email provided');
    }

    results.allSuccess = (results.sms?.success || false) || (results.email?.success || false);
    console.log('🎉 All notifications', results.allSuccess ? 'SUCCESS' : 'PARTIAL/FAILED', results);

    // Dispatch global event for UI
    window.dispatchEvent(new CustomEvent('emergencyNotificationComplete', {
      detail: results
    }));
  } catch (error) {
    console.error('❌ Error in notification service:', error);
    results.allSuccess = false;
  }

  return results;
};

/**
 * Get emergency SMS logs (for demo purposes)
 */
export const getEmergencySMSLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('emergencySMSLogs') || '[]');
  } catch (error) {
    console.error('Failed to get SMS logs:', error);
    return [];
  }
};

/**
 * Get emergency email logs (for demo purposes)
 */
export const getEmergencyEmailLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('emergencyEmailLogs') || '[]');
  } catch (error) {
    console.error('Failed to get email logs:', error);
    return [];
  }
};
