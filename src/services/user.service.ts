import { api } from '@/lib/api';

interface InviteFriendResponse {
  success: boolean;
  message: string;
  data: {
    invitedFriend: {
      phoneNumber: string;
      status: 'pending' | 'joined';
      invitedAt: string;
    };
    totalInvited: number;
  };
}

interface InvitedFriend {
  phoneNumber: string;
  invitedAt: string;
  status: 'pending' | 'joined';
}

interface GetInvitedFriendsResponse {
  success: boolean;
  data: {
    totalInvited: number;
    invitedFriends: InvitedFriend[];
  };
}

class UserService {
  /**
   * Invite a friend by phone number
   */
  async inviteFriend(phoneNumber: string): Promise<InviteFriendResponse> {
    try {
      console.log('Inviting friend:', phoneNumber);
      
      // Add +91 country code if not present
      const formattedPhoneNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;
      
      const response = await api.post('/users/invite-friend', {
        phoneNumber: formattedPhoneNumber
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to invite friend');
      }

      console.log('Friend invited successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error inviting friend:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMsg = error.response.data?.error || 'Invalid invite request';
        throw new Error(errorMsg);
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to invite friend');
    }
  }

  /**
   * Get list of invited friends
   */
  async getInvitedFriends(): Promise<GetInvitedFriendsResponse> {
    try {
      const response = await api.get('/user/invited-friends');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch invited friends');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching invited friends:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch invited friends');
    }
  }
}

export const userService = new UserService();
export type { InviteFriendResponse, InvitedFriend, GetInvitedFriendsResponse };
