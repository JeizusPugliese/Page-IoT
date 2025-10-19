(() => {
  const API_BASE = 'https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net';
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

  const apiClient = (config) => {
    const token = getToken();
    const headers = { ...(config.headers || {}) };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return axios({ ...config, headers });
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
    const correo = document.getElementById('txtcorreo');
    const password = document.getElementById('txtpassword');

    if (!correo || !password) {
      return;
    }

    const email = correo.value.trim();
    const pass = password.value.trim();

    if (!email || !pass) {
      Swal.fire('Error', 'Por favor ingresa ambos campos', 'error');
      return;
    }

    axios.post(`${API_BASE}/login`, { correo: email, password: pass })
      .then(({ data }) => {
        if (!data?.success) {
          Swal.fire('Error', 'Credenciales incorrectas', 'error');
          return;
        }

        localStorage.setItem(STORAGE_KEYS.token, data.token);
        localStorage.setItem(STORAGE_KEYS.role, data.rol);
        localStorage.setItem(STORAGE_KEYS.id, data.id);
        localStorage.setItem(STORAGE_KEYS.name, data.nombre);

        const destino = data.rol === 'admin' ? 'principal_admin.html' : 'principal_usuario.html';
        Swal.fire('Bienvenido', data.nombre, 'success').then(() => {
          window.location.href = destino;
        });
      })
      .catch((error) => {
        console.error('Error al iniciar sesión:', error);
        Swal.fire('Error', 'No se pudo iniciar sesión. Intenta nuevamente.', 'error');
      });
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
      const active = nav.querySelector('#navReportesAdmin a, #navUsuarios a');
      if (active) active.classList.add('active');
    } else if (role === 'usuario') {
      adminTabs.forEach((tab) => tab.setAttribute('hidden', 'hidden'));
      userTabs.forEach((tab) => tab.removeAttribute('hidden'));
      const active = nav.querySelector('#navReportesUser a, #navControlUser a');
      if (active) active.classList.add('active');
    } else {
      [...adminTabs, ...userTabs].forEach((tab) => tab.setAttribute('hidden', 'hidden'));
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
    const toggleButton = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('txtpassword');
    if (!toggleButton || !passwordInput) return;

    toggleButton.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      toggleButton.innerHTML = isHidden
        ? '<i class="far fa-eye-slash"></i>'
        : '<i class="far fa-eye"></i>';
    });
  }

  function guardSession() {
    if (!isLoginView()) {
      verifyToken();
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
      deleteName: document.getElementById('userToDelete')
    };

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
      if (elements.refreshBtn) elements.refreshBtn.classList.toggle('loading', isLoading);
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
      modalElements.editModal.style.display = 'flex';
    }

    function openDeleteModal(correo, nombreCompleto) {
      if (!modalElements.deleteModal) return;
      modalElements.deleteCorreo.value = correo;
      modalElements.deleteName.textContent = nombreCompleto;
      modalElements.deleteModal.style.display = 'flex';
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.style.display = 'none';
    }

    function saveUserChanges(event) {
      event?.preventDefault();
      if (!modalElements.editCorreo) return;

      const payload = {
        nombre: modalElements.editNombre.value.trim(),
        apellido: modalElements.editApellido.value.trim(),
        correo: modalElements.editCorreo.value.trim(),
        celular: modalElements.editCelular.value.trim(),
        password: modalElements.editPassword.value.trim() || undefined
      };

      if (!payload.nombre || !payload.apellido || !payload.correo || !payload.celular) {
        Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
        return;
      }

      apiClient({ method: 'PUT', url: `${API_BASE}/actualizar_usuario`, data: payload })
        .then(({ data }) => {
          if (data?.success) {
            Swal.fire('Actualizado', 'Los datos del usuario se guardaron correctamente', 'success');
            closeModal('editUserModal');
            loadUsers();
          } else {
            Swal.fire('Error', data?.message || 'No fue posible actualizar el usuario', 'error');
          }
        })
        .catch((error) => {
          console.error('Error al actualizar usuario:', error);
          Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
        });
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
    userModule.init();
  });

  window.validarlogin = validarlogin;
  window.logout = logout;
  window.__userModule = userModule;
})();
