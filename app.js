/**
 * Link Dashboard App Logic
 * Uses localStorage to persist data
 */

// Data Structure: Array of Category objects
// Category: { id: string, name: string, links: Array of Link objects }
// Link: { id: string, name: string, url: string }

const STORAGE_KEY = 'linkDashboardData';

// --- State Management ---

let dashboardData = [];

// Drag & Drop State
let draggedCategoryIndex = null;
let draggedLinkData = null; // { catIndex, linkIndex }

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            dashboardData = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse dashboard data', e);
            dashboardData = [];
        }
    } else {
        // Default initial state
        dashboardData = [
            {
                id: 'cat-' + Date.now(),
                name: 'Getting Started',
                links: []
            }
        ];
        saveData();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboardData));
}

// --- DOM Elements ---
const dashboardEl = document.getElementById('dashboard');
const themeSelect = document.getElementById('themeSelect');

// Modals
const categoryModal = document.getElementById('categoryModal');
const linkModal = document.getElementById('linkModal');

// Buttons
const addCatBtn = document.getElementById('addCatBtn');
const addLinkBtn = document.getElementById('addLinkBtn');

// Forms
const categoryForm = document.getElementById('categoryForm');
const linkForm = document.getElementById('linkForm');

// --- Initialization ---

function init() {
    loadData();
    initTheme();
    setupEventListeners();
    renderDashboard();
}

// --- Theme Management ---

function applyTheme(theme) {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('themePreference') || 'system';
    if (themeSelect) {
        themeSelect.value = savedTheme;

        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            if (newTheme === 'system') {
                localStorage.removeItem('themePreference');
            } else {
                localStorage.setItem('themePreference', newTheme);
            }
            applyTheme(newTheme);
        });
    }

    // Listen to system OS changes natively
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (themeSelect && themeSelect.value === 'system') {
            applyTheme('system');
        }
    });
}

// --- Event Listeners ---

function setupEventListeners() {
    // Open action modals
    addCatBtn.addEventListener('click', () => openCategoryModal());
    addLinkBtn.addEventListener('click', () => {
        if (dashboardData.length === 0) {
            alert('Please create a category first.');
            return;
        }
        openLinkModal();
    });

    // Close Modals
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.getAttribute('data-modal');
            closeModal(document.getElementById(modalId));
        });
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Form Submissions
    categoryForm.addEventListener('submit', handleCategorySubmit);
    linkForm.addEventListener('submit', handleLinkSubmit);
}

// --- Modal Handling ---

function openModal(modal) {
    modal.classList.add('active');
    // Focus first input
    const firstInput = modal.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function openCategoryModal(categoryId = null) {
    const titleEl = document.getElementById('categoryModalTitle');
    const idInput = document.getElementById('categoryId');
    const nameInput = document.getElementById('categoryName');

    if (categoryId) {
        // Edit mode
        const category = dashboardData.find(c => c.id === categoryId);
        if (!category) return;

        titleEl.textContent = 'Edit Category';
        idInput.value = category.id;
        nameInput.value = category.name;
    } else {
        // Create mode
        titleEl.textContent = 'Add Category';
        idInput.value = '';
        nameInput.value = '';
    }

    openModal(categoryModal);
}

function openLinkModal(linkId = null, categoryId = null) {
    const titleEl = document.getElementById('linkModalTitle');
    const idInput = document.getElementById('linkId');
    const catSelect = document.getElementById('linkCategory');
    const nameInput = document.getElementById('linkName');
    const urlInput = document.getElementById('linkUrl');
    const origCatInput = document.getElementById('linkOriginalCatId');

    // Populate category select
    catSelect.innerHTML = '';
    dashboardData.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        catSelect.appendChild(option);
    });

    if (linkId && categoryId) {
        // Edit mode
        const category = dashboardData.find(c => c.id === categoryId);
        const link = category?.links.find(l => l.id === linkId);

        if (!link) return;

        titleEl.textContent = 'Edit Link';
        idInput.value = link.id;
        nameInput.value = link.name;
        urlInput.value = link.url;
        catSelect.value = categoryId;
        origCatInput.value = categoryId;
    } else {
        // Create mode
        titleEl.textContent = 'Add Link';
        idInput.value = '';
        nameInput.value = '';
        urlInput.value = '';
        if (categoryId) catSelect.value = categoryId;
        origCatInput.value = '';
    }

    openModal(linkModal);
}

// --- Form Handlers ---

function handleCategorySubmit(e) {
    e.preventDefault();

    const idInput = document.getElementById('categoryId').value;
    const nameInput = document.getElementById('categoryName').value.trim();

    if (!nameInput) return;

    if (idInput) {
        // Update
        const category = dashboardData.find(c => c.id === idInput);
        if (category) category.name = nameInput;
    } else {
        // Create
        dashboardData.push({
            id: 'cat-' + Date.now(),
            name: nameInput,
            links: []
        });
    }

    saveData();
    renderDashboard();
    closeModal(categoryModal);
}

function handleLinkSubmit(e) {
    e.preventDefault();

    const idInput = document.getElementById('linkId').value;
    const targetCatId = document.getElementById('linkCategory').value;
    const nameInput = document.getElementById('linkName').value.trim();
    let urlInput = document.getElementById('linkUrl').value.trim();
    const origCatId = document.getElementById('linkOriginalCatId').value;

    if (!nameInput || !urlInput || !targetCatId) return;

    // Ensure URL has protocol
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
        urlInput = 'https://' + urlInput;
    }

    const targetCategory = dashboardData.find(c => c.id === targetCatId);
    if (!targetCategory) return;

    if (idInput) {
        // Update
        if (origCatId === targetCatId) {
            // Same category, just update link
            const link = targetCategory.links.find(l => l.id === idInput);
            if (link) {
                link.name = nameInput;
                link.url = urlInput;
            }
        } else {
            // Moved to new category
            const origCategory = dashboardData.find(c => c.id === origCatId);
            if (origCategory) {
                const linkIndex = origCategory.links.findIndex(l => l.id === idInput);
                if (linkIndex > -1) {
                    const [link] = origCategory.links.splice(linkIndex, 1);
                    link.name = nameInput;
                    link.url = urlInput;
                    targetCategory.links.push(link);
                }
            }
        }
    } else {
        // Create
        targetCategory.links.push({
            id: 'link-' + Date.now(),
            name: nameInput,
            url: urlInput
        });
    }

    saveData();
    renderDashboard();
    closeModal(linkModal);
}

// --- API functions for UI interaction ---

function deleteCategory(categoryId) {
    dashboardData = dashboardData.filter(c => c.id !== categoryId);
    saveData();
    renderDashboard();
}

function deleteLink(categoryId, linkId) {
    const category = dashboardData.find(c => c.id === categoryId);
    if (category) {
        category.links = category.links.filter(l => l.id !== linkId);
        saveData();
        renderDashboard();
    }
}

// Helper to get a generic favicon for links
function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        // Using Google's favicon service for reliable static favicons
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return '';
    }
}

// --- Rendering ---

function renderDashboard() {
    dashboardEl.innerHTML = '';

    if (dashboardData.length === 0) {
        dashboardEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>Welcome to your Dashboard!</p>
                <button class="btn btn-primary" onclick="openCategoryModal()">
                    <i class="fas fa-plus"></i> Create Your First Category
                </button>
            </div>
        `;
        return;
    }

    dashboardData.forEach((category, index) => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.animationDelay = `${index * 0.05}s`;

        // Card Header
        const header = document.createElement('div');
        header.className = 'category-header';

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle category-drag';
        dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
        dragHandle.title = 'Drag to reorder category';
        dragHandle.onmousedown = () => card.setAttribute('draggable', 'true');
        dragHandle.onmouseup = () => card.removeAttribute('draggable');

        // Category Drag Events
        card.addEventListener('dragstart', (e) => {
            if (draggedLinkData) {
                e.preventDefault();
                return;
            }
            draggedCategoryIndex = index;
            setTimeout(() => card.classList.add('dragging'), 0);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            draggedCategoryIndex = null;
            card.classList.remove('dragging');
            card.removeAttribute('draggable');
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedCategoryIndex !== null && draggedCategoryIndex !== index) {
                card.classList.add('drag-over');
            }
            // Allow link drops onto empty category card
            if (draggedLinkData !== null && category.links.length === 0) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');

            if (draggedCategoryIndex !== null && draggedCategoryIndex !== index) {
                // Reorder category
                const draggedCat = dashboardData.splice(draggedCategoryIndex, 1)[0];
                dashboardData.splice(index, 0, draggedCat);
                saveData();
                renderDashboard();
            } else if (draggedLinkData !== null && category.links.length === 0) {
                // Drop link into empty category
                const sourceCat = dashboardData[draggedLinkData.catIndex];
                const draggedLinkObj = sourceCat.links.splice(draggedLinkData.linkIndex, 1)[0];
                dashboardData[index].links.push(draggedLinkObj);
                saveData();
                renderDashboard();
            }
        });

        const title = document.createElement('h2');
        title.textContent = category.name;

        const actions = document.createElement('div');
        actions.className = 'category-actions';

        // Add Link Button
        const addLnkBtn = document.createElement('button');
        addLnkBtn.className = 'icon-btn';
        addLnkBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addLnkBtn.title = 'Add Link';
        addLnkBtn.onclick = () => openLinkModal(null, category.id);

        // Edit Category Button
        const editCatBtn = document.createElement('button');
        editCatBtn.className = 'icon-btn';
        editCatBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editCatBtn.title = 'Edit Category';
        editCatBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openCategoryModal(category.id);
        };

        // Delete Category Button
        const delCatBtn = document.createElement('button');
        delCatBtn.className = 'icon-btn delete';
        delCatBtn.innerHTML = '<i class="fas fa-trash"></i>';
        delCatBtn.title = 'Delete Category';
        delCatBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteCategory(category.id);
        };

        actions.appendChild(addLnkBtn);
        actions.appendChild(editCatBtn);
        actions.appendChild(delCatBtn);

        header.appendChild(dragHandle);
        header.appendChild(title);
        header.appendChild(actions);
        card.appendChild(header);

        // Links List
        const list = document.createElement('ul');
        list.className = 'links-list';

        // Add list drop handler for dropping links to the end of a category
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        list.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedLinkData !== null && e.target === list) {
                const sourceCat = dashboardData[draggedLinkData.catIndex];
                const draggedLinkObj = sourceCat.links.splice(draggedLinkData.linkIndex, 1)[0];
                dashboardData[index].links.push(draggedLinkObj);
                saveData();
                renderDashboard();
            }
        });

        if (category.links.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'link-item';
            empty.style.justifyContent = 'center';
            empty.style.color = 'var(--text-secondary)';
            empty.style.fontStyle = 'italic';
            empty.style.fontSize = '0.875rem';
            empty.textContent = 'No links yet';
            list.appendChild(empty);
        } else {
            category.links.forEach((link, linkIndex) => {
                const li = document.createElement('li');
                li.className = 'link-item';

                const linkDrag = document.createElement('div');
                linkDrag.className = 'drag-handle link-drag';
                linkDrag.innerHTML = '<i class="fas fa-grip-lines"></i>';
                linkDrag.title = 'Drag to reorder link';
                linkDrag.onmousedown = () => li.setAttribute('draggable', 'true');
                linkDrag.onmouseup = () => li.removeAttribute('draggable');

                li.addEventListener('dragstart', (e) => {
                    e.stopPropagation();
                    draggedLinkData = { catIndex: index, linkIndex: linkIndex };
                    setTimeout(() => li.classList.add('dragging'), 0);
                    e.dataTransfer.effectAllowed = 'move';
                });

                li.addEventListener('dragend', () => {
                    draggedLinkData = null;
                    li.classList.remove('dragging');
                    li.removeAttribute('draggable');
                });

                li.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedLinkData !== null && (draggedLinkData.catIndex !== index || draggedLinkData.linkIndex !== linkIndex)) {
                        li.classList.add('drag-over');
                    }
                });

                li.addEventListener('dragleave', () => li.classList.remove('drag-over'));

                li.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    li.classList.remove('drag-over');
                    if (draggedLinkData !== null) {
                        const sourceCat = dashboardData[draggedLinkData.catIndex];
                        const targetCat = dashboardData[index];
                        const draggedLinkObj = sourceCat.links.splice(draggedLinkData.linkIndex, 1)[0];

                        targetCat.links.splice(linkIndex, 0, draggedLinkObj);
                        saveData();
                        renderDashboard();
                    }
                });

                const a = document.createElement('a');
                a.className = 'link-anchor';
                a.href = link.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';

                // Add Favicon
                const img = document.createElement('img');
                img.className = 'favicon';
                img.src = getFaviconUrl(link.url);
                // Fallback to a globe icon if image fails
                img.onerror = function () {
                    this.style.display = 'none';
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-globe';
                    icon.style.color = 'var(--text-secondary)';
                    icon.style.marginRight = '0.5rem';
                    a.insertBefore(icon, a.firstChild);
                };

                const span = document.createElement('span');
                span.textContent = link.name;

                a.appendChild(img);
                a.appendChild(span);

                const linkActions = document.createElement('div');
                linkActions.className = 'link-actions';

                // Edit Link
                const editLnkBtn = document.createElement('button');
                editLnkBtn.className = 'icon-btn';
                editLnkBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editLnkBtn.title = 'Edit Link';
                // Prevent default so clicking edit doesn't trigger the link navigation
                editLnkBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openLinkModal(link.id, category.id);
                };

                // Delete Link
                const delLnkBtn = document.createElement('button');
                delLnkBtn.className = 'icon-btn delete';
                delLnkBtn.innerHTML = '<i class="fas fa-trash"></i>';
                delLnkBtn.title = 'Delete Link';
                delLnkBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteLink(category.id, link.id);
                };

                linkActions.appendChild(editLnkBtn);
                linkActions.appendChild(delLnkBtn);

                li.appendChild(linkDrag);
                li.appendChild(a);
                li.appendChild(linkActions);
                list.appendChild(li);
            });
        }

        card.appendChild(list);
        dashboardEl.appendChild(card);
    });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
