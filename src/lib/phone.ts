/**
 * Indian Phone Number & WhatsApp Normalization Utility
 *
 * Normalizes user-entered phone numbers across various formats:
 *  - '9820012345'       -> waPhone: '919820012345', clean: '9820012345', display: '+91 98200 12345'
 *  - '09820012345'      -> waPhone: '919820012345', clean: '9820012345', display: '+91 98200 12345'
 *  - '+91 98200 12345'  -> waPhone: '919820012345', clean: '9820012345', display: '+91 98200 12345'
 *  - '+9109820012345'   -> waPhone: '919820012345', clean: '9820012345', display: '+91 98200 12345'
 *  - '919820012345'     -> waPhone: '919820012345', clean: '9820012345', display: '+91 98200 12345'
 *  - '00919820012345'   -> waPhone: '919820012345', clean: '9820012345', display: '+91 98200 12345'
 */

export interface NormalizedPhone {
  raw: string;
  clean: string;      // 10-digit clean string: '9820012345'
  waPhone: string;    // E.164 without plus for wa.me: '919820012345'
  display: string;    // Formatted display: '+91 98200 12345'
  isValid: boolean;
}

export function normalizePhone(rawPhone?: string | number | null): NormalizedPhone {
  if (!rawPhone) {
    return {
      raw: '',
      clean: '',
      waPhone: '',
      display: '',
      isValid: false,
    };
  }

  const raw = String(rawPhone).trim();
  // Strip all non-digits
  let digits = raw.replace(/\D/g, '');

  // Strip international dialing prefix '0091'
  if (digits.startsWith('0091')) {
    digits = digits.slice(2);
  }

  // If starts with '91' and has more than 10 digits (12, 13 digits)
  if (digits.startsWith('91') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // Strip all leading zeros (e.g. '09820012345' -> '9820012345')
  digits = digits.replace(/^0+/, '');

  let clean = digits;
  let waPhone = '';
  let display = '';
  let isValid = false;

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    clean = digits;
    waPhone = `91${digits}`;
    display = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    isValid = true;
  } else if (digits.length > 10) {
    const last10 = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(last10)) {
      clean = last10;
      waPhone = `91${last10}`;
      display = `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
      isValid = true;
    } else {
      waPhone = digits;
      display = `+${digits}`;
      isValid = digits.length >= 7;
    }
  } else if (digits.length === 10) {
    clean = digits;
    waPhone = `91${digits}`;
    display = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    isValid = true;
  } else {
    clean = digits;
    waPhone = digits ? `91${digits}` : '';
    display = digits;
    isValid = false;
  }

  return {
    raw,
    clean,
    waPhone,
    display,
    isValid,
  };
}

/**
 * Builds a direct, valid WhatsApp wa.me URL
 */
export function getWhatsAppUrl(phone?: string | number | null, message?: string): string {
  const norm = normalizePhone(phone);
  const target = norm.waPhone;
  const encodedText = message ? `?text=${encodeURIComponent(message)}` : '';
  if (!target) {
    return message ? `https://wa.me/?text=${encodeURIComponent(message)}` : 'https://wa.me/';
  }
  return `https://wa.me/${target}${encodedText}`;
}
