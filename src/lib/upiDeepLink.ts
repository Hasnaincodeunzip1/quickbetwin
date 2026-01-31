/**
 * UPI Deep Link Generator
 * Creates UPI payment URLs that open user's UPI app (GPay, PhonePe, Paytm, etc.)
 */

interface UPIPaymentParams {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
}

/**
 * Generates a UPI deep link URL
 * Format: upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&tn=<NOTE>&tr=<REF>
 */
export function generateUPIDeepLink(params: UPIPaymentParams): string {
  const { upiId, payeeName, amount, transactionNote, transactionRef } = params;

  const queryParams = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
  });

  if (transactionNote) {
    queryParams.set('tn', transactionNote);
  }

  if (transactionRef) {
    queryParams.set('tr', transactionRef);
  }

  return `upi://pay?${queryParams.toString()}`;
}

/**
 * Opens UPI app with payment details
 * Returns true if the link was opened, false if it failed
 */
export function openUPIApp(params: UPIPaymentParams): boolean {
  const upiUrl = generateUPIDeepLink(params);
  
  try {
    // For mobile devices, this will open the UPI app
    window.location.href = upiUrl;
    return true;
  } catch (error) {
    console.error('Failed to open UPI app:', error);
    return false;
  }
}

/**
 * Checks if the device is likely a mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Generates intent URL for Android (more reliable on Android devices)
 */
export function generateUPIIntentUrl(params: UPIPaymentParams): string {
  const upiUrl = generateUPIDeepLink(params);
  
  // Android intent format for better app picker experience
  return `intent://pay?${upiUrl.replace('upi://pay?', '')}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
}

/**
 * Try to open UPI with fallback options
 */
export function openUPIWithFallback(
  params: UPIPaymentParams,
  onFallback: () => void
): void {
  const upiUrl = generateUPIDeepLink(params);

  // Create a hidden iframe to detect if UPI handler exists
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  // Set timeout to detect if app opened
  const timeout = setTimeout(() => {
    document.body.removeChild(iframe);
    // If we're still here after 2 seconds, show fallback
    onFallback();
  }, 2000);

  // Try to open UPI URL
  window.location.href = upiUrl;

  // Listen for page visibility change (indicates app opened)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.removeChild(iframe);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
}
