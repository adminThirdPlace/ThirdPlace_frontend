'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { 
  Plus,
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  DollarSign,
  Users,
  Edit,
  Trash2,
  Eye,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';

interface Event {
  _id: string;
  title: string;
  description: string;
  understandContent?: string;
  experienceTicketContent?: string;
  price: number;
  experienceTicketPrice: number;
  discountedPrice?: number;
  eventLocation: {
    venueName: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  capacity: number;
  attendeeCount: number;
  startTime: string;
  endTime: string;
  category: string;
  subCategory?: string;
  status: 'CANCELLED' | 'CONFIRMED' | 'COMPLETED' | 'UPCOMING';
  matchingTags: string[];
  imageUrls: string[];
  hostId?: string;
  bookingCount: number;
  safetyInfo?: string;
  rsvpDeadline?: string;
  cancellationPolicy?: string;
  feedbackEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventFormData {
  title: string;
  description: string;
  understandContent?: string;
  experienceTicketContent?: string;
  price: number;
  experienceTicketPrice: number;
  discountedPrice?: number; // Discount percentage
  venueName: string;
  address: string;
  lat?: number;
  lng?: number;
  capacity: number;
  startTime: string;
  endTime: string;
  category: string;
  subCategory?: string;
  status: 'CANCELLED' | 'CONFIRMED' | 'COMPLETED' | 'UPCOMING';
  matchingTags: string[];
  hostId?: string;
  safetyInfo?: string;
  rsvpDeadline?: string;
  cancellationPolicy?: string;
  feedbackEnabled: boolean;
  images?: File[];
  existingImageUrls?: string[];
}

interface ValidationErrors {
  title?: string;
  description?: string;
  understandContent?: string;
  experienceTicketContent?: string;
  price?: string;
  experienceTicketPrice?: string;
  discountedPrice?: string;
  venueName?: string;
  address?: string;
  capacity?: string;
  startTime?: string;
  endTime?: string;
  hostId?: string;
}

const categories = [
  'conference',
  'workshop', 
  'seminar',
  'networking',
  'entertainment',
  'sports',
  'social',
  'dining',
  'outdoor',
  'cultural',
  'other'
];

function EventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    understandContent: '',
    experienceTicketContent: '',
    price: 0,
    experienceTicketPrice: 0,
    discountedPrice: 0,
    venueName: '',
    address: '',
    lat: undefined,
    lng: undefined,
    capacity: 1,
    startTime: '',
    endTime: '',
    category: 'conference',
    subCategory: '',
    status: 'UPCOMING',
    matchingTags: [],
    hostId: '',
    safetyInfo: '',
    rsvpDeadline: '',
    cancellationPolicy: '',
    feedbackEnabled: true,
    images: [],
    existingImageUrls: []
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    fetchEvents();
    
    // Check if create action is requested
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true);
    }
  }, [currentPage, searchParams]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllEvents(currentPage, 10);
      setEvents(response.events || []);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      // Set empty array if fetch fails
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.eventLocation.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;      // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'experienceTicketPrice' || name === 'discountedPrice' || name === 'capacity' || name === 'lat' || name === 'lng'
        ? parseFloat(value) || 0 
        : value
    }));

    // Real-time validation
    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setFormError('Maximum 5 images allowed');
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      setFormError('Only image files under 5MB are allowed');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      images: validFiles
    }));
    setFormError('');
  };

  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        existingImageUrls: prev.existingImageUrls?.filter((_, i) => i !== index) || []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setFormError('Please fix the validation errors below');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (selectedEvent) {
        await adminService.updateEvent(selectedEvent._id, formData);
        setSuccessMessage('Event updated successfully!');
        setShowEditModal(false);
      } else {
        await adminService.createEvent(formData);
        setSuccessMessage('Event created successfully!');
        setShowCreateModal(false);
      }
      
      fetchEvents();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await adminService.deleteEvent(eventId);
      
      setSuccessMessage('Event deleted successfully');
      
      // Refresh events list
      await fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      understandContent: '',
      experienceTicketContent: '',
      price: 0,
      experienceTicketPrice: 0,
      discountedPrice: 0,
      venueName: '',
      address: '',
      lat: undefined,
      lng: undefined,
      capacity: 1,
      startTime: '',
      endTime: '',
      category: 'conference',
      subCategory: '',
      status: 'UPCOMING',
      matchingTags: [],
      hostId: '',
      safetyInfo: '',
      rsvpDeadline: '',
      cancellationPolicy: '',
      feedbackEnabled: true,
      images: [],
      existingImageUrls: []
    });
    setFormError('');
    setSuccessMessage('');
  };  
  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    
    // Helper function to format datetime for datetime-local input
    const formatDateTimeLocal = (isoString: string): string => {
      if (!isoString) return '';
      const date = new Date(isoString);
      // Format as YYYY-MM-DDTHH:MM (required format for datetime-local)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      title: event.title,
      description: event.description,
      understandContent: event.understandContent || '',
      experienceTicketContent: event.experienceTicketContent || '',
      price: event.price,
      experienceTicketPrice: event.experienceTicketPrice,
      discountedPrice: event.discountedPrice || 0,
      venueName: event.eventLocation.venueName,
      address: event.eventLocation.address,
      lat: event.eventLocation.lat,
      lng: event.eventLocation.lng,
      capacity: event.capacity,
      startTime: formatDateTimeLocal(event.startTime),
      endTime: formatDateTimeLocal(event.endTime),
      category: event.category,
      subCategory: event.subCategory || '',
      status: event.status,
      matchingTags: event.matchingTags || [],
      hostId: event.hostId || '',
      safetyInfo: event.safetyInfo || '',
      rsvpDeadline: event.rsvpDeadline ? event.rsvpDeadline.split('T')[0] : '',
      cancellationPolicy: event.cancellationPolicy || '',
      feedbackEnabled: event.feedbackEnabled,
      images: [],
      existingImageUrls: event.imageUrls || []
    });
    setFormError('');
    setSuccessMessage('');
    setShowEditModal(true);
  };// Real-time validation function
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'title':
        if (!value || value.length < 3) return 'Title must be at least 3 characters long';
        if (value.length > 200) return 'Title must be less than 200 characters';
        return '';
      
      case 'description':
        if (!value || value.length < 10) return 'Description must be at least 10 characters long';
        if (value.length > 2000) return 'Description must be less than 2000 characters';
        return '';
      
      case 'understandContent':
        if (value && value.length > 0 && value.length < 10) return 'Understand content must be at least 10 characters long';
        if (value && value.length > 2000) return 'Understand content must be less than 2000 characters';
        return '';
      
      case 'experienceTicketContent':
        if (value && value.length > 0 && value.length < 10) return 'Experience ticket content must be at least 10 characters long';
        if (value && value.length > 2000) return 'Experience ticket content must be less than 2000 characters';
        return '';
      
      case 'venueName':
        if (!value || value.trim().length < 2) return 'Venue name must be at least 2 characters long';
        if (value.length > 200) return 'Venue name must be less than 200 characters';
        return '';
      
      case 'address':
        if (!value || value.trim().length < 5) return 'Address must be at least 5 characters long';
        if (value.length > 500) return 'Address must be less than 500 characters';
        return '';
      
      case 'price':
        if (value < 0) return 'Price cannot be negative';
        return '';
        case 'experienceTicketPrice':
        if (value < 0) return 'Experience ticket price cannot be negative';
        return '';
      
      case 'discountedPrice':
        if (value < 0) return 'Discount percentage cannot be negative';
        if (value > 100) return 'Discount percentage cannot exceed 100%';
        return '';
      
      case 'capacity':
        if (!value || value < 1) return 'Capacity must be at least 1';
        if (value > 1000) return 'Capacity cannot exceed 1000';
        return '';
      
      case 'startTime':
        if (!value) return 'Start time is required';
        const startDate = new Date(value);
        const today = new Date();
        if (startDate <= today) return 'Start time must be in the future';
        return '';
      
      case 'endTime':
        if (!value) return 'End time is required';
        if (formData.startTime && new Date(value) <= new Date(formData.startTime)) {
          return 'End time must be after start time';
        }
        return '';
      
      case 'rsvpDeadline':
        if (value && formData.startTime) {
          const rsvpDate = new Date(value);
          const startDate = new Date(formData.startTime);
          if (rsvpDate >= startDate) {
            return 'RSVP deadline must be before event start time';
          }
        }
        return '';
      
      case 'safetyInfo':
        if (value && value.trim() && value.trim().length < 10) {
          return 'Safety info must be at least 10 characters if provided';
        }
        return '';
      
      case 'cancellationPolicy':
        if (value && value.trim() && value.trim().length < 10) {
          return 'Cancellation policy must be at least 10 characters if provided';
        }
        return '';
        case 'hostId':
        // Optional field, no validation needed
        return '';
      
      default:
        return '';
    }
  };
  // Validate all fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
      Object.keys(formData).forEach((key) => {
      if (key !== 'matchingTags' && key !== 'lat' && key !== 'lng' && key !== 'subCategory' && 
          key !== 'hostId' && key !== 'safetyInfo' && key !== 'rsvpDeadline' && 
          key !== 'cancellationPolicy' && key !== 'feedbackEnabled' && key !== 'status' && 
          key !== 'discountedPrice' && key !== 'images' && key !== 'existingImageUrls' &&
          key !== 'understandContent' && key !== 'experienceTicketContent') {
        const error = validateField(key, formData[key as keyof EventFormData]);
        if (error) {
          errors[key as keyof ValidationErrors] = error;
        }
      }
    });

    // Validate optional fields if they have content
    if (formData.understandContent && formData.understandContent.trim()) {
      const error = validateField('understandContent', formData.understandContent);
      if (error) {
        errors.understandContent = error;
      }
    }

    if (formData.experienceTicketContent && formData.experienceTicketContent.trim()) {
      const error = validateField('experienceTicketContent', formData.experienceTicketContent);
      if (error) {
        errors.experienceTicketContent = error;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="mt-2 text-gray-600">Create and manage events on your platform</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setFormError('');
            setSuccessMessage('');
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by name, description, city, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-green-400 rounded-full mr-2 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onEdit={() => openEditModal(event)}
            onDelete={() => handleDeleteEvent(event._id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first event.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setShowCreateModal(true);
                setFormError('');
                setSuccessMessage('');
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Event
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}      {/* Create Event Modal */}
      {showCreateModal && (
        <EventFormModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create New Event"
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={formLoading}
          error={formError}
          validationErrors={validationErrors}
          onImageChange={handleImageChange}
          onRemoveImage={removeImage}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <EventFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
            resetForm();
          }}
          title="Edit Event"
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={formLoading}
          error={formError}
          validationErrors={validationErrors}          onImageChange={handleImageChange}
          onRemoveImage={removeImage}
        />
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading events...</div>}>
      <EventsContent />
    </Suspense>
  );
}

function EventCard({ event, onEdit, onDelete }: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const availableSeats = event.capacity - event.attendeeCount;
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString()}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {event.eventLocation.venueName}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2" />
            ₹{event.price.toLocaleString()} + ₹{event.experienceTicketPrice.toLocaleString()}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {availableSeats}/{event.capacity} seats available
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {event.category}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            event.status === 'CONFIRMED' || event.status === 'UPCOMING' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {event.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function EventFormModal({ 
  isOpen, 
  onClose, 
  title, 
  formData, 
  onChange, 
  onSubmit, 
  loading, 
  error, 
  validationErrors,
  onImageChange,
  onRemoveImage
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: EventFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  validationErrors: ValidationErrors;
  onImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (index: number, isExisting?: boolean) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter event title"
            />            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${validationErrors.title ? 'text-red-600' : 'text-gray-500'}`}>
                {validationErrors.title || 'Minimum 3 characters, maximum 200'}
              </span>
              <span className="text-xs text-gray-400">
                {formData.title.length}/200
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe your event"
            />            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${validationErrors.description ? 'text-red-600' : 'text-gray-500'}`}>
                {validationErrors.description || 'Minimum 10 characters, maximum 2000'}
              </span>
              <span className="text-xs text-gray-400">
                {formData.description.length}/2000
              </span>
            </div>
          </div>

          {/* Understand Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Understand Content
              <span className="text-xs text-gray-500 ml-2">(Optional)</span>
            </label>
            <textarea
              name="understandContent"
              value={formData.understandContent || ''}
              onChange={onChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.understandContent ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Content to help users understand the event better..."
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${validationErrors.understandContent ? 'text-red-600' : 'text-gray-500'}`}>
                {validationErrors.understandContent || 'Optional field, minimum 10 characters if provided, maximum 2000'}
              </span>
              <span className="text-xs text-gray-400">
                {(formData.understandContent || '').length}/2000
              </span>
            </div>
          </div>

          {/* Experience Ticket Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience Ticket Content
              <span className="text-xs text-gray-500 ml-2">(Optional)</span>
            </label>
            <textarea
              name="experienceTicketContent"
              value={formData.experienceTicketContent || ''}
              onChange={onChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.experienceTicketContent ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe what's included in the experience ticket..."
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${validationErrors.experienceTicketContent ? 'text-red-600' : 'text-gray-500'}`}>
                {validationErrors.experienceTicketContent || 'Optional field, minimum 10 characters if provided, maximum 2000'}
              </span>
              <span className="text-xs text-gray-400">
                {(formData.experienceTicketContent || '').length}/2000
              </span>
            </div>
          </div>

          {/* Price Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={onChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {validationErrors.price && (
                <span className="text-xs text-red-600">{validationErrors.price}</span>
              )}
              {!validationErrors.price && (
                <span className="text-xs text-gray-500">Curation fee for third place</span>
              )}
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Ticket Price *
              </label>
              <input
                type="number"
                name="experienceTicketPrice"
                value={formData.experienceTicketPrice}
                onChange={onChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.experienceTicketPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {validationErrors.experienceTicketPrice && (
                <span className="text-xs text-red-600">{validationErrors.experienceTicketPrice}</span>
              )}
              {!validationErrors.experienceTicketPrice && (
                <span className="text-xs text-gray-500">Main event experience cost</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Percentage
              </label>
              <input
                type="number"
                name="discountedPrice"
                value={formData.discountedPrice || ''}
                onChange={onChange}
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.discountedPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {validationErrors.discountedPrice && (
                <span className="text-xs text-red-600">{validationErrors.discountedPrice}</span>
              )}
              {!validationErrors.discountedPrice && (
                <span className="text-xs text-gray-500">Discount percentage (0-100%)</span>
              )}
            </div>
          </div>          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name *
              </label>
              <input
                type="text"
                name="venueName"
                value={formData.venueName}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.venueName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Event venue name"
              />
              {validationErrors.venueName && (
                <span className="text-xs text-red-600">{validationErrors.venueName}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Full address"
              />
              {validationErrors.address && (
                <span className="text-xs text-red-600">{validationErrors.address}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude (Optional)
              </label>
              <input
                type="number"
                name="lat"
                value={formData.lat || ''}
                onChange={onChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Latitude coordinate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude (Optional)
              </label>
              <input
                type="number"
                name="lng"
                value={formData.lng || ''}
                onChange={onChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Longitude coordinate"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity *
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={onChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.capacity ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Maximum attendees"
            />
            {validationErrors.capacity && (
              <span className="text-xs text-red-600">{validationErrors.capacity}</span>
            )}
            {!validationErrors.capacity && (
              <span className="text-xs text-gray-500">Minimum 1 person</span>
            )}
          </div>          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.startTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.startTime && (
                <span className="text-xs text-red-600">{validationErrors.startTime}</span>
              )}
              {!validationErrors.startTime && (
                <span className="text-xs text-gray-500">Must be a future date and time</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.endTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.endTime && (
                <span className="text-xs text-red-600">{validationErrors.endTime}</span>
              )}
              {!validationErrors.endTime && (
                <span className="text-xs text-gray-500">Must be after start time</span>
              )}
            </div>
          </div>          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                Select the most appropriate category
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <span className="text-xs text-gray-500">
                Current event status
              </span>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub Category (Optional)
              </label>
              <input
                type="text"
                name="subCategory"
                value={formData.subCategory || ''}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sub category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host ID (Optional)
              </label>
              <input
                type="text"
                name="hostId"
                value={formData.hostId || ''}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Host identifier"
              />
            </div>
          </div>

          {/* RSVP Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RSVP Deadline (Optional)
            </label>
            <input
              type="date"
              name="rsvpDeadline"
              value={formData.rsvpDeadline || ''}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">
              Last date for booking this event
            </span>
          </div>

          {/* Safety Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Information (Optional)
            </label>
            <textarea
              name="safetyInfo"
              value={formData.safetyInfo || ''}
              onChange={onChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Safety guidelines and information"
            />
          </div>          {/* Cancellation Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Policy (Optional)
            </label>
            <textarea
              name="cancellationPolicy"
              value={formData.cancellationPolicy || ''}
              onChange={onChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event cancellation policy"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Images
            </label>
            
            {/* Upload New Images */}
            <div className="mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload up to 5 images. Maximum 5MB per image. Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>

            {/* Preview New Images */}
            {formData.images && formData.images.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">New Images:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.images.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveImage?.(index, false)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Existing Images (for edit mode) */}
            {formData.existingImageUrls && formData.existingImageUrls.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.existingImageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Current image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveImage?.(index, true)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Guidelines */}
            {(!formData.images || formData.images.length === 0) && (!formData.existingImageUrls || formData.existingImageUrls.length === 0) && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">No images selected</p>
                <p className="text-xs text-gray-400">Choose images to showcase your event</p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (title.includes('Create') ? 'Create Event' : 'Update Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 