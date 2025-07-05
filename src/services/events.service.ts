import { api } from '@/lib/api';

export interface BackendEvent {
  _id: string;
  eventId?: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  experienceTicketPrice: number;
  price: number; // curation fee for third place
  discountedPrice?: number;
  hostId?: string;
  bookingCount: number;
  status: 'CANCELLED' | 'CONFIRMED' | 'COMPLETED' | 'UPCOMING';
  matchingTags: string[];
  imageUrls: string[];
  safetyInfo?: string;
  rsvpDeadline?: string;
  cancellationPolicy?: string;
  feedbackEnabled: boolean;
  eventLocation: {
    venueName: string;
    lat?: number;
    lng?: number;
    address: string;
  };
  attendeeCount: number;
  createdAt: string;
  updatedAt: string;
  experienceTicketContent :string;
}

export interface EventsResponse {
  events: BackendEvent[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const eventService = {
  // Get all events
  getAllEvents: async (): Promise<BackendEvent[]> => {
    try {
      const response = await api.get('/events');
      const data: EventsResponse = response.data;
      
      // Extract the events array from the paginated response
      if (data && Array.isArray(data.events)) {
        return data.events;
      } else {
        console.error('Invalid response structure:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get event by ID
  getEventById: async (id: string): Promise<BackendEvent> => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // Get events by status
  getEventsByStatus: async (status: string): Promise<BackendEvent[]> => {
    try {
      const response = await api.get(`/events?status=${status}`);
      const data: EventsResponse = response.data;
      
      // Extract the events array from the paginated response
      if (data && Array.isArray(data.events)) {
        return data.events;
      } else {
        console.error('Invalid response structure:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching events by status:', error);
      throw error;
    }
  }
};