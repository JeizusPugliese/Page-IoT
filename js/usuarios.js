(() => {
  const API_BASE = 'https://api-tmom.onrender.com';
  const STORAGE_KEYS = {
    token: 'token',
    role: 'userRole',
    id: 'userId',
    name: 'userName'
  };

  const isLoginView = () => window.location.pathname.toLowerCase().endsWith('login.html');
  const getToken = () => localStorage.getItem(STORAGE_KEYS.token);
  const getRole = () => localStorage.getItem(STORAGE_KEYS.role);
  const getUserId = () => localStorage.getItem(STORAGE_KEYS.id);
  const getUserName = () => localStorage.getItem(STORAGE_KEYS.name) || 'Usuario';

  const loginDom = {
    form: null,
    emailInput: null,
    passwordInput: null,
    toggleBtn: null
  };

  const cacheLoginDom = () => {
    if (!isLoginView()) return loginDom;
    loginDom.form = loginDom.form || document.querySelector('.login-form');
    loginDom.emailInput = loginDom.emailInput || document.getElementById('txtcorreo');
    loginDom.passwordInput = loginDom.passwordInput || document.getElementById('txtpassword');
    loginDom.toggleBtn = loginDom.toggleBtn || document.getElementById('togglePasswordBtn');
    return loginDom;
  };

  const apiClient = (config) => {
    const token = getToken();
    const headers = { ...(config.headers || {}) };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return axios({ ...config, headers });
  };

  const persistSession = ({ token, rol, id, nombre }) => {
    if (token) localStorage.setItem(STORAGE_KEYS.token, token);
    if (rol) localStorage.setItem(STORAGE_KEYS.role, rol);
    if (id) localStorage.setItem(STORAGE_KEYS.id, id);
    if (nombre) localStorage.setItem(STORAGE_KEYS.name, nombre);
  };

  const setLoginLoading = (isLoading) => {
    const { form } = cacheLoginDom();
    if (!form) return;
    const submitButton = form.querySelector('.btn-login');
    if (!submitButton) return;
    submitButton.disabled = isLoading;
    submitButton.classList.toggle('is-loading', isLoading);
    submitButton.setAttribute('aria-busy', String(isLoading));
  };

  const goToDashboard = (role) => {
    const destino = role === 'admin' ? 'principal_admin.html' : 'principal_usuario.html';
    window.location.href = destino;
  };

  const redirectToLogin = () => {
    localStorage.clear();
    window.location.replace('login.html');
  };

  const handleInvalidToken = () => {
    Swal.fire({
      icon: 'warning',
      title: 'Sesión finalizada',
      text: 'Vuelve a iniciar sesión para continuar.'
    }).then(redirectToLogin);
  };

  // ---------------------------
  //  Autenticación
  // ---------------------------
  function validarlogin() {
    const { emailInput, passwordInput } = cacheLoginDom();

    if (!emailInput || !passwordInput) {
      return;
    }

    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!email || !pass) {
      Swal.fire('Error', 'Por favor ingresa ambos campos', 'error');
      return;
    }

    setLoginLoading(true);

    apiClient({ method: 'POST', url: `${API_BASE}/login`, data: { correo: email, password: pass } })
      .then(({ data }) => {
        if (!data?.success) {
          Swal.fire('Error', 'Credenciales incorrectas', 'error');
          return;
        }

        persistSession({
          token: data.token,
          rol: data.rol,
          id: data.id,
          nombre: data.nombre
        });

        Swal.fire('Bienvenido', data.nombre, 'success').then(() => {
          goToDashboard(data.rol);
        });
      })
      .catch((error) => {
        console.error('Error al iniciar sesión:', error);
        Swal.fire('Error', 'No se pudo iniciar sesión. Intenta nuevamente.', 'error');
      })
      .finally(() => setLoginLoading(false));
  }

  function logout() {
    const token = getToken();
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Confirma para salir del sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4361ee',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (!token) {
        redirectToLogin();
        return;
      }

      apiClient({ method: 'POST', url: `${API_BASE}/logout` })
        .catch((error) => {
          console.warn('Error al cerrar sesión:', error);
        })
        .finally(() => {
          Swal.fire({
            icon: 'success',
            title: 'Sesión cerrada',
            timer: 1200,
            showConfirmButton: false
          }).then(redirectToLogin);
        });
    });
  }

  function verifyToken() {
    const token = getToken();
    if (!token) {
      if (!isLoginView()) {
        handleInvalidToken();
      }
      return;
    }

    apiClient({ method: 'POST', url: `${API_BASE}/verificar_token` })
      .then(({ data }) => {
        if (!data?.success) {
          handleInvalidToken();
        }
      })
      .catch((error) => {
        console.error('Error verificando token:', error);
        handleInvalidToken();
      });
  }

  // ---------------------------
  //  UI Helpers
  // ---------------------------
  function applyNavigationState() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    const role = getRole();
    const adminTabs = nav.querySelectorAll('.admin-only');
    const userTabs = nav.querySelectorAll('.user-only');

    [...nav.querySelectorAll('a.active')].forEach((link) => link.classList.remove('active'));

    if (role === 'admin') {
      userTabs.forEach((tab) => tab.setAttribute('hidden', 'hidden'));
      adminTabs.forEach((tab) => tab.removeAttribute('hidden'));
    } else if (role === 'usuario') {
      adminTabs.forEach((tab) => tab.setAttribute('hidden', 'hidden'));
      userTabs.forEach((tab) => tab.removeAttribute('hidden'));
    } else {
      [...adminTabs, ...userTabs].forEach((tab) => tab.setAttribute('hidden', 'hidden'));
      return;
    }

    const visibleItems = [...nav.querySelectorAll('li')].filter((item) => !item.hasAttribute('hidden'));
    const currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const activeLink = visibleItems
      .map((item) => item.querySelector('a'))
      .find((link) => {
        if (!link) return false;
        const href = link.getAttribute('href') || '';
        const hrefPath = href.split('?')[0].split('#')[0].split('/').pop().toLowerCase();
        return hrefPath === currentPath;
      });

    if (activeLink) {
      activeLink.classList.add('active');
    } else if (visibleItems.length) {
      const fallback = visibleItems[0].querySelector('a');
      if (fallback) fallback.classList.add('active');
    }
  }

  function updateUserHeader() {
    const userIcon = document.getElementById('userIcon');
    const welcomeMsg = document.querySelector('.welcome-msg');
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (!userIcon || !welcomeMsg) return;

    const role = getRole();
    const name = getUserName();

    if (usernameDisplay) {
      usernameDisplay.textContent = name;
    }

    if (role === 'admin') {
      userIcon.className = 'fas fa-user-shield';
      welcomeMsg.innerHTML = `<strong>Bienvenido Administrador ${name}</strong>`;
    } else {
      userIcon.className = 'fas fa-user-circle';
      welcomeMsg.innerHTML = `<strong>Bienvenido ${name}</strong>`;
    }
  }

  function setupPasswordToggle() {
    const { toggleBtn, passwordInput } = cacheLoginDom();
    if (!toggleBtn || !passwordInput) return;

    const icon = toggleBtn.querySelector('i');
    toggleBtn.setAttribute('aria-pressed', 'false');

    toggleBtn.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      toggleBtn.setAttribute('aria-pressed', String(isHidden));
      if (icon) {
        icon.classList.toggle('fa-eye-slash', isHidden);
        icon.classList.toggle('fa-eye', !isHidden);
      }
    });
  }

  function guardSession() {
    if (!isLoginView()) {
      verifyToken();
    }
  }

  function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    const button = document.querySelector(`.toggle-password-btn[data-toggle="${fieldId}"]`);
    const icon = button?.querySelector('i');
    const isHidden = input.type === 'password';

    input.type = isHidden ? 'text' : 'password';

    if (button) {
      button.setAttribute('aria-pressed', String(isHidden));
      button.classList.toggle('is-active', isHidden);
    }

    if (icon) {
      icon.classList.toggle('fa-eye', !isHidden);
      icon.classList.toggle('fa-eye-slash', isHidden);
    }
  }

  // ---------------------------
  //  Gestión de usuarios (usuarios.html)
  // ---------------------------
  const userModule = (() => {
    const state = {
      users: [],
      filtered: [],
      currentPage: 1,
      perPage: 10
    };

    const elements = {
      refreshBtn: document.getElementById('refreshUsers'),
      totalUsers: document.getElementById('totalUsers'),
      adminUsers: document.getElementById('adminUsers'),
      lastUpdate: document.getElementById('lastUpdateTime'),
      tableBody: document.getElementById('usersTableBody'),
      paginationInfo: document.getElementById('paginationInfo'),
      prevPage: document.getElementById('prevPage'),
      nextPage: document.getElementById('nextPage'),
      currentPage: document.getElementById('currentPage'),
      searchInput: document.getElementById('userSearch')
    };

    const modalElements = {
      editModal: document.getElementById('editUserModal'),
      deleteModal: document.getElementById('confirmDeleteModal'),
      editNombre: document.getElementById('editNombre'),
      editApellido: document.getElementById('editApellido'),
      editCorreo: document.getElementById('editCorreo'),
      editCelular: document.getElementById('editCelular'),
      editRol: document.getElementById('editRol'),
      editPassword: document.getElementById('editPassword'),
      deleteCorreo: document.getElementById('deleteCorreo'),
      deleteName: document.getElementById('userToDelete'),
      saveButton: document.querySelector('#editUserModal .btn.btn-primary'),
      feedback: document.getElementById('editUserFeedback')
    };

    const MODAL_HIDE_DELAY = 280;

    function showModal(modal) {
      if (!modal) return;
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('is-visible'));
    }

    function hideModal(modal) {
      if (!modal) return;
      modal.classList.remove('is-visible');
      const handleTransitionEnd = () => {
        modal.style.display = 'none';
        modal.removeEventListener('transitionend', handleTransitionEnd);
      };
      modal.addEventListener('transitionend', handleTransitionEnd, { once: true });

      setTimeout(() => {
        if (modal.classList.contains('is-visible')) return;
        modal.style.display = 'none';
      }, MODAL_HIDE_DELAY);
    }

    function setSaving(isSaving) {
      if (!modalElements.saveButton) return;
      modalElements.saveButton.disabled = Boolean(isSaving);
      modalElements.saveButton.classList.toggle('is-loading', Boolean(isSaving));
      modalElements.saveButton.setAttribute('aria-busy', String(Boolean(isSaving)));
    }

    function showEditFeedback(type, message) {
      if (!modalElements.feedback) return;
      if (!type || !message) {
        modalElements.feedback.hidden = true;
        modalElements.feedback.textContent = '';
        modalElements.feedback.classList.remove('success', 'error');
        return;
      }
      modalElements.feedback.textContent = message;
      modalElements.feedback.classList.toggle('success', type === 'success');
      modalElements.feedback.classList.toggle('error', type === 'error');
      modalElements.feedback.hidden = false;
    }

    const hasUserPage = () => Boolean(elements.tableBody);

    function renderStats() {
      if (!elements.totalUsers || !elements.adminUsers) return;
      const adminCount = state.users.filter((user) => Number(user.rol) === 1).length;
      elements.totalUsers.textContent = state.users.length;
      elements.adminUsers.textContent = adminCount;
    }

    function renderTable() {
      if (!elements.tableBody) return;

      elements.tableBody.innerHTML = '';
      const start = (state.currentPage - 1) * state.perPage;
      const end = Math.min(start + state.perPage, state.filtered.length);

      for (let i = start; i < end; i += 1) {
        const user = state.filtered[i];
        const row = document.createElement('tr');
        const rolTexto = Number(user.rol) === 1 ? 'Admin' : 'Usuario';
        const rolClase = Number(user.rol) === 1 ? 'admin' : 'user';

        row.innerHTML = `
          <td>
            <div class="user-avatar">
              <i class="fas fa-user-circle"></i>
              <span>${user.nombre} ${user.apellido || ''}</span>
            </div>
          </td>
          <td>${user.correo}</td>
          <td><span class="badge ${rolClase}">${rolTexto}</span></td>
          <td>
            <button class="btn-action edit" title="Editar" data-action="edit" data-correo="${user.correo}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action delete" title="Eliminar" data-action="delete" data-correo="${user.correo}" data-nombre="${user.nombre} ${user.apellido || ''}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        `;
        elements.tableBody.appendChild(row);
      }

      if (elements.paginationInfo) {
        const text = state.filtered.length === 0
          ? 'No hay usuarios para mostrar'
          : `Mostrando ${state.filtered.length === 0 ? 0 : start + 1}-${end} de ${state.filtered.length} usuarios`;
        elements.paginationInfo.textContent = text;
      }

      if (elements.currentPage) {
        elements.currentPage.textContent = state.currentPage;
      }

      if (elements.prevPage) {
        elements.prevPage.disabled = state.currentPage === 1;
      }

      if (elements.nextPage) {
        const totalPages = Math.ceil(state.filtered.length / state.perPage) || 1;
        elements.nextPage.disabled = state.currentPage >= totalPages;
      }
    }

    function applyFilter(term) {
      const value = term.trim().toLowerCase();
      if (!value) {
        state.filtered = [...state.users];
      } else {
        state.filtered = state.users.filter((user) => {
          const fullName = `${user.nombre} ${user.apellido || ''}`.toLowerCase();
          return fullName.includes(value) || user.correo.toLowerCase().includes(value);
        });
      }
      state.currentPage = 1;
      renderTable();
    }

    function setLoading(isLoading) {
      const loader = document.getElementById('topLoader');
      if (loader) loader.classList.toggle('active', isLoading);
      if (elements.refreshBtn) {
        elements.refreshBtn.classList.toggle('is-loading', isLoading);
        elements.refreshBtn.disabled = isLoading;
        elements.refreshBtn.setAttribute('aria-busy', String(isLoading));
      }
    }

    function loadUsers() {
      setLoading(true);
      return apiClient({ method: 'GET', url: `${API_BASE}/obtener_usuarios` })
        .then(({ data }) => {
          state.users = data?.usuarios || [];
          state.filtered = [...state.users];
          if (elements.lastUpdate) {
            const now = new Date();
            elements.lastUpdate.textContent = now.toLocaleTimeString();
          }
          renderStats();
          renderTable();
        })
        .catch((error) => {
          console.error('Error al cargar usuarios:', error);
          Swal.fire('Error', 'No se pudo cargar la lista de usuarios', 'error');
        })
        .finally(() => setLoading(false));
    }

    function openEditModal(correo) {
      if (!modalElements.editModal) return;
      const user = state.users.find((u) => u.correo === correo);
      if (!user) return;

      modalElements.editNombre.value = user.nombre;
      modalElements.editApellido.value = user.apellido || '';
      modalElements.editCorreo.value = user.correo;
      modalElements.editCelular.value = user.celular || '';
      modalElements.editRol.value = user.rol;
      modalElements.editPassword.value = '';
      if (modalElements.editPassword) {
        modalElements.editPassword.value = '';
        modalElements.editPassword.type = 'password';
      }

      const toggleButton = document.querySelector('.toggle-password-btn[data-toggle="editPassword"]');
      if (toggleButton) {
        toggleButton.classList.remove('is-active');
        toggleButton.setAttribute('aria-pressed', 'false');
        const toggleIcon = toggleButton.querySelector('i');
        if (toggleIcon) {
          toggleIcon.classList.add('fa-eye');
          toggleIcon.classList.remove('fa-eye-slash');
        }
      }

      showEditFeedback(null);
      setSaving(false);

      showModal(modalElements.editModal);
    }

    function openDeleteModal(correo, nombreCompleto) {
      if (!modalElements.deleteModal) return;
      modalElements.deleteCorreo.value = correo;
      modalElements.deleteName.textContent = nombreCompleto;
      showModal(modalElements.deleteModal);
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) hideModal(modal);
      showEditFeedback(null);
      setSaving(false);
    }

    function saveUserChanges(event) {
      event?.preventDefault();
      if (!modalElements.editCorreo) return;

      const payload = {
        nombre: modalElements.editNombre.value.trim(),
        apellido: modalElements.editApellido.value.trim(),
        correo: modalElements.editCorreo.value.trim(),
        celular: modalElements.editCelular.value.trim(),
        password: modalElements.editPassword.value.trim()
      };

      if (!payload.password) {
        delete payload.password;
      }

      if (!payload.nombre || !payload.apellido || !payload.correo || !payload.celular) {
        Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
        return;
      }

      showEditFeedback(null);
      setSaving(true);

      apiClient({ method: 'PUT', url: `${API_BASE}/actualizar_usuario`, data: payload })
        .then(({ data }) => {
          if (data?.success) {
            showEditFeedback('success', 'Datos del usuario actualizados.');
            loadUsers();
            setTimeout(() => showEditFeedback(null), 2200);
          } else {
            showEditFeedback('error', data?.message || 'No fue posible actualizar el usuario');
          }
        })
        .catch((error) => {
          console.error('Error al actualizar usuario:', error);
          showEditFeedback('error', 'No se pudo actualizar el usuario');
        })
        .finally(() => setSaving(false));
    }

    function confirmDeleteUser() {
      const correo = modalElements.deleteCorreo?.value;
      if (!correo) return;

      apiClient({ method: 'DELETE', url: `${API_BASE}/eliminar_usuario/${correo}` })
        .then(({ data }) => {
          if (data?.success) {
            Swal.fire({
              icon: 'success',
              title: 'Usuario eliminado',
              showConfirmButton: false,
              timer: 1500
            });
            closeModal('confirmDeleteModal');
            loadUsers();
          } else {
            Swal.fire('Error', data?.message || 'No fue posible eliminar el usuario', 'error');
          }
        })
        .catch((error) => {
          console.error('Error eliminando usuario:', error);
          Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
        });
    }

    function handleTableActions(event) {
      const target = event.target.closest('button[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'edit') {
        openEditModal(target.dataset.correo);
      } else if (action === 'delete') {
        openDeleteModal(target.dataset.correo, target.dataset.nombre);
      }
    }

    function bindEvents() {
      if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', loadUsers);
      }
      if (elements.prevPage) {
        elements.prevPage.addEventListener('click', () => {
          if (state.currentPage > 1) {
            state.currentPage -= 1;
            renderTable();
          }
        });
      }
      if (elements.nextPage) {
        elements.nextPage.addEventListener('click', () => {
          const totalPages = Math.ceil(state.filtered.length / state.perPage) || 1;
          if (state.currentPage < totalPages) {
            state.currentPage += 1;
            renderTable();
          }
        });
      }
      if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (event) => applyFilter(event.target.value));
      }
      if (elements.tableBody) {
        elements.tableBody.addEventListener('click', handleTableActions);
      }

      // Exponer helpers para los atributos inline existentes
      window.buscarUsuarios = () => applyFilter(elements.searchInput?.value || '');
      window.abrirModalEdicion = openEditModal;
      window.abrirModalEliminacion = openDeleteModal;
      window.cerrarModal = closeModal;
      window.guardarCambios = saveUserChanges;
      window.eliminarUsuarioConfirmado = confirmDeleteUser;
    }

    function init() {
      if (!hasUserPage()) return;
      bindEvents();
      [modalElements.editModal, modalElements.deleteModal].forEach((modal) => {
        if (!modal) return;
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            hideModal(modal);
          }
        });
      });
      loadUsers();
    }

    return { init, reload: loadUsers };
  })();

  // ---------------------------
  //  Inicialización global
  // ---------------------------
  document.addEventListener('DOMContentLoaded', () => {
    applyNavigationState();
    updateUserHeader();
    setupPasswordToggle();
    guardSession();
    document.querySelectorAll('.toggle-password-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', 'false');
    });
    userModule.init();
  });

  window.validarlogin = validarlogin;
  window.logout = logout;
  window.__userModule = userModule;
  window.togglePassword = togglePassword;
})();
