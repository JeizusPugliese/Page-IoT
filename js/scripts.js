/*!
    * Start Bootstrap - SB Admin v7.0.5 (https://startbootstrap.com/template/sb-admin)
    * Copyright 2013-2022 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
    */
    // 
// Scripts
// 
document.getElementById("sidebarToggle").addEventListener("click", function () {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const content = document.querySelector(".dashboard-content");
    const header = document.querySelector(".dashboard-header");

    sidebar.classList.toggle("collapsed");
    content.classList.toggle("expanded");
    header.classList.toggle("expanded");
});


