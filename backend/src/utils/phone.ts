// ─── Phone Number Normalization & Validation Utility ─────────────────────────
// Supports Indian (+91) standard 10-digit mobile numbers as well as international E.164 formats

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // Clean E.164 format (e.g., "+919876543210")
  formatted: string;  // Human-readable format (e.g., "+91 98765 43210")
  countryCode: string;
  nationalNumber: string;
  error?: string;
}

/**
 * Validate and normalize a phone number into strict E.164 format.
 * Defaults to India (+91) for 10-digit numbers or numbers without country code.
 */
export function validateAndNormalizePhone(rawPhone?: string | null): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      error: 'Employee does not have a valid phone number.',
    };
  }

  // Strip whitespace, brackets, dots, and hyphens
  let clean = rawPhone.trim().replace(/[\s\(\)\-\.]/g, '');

  if (!clean) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      countryCode: '',
      nationalNumber: '',
      error: 'Employee does not have a valid phone number.',
    };
  }

  // Handle leading zeros (e.g. 09876543210 -> 9876543210)
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.substring(1);
  }

  // Case 1: Already has leading +
  if (clean.startsWith('+')) {
    const digitsOnly = clean.substring(1);
    if (!/^\d{7,15}$/.test(digitsOnly)) {
      return {
        isValid: false,
        normalized: '',
        formatted: '',
        countryCode: '',
        nationalNumber: '',
        error: 'Phone number format is invalid. Must contain between 7 and 15 digits.',
      };
    }

    // Identify country code for +91
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
      const national = digitsOnly.substring(2);
      return {
        isValid: true,
        normalized: `+91${national}`,
        formatted: `+91 ${national.slice(0, 5)} ${national.slice(5)}`,
        countryCode: '+91',
        nationalNumber: national,
      };
    }

    return {
      isValid: true,
      normalized: `+${digitsOnly}`,
      formatted: `+${digitsOnly}`,
      countryCode: `+${digitsOnly.slice(0, Math.min(3, digitsOnly.length - 7))}`,
      nationalNumber: digitsOnly,
    };
  }

  // Case 2: Starts with '91' and is 12 digits (India prefix without '+')
  if (clean.startsWith('91') && clean.length === 12 && /^\d{12}$/.test(clean)) {
    const national = clean.substring(2);
    return {
      isValid: true,
      normalized: `+91${national}`,
      formatted: `+91 ${national.slice(0, 5)} ${national.slice(5)}`,
      countryCode: '+91',
      nationalNumber: national,
    };
  }

  // Case 3: 10-digit Indian Mobile number (6, 7, 8, 9 starting)
  if (/^[6-9]\d{9}$/.test(clean)) {
    return {
      isValid: true,
      normalized: `+91${clean}`,
      formatted: `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`,
      countryCode: '+91',
      nationalNumber: clean,
    };
  }

  // Case 4: Any other 10-digit number
  if (/^\d{10}$/.test(clean)) {
    return {
      isValid: true,
      normalized: `+91${clean}`,
      formatted: `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`,
      countryCode: '+91',
      nationalNumber: clean,
    };
  }

  // Case 5: 11 to 15 digits assumed international without '+'
  if (/^\d{11,15}$/.test(clean)) {
    return {
      isValid: true,
      normalized: `+${clean}`,
      formatted: `+${clean}`,
      countryCode: '+1',
      nationalNumber: clean,
    };
  }

  return {
    isValid: false,
    normalized: '',
    formatted: '',
    countryCode: '',
    nationalNumber: '',
    error: 'Phone number format is invalid. Please provide a valid 10-digit mobile number or standard E.164 number.',
  };
}

export default validateAndNormalizePhone;
