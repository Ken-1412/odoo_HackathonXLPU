import emailjs from '@emailjs/browser';

export interface SendOtpEmailParams {
  toEmail: string;
  userName: string;
  otp: string;
  expiresIn?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  status?: number;
}

/**
 * Client-Side EmailJS Browser Dispatcher for StockSense Password Reset OTP
 * Only uses the public key (VITE_EMAILJS_PUBLIC_KEY).
 * Never exposes private server credentials.
 */
class ClientEmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;

  constructor() {
    this.serviceId = (import.meta.env.VITE_EMAILJS_SERVICE_ID || '').trim();
    this.templateId = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '').trim();
    this.publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '').trim();
  }

  public isConfigured(): boolean {
    return Boolean(this.serviceId && this.templateId && this.publicKey);
  }

  /**
   * Dispatch OTP Email via EmailJS Browser SDK
   * Template parameters sent:
   * - to_email
   * - user_name
   * - otp
   * - expires_in
   */
  public async sendOtpEmail(params: SendOtpEmailParams): Promise<EmailDispatchResult> {
    const { toEmail, userName, otp, expiresIn = '10 minutes' } = params;

    // Check if EmailJS public credentials are provided
    if (!this.isConfigured()) {
      console.warn(
        '[StockSense EmailJS] VITE_EMAILJS_PUBLIC_KEY / SERVICE_ID / TEMPLATE_ID not configured in frontend .env. ' +
        'OTP generated and handled by backend authority.'
      );
      return {
        success: true,
        message: 'OTP generated. (EmailJS frontend credentials pending in .env)',
      };
    }

    try {
      const templateParams = {
        to_email: toEmail,
        user_name: userName || toEmail.split('@')[0],
        otp: otp,
        expires_in: expiresIn,
        app_name: 'StockSense',
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey
      );

      return {
        success: true,
        status: response.status,
        message: 'Password reset OTP email sent successfully.',
      };
    } catch (err: any) {
      console.error('[StockSense EmailJS Error]:', err?.text || err?.message || err);
      return {
        success: false,
        message: err?.text || err?.message || 'Failed to dispatch email via EmailJS.',
      };
    }
  }
}

export const clientEmailService = new ClientEmailService();

export const sendPasswordResetOtpEmail = async (params: {
  to_email: string;
  user_name: string;
  otp: string;
  expires_in?: string;
}): Promise<EmailDispatchResult> => {
  return clientEmailService.sendOtpEmail({
    toEmail: params.to_email,
    userName: params.user_name,
    otp: params.otp,
    expiresIn: params.expires_in,
  });
};

export default clientEmailService;

