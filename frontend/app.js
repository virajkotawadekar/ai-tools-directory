// Global State Manager
const state = {
  user: null,
  token: null,
  activeCategory: 'all',
  searchQuery: '',
  pricingFilter: 'all',
  ratingFilter: '0',
  sortOrder: 'popular',
  currentPage: 1,
  limit: 12,
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
};

// Base API URL
const API_BASE = '/api';

// On Document Load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  fetchCategories();
  fetchTools();
  setupEventListeners();
  initFaqs();
});

// 1. Theme Manager
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  
  if (savedTheme === 'light') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }

  document.getElementById('themeToggle').addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  });
}

// 2. Authentication Status
async function checkAuth() {
  state.token = localStorage.getItem('token');
  const sessionArea = document.getElementById('userSessionArea');

  if (!state.token) {
    sessionArea.innerHTML = `<a href="/login" class="nav-link" style="font-weight: 600;">Login</a>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();
    
    if (data.success) {
      state.user = data.user;
      let adminLink = '';
      if (state.user.role === 'admin') {
        adminLink = `<a href="/admin" class="nav-link" style="color: #a855f7; font-weight: 600;">Admin Panel</a>`;
      }
      
      sessionArea.innerHTML = `
        ${adminLink}
        <span style="color: var(--text-secondary); font-size: 0.9rem;">Hello, <strong>${state.user.name.split(' ')[0]}</strong></span>
        <button id="logoutBtn" class="nav-link" style="background:none; border:none; cursor:pointer; font-weight:600; color:var(--danger);">Logout</button>
      `;
      
      document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
      logoutQuietly();
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
    logoutQuietly();
  }
}

function logout() {
  logoutQuietly();
  showToast('Logged out successfully.');
  setTimeout(() => window.location.reload(), 1000);
}

function logoutQuietly() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  state.token = null;
  state.user = null;
  document.getElementById('userSessionArea').innerHTML = `<a href="/login" class="nav-link" style="font-weight: 600;">Login</a>`;
}

// 3. Category Handling
async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    
    if (data.success) {
      const categoriesGrid = document.getElementById('categoriesGrid');
      const submitCategorySelect = document.getElementById('submitCategory');
      
      // Keep "All Tools" but update its count
      const totalCount = data.categories.reduce((acc, c) => acc + c.count, 0);
      document.getElementById('allToolsCount').textContent = `${totalCount}+ Tools`;
      document.getElementById('heroStatsTotal').textContent = `${totalCount}+`;
      document.getElementById('heroStatsCategories').textContent = data.categories.length;

      // Clear dynamic categories
      const dynamicCards = categoriesGrid.querySelectorAll('.category-card:not([data-category="all"])');
      dynamicCards.forEach(card => card.remove());

      // Render categories
      data.categories.forEach(cat => {
        // Build card
        const card = document.createElement('div');
        card.className = `category-card ${state.activeCategory === cat.slug ? 'active' : ''}`;
        card.setAttribute('data-category', cat.slug);
        
        let iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>`;
        
        // Match specific SVGs for category card styling
        if (cat.slug === 'writing') iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
        else if (cat.slug === 'coding') iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
        else if (cat.slug === 'image') iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
        else if (cat.slug === 'video') iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
        else if (cat.slug === 'design') iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>`;
        else if (cat.slug === 'marketing') iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path></svg>`;
        else if (cat.slug === 'productivity') iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;

        card.innerHTML = `
          <div class="category-icon">${iconSvg}</div>
          <h4>${cat.name}</h4>
          <p>${cat.count}+ Tools</p>
        `;
        
        card.addEventListener('click', () => {
          document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          state.activeCategory = cat.slug;
          state.currentPage = 1;
          fetchTools();
        });
        
        categoriesGrid.appendChild(card);

        // Add to submit select dropdown
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        submitCategorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error listing categories:', error);
  }
}

// 4. Tools Hub Handling
async function fetchTools() {
  const toolsGrid = document.getElementById('toolsGrid');
  toolsGrid.innerHTML = `<div style="text-align:center; padding:5rem; width:100%; grid-column:1/-1; font-size:1.2rem; color:var(--text-muted);">Loading AI tools from database...</div>`;

  const queryParams = new URLSearchParams({
    page: state.currentPage.toString(),
    limit: state.limit.toString(),
    category: state.activeCategory,
    search: state.searchQuery,
    pricing: state.pricingFilter,
    rating: state.ratingFilter,
    sort: state.sortOrder
  });

  try {
    const res = await fetch(`${API_BASE}/tools?${queryParams.toString()}`);
    const data = await res.json();

    if (data.success) {
      renderTools(data.tools);
      renderPagination(data.pagination);
      document.getElementById('resultsCount').textContent = `${data.pagination.total} Tools Found`;

      // Fill trending tools in sidebar using first 5 results
      if (state.activeCategory === 'all' && state.searchQuery === '') {
        renderTrending(data.tools.slice(0, 5));
      }
    }
  } catch (error) {
    console.error('Error fetching tools:', error);
    toolsGrid.innerHTML = `<div style="text-align:center; padding:5rem; width:100%; grid-column:1/-1; color:var(--danger);">Error connecting to database. Please verify connection credentials.</div>`;
  }
}

function renderTools(tools) {
  const toolsGrid = document.getElementById('toolsGrid');
  toolsGrid.innerHTML = '';

  if (tools.length === 0) {
    toolsGrid.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; padding:5rem; text-align:center; width:100%;">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="width: 60px; height: 60px; color: var(--text-muted); margin-bottom:1rem;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No AI Tools Found</h3>
        <p style="color:var(--text-muted);">Try refining your search keyword or switching categories.</p>
      </div>
    `;
    return;
  }

  tools.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    
    const isFav = state.favorites.includes(tool.id);

    card.innerHTML = `
      <div>
        <div class="tool-header">
          <div class="tool-identity">
            <div class="tool-logo-box">${tool.logo}</div>
            <div class="tool-name-cat">
              <h3><a href="/tools/${tool.slug}">${tool.name}</a></h3>
              <span class="tool-cat-pill">${tool.category_name}</span>
            </div>
          </div>
          
          <div style="display: flex; flexDirection: column; align-items: flex-end; gap: 0.5rem;">
            <div class="tool-rating">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px; height:14px; color:var(--warning);"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span style="font-size:0.9rem; font-weight:700;">${parseFloat(tool.rating).toFixed(1)}</span>
            </div>
            
            <button class="favorite-toggle-btn" data-id="${tool.id}" style="background: transparent; border: none; cursor: pointer; color: ${isFav ? '#a855f7' : 'var(--text-muted)'}; display: flex; align-items: center;" title="${isFav ? 'Remove Favorite' : 'Add Favorite'}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
        <p class="tool-desc">${tool.description}</p>
      </div>
      <div class="tool-footer">
        <div class="tool-stats">
          <div class="tool-stat-unit" title="Monthly Visitors">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:16px; height:16px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>${tool.monthly_visits}</span>
          </div>
          <span style="font-size: 0.85rem; color: #10b981; font-weight: bold;">${tool.pricing}</span>
        </div>
        <a href="/tools/${tool.slug}" class="visit-link-btn">View Details &rarr;</a>
      </div>
    `;

    // Attach bookmark listener
    card.querySelector('.favorite-toggle-btn').addEventListener('click', (e) => {
      e.preventDefault();
      toggleFavorite(tool.id, card.querySelector('.favorite-toggle-btn'));
    });

    toolsGrid.appendChild(card);
  });
}

function toggleFavorite(id, btn) {
  let favs = [...state.favorites];
  if (favs.includes(id)) {
    favs = favs.filter(x => x !== id);
    btn.style.color = 'var(--text-muted)';
    btn.querySelector('svg').setAttribute('fill', 'none');
    showToast('Removed from bookmarks');
  } else {
    favs.push(id);
    btn.style.color = '#a855f7';
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
    showToast('Added to bookmarks!');
  }
  state.favorites = favs;
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function renderPagination(meta) {
  const container = document.getElementById('paginationContainer');
  container.innerHTML = '';
  
  if (meta.pages <= 1) return;

  // Previous Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = meta.page === 1;
  prevBtn.addEventListener('click', () => {
    state.currentPage = meta.page - 1;
    fetchTools();
    scrollToDirectory();
  });
  container.appendChild(prevBtn);

  // Pages numbers
  for (let i = 1; i <= meta.pages; i++) {
    const pBtn = document.createElement('button');
    pBtn.className = `pagination-btn ${meta.page === i ? 'active' : ''}`;
    pBtn.textContent = i;
    pBtn.addEventListener('click', () => {
      state.currentPage = i;
      fetchTools();
      scrollToDirectory();
    });
    container.appendChild(pBtn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = meta.page === meta.pages;
  nextBtn.addEventListener('click', () => {
    state.currentPage = meta.page + 1;
    fetchTools();
    scrollToDirectory();
  });
  container.appendChild(nextBtn);
}

function renderTrending(tools) {
  const list = document.getElementById('trendingList');
  list.innerHTML = '';
  
  tools.forEach((tool, index) => {
    const item = document.createElement('div');
    item.className = 'trending-item';
    item.innerHTML = `
      <div class="trending-item-left">
        <span class="trending-rank">#${index + 1}</span>
        <a href="/tools/${tool.slug}" class="trending-tool-name">${tool.name}</a>
      </div>
      <div class="trending-indicator up">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:12px; height:12px;"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
        <span>Trending</span>
      </div>
    `;
    list.appendChild(item);
  });
}

function scrollToDirectory() {
  document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
}

// 5. Event Binding
function setupEventListeners() {
  // Hero Search Form
  document.getElementById('heroSearchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('heroSearchInput').value.trim();
    state.searchQuery = val;
    document.getElementById('directorySearchInput').value = val;
    state.currentPage = 1;
    fetchTools();
    scrollToDirectory();
  });

  // Directory Search Field
  document.getElementById('directorySearchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    state.currentPage = 1;
    // Debounce or immediate
    fetchTools();
  });

  // Filters change
  document.getElementById('filterPricing').addEventListener('change', (e) => {
    state.pricingFilter = e.target.value;
    state.currentPage = 1;
    fetchTools();
  });

  document.getElementById('filterRating').addEventListener('change', (e) => {
    state.ratingFilter = e.target.value;
    state.currentPage = 1;
    fetchTools();
  });

  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sortOrder = e.target.value;
    state.currentPage = 1;
    fetchTools();
  });

  // Modal actions
  const submitModal = document.getElementById('submitModal');
  const openModalBtn = document.getElementById('openSubmitModalBtn');
  const closeModalBtn = document.getElementById('closeSubmitModalBtn');
  const overlay = document.getElementById('submitModalOverlay');

  openModalBtn.addEventListener('click', () => {
    if (!state.token) {
      showToast('Please login to submit an AI tool.', 'error');
      setTimeout(() => window.location.href = '/login', 1500);
      return;
    }
    submitModal.classList.add('active');
  });

  const closeModal = () => submitModal.classList.remove('active');
  closeModalBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // Submit Form Action
  document.getElementById('submitToolForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const body = {
      name: document.getElementById('submitName').value.trim(),
      category_id: parseInt(document.getElementById('submitCategory').value),
      website_url: document.getElementById('submitUrl').value.trim(),
      pricing: document.getElementById('submitPricing').value,
      monthly_visits: document.getElementById('submitVisits').value.trim() || '0K',
      tags: document.getElementById('submitTags').value.trim(),
      description: document.getElementById('submitDescription').value.trim(),
      logo: document.getElementById('submitLogo').value.trim() || null
    };

    try {
      const res = await fetch(`${API_BASE}/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(data.message);
        document.getElementById('submitToolForm').reset();
        closeModal();
      } else {
        showToast(data.error || 'Failed to submit tool', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error, please try again.', 'error');
    }
  });

  // Newsletter form
  document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value;
    document.getElementById('newsletterEmail').value = '';
    showToast(`Subscribed! Weekly updates will be sent to: ${email}`);
  });
}

// 6. FAQ Accordions
function initFaqs() {
  const questions = document.querySelectorAll('.faq-question');
  questions.forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isActive = item.classList.contains('active');
      
      document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
      
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// Helper: Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper global function for category redirection via footers
window.setCategoryFilter = (slug) => {
  document.querySelectorAll('.category-card').forEach(c => {
    c.classList.remove('active');
    if (c.getAttribute('data-category') === slug) {
      c.classList.add('active');
    }
  });
  state.activeCategory = slug;
  state.currentPage = 1;
  fetchTools();
  scrollToDirectory();
};
