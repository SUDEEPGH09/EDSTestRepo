import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 768px)');

/* =====================================================
   Event handlers (DEFINED FIRST)
   ===================================================== */

function openOnKeydown(e) {
  const focused = document.activeElement;
  if (!focused || !focused.classList.contains('nav-drop')) return;

  if (e.code === 'Enter' || e.code === 'Space') {
    const expanded = focused.getAttribute('aria-expanded') === 'true';
    const sections = focused.closest('.nav-sections');

    toggleAllNavSections(sections, false);
    focused.setAttribute('aria-expanded', !expanded);
  }
}

function focusNavSection() {
  document.activeElement?.addEventListener('keydown', openOnKeydown);
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;

  const nav = document.getElementById('nav');
  if (!nav) return;

  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;

  const expandedSection = navSections.querySelector('[aria-expanded="true"]');

  if (expandedSection && isDesktop.matches) {
    toggleAllNavSections(navSections, false);
    expandedSection.focus();
  } else if (!isDesktop.matches) {
    toggleMenu(nav, navSections, false);
    nav.querySelector('button')?.focus();
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (nav.contains(e.relatedTarget)) return;

  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;

  const expandedSection = navSections.querySelector('[aria-expanded="true"]');

  if (expandedSection && isDesktop.matches) {
    toggleAllNavSections(navSections, false);
  } else if (!isDesktop.matches) {
    toggleMenu(nav, navSections, false);
  }
}

/* =====================================================
   Helper functions
   ===================================================== */

function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll('.default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const isExpanded = nav.getAttribute('aria-expanded') === 'true';
  const expanded = forceExpanded !== null ? forceExpanded : !isExpanded;

  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';

  nav.setAttribute('aria-expanded', expanded);

  toggleAllNavSections(
    navSections,
    expanded && !isDesktop.matches,
  );

  const button = nav.querySelector('.nav-hamburger button');
  if (button) {
    button.setAttribute(
      'aria-label',
      expanded ? 'Close navigation' : 'Open navigation',
    );
  }

  const navDrops = navSections.querySelectorAll('.nav-drop');

  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', '0');
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/* =====================================================
   Main decorate
   ===================================================== */

export default async function decorate(block) {
  /* ---------- head-top ---------- */
  const headTop = document.createElement('div');
  headTop.className = 'head-top';

  while (block.firstElementChild) {
    headTop.append(block.firstElementChild);
  }

  /* ---------- load nav ---------- */
  const navMeta = getMetadata('nav');
  const navPath = navMeta
    ? new URL(navMeta, window.location).pathname
    : '/nav';

  const fragment = await loadFragment(navPath);

  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';

  while (fragment.firstElementChild) {
    nav.append(fragment.firstElementChild);
  }

  ['brand', 'sections', 'tools'].forEach((name, i) => {
    nav.children[i]?.classList.add(`nav-${name}`);
  });

  const navBrand = nav.querySelector('.nav-brand .button');
  if (navBrand) {
    navBrand.className = '';
    navBrand.closest('.button-container')
      ?.classList.remove('button-container');
  }

  const navSections = nav.querySelector('.nav-sections');

  navSections
    ?.querySelectorAll(':scope .default-content-wrapper > ul > li')
    .forEach((section) => {
      if (section.querySelector('ul')) {
        section.classList.add('nav-drop');
      }

      section.addEventListener('click', () => {
        if (!isDesktop.matches) return;

        const expanded = section.getAttribute('aria-expanded') === 'true';

        toggleAllNavSections(navSections, false);
        section.setAttribute('aria-expanded', !expanded);
      });
    });

  /* ---------- hamburger ---------- */
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `
    <button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>
  `;

  hamburger.addEventListener('click', () => {
    toggleMenu(nav, navSections);
  });

  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, isDesktop.matches);
  });

  /* ---------- assemble ---------- */
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  if (headTop.childElementCount) {
    block.append(headTop);
  }

  block.append(navWrapper);
}
