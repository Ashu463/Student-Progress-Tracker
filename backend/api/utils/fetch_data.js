import axios from 'axios';
export const fetchCodeforcesUserData = async (handle) => {
  try {
    // Check if user exists and get basic info
    const userResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    const userData = await userResponse.data;
    
    if (userData.status !== 'OK') {
      throw new Error('User not found');
    }
    
    const user = userData.result[0];
    
    const ratingResponse = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
    const ratingData = await ratingResponse.data

    const userStatus = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
    const userStatusData = await userStatus.data;
    if (userStatusData.status !== 'OK') {
      throw new Error('Failed to fetch user status');
    }
    return {
      handle: user.handle,
      currentRating: user.rating || 0,
      maxRating: user.maxRating || 0,
      ratingHistory: ratingData.result || [],
      submissions: userStatusData.result || [],
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      exists: true
    };
    
  } catch (error) {
    return {
      handle,
      exists: false,
      error: error.message
    };
  }
};