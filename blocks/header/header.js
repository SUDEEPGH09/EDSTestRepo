import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 768px)');

/* ================================
   Utility / Behavior Functions
================================ */

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;

  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;

  const nav = document.getElementById('nav');
  if (!nav) return;

  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;

  const expandedSection = navSections.querySelector('[aria-expanded="true"]');

  if (expandedSection && isDesktop.matches) {
    toggleAllNavSections(navSections);
    expandedSection.focus();
  } else if (!isDesktop.matches) {
    toggleMenu(nav, navSections);
    nav.querySelector('.nav-hamburger button')?.focus();
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav || nav.contains(e.relatedTarget)) return;

  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;

  const expandedSection = navSections.querySelector('[aria-expanded="true"]');

  if (expandedSection && isDesktop.matches) {
    toggleAllNavSections(navSections, false);
  } else if (!isDesktop.matches) {
    toggleMenu(nav, navSections, false);
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  if (!focused || focused.className !== 'nav-drop') return;

  if (e.code === 'Enter' || e.code === 'Space') {
    const expanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement?.addEventListener('keydown', openOnKeydown);
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';

  const button = nav.querySelector('.nav-hamburger button');

  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(
    navSections,
    expanded || isDesktop.matches ? 'false' : 'true',
  );

  button?.setAttribute(
    'aria-label',
    expanded ? 'Open navigation' : 'Close navigation',
  );

  const navDrops = navSections?.querySelectorAll('.nav-drop') || [];

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

/* ================================
   Header Decorator
================================ */

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta
    ? new URL(navMeta, window.location).pathname
    : '/nav';

  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  block.textContent = '';

  /* -------- Head Top (authorable) -------- */
  const firstSection = fragment.querySelector(':scope > div');

  if (firstSection) {
    const headTop = document.createElement('div');
    headTop.className = 'head-top';
    headTop.append(firstSection);
    block.append(headTop);
  }

  /* -------- Nav -------- */
  const nav = document.createElement('nav');
  nav.id = 'nav';

  while (fragment.firstElementChild) {
    nav.append(fragment.firstElementChild);
  }

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((cls, index) => {
    const section = nav.children[index];
    if (section) section.classList.add(`nav-${cls}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container')?.classList.remove('button-container');
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) {
          navSection.classList.add('nav-drop');
        }

        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
  }

  /* -------- Hamburger -------- */
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `
    <button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>
  `;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));

  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, isDesktop.matches);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  block.append(navWrapper);
}
