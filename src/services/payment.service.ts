import { api } from '@/lib/api';

interface CreateOrderResponse {
  success: boolean;
  data: {
    bookingId: string;
    orderId: string;
    amount: number;
    currency: string;
    event: {
      id: string;
      name: string;
      date: string;
      location: any;
    };
    razorpayKeyId: string;
  };
}

interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId: string;
}

interface PaymentFailureData {
  razorpay_order_id: string;
  bookingId: string;
  error: any;
}

class PaymentService {  /**
   * Create a payment order for booking
   */
  async createPaymentOrder(eventId: string, numberOfSeats: number, amount?: number): Promise<CreateOrderResponse> {
    try {
      console.log('Creating payment order:', { eventId, numberOfSeats, amount });
      
      const requestBody: any = {
        eventId,
        numberOfSeats,
      };

      // Include amount if provided
      if (amount !== undefined) {
        requestBody.amount = amount;
      }

      const response = await api.post('/payment/create-order', requestBody);

      console.log('Payment order response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create payment order');
      }

      // Validate minimum amount
      if (response.data.data.amount < 1) {
        throw new Error('Order amount must be at least ₹1');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMsg = error.response.data?.error || 'Invalid payment request';
        throw new Error(errorMsg);
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to create payment order');
    }
  }
  /**
   * Verify payment after successful Razorpay checkout
   */
  async verifyPayment(paymentData: VerifyPaymentData) {
    try {
      console.log('Verifying payment:', paymentData);
      
      const response = await api.post('/payment/verify', paymentData);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Payment verification failed');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw new Error(error.response?.data?.error || error.message || 'Payment verification failed');
    }
  }

  /**
   * Handle payment failure or cancellation
   */
  async handlePaymentFailure(failureData: PaymentFailureData) {
    try {
      console.log('Handling payment failure:', failureData);
      
      const response = await api.post('/payment/failure', failureData);
      return response.data;
    } catch (error: any) {
      console.error('Error handling payment failure:', error);
      // Don't throw error here as it's cleanup operation
      return { success: false, error: error.message };
    }
  }
  /**
   * Cancel booking (for payment failures)
   */
  async cancelBooking(bookingId: string) {
    try {
      const response = await api.post(`/booking/${bookingId}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment status for a booking
   */
  async getPaymentStatus(bookingId: string) {
    try {
      const response = await api.get(`/payment/status/${bookingId}`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get payment status');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get payment status');
    }
  }
  /**
   * Get payment details for a booking
   */
  async getPaymentByBookingId(bookingId: string) {
    try {
      const response = await api.get(`/payment/status/${bookingId}`);

      if (response.data.success) {
        return response.data.data.payment;
      } else {
        throw new Error(response.data.error || 'Failed to get payment details');
      }
    } catch (error: any) {
      console.error('Error getting payment details:', error);
      // Return null if payment not found, don't throw error
      return null;
    }
  }
}

export const paymentService = new PaymentService();
