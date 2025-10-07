const excelService = require('../services/excelService');
const { v4: uuidv4 } = require('uuid');

// Initialize Excel files
excelService.initializeExcelFiles();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const users = await excelService.getAllUsers();
    const adminUser = users.find(user => user.role === 'admin');
    
    if (adminUser) {
      console.log('Admin user already exists:', adminUser.email);
      return;
    }
    
    // Create admin user
    const newAdmin = {
      id: uuidv4(),
      email: 'admin@legasus.com',
      password: 'admin123', // In a real app, hash the password
      name: 'Admin User',
      address: 'Legasus HQ',
      phone: '1234567890',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    await excelService.addUser(newAdmin);
    console.log('Admin user created successfully:', newAdmin.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run the function
createAdminUser();