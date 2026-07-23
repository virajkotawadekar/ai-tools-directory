// Admin Panel State Manager
const state = {
  token: localStorage.getItem('token'),
  user: null,
  tools: [],
  categories: [],
  activeTab: 'pending',
};

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  verifyAdminSession();
  setupEventListeners();
});

// Theme Selector
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
}

// Session Validation
async function verifyAdminSession() {
  const sessionArea = document.getElementById('adminSessionArea');

  if (!state.token) {
    redirectToLogin('Access denied. Please log in.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();

    if (data.success && data.user.role === 'admin') {
      state.user = data.user;
      sessionArea.innerHTML = `
        <span style="color: var(--text-secondary); font-size: 0.9rem;">Admin: <strong>${state.user.name}</strong></span>
        <button id="adminLogoutBtn" class="nav-link" style="background:none; border:none; cursor:pointer; font-weight:600; color:var(--danger);">Logout</button>
      `;
      document.getElementById('adminLogoutBtn').addEventListener('click', logout);
      
      // Load Dashboard Data
      loadDashboardData();
    } else {
      redirectToLogin('Access denied. Admin privileges required.');
    }
  } catch (error) {
    console.error('Admin session validation failed:', error);
    redirectToLogin('Database verify error, please try again.');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Logged out successfully.');
  setTimeout(() => window.location.href = '/', 1000);
}

function redirectToLogin(message) {
  showToast(message, 'error');
  setTimeout(() => window.location.href = '/login', 1500);
}

// Load Dashboard Data
async function loadDashboardData() {
  await fetchCategories();
  await fetchTools();
}

// 1. Fetch Categories
async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    
    if (data.success) {
      state.categories = data.categories;
      
      // Update categories count stat
      document.getElementById('statTotalCategories').textContent = data.categories.length;
      
      // Update Category Edit Select List Options
      const editCategorySelect = document.getElementById('editCategory');
      editCategorySelect.innerHTML = '';
      data.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        editCategorySelect.appendChild(option);
      });

      // Render Categories Table Panel
      renderCategoriesTable();
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    showToast('Failed to fetch categories.', 'error');
  }
}

// 2. Fetch Tools (Admin Mode fetches both approved and pending)
async function fetchTools() {
  try {
    const res = await fetch(`${API_BASE}/tools?limit=150&adminMode=true`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();

    if (data.success) {
      state.tools = data.tools;
      
      const pendingTools = data.tools.filter(t => t.status === 'pending');
      const approvedTools = data.tools.filter(t => t.status === 'approved');

      // Update count statistics cards
      document.getElementById('statTotalTools').textContent = data.tools.length;
      document.getElementById('statPendingQueue').textContent = pendingTools.length;
      document.getElementById('statApprovedLive').textContent = approvedTools.length;

      // Render tables
      renderPendingTable(pendingTools);
      renderApprovedTable(approvedTools);
    }
  } catch (error) {
    console.error('Error fetching admin tools:', error);
    showToast('Failed to fetch AI Tools catalog.', 'error');
  }
}


// 3. Render Pending Queue Table
function renderPendingTable(tools) {
  const tbody = document.getElementById('pendingQueueTable');
  tbody.innerHTML = '';

  if (tools.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No pending submissions.
        </td>
      </tr>
    `;
    return;
  }

  tools.forEach(tool => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--text-primary);">${tool.name}</td>
      <td><span class="tool-cat-pill">${tool.category_name}</span></td>
      <td>${tool.pricing}</td>
      <td><a href="${tool.website_url}" target="_blank" style="color: var(--primary); text-decoration: underline;">Link</a></td>
      <td>
        <div class="action-btn-group">
          <button class="btn-small btn-approve" data-id="${tool.id}">Approve</button>
          <button class="btn-small btn-edit" data-id="${tool.id}">Edit</button>
          <button class="btn-small btn-delete" data-id="${tool.id}">Delete</button>
        </div>
      </td>
    `;

    // Bind action listeners
    tr.querySelector('.btn-approve').addEventListener('click', () => approveTool(tool.id));
    tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(tool));
    tr.querySelector('.btn-delete').addEventListener('click', () => deleteTool(tool.id));

    tbody.appendChild(tr);
  });
}

// 4. Render Live Approved Table
function renderApprovedTable(tools) {
  const tbody = document.getElementById('approvedCatalogTable');
  tbody.innerHTML = '';

  if (tools.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No approved tools inside live directory.
        </td>
      </tr>
    `;
    return;
  }

  tools.forEach(tool => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--text-primary);">${tool.name}</td>
      <td><span class="tool-cat-pill">${tool.category_name}</span></td>
      <td>${tool.pricing}</td>
      <td>${tool.monthly_visits}</td>
      <td>${parseFloat(tool.rating).toFixed(1)} ★</td>
      <td>
        <div class="action-btn-group">
          <button class="btn-small btn-edit" data-id="${tool.id}">Edit Details</button>
          <button class="btn-small btn-delete" data-id="${tool.id}">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(tool));
    tr.querySelector('.btn-delete').addEventListener('click', () => deleteTool(tool.id));

    tbody.appendChild(tr);
  });
}

// 5. Render Categories Table
function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTable');
  tbody.innerHTML = '';

  state.categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cat.id}</td>
      <td style="font-weight: 700; color: var(--text-primary);">${cat.name}</td>
      <td><code>${cat.slug}</code></td>
      <td><strong>${cat.count}</strong></td>
      <td>
        <button class="btn-small btn-delete" data-id="${cat.id}">Delete</button>
      </td>
    `;
    
    tr.querySelector('.btn-delete').addEventListener('click', () => deleteCategory(cat.id));
    tbody.appendChild(tr);
  });
}

// 6. Action Operations API calls
async function approveTool(id) {
  try {
    const res = await fetch(`${API_BASE}/tools/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message);
      fetchTools();
    } else {
      showToast(data.error || 'Failed to approve tool', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Connection error.', 'error');
  }
}

async function deleteTool(id) {
  if (!confirm('Are you sure you want to delete this AI tool and all of its reviews?')) return;

  try {
    const res = await fetch(`${API_BASE}/tools/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message);
      fetchTools();
      fetchCategories(); // Tool deleted, category counts updated
    } else {
      showToast(data.error || 'Failed to delete tool', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Connection error.', 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('Are you sure you want to delete this category? Any associated tools will lose their references.')) return;

  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message);
      loadDashboardData(); // Reload both
    } else {
      showToast(data.error || 'Failed to delete category', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Connection error.', 'error');
  }
}

// Edit Modal Opening & Saving
function openEditModal(tool) {
  document.getElementById('editId').value = tool.id;
  document.getElementById('editName').value = tool.name;
  document.getElementById('editCategory').value = tool.category_id;
  document.getElementById('editUrl').value = tool.website_url;
  document.getElementById('editPricing').value = tool.pricing;
  document.getElementById('editVisits').value = tool.monthly_visits;
  document.getElementById('editTags').value = tool.tags;
  document.getElementById('editDescription').value = tool.description;
  document.getElementById('editLogo').value = tool.logo;

  document.getElementById('editModalTitle').textContent = tool.name;
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

// Event Bindings
function setupEventListeners() {
  const editModal = document.getElementById('editModal');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const overlay = document.getElementById('editModalOverlay');

  const close = () => editModal.classList.remove('active');
  closeEditModalBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // Edit Tool form submit
  document.getElementById('editToolForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    
    const body = {
      name: document.getElementById('editName').value.trim(),
      category_id: parseInt(document.getElementById('editCategory').value),
      website_url: document.getElementById('editUrl').value.trim(),
      pricing: document.getElementById('editPricing').value,
      monthly_visits: document.getElementById('editVisits').value.trim(),
      tags: document.getElementById('editTags').value.trim(),
      description: document.getElementById('editDescription').value.trim(),
      logo: document.getElementById('editLogo').value.trim()
    };

    try {
      const res = await fetch(`${API_BASE}/tools/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message);
        closeEditModal();
        fetchTools();
      } else {
        showToast(data.error || 'Failed to update tool details', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Connection error, please try again.', 'error');
    }
  });

  // Create Category form submit
  document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const icon = document.getElementById('catIcon').value.trim() || 'grid';
    const description = document.getElementById('catDesc').value.trim();

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ name, icon, description })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message);
        document.getElementById('addCategoryForm').reset();
        fetchCategories();
      } else {
        showToast(data.error || 'Failed to create category', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Connection error.', 'error');
    }
  });
}

// Switch tabs panels
window.switchTab = (tabName) => {
  state.activeTab = tabName;
  
  // Update button classes
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(tabName === 'pending' ? 'pending' : (tabName === 'approved' ? 'directory' : 'categories'))) {
      btn.classList.add('active');
    }
  });

  // Switch panels display
  document.getElementById('panelPending').style.display = tabName === 'pending' ? 'block' : 'none';
  document.getElementById('panelApproved').style.display = tabName === 'approved' ? 'block' : 'none';
  document.getElementById('panelCategories').style.display = tabName === 'categories' ? 'block' : 'none';
};

// Toast notification helper
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
