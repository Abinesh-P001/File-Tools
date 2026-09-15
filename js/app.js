/**
 * Main Application Logic
 * Quick tool search, category filtering, mobile navigation, and smart dropzone routing.
 */

document.addEventListener('DOMContentLoaded', () => {
    initToolSearchAndFilter();
    initMobileNav();
    initHomeSmartDropzone();
});

/**
 * Filter tools by search query and category tags
 */
function initToolSearchAndFilter() {
    const searchInput = document.getElementById('toolSearchInput');
    const categoryPills = document.querySelectorAll('.category-pill');
    const toolCards = document.querySelectorAll('.tool-card');

    if (!toolCards.length) return;

    let activeCategory = 'all';
    let searchQuery = '';

    const filterTools = () => {
        let visibleCount = 0;
        toolCards.forEach(card => {
            const title = card.querySelector('.tool-title')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.tool-desc')?.textContent.toLowerCase() || '';
            const category = card.getAttribute('data-category') || '';
            const tags = card.getAttribute('data-tags') || '';

            const matchesCategory = activeCategory === 'all' || category === activeCategory;
            const matchesSearch = !searchQuery || 
                title.includes(searchQuery) || 
                desc.includes(searchQuery) || 
                tags.includes(searchQuery);

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        const noResults = document.getElementById('noResultsMsg');
        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterTools();
        });
    }

    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.getAttribute('data-category') || 'all';
            filterTools();
        });
    });
}

/**
 * Mobile hamburger navigation toggle with auto-close
 */
function initMobileNav() {
    const toggleBtn = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('mainNavMenu');

    if (toggleBtn && navMenu) {
        toggleBtn.addEventListener('click', () => {
            const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !expanded);
            navMenu.classList.toggle('is-open');
        });

        // Auto close when any link inside nav is clicked
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('is-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
            });
        });

        // Auto close when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains('is-open')) {
                navMenu.classList.remove('is-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

/**
 * Smart Quick-Dropzone on Home Page
 * Auto-detects dropped file type and routes user to the right tool instantly.
 */
function initHomeSmartDropzone() {
    const quickDrop = document.getElementById('homeQuickDrop');
    const quickInput = document.getElementById('homeQuickInput');
    const suggestionsModal = document.getElementById('toolSuggestionsModal');

    if (!quickDrop || !quickInput) return;

    quickDrop.addEventListener('click', () => quickInput.click());

    ['dragenter', 'dragover'].forEach(name => {
        quickDrop.addEventListener(name, (e) => {
            e.preventDefault();
            quickDrop.classList.add('is-dragover');
        });
    });

    ['dragleave', 'drop'].forEach(name => {
        quickDrop.addEventListener(name, (e) => {
            e.preventDefault();
            quickDrop.classList.remove('is-dragover');
        });
    });

    const handleFile = (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'jpg' || ext === 'jpeg') {
            window.location.href = 'tools/jpg-to-png.html';
        } else if (ext === 'png') {
            window.location.href = 'tools/png-to-jpg.html';
        } else if (ext === 'pdf') {
            window.location.href = 'tools/pdf-merge.html';
        } else if (ext === 'txt' || ext === 'md') {
            window.location.href = 'tools/txt-to-pdf.html';
        } else {
            // Default to image compressor for other formats
            window.location.href = 'tools/image-compressor.html';
        }
    };

    quickDrop.addEventListener('drop', (e) => {
        if (e.dataTransfer?.files?.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    quickInput.addEventListener('change', (e) => {
        if (e.target.files?.length) {
            handleFile(e.target.files[0]);
        }
    });
}
