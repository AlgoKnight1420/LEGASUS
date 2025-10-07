const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// File paths
const PRODUCTS_FILE = path.join(dataDir, 'products.xlsx');
const USERS_FILE = path.join(dataDir, 'users.xlsx');
const ORDERS_FILE = path.join(dataDir, 'orders.xlsx');

// Initialize Excel files if they don't exist
async function initializeExcelFiles() {
  await initializeProductsFile();
  await initializeUsersFile();
  await initializeOrdersFile();
}

async function initializeProductsFile() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Image', key: 'image', width: 50 },
      { header: 'Sizes', key: 'sizes', width: 20 },
      { header: 'Care', key: 'care', width: 30 },
      { header: 'Fabric', key: 'fabric', width: 20 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Stock Status', key: 'stockStatus', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 }
    ];
    
    await workbook.xlsx.writeFile(PRODUCTS_FILE);
  }
}

async function initializeUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Password', key: 'password', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Address', key: 'address', width: 50 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];
    
    await workbook.xlsx.writeFile(USERS_FILE);
  }
}

async function initializeOrdersFile() {
  if (!fs.existsSync(ORDERS_FILE)) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'User ID', key: 'userId', width: 10 },
      { header: 'Products', key: 'products', width: 50 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment ID', key: 'paymentId', width: 30 },
      { header: 'Shipping Address', key: 'shippingAddress', width: 50 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 }
    ];
    
    await workbook.xlsx.writeFile(ORDERS_FILE);
  }
}

// Products CRUD operations
async function getAllProducts() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTS_FILE);
  const worksheet = workbook.getWorksheet('Products');
  
  const products = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      const product = {
        id: row.getCell('id').value,
        name: row.getCell('name').value,
        price: row.getCell('price').value,
        category: row.getCell('category').value,
        description: row.getCell('description').value,
        image: row.getCell('image').value,
        sizes: row.getCell('sizes').value ? row.getCell('sizes').value.split(',') : [],
        care: row.getCell('care').value,
        fabric: row.getCell('fabric').value,
        color: row.getCell('color').value,
        stockStatus: row.getCell('stockStatus').value || 'in_stock',
        createdAt: row.getCell('createdAt').value,
        updatedAt: row.getCell('updatedAt').value
      };
      products.push(product);
    }
  });
  
  return products;
}

async function getProductById(id) {
  const products = await getAllProducts();
  return products.find(product => product.id === id);
}

async function addProduct(product) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTS_FILE);
  const worksheet = workbook.getWorksheet('Products');
  
  // Add new row
  const row = worksheet.addRow({
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    description: product.description,
    image: product.image,
    sizes: product.sizes ? product.sizes.join(',') : '',
    care: product.care,
    fabric: product.fabric,
    color: product.color,
    stockStatus: product.stockStatus || 'in_stock',
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString()
  });
  
  await workbook.xlsx.writeFile(PRODUCTS_FILE);
  return product;
}

async function updateProduct(id, updatedProduct) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTS_FILE);
  const worksheet = workbook.getWorksheet('Products');
  
  let updated = false;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.getCell('id').value === id) {
      // Update row
      row.getCell('name').value = updatedProduct.name;
      row.getCell('price').value = updatedProduct.price;
      row.getCell('category').value = updatedProduct.category;
      row.getCell('description').value = updatedProduct.description;
      row.getCell('image').value = updatedProduct.image;
      row.getCell('sizes').value = updatedProduct.sizes ? updatedProduct.sizes.join(',') : '';
      row.getCell('care').value = updatedProduct.care;
      row.getCell('fabric').value = updatedProduct.fabric;
      row.getCell('color').value = updatedProduct.color;
      row.getCell('stockStatus').value = updatedProduct.stockStatus || 'in_stock';
      row.getCell('updatedAt').value = new Date().toISOString();
      updated = true;
    }
  });
  
  if (updated) {
    await workbook.xlsx.writeFile(PRODUCTS_FILE);
    return updatedProduct;
  }
  return null;
}

async function deleteProduct(id) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(PRODUCTS_FILE);
  const worksheet = workbook.getWorksheet('Products');
  
  let rowToDelete = null;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.getCell('id').value === id) {
      rowToDelete = rowNumber;
    }
  });
  
  if (rowToDelete) {
    worksheet.spliceRows(rowToDelete, 1);
    await workbook.xlsx.writeFile(PRODUCTS_FILE);
    return true;
  }
  return false;
}

// Users CRUD operations
async function getAllUsers() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(USERS_FILE);
  const worksheet = workbook.getWorksheet('Users');
  
  const users = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      const user = {
        id: row.getCell('id').value,
        email: row.getCell('email').value,
        password: row.getCell('password').value,
        name: row.getCell('name').value,
        address: row.getCell('address').value,
        phone: row.getCell('phone').value,
        role: row.getCell('role').value || 'user',
        createdAt: row.getCell('createdAt').value
      };
      users.push(user);
    }
  });
  
  return users;
}

async function getUserById(id) {
  const users = await getAllUsers();
  return users.find(user => user.id === id);
}

async function getUserByEmail(email) {
  const users = await getAllUsers();
  return users.find(user => user.email === email);
}

async function addUser(user) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(USERS_FILE);
  const worksheet = workbook.getWorksheet('Users');
  
  // Add new row
  const row = worksheet.addRow({
    id: user.id,
    email: user.email,
    password: user.password,
    name: user.name || '',
    address: user.address || '',
    phone: user.phone || '',
    role: user.role || 'user',
    createdAt: user.createdAt || new Date().toISOString()
  });
  
  await workbook.xlsx.writeFile(USERS_FILE);
  return user;
}

async function updateUser(id, updatedUser) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(USERS_FILE);
  const worksheet = workbook.getWorksheet('Users');
  
  let updated = false;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.getCell('id').value === id) {
      // Update row
      if (updatedUser.email) row.getCell('email').value = updatedUser.email;
      if (updatedUser.password) row.getCell('password').value = updatedUser.password;
      if (updatedUser.name) row.getCell('name').value = updatedUser.name;
      if (updatedUser.address) row.getCell('address').value = updatedUser.address;
      if (updatedUser.phone) row.getCell('phone').value = updatedUser.phone;
      if (updatedUser.role) row.getCell('role').value = updatedUser.role;
      updated = true;
    }
  });
  
  if (updated) {
    await workbook.xlsx.writeFile(USERS_FILE);
    return updatedUser;
  }
  return null;
}

// Orders CRUD operations
async function getAllOrders() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(ORDERS_FILE);
  const worksheet = workbook.getWorksheet('Orders');
  
  const orders = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      const order = {
        id: row.getCell('id').value,
        userId: row.getCell('userId').value,
        products: JSON.parse(row.getCell('products').value || '[]'),
        total: row.getCell('total').value,
        status: row.getCell('status').value,
        paymentId: row.getCell('paymentId').value,
        shippingAddress: row.getCell('shippingAddress').value,
        createdAt: row.getCell('createdAt').value,
        updatedAt: row.getCell('updatedAt').value
      };
      orders.push(order);
    }
  });
  
  return orders;
}

async function getOrderById(id) {
  const orders = await getAllOrders();
  return orders.find(order => order.id === id);
}

async function getOrdersByUserId(userId) {
  const orders = await getAllOrders();
  return orders.filter(order => order.userId === userId);
}

async function addOrder(order) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(ORDERS_FILE);
  const worksheet = workbook.getWorksheet('Orders');
  
  // Add new row
  const row = worksheet.addRow({
    id: order.id,
    userId: order.userId,
    products: JSON.stringify(order.products),
    total: order.total,
    status: order.status || 'pending',
    paymentId: order.paymentId || '',
    shippingAddress: order.shippingAddress || '',
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString()
  });
  
  await workbook.xlsx.writeFile(ORDERS_FILE);
  return order;
}

async function updateOrder(id, updatedOrder) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(ORDERS_FILE);
  const worksheet = workbook.getWorksheet('Orders');
  
  let updated = false;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.getCell('id').value === id) {
      // Update row
      if (updatedOrder.status) row.getCell('status').value = updatedOrder.status;
      if (updatedOrder.paymentId) row.getCell('paymentId').value = updatedOrder.paymentId;
      row.getCell('updatedAt').value = new Date().toISOString();
      updated = true;
    }
  });
  
  if (updated) {
    await workbook.xlsx.writeFile(ORDERS_FILE);
    return updatedOrder;
  }
  return null;
}

module.exports = {
  initializeExcelFiles,
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  getUserById,
  getUserByEmail,
  addUser,
  updateUser,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  addOrder,
  updateOrder
};