export default function decorate(block) {
  block.classList.add('custom-header');

  const rows = [...block.children];

  const header = document.createElement('header');
  header.className = 'custom-header__inner';

  /* ========== LOGO ========== */
  const logoRow = rows[0];
  const logoCell = logoRow.children[0];
  const logoLink = logoRow.children[1]?.textContent?.trim() || '/';

  const logoAnchor = document.createElement('a');
  logoAnchor.href = logoLink;
  logoAnchor.className = 'custom-header__logo';

  const logoImg = logoCell.querySelector('img');
  if (logoImg) logoAnchor.append(logoImg);

  /* ========== NAV ========== */
  const navRow = rows[1];
  const nav = document.createElement('nav');
  nav.className = 'custom-header__nav';

  const navList = navRow.querySelector('ul');
  if (navList) nav.append(navList);

  nav.querySelectorAll('li').forEach((li) => {
    const submenu = li.querySelector('ul');
    if (submenu) {
      li.classList.add('has-dropdown');
      li.setAttribute('aria-expanded', 'false');

      li.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = li.getAttribute('aria-expanded') === 'true';
        closeAllDropdowns(nav);
        li.setAttribute('aria-expanded', (!expanded).toString());
      });
    }
  });

  /* ========== SOCIAL ========== */
  const socialRow = rows[2];
  const social = document.createElement('div');
  social.className = 'custom-header__social';

  [...socialRow.children].forEach((cell) => {
    const img = cell.querySelector('img');
    const link = cell.nextElementSibling?.textContent?.trim();

    if (img && link) {
      const a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.append(img);
      social.append(a);
    }
  });

  /* ========== HAMBURGER ========== */
  const hamburger = document.createElement('button');
  hamburger.className = 'custom-header__hamburger';
  hamburger.setAttribute('aria-label', 'Toggle menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';

  hamburger.addEventListener('click', () => {
    header.classList.toggle('menu-open');
  });

  /* ========== ASSEMBLE ========== */
  header.append(logoAnchor, hamburger, nav, social);
  block.innerHTML = '';
  block.append(header);
}

function closeAllDropdowns(nav) {
  nav.querySelectorAll('li[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
}
