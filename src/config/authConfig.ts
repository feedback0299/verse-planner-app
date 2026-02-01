export const authConfig = {
  admin: async (email: string, pass: string) => {
    if ((email === 'admin' || email === 'athumanesarindia.tech@gmail.com') && pass === 'ChurchAdmin') {
      return { 
        success: true, 
        session: { user: { email: email, name: 'Church Admin' } },
        message: "Welcome Admin"
      };
    }
    return { success: false, message: "Invalid credentials" };
  },
  
  magazine: async (email: string, pass: string) => {
    if (email.trim().toLowerCase() === 'editor' && pass.trim() === 'publish') {
      return { 
        success: true, 
        session: { user: { email: 'editor', name: 'Magazine Editor' } },
        message: "Welcome Editor"
      };
    }
    return { success: false, message: "Invalid credentials. Please check for spaces or capitalization." };
  },

  branch: async (email: string, pass: string) => {
     // Email field is unused for Branch admin logic in original code, but we keep signature consistent
     // The original code passed 'email' (from input) as name if successful.
     // Here we might just want to use the password.
     if (pass === 'branch2024') {
      return { 
        success: true, 
        session: { user: { name: email || 'Branch Admin' } }, 
        message: 'Welcome to Branch Registry' 
      };
    }
    return { success: false, message: 'Invalid Credentials' };
  },

  members: async (identity: string, pass: string) => {
    if (pass === 'members2024') {
      if (!identity.trim()) {
         return { success: false, message: "Please enter your name for the audit log." };
      }
      return { 
        success: true, 
        session: { user: { name: identity.trim() } }, 
        message: `Welcome, ${identity.trim()}`
      };
    }
    return { success: false, message: "Invalid administration credentials." };
  }
};
