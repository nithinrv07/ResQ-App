/**
 * Validates Indian mobile phone numbers
 * Accepts: 10-digit numbers, +91 prefix, spaces or dashes
 * Returns: { isValid: boolean, message: string, cleanNumber: string }
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return { isValid: false, message: 'Phone number is required', cleanNumber: '' };
  }

  // Remove spaces, dashes, and country code
  let cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Remove +91 or 91 prefix if present
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return { 
      isValid: false, 
      message: 'Phone number must be 10 digits', 
      cleanNumber: cleaned 
    };
  }

  // Check if it starts with valid Indian mobile prefix (6, 7, 8, 9)
  if (!/^[6-9]/.test(cleaned)) {
    return { 
      isValid: false, 
      message: 'Phone number must start with 6, 7, 8, or 9', 
      cleanNumber: cleaned 
    };
  }

  return { 
    isValid: true, 
    message: 'Valid phone number', 
    cleanNumber: cleaned 
  };
};

/**
 * Format phone number to display format (XXX-XXXX-XXXX)
 */
export const formatPhoneNumber = (phoneNumber) => {
  const { cleanNumber } = validatePhoneNumber(phoneNumber);
  if (cleanNumber.length === 10) {
    return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7)}`;
  }
  return phoneNumber;
};
