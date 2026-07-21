const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. POST A REVIEW (Requires authentication)
router.post('/', verifyToken, async (req, res) => {
  const { toolId, rating, comment } = req.body;
  const userId = req.user.id; // From verifyToken middleware

  if (!toolId || !rating) {
    return res.status(400).json({ success: false, error: 'Tool ID and rating are required.' });
  }

  const numericRating = parseInt(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    // 1. Verify if tool exists
    const [tools] = await db.query('SELECT id FROM tools WHERE id = ?', [toolId]);
    if (tools.length === 0) {
      return res.status(404).json({ success: false, error: 'AI Tool not found.' });
    }

    // 2. Optional: check if user already reviewed this tool
    const [existing] = await db.query('SELECT id FROM reviews WHERE user_id = ? AND tool_id = ?', [userId, toolId]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'You have already reviewed this AI tool.' });
    }

    // 3. Insert review
    await db.query(
      'INSERT INTO reviews (user_id, tool_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, toolId, numericRating, comment || '']
    );

    // 4. Recalculate average rating of the tool
    const [ratingResult] = await db.query('SELECT AVG(rating) AS avg_rating FROM reviews WHERE tool_id = ?', [toolId]);
    const avgRating = parseFloat(ratingResult[0].avg_rating || numericRating).toFixed(1);

    // 5. Update rating in tools table
    await db.query('UPDATE tools SET rating = ? WHERE id = ?', [avgRating, toolId]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      avgRating: parseFloat(avgRating)
    });
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ success: false, error: 'Database transaction error.' });
  }
});

// 2. GET REVIEWS FOR A TOOL
router.get('/tool/:toolId', async (req, res) => {
  const toolId = req.params.toolId;
  try {
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS userName 
       FROM reviews r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.tool_id = ? 
       ORDER BY r.created_at DESC`,
      [toolId]
    );
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ success: false, error: 'Database query error.' });
  }
});

module.exports = router;
