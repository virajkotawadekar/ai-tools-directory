const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// 1. GET ALL TOOLS (with filters, sorting, and pagination)
router.get('/', async (req, res) => {
  const search = req.query.search || '';
  const category = req.query.category || 'all';
  const pricing = req.query.pricing || 'all';
  const minRating = parseFloat(req.query.rating) || 0;
  const sort = req.query.sort || 'popular';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  // Security: Check if adminMode is requested and token is valid admin
  let statusFilter = "t.status = 'approved'";
  if (req.query.adminMode === 'true') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        if (decoded.role === 'admin') {
          statusFilter = "1=1"; // Admin can view all
        }
      } catch (err) {
        // Fallback to approved
      }
    }
  }

  // Dynamic Query Building
  let whereClauses = [statusFilter];
  let queryParams = [];

  if (search.trim() !== '') {
    whereClauses.push('(t.name LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)');
    const likeVal = `%${search}%`;
    queryParams.push(likeVal, likeVal, likeVal);
  }

  if (category !== 'all') {
    whereClauses.push('c.slug = ?');
    queryParams.push(category);
  }

  if (pricing !== 'all') {
    whereClauses.push('t.pricing = ?');
    queryParams.push(pricing);
  }

  if (minRating > 0) {
    whereClauses.push('t.rating >= ?');
    queryParams.push(minRating);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Determine sorting SQL
  let orderSQL = 'ORDER BY CAST(REPLACE(t.monthly_visits, "M", "") AS DECIMAL(10,2)) DESC'; // default popular
  if (sort === 'rating') {
    orderSQL = 'ORDER BY t.rating DESC';
  } else if (sort === 'newest') {
    orderSQL = 'ORDER BY t.created_at DESC, t.id DESC';
  }

  try {
    // 1. Get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM tools t 
      LEFT JOIN categories c ON t.category_id = c.id 
      ${whereSQL}
    `;
    const [countResult] = await db.query(countQuery, queryParams);
    const total = countResult[0].total;

    // 2. Get paginated results
    const selectQuery = `
      SELECT t.*, c.name AS category_name, c.slug AS category_slug 
      FROM tools t 
      LEFT JOIN categories c ON t.category_id = c.id 
      ${whereSQL}
      ${orderSQL}
      LIMIT ? OFFSET ?
    `;
    
    // Express parameters must match array values; LIMIT/OFFSET need integers
    const [tools] = await db.query(selectQuery, [...queryParams, limit, offset]);

    res.json({
      success: true,
      tools,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ success: false, error: 'Database query error.' });
  }
});

// 2. GET SINGLE TOOL BY SLUG (including reviews)
router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;
  try {
    const query = `
      SELECT t.*, c.name AS category, c.slug AS category_slug 
      FROM tools t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.slug = ?
    `;
    const [tools] = await db.query(query, [slug]);
    
    if (tools.length === 0) {
      return res.status(404).json({ success: false, error: 'Tool not found.' });
    }

    const tool = tools[0];

    // Fetch reviews for this tool
    const reviewsQuery = `
      SELECT r.id, r.rating, r.comment, r.created_at, u.name AS userName 
      FROM reviews r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE r.tool_id = ? 
      ORDER BY r.created_at DESC
    `;
    const [reviews] = await db.query(reviewsQuery, [tool.id]);

    tool.reviews = reviews;

    res.json({ success: true, tool });
  } catch (error) {
    console.error('Error fetching single tool:', error);
    res.status(500).json({ success: false, error: 'Database query error.' });
  }
});

// 3. SUBMIT / ADD AI TOOL (authenticated user submits, defaults status='pending')
router.post('/', verifyToken, async (req, res) => {
  const { name, category_id, description, logo, website_url, pricing, tags, monthly_visits } = req.body;

  if (!name || !category_id || !description || !website_url || !pricing) {
    return res.status(400).json({ success: false, error: 'Name, category, description, website URL and pricing are required.' });
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const status = req.user.role === 'admin' ? 'approved' : 'pending'; // Auto-approve if admin
  const visits = monthly_visits || '0K';
  
  // Default generic logo SVG if none provided
  const logoSvg = logo || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>`;

  try {
    // Check slug uniqueness
    const [existing] = await db.query('SELECT id FROM tools WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'An AI tool with this name or slug already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO tools (name, slug, category_id, description, logo, website_url, pricing, rating, monthly_visits, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, slug, category_id, description, logoSvg, website_url, pricing, 0.0, visits, tags || '', status]
    );

    res.status(201).json({
      success: true,
      message: status === 'approved' ? 'AI Tool added successfully!' : 'AI Tool submitted successfully for approval.',
      toolId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting tool:', error);
    res.status(500).json({ success: false, error: 'Database insert error.' });
  }
});

// 4. UPDATE AI TOOL DETAILS (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const toolId = req.params.id;
  const { name, category_id, description, logo, website_url, pricing, monthly_visits, tags, status } = req.body;

  try {
    // Check if tool exists
    const [existing] = await db.query('SELECT * FROM tools WHERE id = ?', [toolId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'AI Tool not found.' });
    }

    const tool = existing[0];
    const updatedName = name || tool.name;
    const updatedSlug = name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : tool.slug;
    
    // Build SQL update sets
    let updateFields = [];
    let queryParams = [];

    if (name) { updateFields.push('name = ?', 'slug = ?'); queryParams.push(updatedName, updatedSlug); }
    if (category_id) { updateFields.push('category_id = ?'); queryParams.push(category_id); }
    if (description) { updateFields.push('description = ?'); queryParams.push(description); }
    if (logo) { updateFields.push('logo = ?'); queryParams.push(logo); }
    if (website_url) { updateFields.push('website_url = ?'); queryParams.push(website_url); }
    if (pricing) { updateFields.push('pricing = ?'); queryParams.push(pricing); }
    if (monthly_visits) { updateFields.push('monthly_visits = ?'); queryParams.push(monthly_visits); }
    if (tags !== undefined) { updateFields.push('tags = ?'); queryParams.push(tags); }
    if (status) { updateFields.push('status = ?'); queryParams.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update provided.' });
    }

    const updateQuery = `UPDATE tools SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.query(updateQuery, [...queryParams, toolId]);

    res.json({ success: true, message: 'AI Tool updated successfully!' });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ success: false, error: 'Database update error.' });
  }
});

// 5. DELETE AI TOOL (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const toolId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM tools WHERE id = ?', [toolId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'AI Tool not found.' });
    }
    res.json({ success: true, message: 'AI Tool and its reviews deleted successfully.' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ success: false, error: 'Database delete error.' });
  }
});

// 6. APPROVE PENDING SUBMISSION (Admin only)
router.patch('/:id/approve', verifyToken, isAdmin, async (req, res) => {
  const toolId = req.params.id;
  try {
    const [result] = await db.query('UPDATE tools SET status = ? WHERE id = ?', ['approved', toolId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'AI Tool not found.' });
    }
    res.json({ success: true, message: 'AI Tool approved and is now live!' });
  } catch (error) {
    console.error('Error approving tool:', error);
    res.status(500).json({ success: false, error: 'Database update error.' });
  }
});

module.exports = router;
