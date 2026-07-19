/**
 * zamolxis.uk — Homelab Dashboard
 * Copyright (C) 2026 Adrian Birnaz <ad.birnaz@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

(function () {
  'use strict';

  // ===========================
  // Configuration
  // ===========================

  /**
   * CDN for self-hosted service icons.
   * Source: https://github.com/walkxcode/dashboard-icons
   */
  var ICON_CDN = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/';

  /**
   * Category definitions.
   * key  — internal id
   * name — display label
   * color — CSS variable name from style.css
   */
  var CATEGORIES = {
    media:  { name: 'Media & Photos', color: 'var(--cat-media)' },
    prod:   { name: 'Productivity',   color: 'var(--cat-prod)' },
    infra:  { name: 'Infrastructure', color: 'var(--cat-infra)' },
    ai:     { name: 'AI & Creative',  color: 'var(--cat-ai)' }
  };

  /**
   * Service list.
   *   name     — display name
   *   slug     — used to build the URL
   *   icon     — filename on the CDN (without .png); omit if selfIcon is true
   *   selfIcon — true if the service serves its own /favicon.svg instead of
   *              using the icon CDN (tried on both local and tailscale hosts)
   *   category — key in CATEGORIES
   */
  var SERVICES = [
    { name: 'Immich',           slug: 'immich',        icon: 'immich',      category: 'media' },
    { name: 'Emby',             slug: 'emby',          icon: 'emby',        category: 'media' },
    { name: 'Filmography',      slug: 'filmography',   selfIcon: true,      category: 'media' },
    { name: 'AFFiNE',           slug: 'affine',        icon: 'affine',      category: 'prod' },
    { name: 'Vikunja',          slug: 'vikunja',        icon: 'vikunja',     category: 'prod' },
    { name: 'Portainer',        slug: 'portainer',     icon: 'portainer',   category: 'infra' },
    { name: 'Portainer (MSI)',  slug: 'portainer-msi', icon: 'portainer',   category: 'infra' },
    { name: 'FileBrowser',      slug: 'filebrowser',   icon: 'filebrowser', category: 'infra' },
    { name: 'Uptime Kuma',      slug: 'uptime',        icon: 'uptime-kuma', category: 'infra' },
    { name: 'ComfyUI',          slug: 'comfyui',       icon: 'comfyui',     category: 'ai' },
    { name: 'KoboldCPP',        slug: 'koboldcpp',     icon: 'koboldcpp',   category: 'ai' }
  ];


  // ===========================
  // State
  // ===========================

  var currentMode = 'local';


  // ===========================
  // Helpers
  // ===========================

  /**
   * Build URL for a service based on current network mode.
   */
  function buildUrl(slug, mode) {
    if (mode === 'local') {
      return 'http://' + slug + '.local';
    }
    return 'https://' + slug + '.zamolxis.uk';
  }

  /**
   * Strip protocol prefix for display.
   */
  function stripProtocol(url) {
    return url.replace(/^https?:\/\//, '');
  }

  /**
   * Build both candidate favicon URLs for a self-hosted service's own
   * favicon.svg, ordered so the one matching the current network mode
   * is tried first (the other is only reachable from a different network).
   */
  function buildSelfIconUrls(slug) {
    var primary = buildUrl(slug, currentMode);
    var secondaryMode = currentMode === 'local' ? 'tailscale' : 'local';
    var secondary = buildUrl(slug, secondaryMode);
    return [primary + '/favicon.svg', secondary + '/favicon.svg'];
  }

  /**
   * Get 1-2 letter initials for the fallback icon.
   */
  function getInitials(name) {
    var words = name.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  /**
   * Simple hash → hue for deterministic fallback colors.
   */
  function hashHue(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  }


  // ===========================
  // DOM References
  // ===========================

  var container   = document.getElementById('services-container');
  var searchInput = document.getElementById('search-input');
  var btnLocal    = document.getElementById('btn-local');
  var btnTailscale = document.getElementById('btn-tailscale');


  // ===========================
  // Rendering
  // ===========================

  /**
   * Build the full dashboard HTML and inject it.
   */
  function render() {
    container.innerHTML = '';

    // Group services by category
    var groups = {};
    Object.keys(CATEGORIES).forEach(function (key) {
      groups[key] = [];
    });
    SERVICES.forEach(function (svc) {
      if (groups[svc.category]) {
        groups[svc.category].push(svc);
      }
    });

    // Render each category
    Object.keys(CATEGORIES).forEach(function (catKey) {
      var cat = CATEGORIES[catKey];
      var items = groups[catKey];
      if (!items || items.length === 0) return;

      var section = document.createElement('section');
      section.className = 'category';
      section.setAttribute('data-category', catKey);

      // Category header
      var header = document.createElement('div');
      header.className = 'category__header';
      header.innerHTML =
        '<span class="category__dot" style="background:' + cat.color + '"></span>' +
        '<span class="category__name">' + cat.name + '</span>';
      section.appendChild(header);

      // Cards grid
      var grid = document.createElement('div');
      grid.className = 'cards-grid';

      items.forEach(function (svc) {
        var url = buildUrl(svc.slug, currentMode);
        var card = document.createElement('a');
        card.className = 'card';
        card.href = url;
        card.setAttribute('data-name', svc.name.toLowerCase());
        card.setAttribute('data-category', catKey);

        // Logo
        var hue = hashHue(svc.name);
        var fallbackBg = 'hsl(' + hue + ', 40%, 28%)';

        card.innerHTML =
          '<div class="card__logo-fallback" style="display:none;background:' + fallbackBg + '">' +
            getInitials(svc.name) +
          '</div>' +
          '<div class="card__info">' +
            '<div class="card__name">' + svc.name + '</div>' +
            '<div class="card__url">' + stripProtocol(url) + '</div>' +
          '</div>';

        var logo = document.createElement('img');
        logo.className = 'card__logo';
        logo.alt = '';
        logo.loading = 'lazy';

        if (svc.selfIcon) {
          var candidates = buildSelfIconUrls(svc.slug);
          var attempt = 0;
          logo.onerror = function () {
            attempt++;
            if (attempt < candidates.length) {
              logo.src = candidates[attempt];
            } else {
              logo.style.display = 'none';
              logo.nextElementSibling.style.display = 'flex';
            }
          };
          logo.src = candidates[0];
        } else {
          logo.onerror = function () {
            logo.style.display = 'none';
            logo.nextElementSibling.style.display = 'flex';
          };
          logo.src = ICON_CDN + svc.icon + '.png';
        }

        card.insertBefore(logo, card.firstChild);

        grid.appendChild(card);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  }


  // ===========================
  // Mode Switching
  // ===========================

  function setMode(mode) {
    currentMode = mode;

    btnLocal.classList.toggle('active', mode === 'local');
    btnLocal.setAttribute('aria-selected', mode === 'local');

    btnTailscale.classList.toggle('active', mode === 'tailscale');
    btnTailscale.setAttribute('aria-selected', mode === 'tailscale');

    // Persist preference
    try { localStorage.setItem('homelab-mode', mode); } catch (e) { /* silent */ }

    render();
    applyFilter();
  }


  // ===========================
  // Search / Filter
  // ===========================

  function applyFilter() {
    var query = searchInput.value.trim().toLowerCase();
    var categories = container.querySelectorAll('.category');

    categories.forEach(function (section) {
      var cards = section.querySelectorAll('.card');
      var visibleCount = 0;

      cards.forEach(function (card) {
        var name = card.getAttribute('data-name');
        var match = !query || name.indexOf(query) !== -1;
        card.classList.toggle('card--hidden', !match);
        if (match) visibleCount++;
      });

      section.classList.toggle('category--hidden', visibleCount === 0);
    });

    // Show empty state if nothing matches
    var existing = container.querySelector('.empty-state');
    if (existing) existing.remove();

    if (query) {
      var anyVisible = container.querySelector('.card:not(.card--hidden)');
      if (!anyVisible) {
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML =
          '<div class="empty-state__icon">' +
            '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/></svg>' +
          '</div>' +
          '<div class="empty-state__text">No services match "' + escapeHtml(query) + '"</div>';
        container.appendChild(empty);
      }
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  // ===========================
  // Event Listeners
  // ===========================

  btnLocal.addEventListener('click', function () { setMode('local'); });
  btnTailscale.addEventListener('click', function () { setMode('tailscale'); });
  searchInput.addEventListener('input', applyFilter);

  // Keyboard shortcut: "/" to focus search
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      searchInput.blur();
      applyFilter();
    }
  });


  // ===========================
  // Initialize
  // ===========================

  (function init() {
    // Restore saved mode
    try {
      var saved = localStorage.getItem('homelab-mode');
      if (saved === 'local' || saved === 'tailscale') {
        currentMode = saved;
      }
    } catch (e) { /* silent */ }

    setMode(currentMode);
  })();

})();
