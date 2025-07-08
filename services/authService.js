import userService from './usersService';

const authService = {
  async login(username, password) {
    try {
      const userRes = await userService.getUsers();
      if (userRes.error) {
        return { error: userRes.error };
      }
      
      // First check if user exists with correct credentials
      const user = userRes.data.find(
        u => u.username === username && u.password === password
      );
      
      if (!user) {
        return { error: 'Invalid username or password' };
      }
      
      // Check if user status is active
      if (user.status !== 'Active') {
        return { error: 'Account is inactive. Please contact administrator.' };
      }
      
      // If user exists and is active, return success
      return { user };
      
    } catch (error) {
      return { error: error.message };
    }
  }
};

export default authService;