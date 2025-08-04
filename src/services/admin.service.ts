import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

class AdminService {
  private static instance: AdminService;
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }
  // Production-ready admin authentication with Firebase
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get Firebase ID token
      const token = await user.getIdToken();
      
      // Verify with backend that this user is an admin
      const response = await fetch(`${this.baseUrl}/api/admin/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid: user.uid, email: user.email })
      });
      
      if (!response.ok) {
        await firebaseSignOut(auth); // Sign out from Firebase if not authorized
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.error || 'Access denied. Admin privileges required.' 
        };
      }
      
      const adminData = await response.json();
      
      // Store token and admin info for session management
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(adminData));
      
      return { success: true, token };
      
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'Admin account not found.' };
      } else if (error.code === 'auth/wrong-password') {
        return { success: false, error: 'Invalid password.' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email address.' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed attempts. Please try again later.' };
      } else if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error. Please check your connection.' };
      }
      
      return { success: false, error: error.message || 'Login failed. Please check your credentials.' };
    }
  }  // Temporary fallback for admin authentication during setup
  async loginWithFallback(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    console.log('Attempting admin login with fallback...', { email, baseUrl: this.baseUrl });
    
    // Skip Firebase completely for fallback authentication
    if (email === 'admin@thethirdplace.com' && password === 'AdminPassword123!') {
      try {
        console.log('Using fallback authentication (skipping Firebase)...');
        const healthUrl = `${this.baseUrl}/api/admin/health`;
        console.log('Testing health endpoint:', healthUrl);
        
        const response = await fetch(healthUrl);
        console.log('Health check response:', response.status, response.statusText);
        
        if (!response.ok) {
          return { success: false, error: `Cannot connect to backend. Server responded with ${response.status}` };
        }
        
        const healthData = await response.json();
        console.log('Health check data:', healthData);
        
        // Store a temporary token for session management
        localStorage.setItem('adminToken', 'temp-admin-token');
        localStorage.setItem('adminData', JSON.stringify({
          email: 'admin@thethirdplace.com',
          name: 'Development Admin',
          role: 'super_admin'
        }));
        
        console.log('Fallback authentication successful');
        return { success: true, token: 'temp-admin-token' };
        
      } catch (error) {
        console.error('Backend connection error:', error);
        return { success: false, error: `Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }

    return { success: false, error: 'Invalid credentials for fallback mode. Use admin@thethirdplace.com with correct password.' };
  }
  // Check if admin is logged in
  isLoggedIn(): boolean {
    const token = localStorage.getItem('adminToken');
    
    // For fallback authentication, we only need the token
    if (token === 'temp-admin-token') {
      return true;
    }
    
    // For Firebase authentication, we need both token and user
    const user = auth.currentUser;
    return !!(token && user);
  }

  // Get current admin data
  getCurrentAdmin(): any {
    const adminDataStr = localStorage.getItem('adminData');
    return adminDataStr ? JSON.parse(adminDataStr) : null;
  }

  // Logout admin
  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if Firebase logout fails
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    }
  }
  // Get auth headers for API calls
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('adminToken');
    
    // Handle temporary token for fallback authentication
    if (token === 'temp-admin-token') {
      return {
        'Content-Type': 'application/json'
        // No authorization header for fallback mode since backend doesn't validate it
      };
    }
    
    // Refresh token if user is logged in but token is expired
    if (!token && auth.currentUser) {
      try {
        const newToken = await auth.currentUser.getIdToken(true);
        localStorage.setItem('adminToken', newToken);
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`
        };
      } catch (error) {
        console.error('Error refreshing token:', error);
        // If token refresh fails, user needs to login again
        await this.logout();
        throw new Error('Authentication expired. Please login again.');
      }
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = await this.getAuthHeaders();
      
      // Use development endpoint for fallback authentication
      const endpoint = token === 'temp-admin-token' 
        ? `${this.baseUrl}/api/admin/dashboard-dev`
        : `${this.baseUrl}/api/admin/dashboard`;
      
      const response = await fetch(endpoint, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }  // Event Management
  async createEvent(eventData: any): Promise<any> {
    try {
      // Validate minimum requirements before sending
      if (!eventData.venueName || eventData.venueName.trim().length < 2) {
        throw new Error('Venue name must be at least 2 characters long');
      }
      
      if (!eventData.address || eventData.address.trim().length < 5) {
        throw new Error('Address must be at least 5 characters long');
      }

      const token = localStorage.getItem('adminToken');
      const endpoint = token === 'temp-admin-token' 
        ? `${this.baseUrl}/api/admin/events-dev`
        : `${this.baseUrl}/api/admin/events`;

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', eventData.title.trim());
      formData.append('description', eventData.description.trim());
      
      // Add optional content fields
      if (eventData.understandContent && eventData.understandContent.trim()) {
        formData.append('understandContent', eventData.understandContent.trim());
      }
      
      if (eventData.experienceTicketContent && eventData.experienceTicketContent.trim()) {
        formData.append('experienceTicketContent', eventData.experienceTicketContent.trim());
      }
      
      formData.append('category', eventData.category);
      formData.append('startTime', new Date(eventData.startTime).toISOString());
      formData.append('endTime', new Date(eventData.endTime).toISOString());
      formData.append('capacity', parseInt(eventData.capacity).toString());
      formData.append('experienceTicketPrice', (parseFloat(eventData.experienceTicketPrice) || 0).toString());
      formData.append('price', (parseFloat(eventData.price) || 0).toString());
      formData.append('feedbackEnabled', (eventData.feedbackEnabled !== false).toString());
      
      // Add location data as JSON string
      const locationData = {
        venueName: eventData.venueName.trim(),
        address: eventData.address.trim(),
        ...(eventData.lat && !isNaN(parseFloat(eventData.lat)) && { lat: parseFloat(eventData.lat) }),
        ...(eventData.lng && !isNaN(parseFloat(eventData.lng)) && { lng: parseFloat(eventData.lng) })
      };
      formData.append('eventLocation', JSON.stringify(locationData));

      // Add optional fields
      if (eventData.subCategory && eventData.subCategory.trim()) {
        formData.append('subCategory', eventData.subCategory.trim());
      }
      
      if (eventData.hostId && eventData.hostId.trim()) {
        formData.append('hostId', eventData.hostId.trim());
      }
      
      if (eventData.safetyInfo && eventData.safetyInfo.trim() && eventData.safetyInfo.trim().length >= 10) {
        formData.append('safetyInfo', eventData.safetyInfo.trim());
      }
      
      if (eventData.rsvpDeadline && eventData.rsvpDeadline !== '') {
        const rsvpDate = new Date(eventData.rsvpDeadline);
        const startDate = new Date(eventData.startTime);
        if (rsvpDate < startDate) {
          formData.append('rsvpDeadline', rsvpDate.toISOString());
        }
      }
      
      if (eventData.cancellationPolicy && eventData.cancellationPolicy.trim() && eventData.cancellationPolicy.trim().length >= 10) {
        formData.append('cancellationPolicy', eventData.cancellationPolicy.trim());
      }
      
      if (eventData.discountedPrice && parseFloat(eventData.discountedPrice) > 0) {
        formData.append('discountedPrice', parseFloat(eventData.discountedPrice).toString());
      }

      // Add matching tags
      if (eventData.matchingTags && eventData.matchingTags.length > 0) {
        formData.append('matchingTags', JSON.stringify(eventData.matchingTags));
      }

      // Add image files
      if (eventData.images && eventData.images.length > 0) {
        eventData.images.forEach((file: File) => {
          formData.append('images', file);
        });
      }

      // Get auth headers but remove Content-Type to let browser set it for FormData
      const authHeaders = await this.getAuthHeaders();
      const headers: Record<string, string> = {};
      
      // Copy authorization header only, browser will set Content-Type for FormData
      if (authHeaders && typeof authHeaders === 'object' && !Array.isArray(authHeaders) && 'Authorization' in authHeaders) {
        headers.Authorization = (authHeaders as Record<string, string>).Authorization;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }  async updateEvent(eventId: string, eventData: any): Promise<any> {
    try {
      // Validate minimum requirements before sending
      if (!eventData.venueName || eventData.venueName.trim().length < 2) {
        throw new Error('Venue name must be at least 2 characters long');
      }
      
      if (!eventData.address || eventData.address.trim().length < 5) {
        throw new Error('Address must be at least 5 characters long');
      }

      const token = localStorage.getItem('adminToken');
      const endpoint = token === 'temp-admin-token' 
        ? `${this.baseUrl}/api/admin/events-dev/${eventId}`
        : `${this.baseUrl}/api/admin/events/${eventId}`;

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', eventData.title.trim());
      formData.append('description', eventData.description.trim());
      
      // Add optional content fields
      if (eventData.understandContent && eventData.understandContent.trim()) {
        formData.append('understandContent', eventData.understandContent.trim());
      }
      
      if (eventData.experienceTicketContent && eventData.experienceTicketContent.trim()) {
        formData.append('experienceTicketContent', eventData.experienceTicketContent.trim());
      }
      
      formData.append('category', eventData.category);
      formData.append('startTime', new Date(eventData.startTime).toISOString());
      formData.append('endTime', new Date(eventData.endTime).toISOString());
      formData.append('capacity', parseInt(eventData.capacity).toString());
      formData.append('experienceTicketPrice', (parseFloat(eventData.experienceTicketPrice) || 0).toString());
      formData.append('price', (parseFloat(eventData.price) || 0).toString());
      formData.append('feedbackEnabled', (eventData.feedbackEnabled !== false).toString());
      
      // Add location data as JSON string
      const locationData = {
        venueName: eventData.venueName.trim(),
        address: eventData.address.trim(),
        ...(eventData.lat && !isNaN(parseFloat(eventData.lat)) && { lat: parseFloat(eventData.lat) }),
        ...(eventData.lng && !isNaN(parseFloat(eventData.lng)) && { lng: parseFloat(eventData.lng) })
      };
      formData.append('eventLocation', JSON.stringify(locationData));

      // Include status for updates
      if (eventData.status) {
        formData.append('status', eventData.status);
      }

      // Add optional fields
      if (eventData.subCategory && eventData.subCategory.trim()) {
        formData.append('subCategory', eventData.subCategory.trim());
      }
      
      if (eventData.hostId && eventData.hostId.trim()) {
        formData.append('hostId', eventData.hostId.trim());
      }
      
      if (eventData.safetyInfo && eventData.safetyInfo.trim() && eventData.safetyInfo.trim().length >= 10) {
        formData.append('safetyInfo', eventData.safetyInfo.trim());
      }
      
      if (eventData.rsvpDeadline && eventData.rsvpDeadline !== '') {
        const rsvpDate = new Date(eventData.rsvpDeadline);
        const startDate = new Date(eventData.startTime);
        if (rsvpDate < startDate) {
          formData.append('rsvpDeadline', rsvpDate.toISOString());
        }
      }
      
      if (eventData.cancellationPolicy && eventData.cancellationPolicy.trim() && eventData.cancellationPolicy.trim().length >= 10) {
        formData.append('cancellationPolicy', eventData.cancellationPolicy.trim());
      }
      
      if (eventData.discountedPrice && parseFloat(eventData.discountedPrice) > 0) {
        formData.append('discountedPrice', parseFloat(eventData.discountedPrice).toString());
      }      // Add matching tags
      if (eventData.matchingTags && eventData.matchingTags.length > 0) {
        formData.append('matchingTags', JSON.stringify(eventData.matchingTags));
      } else {
        formData.append('matchingTags', JSON.stringify([]));
      }

      // Add existing image URLs that should be kept (always send as array)
      const existingImages = eventData.existingImageUrls && Array.isArray(eventData.existingImageUrls) 
        ? eventData.existingImageUrls 
        : [];
      formData.append('imageUrls', JSON.stringify(existingImages));

      // Add new image files
      if (eventData.images && eventData.images.length > 0) {
        eventData.images.forEach((file: File) => {
          formData.append('images', file);
        });
      }

      // Get auth headers but remove Content-Type to let browser set it for FormData
      const authHeaders = await this.getAuthHeaders();
      const headers: Record<string, string> = {};
      
      // Copy authorization header only, browser will set Content-Type for FormData
      if (authHeaders && typeof authHeaders === 'object' && !Array.isArray(authHeaders) && 'Authorization' in authHeaders) {
        headers.Authorization = (authHeaders as Record<string, string>).Authorization;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers,
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update event');
      }

      return response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }
  async deleteEvent(eventId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const token = localStorage.getItem('adminToken');
      
      // Use development endpoint for fallback authentication
      const endpoint = token === 'temp-admin-token' 
        ? `${this.baseUrl}/api/admin/events-dev/${eventId}`
        : `${this.baseUrl}/api/admin/events/${eventId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getAllEvents(page = 1, limit = 10): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/events?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }
  // User Management
  async getAllUsers(page = 1, limit = 10): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/admin/users?page=${page}&limit=${limit}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  // Booking Management
  async getAllBookings(page = 1, limit = 10, filters?: any): Promise<any> {
    try {
      let url = `${this.baseUrl}/api/admin/bookings?page=${page}&limit=${limit}`;
      
      if (filters?.status) {
        url += `&status=${filters.status}`;
      }
      if (filters?.eventId) {
        url += `&eventId=${filters.eventId}`;
      }
      
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId: string, status: 'waitlist' | 'confirmed' | 'cancelled'): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/admin/bookings/update-status`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
}

export const adminService = AdminService.getInstance();