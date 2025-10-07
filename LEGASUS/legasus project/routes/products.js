const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const excelService = require('../services/excelService');

// Initialize Excel files
excelService.initializeExcelFiles();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const products = await excelService.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await excelService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin)
 */
router.post('/', async (req, res) => {
  try {
    const { name, price, category, description, image, sizes, care, fabric, color, stockStatus } = req.body;
    
    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    
    const newProduct = {
      id: uuidv4(),
      name,
      price: parseFloat(price),
      category: category || 'unisex',
      description: description || '',
      image: image || 'https://via.placeholder.com/300x400?text=Product+Image',
      sizes: sizes || [],
      care: care || '',
      fabric: fabric || '',
      color: color || '',
      stockStatus: stockStatus || 'in_stock',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const product = await excelService.addProduct(newProduct);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (Admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, price, category, description, image, sizes, care, fabric, color, stockStatus } = req.body;
    
    // Check if product exists
    const product = await excelService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const updatedProduct = {
      ...product,
      name: name || product.name,
      price: price ? parseFloat(price) : product.price,
      category: category || product.category,
      description: description !== undefined ? description : product.description,
      image: image || product.image,
      sizes: sizes || product.sizes,
      care: care !== undefined ? care : product.care,
      fabric: fabric !== undefined ? fabric : product.fabric,
      color: color !== undefined ? color : product.color,
      stockStatus: stockStatus || product.stockStatus,
      updatedAt: new Date().toISOString()
    };
    
    const result = await excelService.updateProduct(req.params.id, updatedProduct);
    if (!result) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await excelService.deleteProduct(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock status
 * @access  Private (Admin)
 */
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stockStatus } = req.body;
    
    if (!stockStatus || !['in_stock', 'out_of_stock'].includes(stockStatus)) {
      return res.status(400).json({ message: 'Valid stock status is required' });
    }
    
    // Check if product exists
    const product = await excelService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const updatedProduct = {
      ...product,
      stockStatus,
      updatedAt: new Date().toISOString()
    };
    
    const result = await excelService.updateProduct(req.params.id, updatedProduct);
    if (!result) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;