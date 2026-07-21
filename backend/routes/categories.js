const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// 1. GET ALL CATEGORIES (with dynamic tool counts)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT c.*, COUNT(t.id) AS count 
      FROM categories c 
      LEFT JOIN tools t ON c.id = t.category_id AND t.status = 'approved'
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const [categories] = await db.query(query);
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Database query error.' });
  }
});

// 2. CREATE A CATEGORY (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, icon, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  try {
    // Check if category already exists
    const [existing] = await db.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Category already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)',
      [name, slug, icon || 'grid', description || '']
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: 'Database insert error.' });
  }
});

// 3. DELETE A CATEGORY (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const categoryId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: 'Database delete error.' });
  }
});

module.exports = router;
