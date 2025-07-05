'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import { X, Users, Calendar, DollarSign, Clock, User, Mail, Phone, MapPin, UserPlus } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
  gender?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  eventsBooked: any[];
  invitedFriends?: {
    phoneNumber: string;
    invitedAt: string;
    status: 'pending' | 'joined';
  }[];
  personalityTestCompleted: boolean;
  createdAt: string;
}

interface Booking {
  _id: string;
  userId: User | null;
  eventId: {
    _id: string;
    title: string;
    startTime: string;
    price: number;
  } | null;
  numberOfSeats: number;
  totalAmount: number;
  bookingStatus: 'pending_payment' | 'waitlist' | 'confirmed' | 'cancelled';
  createdAt: string;
}

// UserDetailModal component
function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  if (!user) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleEscapeKey}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
                </h3>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{user.phoneNumber}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <span className="text-sm text-gray-900">{user.gender || 'Not specified'}</span>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <span className="text-sm text-gray-900">
                  {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not specified'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Personality Test</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.personalityTestCompleted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.personalityTestCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          {user.address && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-900">
                  {user.address.street && <div>{user.address.street}</div>}
                  {user.address.city && <div>{user.address.city}</div>}
                  {user.address.state && <div>{user.address.state}</div>}
                  {user.address.country && <div>{user.address.country}</div>}
                  {user.address.pincode && <div>{user.address.pincode}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{user.eventsBooked?.length || 0}</div>
              <div className="text-sm text-blue-800">Events Booked</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{user.invitedFriends?.length || 0}</div>
              <div className="text-sm text-green-800">Friends Invited</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
              <div className="text-sm text-purple-800">Joined Date</div>
            </div>
          </div>

          {/* Invited Friends Details */}
          {user.invitedFriends && user.invitedFriends.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Invited Friends</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {user.invitedFriends.map((friend, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {friend.phoneNumber.slice(-2)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {friend.phoneNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            Invited {new Date(friend.invitedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          friend.status === 'joined' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {friend.status === 'joined' ? 'Joined' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [events, setEvents] = useState<{_id: string, title: string}[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filter !== 'all') filters.status = filter;
      if (eventFilter !== 'all') filters.eventId = eventFilter;
      
      const response = await adminService.getAllBookings(page, 20, Object.keys(filters).length > 0 ? filters : undefined);
      setBookings(response.bookings || []);
      setTotalPages(response.totalPages || 1);
      setTotalBookings(response.total || response.bookings?.length || 0);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Get all events with a high limit for the dropdown
      const response = await adminService.getAllEvents(1, 1000);
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [page, filter, eventFilter]);

  const handleStatusUpdate = async (bookingId: string, newStatus: 'waitlist' | 'confirmed' | 'cancelled') => {
    try {
      setUpdating(bookingId);
      await adminService.updateBookingStatus(bookingId, newStatus);
      
      // Update the booking in the local state
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, bookingStatus: newStatus }
          : booking
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'waitlist':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'waitlist':
        return 'Waitlisted';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          {totalBookings > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {totalBookings} booking{totalBookings !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
        <p className="text-gray-600">Manage event bookings and update statuses</p>
        
        {/* Active Filters Summary */}
        {(filter !== 'all' || eventFilter !== 'all') && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-blue-800">Active filters:</span>
              {filter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Status: {getStatusText(filter)}
                </span>
              )}
              {eventFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Event: {events.find(e => e._id === eventFilter)?.title || 'Unknown Event'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by status:</label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
          >
            <option value="all">All Statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="waitlist">Waitlisted</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by event:</label>
          <select
            value={eventFilter}
            onChange={(e) => {
              setEventFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px] max-w-[300px]"
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title.length > 30 ? `${event.title.substring(0, 30)}...` : event.title}
              </option>
            ))}
          </select>
        </div>

        {(filter !== 'all' || eventFilter !== 'all') && (
          <button
            onClick={() => {
              setFilter('all');
              setEventFilter('all');
              setPage(1);
            }}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings && bookings.length > 0 ? bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {booking.userId ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(booking.userId);
                                setShowUserModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {`${booking.userId.firstName}${booking.userId.lastName ? ` ${booking.userId.lastName}` : ''}`}
                            </button>
                            {booking.userId.invitedFriends && booking.userId.invitedFriends.length > 0 && (
                              <div className="flex items-center gap-1 relative group">
                                <UserPlus className="h-4 w-4 text-green-600" />
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                  {booking.userId.invitedFriends.length}
                                </span>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  <div className="font-medium mb-1">Invited Friends:</div>
                                  {booking.userId.invitedFriends.map((friend, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2">
                                      <span>{friend.phoneNumber}</span>
                                      <span className={`text-xs px-1 py-0.5 rounded ${
                                        friend.status === 'joined' ? 'bg-green-600 text-green-100' : 'bg-yellow-600 text-yellow-100'
                                      }`}>
                                        {friend.status}
                                      </span>
                                    </div>
                                  ))}
                                  
                                  {/* Tooltip arrow */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          'User Deleted'
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.userId?.email || 'Email unavailable'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.userId?.phoneNumber || 'Phone unavailable'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.eventId?.title || 'Event Deleted'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.eventId?.startTime ? (
                          <>
                            {new Date(booking.eventId.startTime).toLocaleDateString()} at{' '}
                            {new Date(booking.eventId.startTime).toLocaleTimeString()}
                          </>
                        ) : (
                          'Date unavailable'
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.numberOfSeats}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{booking.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.bookingStatus)}`}>
                      {getStatusText(booking.bookingStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {booking.bookingStatus === 'waitlist' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                          disabled={updating === booking._id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {updating === booking._id ? 'Updating...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                          disabled={updating === booking._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {booking.bookingStatus === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                        disabled={updating === booking._id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {updating === booking._id ? 'Updating...' : 'Cancel'}
                      </button>
                    )}
                    {booking.bookingStatus === 'cancelled' && (
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                        disabled={updating === booking._id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {updating === booking._id ? 'Updating...' : 'Reconfirm'}
                      </button>
                    )}
                    {booking.bookingStatus === 'pending_payment' && (
                      <span className="text-gray-400">Awaiting payment</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setShowUserModal(false);
          }}
        />
      )}
    </div>
  );
}
