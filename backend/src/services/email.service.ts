import emailjs from '@emailjs/nodejs';

export interface SendOtpEmailParams {
  toEmail: string;
  toName: string;
  otp: string;
}

class EmailService {
  /**
   * Read credentials lazily so dotenv.config() has already run
   */
  private get serviceId(): string {
    return process.env.EMAILJS_SERVICE_ID || '';
  }
  private get templateId(): string {
    return process.env.EMAILJS_TEMPLATE_ID || '';
  }
  private get publicKey(): string {
    return process.env.EMAILJS_PUBLIC_KEY || '';
  }
  private get privateKey(): string {
    return process.env.EMAILJS_PRIVATE_KEY || '';
  }

  /**
   * Send OTP password reset email using EmailJS Node.js SDK
   */
  public async sendOtpEmail(params: SendOtpEmailParams): Promise<{ success: boolean; message: string }> {
    const { toEmail, toName, otp } = params;

    console.log('\n==================================================');
    console.log(`🔐 [STOCKSENSE OTP DISPATCH via EmailJS]`);
    console.log(`To: ${toName} <${toEmail}>`);
    console.log(`OTP Code: >>> ${otp} <<< (Valid for 10 minutes)`);
    console.log(`EmailJS Service: ${this.serviceId || '(not set)'}`);
    console.log(`EmailJS Template: ${this.templateId || '(not set)'}`);
    console.log('==================================================\n');

    if (this.serviceId && this.templateId && this.publicKey) {
      try {
        const templateParams: Record<string, string> = {
          // Standard EmailJS template variables
          to_name: toName,
          to_email: toEmail,
          otp_code: otp,
          app_name: 'StockSense Inventory Management',
          expiry_minutes: '10',
          // Common alternative variable names used in EmailJS templates
          user_name: toName,
          user_email: toEmail,
          passcode: otp,
          message: `Your StockSense verification code is: ${otp}. This code expires in 10 minutes.`,
          reply_to: toEmail,
        };

        const response = await emailjs.send(
          this.serviceId,
          this.templateId,
          templateParams,
          {
            publicKey: this.publicKey,
            privateKey: this.privateKey || undefined,
          }
        );
        console.log(`✅ [EmailJS] OTP email dispatched successfully: status ${response.status}`);
        return { success: true, message: 'OTP sent to your email.' };
      } catch (err: any) {
        const errorDetail = err?.text || err?.message || JSON.stringify(err);
        console.error(`⚠️ [EmailJS Error]: ${errorDetail}`);
        // Still return success so the user can use the OTP from server logs during development
        return {
          success: true,
          message: `OTP generated (EmailJS dispatch issue: ${errorDetail}). Check server console for OTP code.`,
        };
      }
    } else {
      const missing = [];
      if (!this.serviceId) missing.push('EMAILJS_SERVICE_ID');
      if (!this.templateId) missing.push('EMAILJS_TEMPLATE_ID');
      if (!this.publicKey) missing.push('EMAILJS_PUBLIC_KEY');
      console.log(`ℹ️ [EmailJS] Missing credentials: ${missing.join(', ')}. OTP printed above for local dev.`);
      return {
        success: true,
        message: 'OTP generated and logged for local development.',
      };
    }
  }

  // Compatibility stubs for legacy services
  public async sendAssetAllocatedEmail(...args: any[]): Promise<void> {}
  public async sendAssetReturnedEmail(...args: any[]): Promise<void> {}
  public async sendTransferApprovedEmail(...args: any[]): Promise<void> {}
  public async sendAdminPasswordResetEmail(...args: any[]): Promise<void> {}
  public async sendBookingApprovedEmail(...args: any[]): Promise<void> {}
  public async sendBookingRejectedEmail(...args: any[]): Promise<void> {}
  public async sendWelcomeEmail(...args: any[]): Promise<void> {}
  public async sendPasswordResetEmail(...args: any[]): Promise<void> {}
  public async sendAccountActivatedEmail(...args: any[]): Promise<void> {}
  public async sendAccountDeactivatedEmail(...args: any[]): Promise<void> {}
  public async sendMaintenanceApprovedEmail(...args: any[]): Promise<void> {}
  public async sendMaintenanceTechnicianAssignedEmail(...args: any[]): Promise<void> {}
  public async sendMaintenanceResolvedEmail(...args: any[]): Promise<void> {}
}

export const emailService = new EmailService();
export default emailService;
