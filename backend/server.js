const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/reviews', require('./routes/reviews'));

// SEO ROUTING: Intercept /tools/:slug for dynamic meta tags injection
app.get('/tools/:slug', async (req, res) => {
  const slug = req.params.slug;
  const toolHtmlPath = path.join(__dirname, '../frontend/tool.html');
  
  try {
    // 1. Fetch tool details from MySQL database
    const [tools] = await db.query(
      `SELECT t.name, t.description 
       FROM tools t 
       WHERE t.slug = ? AND t.status = 'approved'`, 
      [slug]
    );

    // If tool is not found, serve the default tool details page
    if (tools.length === 0) {
      if (fs.existsSync(toolHtmlPath)) {
        return res.sendFile(toolHtmlPath);
      } else {
        return res.status(404).send('Details page not found');
      }
    }

    const tool = tools[0];

    // 2. Read the frontend/tool.html file
    if (fs.existsSync(toolHtmlPath)) {
      let html = fs.readFileSync(toolHtmlPath, 'utf8');

      // 3. Inject dynamic values into the SEO elements
      const seoTitle = `${tool.name} - AI Tool Features, Rating & Reviews`;
      const seoDescription = tool.description.length > 160 
        ? tool.description.substring(0, 157) + '...' 
        : tool.description;

      // Replace template markers or default title/description tag
      html = html.replace(/<title>.*?<\/title>/, `<title>${seoTitle}</title>`);
      
      // Replace meta description (or insert if not exists)
      const descTagPattern = /<meta\s+name="description"\s+content=".*?"\s*\/?>/i;
      if (descTagPattern.test(html)) {
        html = html.replace(descTagPattern, `<meta name="description" content="${seoDescription}" />`);
      } else {
        html = html.replace('</head>', `<meta name="description" content="${seoDescription}" />\n</head>`);
      }

      // Send the dynamically built HTML string
      res.send(html);
    } else {
      res.status(404).send('Details page template missing');
    }
  } catch (error) {
    console.error('SEO route injection error:', error);
    // On database error, fallback to normal file delivery
    if (fs.existsSync(toolHtmlPath)) {
      res.sendFile(toolHtmlPath);
    } else {
      res.status(500).send('Server Error');
    }
  }
});

// Serve frontend assets statically
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve admin panel statically at /admin
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Direct routes for login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Fallback: send index.html for undefined frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express Server running on http://localhost:${PORT}`);
});
