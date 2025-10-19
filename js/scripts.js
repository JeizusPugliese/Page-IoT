/*!
 * Start Bootstrap - SB Admin v7.0.5 (https://startbootstrap.com/template/sb-admin)
 * Copyright 2013-2022 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
 */

(() => {
  const toggle = document.getElementById('sidebarToggle');
  if (!toggle) return;

  const sidebar = document.querySelector('.dashboard-sidebar');
  const content = document.querySelector('.dashboard-content');
  const header = document.querySelector('.dashboard-header');

  toggle.addEventListener('click', () => {
    if (sidebar) sidebar.classList.toggle('collapsed');
    if (content) content.classList.toggle('expanded');
    if (header) header.classList.toggle('expanded');
  });
})();
