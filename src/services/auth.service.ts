import { 
  ConfirmationResult, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signOut,
  User 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export class AuthService {
  private static instance: AuthService;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize reCAPTCHA verifier
  initializeRecaptcha(): RecaptchaVerifier {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }

    this.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      'recaptcha-container',
      {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      }
    );

    return this.recaptchaVerifier;
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<ConfirmationResult> {
    try {
      if (!this.recaptchaVerifier) {
        this.initializeRecaptcha();
      }

      if (!this.recaptchaVerifier) {
        throw new Error('RecaptchaVerifier is not initialized');
      }

      console.log('Sending OTP to:', phoneNumber);
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        this.recaptchaVerifier
      );

      console.log('OTP sent successfully');
      return confirmationResult;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/invalid-phone-number':
          throw new Error('Invalid phone number. Please check the number and try again.');
        case 'auth/too-many-requests':
          throw new Error('Too many requests. Please try again later.');
        case 'auth/quota-exceeded':
          throw new Error('SMS quota exceeded. Please try again later.');
        case 'auth/captcha-check-failed':
          throw new Error('reCAPTCHA verification failed. Please try again.');
        case 'auth/invalid-app-credential':
          throw new Error('Invalid app credentials. Please check Firebase configuration.');
        default:
          throw new Error(error.message || 'Failed to send OTP. Please try again.');
      }
    }
  }
  // Verify OTP
  async verifyOTP(confirmationResult: ConfirmationResult, otp: string): Promise<User> {
    try {
      console.log('Verifying OTP:', otp);
      
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;
      
      // Get and store the Firebase ID token for API calls
      const idToken = await user.getIdToken();
      localStorage.setItem('authToken', idToken);
      
      console.log('OTP verified successfully, user:', user.uid);
      console.log('Auth token stored in localStorage');
      
      return user;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          throw new Error('Invalid OTP. Please check the code and try again.');
        case 'auth/code-expired':
          throw new Error('OTP has expired. Please request a new one.');
        default:
          throw new Error(error.message || 'Failed to verify OTP. Please try again.');
      }
    }
  }

  // Register user with backend after successful phone verification
  async registerUser(userData: {
    phoneNumber: string;
    firstName: string;
    lastName?: string;
    email: string;
    gender?: string;
    dateOfBirth?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
    };
  }): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      console.log('Registering user with backend:', userData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...userData,
          firebaseUid: user.uid,
        }),
      });      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to register user');
      }

      const result = await response.json();
      console.log('User registered successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register user');
    }
  }
  // Check if a user exists by phone number
  async checkUserExists(phoneNumber: string): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Clean up resources
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }

  // Sign out user from Firebase
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      // Clear token from localStorage
      localStorage.removeItem('authToken');
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }
}

export const authService = AuthService.getInstance();
