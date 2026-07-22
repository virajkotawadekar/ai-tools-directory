// State Manager
const state = {
  tool: null,
  token: localStorage.getItem('token'),
  user: null,
  slug: window.location.pathname.split('/').pop(),
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
};

const API_BASE = 'https://ai-tools-directory-production-3e93.up.railway.app/api';

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  fetchToolDetails();
  setupEventListeners();
});

// Theme Manager
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

// User Session Status
async function checkAuth() {
  const sessionArea = document.getElementById('userSessionArea');
  const loginMessage = document.getElementById('reviewAuthMessage');
  const reviewForm = document.getElementById('submitReviewForm');

  if (!state.token) {
    sessionArea.innerHTML = `<a href="/login" class="nav-link" style="font-weight: 600;">Login</a>`;
    loginMessage.style.display = 'block';
    reviewForm.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
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
      
      // Update form displays
      loginMessage.style.display = 'none';
      reviewForm.style.display = 'block';
    } else {
      logoutQuietly();
    }
  } catch (error) {
    console.error('Session verify failed:', error);
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
  document.getElementById('reviewAuthMessage').style.display = 'block';
  document.getElementById('submitReviewForm').style.display = 'none';
}

// Fetch Tool Details
async function fetchToolDetails() {
  const loader = document.getElementById('loaderArea');
  const details = document.getElementById('detailLayoutArea');

  try {
    const res = await fetch(`${API_BASE}/tools/${state.slug}`);
    const data = await res.json();

    if (data.success) {
      state.tool = data.tool;
      
      // Update HTML Elements
      document.getElementById('detailName').textContent = state.tool.name;
      document.getElementById('detailCategory').textContent = state.tool.category;
      document.getElementById('detailDescription').textContent = state.tool.description;
      document.getElementById('detailPricing').textContent = state.tool.pricing;
      document.getElementById('detailRating').textContent = parseFloat(state.tool.rating).toFixed(1);
      document.getElementById('detailVisits').textContent = state.tool.monthly_visits;
      document.getElementById('detailLogo').innerHTML = state.tool.logo;
      
      const visitLink = document.getElementById('detailVisitLink');
      visitLink.href = state.tool.website_url;
      
      // Synchronize Title & Meta locally just in case client hydration loads
      document.title = `${state.tool.name} - AI Tool Features & Reviews`;

      // Update Bookmark button state
      syncBookmarkButton();

      // Render Reviews
      renderReviews(state.tool.reviews);

      loader.style.display = 'none';
      details.style.display = 'grid';
    } else {
      showError('Tool Not Found', 'The AI tool you are searching for does not exist in our directory.');
    }
  } catch (error) {
    console.error('Error fetching tool details:', error);
    showError('Error Connecting', 'Failed to retrieve tool details from the server.');
  }
}

function syncBookmarkButton() {
  const btn = document.getElementById('bookmarkDetailBtn');
  const svg = document.getElementById('bookmarkDetailSvg');
  const text = document.getElementById('bookmarkDetailText');
  
  const isFav = state.favorites.includes(state.tool.id);
  
  if (isFav) {
    btn.style.color = '#a855f7';
    svg.setAttribute('fill', 'currentColor');
    text.textContent = 'Bookmarked';
  } else {
    btn.style.color = 'var(--text-secondary)';
    svg.setAttribute('fill', 'none');
    text.textContent = 'Bookmark';
  }
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsContainer');
  const title = document.getElementById('reviewsCountTitle');
  
  container.innerHTML = '';
  title.textContent = `User Reviews (${reviews.length})`;

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 0; color: var(--text-muted);">
        No reviews posted yet. Be the first to write a review!
      </div>
    `;
    return;
  }

  reviews.forEach(rev => {
    const item = document.createElement('div');
    item.className = 'review-item';
    
    const formattedDate = new Date(rev.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    item.innerHTML = `
      <div class="review-meta">
        <span class="review-author">${rev.userName}</span>
        <span style="color: #f59e0b; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          ${rev.rating} / 5
        </span>
      </div>
      <p class="review-text">${rev.comment}</p>
      <span style="font-size:0.8rem; color:var(--text-muted); display:block; margin-top:0.5rem;">Reviewed on ${formattedDate}</span>
    `;
    container.appendChild(item);
  });
}

function showError(title, desc) {
  const loader = document.getElementById('loaderArea');
  loader.innerHTML = `
    <div style="padding: 2rem 0;">
      <h2 style="font-size:2rem; margin-bottom:1rem; color:var(--text-primary);">${title}</h2>
      <p style="color:var(--text-muted); margin-bottom:1.5rem;">${desc}</p>
      <a href="/" class="submit-btn" style="display: inline-block;">Back to Directory</a>
    </div>
  `;
}

// Event Bindings
function setupEventListeners() {
  // Bookmark Toggle
  document.getElementById('bookmarkDetailBtn').addEventListener('click', () => {
    if (!state.tool) return;
    
    let favs = [...state.favorites];
    const id = state.tool.id;
    
    if (favs.includes(id)) {
      favs = favs.filter(x => x !== id);
      showToast('Removed from bookmarks');
    } else {
      favs.push(id);
      showToast('Added to bookmarks!');
    }
    
    state.favorites = favs;
    localStorage.setItem('favorites', JSON.stringify(favs));
    syncBookmarkButton();
  });

  // Review Form Submit
  document.getElementById('submitReviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!state.token) {
      showToast('You must log in to submit reviews.', 'error');
      return;
    }

    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value.trim();

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          toolId: state.tool.id,
          rating,
          comment
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message);
        document.getElementById('reviewComment').value = '';
        
        // Reload details to update reviews list and average rating
        fetchToolDetails();
      } else {
        showToast(data.error || 'Failed to submit review', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error connecting to server.', 'error');
    }
  });
}

// Toast System
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
