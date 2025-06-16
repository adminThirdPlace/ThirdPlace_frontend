'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { DashboardSkeleton } from '@/components/ui/skeleton';

// Simple spinner component
const Spinner = ({ size = 16 }: { size?: number }) => (
  <div 
    className="animate-spin rounded-full border-2 border-transparent border-t-current"
    style={{ 
      width: size, 
      height: size,
      borderTopColor: 'currentColor'
    }}
  />
);

interface FormData {
  phoneNumber: string;
  countryCode: string;
  otp: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: {
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

export default function AuthPage() {
  try {
    return <AuthPageContent />;
  } catch (error) {
    console.error('Unexpected error in AuthPage:', error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <div className="text-red-500 text-lg font-[family-name:var(--font-crimson-pro)]">
            Something went wrong
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-black text-white px-6 py-2 rounded-lg font-[family-name:var(--font-crimson-pro)]"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }
}

function AuthPageContent() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUserState } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);  const [error, setError] = useState('');const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    countryCode: '+91',
    otp: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    address: {
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    }
  });

  // Dynamic total steps based on user type
  const getTotalSteps = () => {
    if (isExistingUser === null) return 2; // Phone + OTP
    return isExistingUser ? 2 : 3; // Existing: Phone + OTP, New: Phone + OTP + Info
  };  // Add console logging for debugging
  useEffect(() => {
    console.log('🔐 Auth Page: Auth state', {
      isAuthenticated: !!user,
      uid: user?.uid,
      phoneNumber: user?.phoneNumber,
      authLoading,
      isExistingUser    });
  }, [user, authLoading, isExistingUser]);
  // Handle authenticated user redirect
  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔐 Auth Page: User authenticated, redirecting to dashboard...');
      try {
        router.replace('/dashboard');
      } catch (error) {
        console.error('Error redirecting to dashboard:', error);
        // Fallback: try using window.location
        window.location.href = '/dashboard';
      }
    }
  }, [user, authLoading, router]);// Initialize reCAPTCHA when component mounts (only if user is not authenticated)
  useEffect(() => {
    // Only initialize reCAPTCHA if user is not authenticated and not still loading
    if (!user && !authLoading) {
      try {
        authService.initializeRecaptcha();
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        // Gracefully handle reCAPTCHA initialization errors
        setComponentError('Failed to initialize authentication. Please try again.');
      }
    }
    
    return () => {
      if (!user && !authLoading) {
        try {
          authService.cleanup();
        } catch (error) {
          console.error('Error cleaning up auth service:', error);
        }
      }
    };
  }, [user, authLoading]);

  // Timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);  const handleInputChange = (field: keyof FormData | string, value: string) => {
    // Handle phone number input - remove spaces and non-digits
    if (field === 'phoneNumber') {
      // Remove all non-digits (including spaces)
      const digits = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limitedDigits = digits.slice(0, 10);
      // Store without formatting (no spaces)
      setFormData(prev => ({ ...prev, [field]: limitedDigits }));
      return;
    }
    
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({ 
        ...prev, 
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field as keyof FormData]: value }));
    }
    if (error) setError(''); // Clear error when user types
  };
  // Validation helper functions
  const validatePhoneNumber = (phone: string) => {
    // Remove spaces and validate
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    return phoneRegex.test(cleanPhone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const checkUserExists = async (phoneNumber: string) => {
    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      const fullPhoneNumber = `${formData.countryCode}${cleanPhone}`;
      const exists = await authService.checkUserExists(fullPhoneNumber);
      setIsExistingUser(exists);
      return exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      setIsExistingUser(false);
      return false;
    }
  };
  const handleSendOTP = async () => {
    if (!formData.phoneNumber || !validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First check if user exists
      await checkUserExists(formData.phoneNumber);
      
      // Remove spaces from phone number for backend
      const cleanPhoneNumber = formData.phoneNumber.replace(/\s/g, '');
      const fullPhoneNumber = `${formData.countryCode}${cleanPhoneNumber}`;
      console.log('Sending OTP to:', fullPhoneNumber);
      
      const confirmation = await authService.sendOTP(fullPhoneNumber);
      setConfirmationResult(confirmation);
      setCurrentStep(2);
      
      // Start the resend timer
      setResendTimer(30);
      setCanResend(false);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (!confirmationResult) {
      setError('Please request a new OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {      await authService.verifyOTP(confirmationResult, formData.otp);
      console.log('OTP verification successful');
      
      if (isExistingUser) {
        // Existing user - redirect to dashboard
        console.log('Existing user sign-in successful, redirecting to dashboard...');
        setRedirecting(true);
        
        // Wait for AuthProvider to update user state
        await refreshUserState();
        
        // Small delay to ensure AuthProvider is fully updated
        setTimeout(() => {
          router.replace('/dashboard');
        }, 150);
      } else {
        // New user - proceed to registration info
        setCurrentStep(3);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleSignUp = async () => {
    setLoading(true);
    setError('');    try {
      // Clean phone number by removing spaces
      const cleanPhoneNumber = formData.phoneNumber.replace(/\s/g, '');
      
      const userData = {
        phoneNumber: `${formData.countryCode}${cleanPhoneNumber}`,
        firstName: formData.firstName.trim(),
        // Only include gender if it's not empty
        ...(formData.gender && { gender: formData.gender }),
        // Only include dateOfBirth if it's not empty
        ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
        // Only include email if it's not empty
        ...(formData.email.trim() && { email: formData.email.toLowerCase().trim() }),
        // Only include address if any field is not empty
        ...((formData.address.city.trim() || formData.address.state.trim() || formData.address.pincode.trim()) && {
          address: {
            ...(formData.address.city.trim() && { city: formData.address.city.trim() }),
            ...(formData.address.state.trim() && { state: formData.address.state.trim() }),
            country: formData.address.country,
            ...(formData.address.pincode.trim() && { pincode: formData.address.pincode.trim() })
          }
        })
      };

      await authService.registerUser(userData);
        // Refresh auth state to check if user profile now exists
      await refreshUserState();
        // Registration successful, set redirecting state and redirect to dashboard
      console.log('✅ Registration completed successfully');
      setRedirecting(true);
      // Small delay to ensure AuthProvider is fully updated
      setTimeout(() => {
        router.replace('/dashboard');
      }, 150);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    }
    
    setLoading(false);
  };  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    setError('');
    
    try {
      // Remove spaces from phone number for backend
      const cleanPhoneNumber = formData.phoneNumber.replace(/\s/g, '');
      const fullPhoneNumber = `${formData.countryCode}${cleanPhoneNumber}`;
      const confirmation = await authService.sendOTP(fullPhoneNumber);
      setConfirmationResult(confirmation);
      setError('');
      
      // Start the resend timer
      setResendTimer(30);
      setCanResend(false);
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      setError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handleSendOTP();
    } else if (currentStep === 2) {
      handleVerifyOTP();
    } else if (currentStep === 3) {
      handleBasicInfoSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      
      // Reset user existence check if going back to step 1
      if (currentStep === 2) {
        setIsExistingUser(null);
      }
    }
  };
  const handleBasicInfoSubmit = () => {
    // Validation for basic info
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    // Check age only if date of birth is provided
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setError('You must be at least 18 years old to sign up');
        return;
      }
    }

    // All validation passed, proceed with signup
    handleSignUp();
  };

  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-1 mb-8">
      <div 
        className="bg-black h-1 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${(currentStep / getTotalSteps()) * 100}%` }}
      />
    </div>
  );
  const renderPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-left space-y-2">
        <h1 className="text-xl font-medium text-gray-900 font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 500 }}>
          Welcome to third place.
        </h1>
        <p className="text-xl font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
          <span className="font-medium" style={{ fontWeight: 500 }}>Third Place</span> helps you meet <span className="font-medium" style={{ fontWeight: 500 }}>new people</span>, discover your <span className="font-medium" style={{ fontWeight: 500 }}>city</span>, & deepen your <span className="font-medium" style={{ fontWeight: 500 }}>relationships</span>.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-gray-700 text-xl font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
          Enter your phone number to get started
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}        <div className="flex justify-center">
          <div className="border border-gray-300 rounded-lg px-4 py-3 bg-white max-w-sm w-full focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all">
            <div className="flex items-center justify-center w-full gap-3">
              <select 
                value={formData.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                disabled={loading}
                className="appearance-none bg-transparent border-none outline-none text-xl font-light font-[family-name:var(--font-crimson-pro)] disabled:cursor-not-allowed text-right" style={{ fontWeight: 300, width: '60px' }}
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
              <span className="text-gray-300 text-xl">|</span>
              <input
                type="tel"
                placeholder="33333 33333"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={loading}
                className="bg-transparent border-none outline-none text-xl font-light font-[family-name:var(--font-crimson-pro)] disabled:cursor-not-allowed text-left" style={{ fontWeight: 300, width: '140px' }}
              />
            </div>
          </div>
        </div><button
          onClick={handleNext}
          disabled={!formData.phoneNumber || loading}
          className="w-full bg-black text-white py-3 rounded-lg text-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors font-[family-name:var(--font-crimson-pro)] flex items-center justify-center gap-2" style={{ fontWeight: 500 }}
        >
          {loading && <Spinner size={20} />}
          {loading ? 'Sending OTP...' : 'Continue'}
        </button>

        <div className="text-left">
          <p className="font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300, fontSize: '12px', lineHeight: '18px' }}>
            By clicking Continue I agree to Third Place&apos;s{' '}
            <Link href="/terms-conditions" className="underline">
              Terms & Conditions
            </Link>{' '}
            &{' '}
            <Link href="/privacy-policy" className="underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
  const renderOtpStep = () => (
    <div className="space-y-6">
      <div className="text-left space-y-2">
        <h1 className="text-xl font-medium text-gray-900 font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 500 }}>
          Welcome to third place.
        </h1>
        <p className="text-xl font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
          <span className="font-medium" style={{ fontWeight: 500 }}>Third Place</span> helps you meet <span className="font-medium" style={{ fontWeight: 500 }}>new people</span>, discover your <span className="font-medium" style={{ fontWeight: 500 }}>city</span>, & deepen your <span className="font-medium" style={{ fontWeight: 500 }}>relationships</span>.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-gray-700 text-xl font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
          Enter the OTP sent to {formData.countryCode} {formData.phoneNumber}
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}        <div className="flex justify-center">
          <input
            type="tel"
            placeholder="Enter OTP"
            value={formData.otp}
            onChange={(e) => handleInputChange('otp', e.target.value)}
            disabled={loading}
            maxLength={6}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-3 text-xl font-light focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[family-name:var(--font-crimson-pro)] disabled:bg-gray-100 disabled:cursor-not-allowed text-center" style={{ fontWeight: 300 }}
          />
        </div>
      </div>      <button
        onClick={handleNext}
        disabled={!formData.otp || loading}
        className="w-full bg-black text-white py-3 rounded-lg text-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors font-[family-name:var(--font-crimson-pro)] flex items-center justify-center gap-2" style={{ fontWeight: 500 }}
      >
        {loading && <Spinner size={20} />}
        {loading ? 'Verifying...' : 'Verify'}
      </button>

      <div className="text-left">
        <p className="text-xl text-gray-600 font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
          Didn&apos;t receive the OTP?{' '}
          {!canResend ? (
            <span className="text-gray-600 font-medium" style={{ fontWeight: 500 }}>
              Retry in 0:{resendTimer.toString().padStart(2, '0')}s?
            </span>
          ) : (            <button 
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="text-blue-600 underline font-medium disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1" 
              style={{ fontWeight: 500 }}
            >
              {resendLoading && <Spinner size={16} />}
              {resendLoading ? 'Retrying...' : 'Retry Now'}
            </button>
          )}
        </p>
      </div>
    </div>
  );
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-xl font-medium text-gray-900 font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 500 }}>
          BASIC INFO
        </h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xl text-gray-700 mb-1 font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
            First name*
          </label>
          <input
            type="text"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 text-xl font-light focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}
          />
        </div>        <div> 
          <label className="block text-xl text-gray-700 mb-1 font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 text-xl font-light focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xl text-gray-700 mb-1 font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
              Gender*
            </label>
            <div className="relative">
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-3 pr-8 text-xl font-light focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-xl text-gray-700 mb-1 font-light font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}>
              Date of birth*
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-xl font-light focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[family-name:var(--font-crimson-pro)]" style={{ fontWeight: 300 }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}        <button
          onClick={handleNext}
          disabled={!formData.firstName || !formData.gender || !formData.dateOfBirth  || loading}
          className="w-full bg-black text-white py-3 rounded-lg text-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors font-[family-name:var(--font-crimson-pro)] flex items-center justify-center gap-2" style={{ fontWeight: 500 }}
        >
          {loading && <Spinner size={20} />}
          {loading ? 'Creating Account...' : 'Sign up'}
        </button>
      </div>
    </div>
  );  // Early return for authenticated user to prevent flash
  if (user && !authLoading) {
    console.log('🔐 Auth Page: User authenticated, redirecting...');
    try {
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error redirecting to dashboard:', error);
      // Fallback: try using window.location
      window.location.href = '/dashboard';
    }
    return <DashboardSkeleton />;
  }

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size={32} />
          <p className="text-gray-600 text-lg font-[family-name:var(--font-crimson-pro)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }  // Show loading state when redirecting
  if (redirecting) {
    return <DashboardSkeleton />;
  }

  // Show error state if component error occurred
  if (componentError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <div className="text-red-500 text-lg font-[family-name:var(--font-crimson-pro)]">
            Something went wrong
          </div>
          <button 
            onClick={() => {
              setComponentError(null);
              router.replace('/');
            }}
            className="bg-black text-white px-6 py-2 rounded-lg font-[family-name:var(--font-crimson-pro)]"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 border-b border-gray-200">
        <button 
          onClick={currentStep > 1 ? handleBack : () => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="flex-shrink-0">
          <Image
            src="/Logo_001-01.png"
            alt="Third Place Logo"
            width={100}
            height={30}
            className="object-contain"
            priority
          />
        </div>
        
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="px-6  max-w-md mx-auto">
        {renderProgressBar()}        {currentStep === 1 && !user && !redirecting && renderPhoneStep()}
        {currentStep === 2 && !user && !redirecting && renderOtpStep()}
        {currentStep === 3 && !user && !isExistingUser && !redirecting && renderBasicInfoStep()}
        
        {/* reCAPTCHA container (invisible) */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
