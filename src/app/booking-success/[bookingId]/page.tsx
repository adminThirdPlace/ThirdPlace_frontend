'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, XCircle, Clock } from 'lucide-react';
import { bookingService, type BookedEvent } from '@/services/booking.service';
import { paymentService } from '@/services/payment.service';
import { type BackendEvent } from '@/services/events.service';
import { useRazorpay } from '@/hooks/useRazorpay';
import { BookingSuccessSkeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

// Global flag to prevent multiple Razorpay instances
let isRazorpayOpen = false;

export default function BookingSuccessPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const { openRazorpay } = useRazorpay();
  const [booking, setBooking] = useState<BookedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [currentStep, setCurrentStep] = useState<'creating' | 'processing' | 'completed' | 'failed'>('creating');
  const paymentInitializedRef = useRef(false);
  
  // Check if this is a new booking creation flow
  const isNewBooking = async () => {
    const { bookingId } = await params;
    return bookingId === 'new';
  };

  // Get booking details from URL params for new bookings
  const getBookingParamsFromUrl = () => {
    return {
      eventId: searchParams.get('eventId'),
      eventName: searchParams.get('eventName'),
      numberOfSeats: parseInt(searchParams.get('numberOfSeats') || '1'),
      totalAmount: parseInt(searchParams.get('totalAmount') || '0'),
      userName: searchParams.get('userName'),
      userEmail: searchParams.get('userEmail'),
      userContact: searchParams.get('userContact'),
      friendPhone: searchParams.get('friendPhone'),
    };
  };

  // Get existing payment details from URL params
  const getPaymentParamsFromUrl = () => {
    return {
      orderId: searchParams.get('orderId'),
      razorpayKey: searchParams.get('razorpayKey'),
      amount: searchParams.get('amount'),
      currency: searchParams.get('currency'),
      eventName: searchParams.get('eventName'),
      eventId: searchParams.get('eventId'),
      userName: searchParams.get('userName'),
      userEmail: searchParams.get('userEmail'),
      userContact: searchParams.get('userContact'),
    };
  };

  const createBookingAndPayment = async (bookingParams: any) => {
    try {
      console.log('🔄 Creating payment order for new booking...');
      setCurrentStep('creating');

      // Create payment order
      const orderResponse = await paymentService.createPaymentOrder(
        bookingParams.eventId,
        bookingParams.numberOfSeats,
        bookingParams.totalAmount
      );

      console.log('✅ Payment order created:', orderResponse.data);

      if (!orderResponse.data.orderId || !orderResponse.data.razorpayKeyId) {
        throw new Error('Invalid order response from server');
      }

      // Update booking state with created booking
      setBooking({ 
        _id: orderResponse.data.bookingId,
        paymentStatus: 'created',
        bookingStatus: 'pending_payment',
        numberOfSeats: bookingParams.numberOfSeats,
        totalAmount: bookingParams.totalAmount,
        eventId: {
          _id: bookingParams.eventId,
          title: bookingParams.eventName,
        } as BackendEvent,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as BookedEvent);

      setCurrentStep('processing');

      // Start payment flow
      await handleRazorpayPayment(orderResponse.data.bookingId, {
        orderId: orderResponse.data.orderId,
        razorpayKey: orderResponse.data.razorpayKeyId,
        amount: orderResponse.data.amount.toString(),
        currency: orderResponse.data.currency || 'INR',
        eventName: orderResponse.data.event.name,
        eventId: bookingParams.eventId,
        userName: bookingParams.userName,
        userEmail: bookingParams.userEmail,
        userContact: bookingParams.userContact,
      });

    } catch (error: any) {
      console.error('❌ Error creating booking and payment:', error);
      setCurrentStep('failed');
      setPaymentError(error.message || 'Failed to create payment order');
    }
  };

  const handleRazorpayPayment = async (bookingId: string, paymentParams: any) => {
    try {
      console.log('💳 Starting Razorpay payment for booking:', bookingId);
      
      if (isRazorpayOpen) {
        console.log('⚠️ Razorpay is already open, skipping...');
        return;
      }
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', `/booking-success/${bookingId}`);
      
      isRazorpayOpen = true;
      
      // Small delay to ensure processing UI is shown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      openRazorpay({
        key: paymentParams.razorpayKey,
        amount: parseInt(paymentParams.amount) * 100,
        currency: paymentParams.currency || 'INR',
        name: 'The Third Place',
        description: `Booking for ${paymentParams.eventName}`,
        order_id: paymentParams.orderId,
        handler: async (response: any) => {
          try {
            console.log('✅ Payment success:', response);
            isRazorpayOpen = false;
            setCurrentStep('completed');
            
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingId,
            });

            // Fetch updated booking with new payment status
            const bookingData = await bookingService.getBookingById(bookingId);
            console.log('📦 Updated booking data after payment:', bookingData);
            setBooking(bookingData);
            
          } catch (error: any) {
            console.error('❌ Payment verification failed:', error);
            isRazorpayOpen = false;
            setCurrentStep('failed');
            setPaymentError('Payment verification failed. Please contact support if payment was deducted.');
            
            try {
              await paymentService.cancelBooking(bookingId);
              const bookingData = await bookingService.getBookingById(bookingId);
              setBooking(bookingData);
            } catch (cancelError) {
              console.error('Error cancelling booking:', cancelError);
            }
          }
        },
        prefill: {
          name: paymentParams.userName || '',
          email: paymentParams.userEmail || '',
          contact: paymentParams.userContact || '',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: async () => {
            try {
              console.log('❌ Payment cancelled by user');
              isRazorpayOpen = false;
              setCurrentStep('failed');
              
              await paymentService.cancelBooking(bookingId);
              await paymentService.handlePaymentFailure({
                razorpay_order_id: paymentParams.orderId,
                bookingId: bookingId,
                error: { code: 'USER_CANCELLED', description: 'Payment cancelled by user' }
              });
              
              const bookingData = await bookingService.getBookingById(bookingId);
              setBooking(bookingData);
              
            } catch (error) {
              console.error('Error handling payment cancellation:', error);
            }
          },
        },
      });
      
    } catch (error: any) {
      console.error('❌ Razorpay error:', error);
      isRazorpayOpen = false;
      setCurrentStep('failed');
      setPaymentError(error.message || 'Payment failed');
    }
  };

  const retryPayment = async () => {
    console.log('🔄 Retrying payment...');
    const { bookingId } = await params;
    
    if (bookingId === 'new') {
      // For new bookings, restart the entire flow
      const bookingParams = getBookingParamsFromUrl();
      paymentInitializedRef.current = false;
      isRazorpayOpen = false;
      setPaymentError('');
      setCurrentStep('creating');
      await createBookingAndPayment(bookingParams);
    } else {
      // For existing bookings, try payment with existing order
      const paymentParams = getPaymentParamsFromUrl();
      if (paymentParams.orderId) {
        paymentInitializedRef.current = false;
        isRazorpayOpen = false;
        setPaymentError('');
        setCurrentStep('processing');
        await handleRazorpayPayment(bookingId, paymentParams);
      }
    }
  };

  useEffect(() => {
    const initializePaymentFlow = async () => {
      try {
        const { bookingId } = await params;
        
        if (bookingId === 'new') {
          // New booking flow - create order and start payment
          console.log('🆕 New booking flow detected');
          const bookingParams = getBookingParamsFromUrl();
          
          if (!bookingParams.eventId || !bookingParams.totalAmount) {
            throw new Error('Missing required booking parameters');
          }
          
          setLoading(false);
          await createBookingAndPayment(bookingParams);
          
        } else {
          // Existing booking flow
          console.log('📋 Existing booking flow detected');
          const paymentParams = getPaymentParamsFromUrl();
          
          if (paymentParams.orderId && paymentParams.razorpayKey && paymentParams.amount && !paymentInitializedRef.current) {
            // Has payment params, start payment flow
            console.log('🚀 Payment params found, starting payment flow...');
            paymentInitializedRef.current = true;
            setLoading(false);
            setCurrentStep('processing');
            
            // Create a temporary booking object to show processing state
            setBooking({ 
              _id: bookingId,
              paymentStatus: 'created',
              bookingStatus: 'pending_payment',
              numberOfSeats: 1,
              totalAmount: parseInt(paymentParams.amount || '0'),
              eventId: { 
                _id: paymentParams.eventId || '',
                title: paymentParams.eventName || 'Event'
              } as BackendEvent,
              userId: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as BookedEvent);
            
            // Start payment flow
            await handleRazorpayPayment(bookingId, paymentParams);
          } else {
            // No payment params, just fetch existing booking
            console.log('📋 No payment params, fetching existing booking...');
            const bookingData = await bookingService.getBookingById(bookingId);
            setBooking(bookingData);
            setCurrentStep('completed');
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error('❌ Error initializing payment flow:', err);
        setError(err.message || 'Failed to initialize payment flow');
        setCurrentStep('failed');
        setLoading(false);
      }
    };

    const timer = setTimeout(initializePaymentFlow, 100);
    return () => clearTimeout(timer);
  }, [params]);

  if (loading) {
    return <BookingSuccessSkeleton />;
  }

  if (loading) {
    return <BookingSuccessSkeleton />;
  }

  // Determine the current state based on booking's paymentStatus and currentStep
  const getPaymentState = () => {
    if (!booking && currentStep === 'failed') return 'error';
    // if (!booking) return 'error';
    
    switch (currentStep) {
      case 'creating':
        return 'creating';
      case 'processing':
        return 'processing';
      case 'failed':
        return booking?.paymentStatus === 'failed' ? 'cancelled' : 'cancelled';
      case 'completed':
        return booking?.paymentStatus === 'paid' ? 'success' : 'failed';
      default:
        // Fallback to booking status
        switch (booking?.paymentStatus) {
          case 'created':
            return 'processing';
          case 'paid':
            return 'success';
          case 'failed':
            return 'cancelled';
          default:
            return booking?.bookingStatus === 'cancelled' ? 'cancelled' : 'success';
        }
    }
  };

  const renderContent = () => {
    const paymentState = getPaymentState();
    const paymentParams = getPaymentParamsFromUrl();
    const bookingParams = getBookingParamsFromUrl();
    
    switch (paymentState) {
      case 'creating':
        return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Creating Your Booking
            </h2>
            <p className="text-gray-600 mb-6">
              Please wait while we prepare your payment...
            </p>
          </div>
        );

      case 'processing':
        return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your payment in the Razorpay window...
            </p>
          </div>
        );

      case 'success':
        if (!booking) return null;
        
        return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your payment was successful and your booking has been confirmed for{' '}
              <span className="font-semibold">{booking.eventId?.title || 'your event'}</span>.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium">{booking._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-medium">{booking.eventId?.title || 'Event'}</span>
              </div>
              {booking.eventId?.startTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                  {new Date(booking.eventId.startTime).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Seats:</span>
                <span className="font-medium">{booking.numberOfSeats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium capitalize ${booking.bookingStatus === 'waitlist' ? 'text-yellow-600' : 'text-green-600'}`}>
                {booking.bookingStatus}
                </span>
              </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/invites"
                className="block w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                View Your Invites
              </Link>
              <Link
                href="/dashboard"
                className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        );

      case 'failed':
        // return (
        //   <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        //     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        //       <XCircle className="w-8 h-8 text-red-500" />
        //     </div>
        //     <h1 className="text-2xl font-bold text-gray-900 mb-2">
        //       Payment Failed
        //     </h1>
        //     <p className="text-gray-600 mb-6">
        //       {paymentError || 'Your payment could not be processed. Please try again.'}
        //     </p>
        //     <div className="space-y-3">
        //       <button
        //         onClick={retryPayment}
        //         className="block w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition"
        //       >
        //         Retry Payment
        //       </button>
        //       {(paymentParams.eventId || bookingParams.eventId) && (
        //         <Link
        //           href={`/events/${paymentParams.eventId || bookingParams.eventId}`}
        //           className="block w-full border border-black text-black py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
        //         >
        //           Go Back to Event
        //         </Link>
        //       )}
        //       <Link
        //         href="/dashboard"
        //         className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
        //       >
        //         Go to Dashboard
        //       </Link>
        //     </div>
        //   </div>
        // );
            return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your payment in the Razorpay window...
            </p>
          </div>
        );
      case 'cancelled':
        return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-gray-600 mb-6">
              You cancelled the payment. Your booking has been cancelled.
            </p>
            <div className="space-y-3">
              <button
                onClick={retryPayment}
                className="block w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Try Again
              </button>
              {(paymentParams.eventId || bookingParams.eventId) && (
                <Link
                  href={`/events/${paymentParams.eventId || bookingParams.eventId}`}
                  className="block w-full border border-black text-black py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Go Back to Event
                </Link>
              )}
              <Link
                href="/dashboard"
                className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'Unable to load booking details'}
            </p>
            <Link
              href="/dashboard"
              className="block w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        );
      
      default :
      return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your payment in the Razorpay window...
            </p>
          </div>
        );
    }
  };

  const getHeaderTitle = () => {
    const paymentState = getPaymentState();
    switch (paymentState) {
      case 'creating': return 'CREATING BOOKING';
      case 'processing': return 'PROCESSING PAYMENT';
      case 'success': return 'BOOKING CONFIRMED';
      default: return 'PAYMENT STATUS';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="flex h-[58px] items-center justify-between border-b border-[#E5E5EA] px-4">
        <Link href="/dashboard" className="p-1 text-black">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold italic tracking-wide">
          {getHeaderTitle()}
        </h1>
        <span className="h-5 w-5" />
      </header>

      <div className="flex items-center justify-center px-4 py-12">
        {renderContent()}
      </div>
    </div>
  );
}
