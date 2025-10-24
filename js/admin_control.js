(() => {
  const API_BASE = 'https://api-tmom.onrender.com';

  document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userRole') !== 'admin') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const authHeaders = { Authorization: `Bearer ${token}` };

    const elements = {
      topLoader: document.getElementById('topLoader'),
      refreshButton: document.getElementById('refresh-btn'),
      lastUpdate: document.getElementById('last-update-text'),
      totalUsuarios: document.getElementById('totalUsuarios'),
      totalSensoresUsuario: document.getElementById('totalSensoresUsuario'),
      selectedUserLabel: document.getElementById('selectedUserLabel'),
      searchInput: document.getElementById('userSearch'),
      searchButton: document.getElementById('userSearchBtn'),
      tableBody: document.getElementById('usuariosTableBody'),
      modal: document.getElementById('adminUsuarioModal'),
      modalTitle: document.getElementById('adminUsuarioNombre'),
      sensorList: document.getElementById('sensoresUsuarioList'),
      addForm: document.getElementById('adminAddSensorForm'),
      sensorName: document.getElementById('adminSensorName'),
      sensorReference: document.getElementById('adminSensorRef'),
      sensorType: document.getElementById('adminSensorTipo')
    };

    const state = {
      users: [],
      filteredUsers: [],
      selectedUserId: null,
      selectedUserName: '',
      refreshInterval: null
    };

    function updateSelectedUserLabel() {
      if (!elements.selectedUserLabel) return;
      elements.selectedUserLabel.textContent = state.selectedUserName || 'Sin seleccionar';
    }

    function resetSensorView(message) {
      if (elements.totalSensoresUsuario) elements.totalSensoresUsuario.textContent = '0';
      if (elements.sensorList) {
        elements.sensorList.innerHTML = `<div style="text-align:center;color:#888;">${message || 'Selecciona un usuario para visualizar sus sensores.'}</div>`;
      }
    }

    const showModal = (modal) => {
      if (!modal) return;
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('is-visible'));
    };

    const hideModal = (modal) => {
      if (!modal) return;
      modal.classList.remove('is-visible');
      const finishHide = () => {
        modal.style.display = 'none';
        modal.removeEventListener('transitionend', finishHide);
      };
      modal.addEventListener('transitionend', finishHide, { once: true });
      setTimeout(finishHide, 280);
    };

    const setLoading = (isLoading) => {
      if (elements.topLoader) elements.topLoader.classList.toggle('active', Boolean(isLoading));
      if (elements.refreshButton) elements.refreshButton.classList.toggle('loading', Boolean(isLoading));
    };

    const formatDateTime = (value) => {
      if (!value) return 'Sin lecturas';
      try {
        return new Date(value).toLocaleString();
      } catch (error) {
        return value;
      }
    };

    const renderUsers = () => {
      if (!elements.tableBody) return;
      elements.tableBody.innerHTML = '';

      if (state.filteredUsers.length === 0) {
        elements.tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888;">No hay usuarios disponibles.</td></tr>';
        return;
      }

      state.filteredUsers.forEach((user) => {
        const row = document.createElement('tr');
        row.dataset.userId = user.id;
        if (user.id === state.selectedUserId) {
          row.classList.add('is-selected');
        }

        const nombreCompleto = `${user.nombre} ${user.apellido || ''}`.trim();
        const rolId = Number(user.rol);
        const rolTexto = rolId === 1 ? 'Administrador' : 'Usuario estándar';
        const rolClase = rolId === 1 ? 'admin' : 'user';

        row.innerHTML = `
          <td>
            <div class="user-avatar">
              <i class="fas fa-user-circle"></i>
              <div>
                <span>${nombreCompleto || user.nombre}</span>
                <span class="user-mail">${user.correo}</span>
              </div>
            </div>
          </td>
          <td><span class="badge ${rolClase}">${rolTexto}</span></td>
          <td>
            <button class="admin-btn" data-action="manage" data-user-id="${user.id}">
              <i class="fas fa-sliders-h"></i>
              <span>Administrar</span>
            </button>
          </td>
        `;
        elements.tableBody.appendChild(row);
      });
    };

    const updateUserStats = () => {
      if (elements.totalUsuarios) {
        elements.totalUsuarios.textContent = state.filteredUsers.length.toString();
      }
    };

    const filterUsers = (term) => {
      const value = (term || '').trim().toLowerCase();
      if (!value) {
        state.filteredUsers = [...state.users];
      } else {
        state.filteredUsers = state.users.filter((user) => {
          const fullName = `${user.nombre} ${user.apellido || ''}`.toLowerCase();
          return fullName.includes(value) || user.correo.toLowerCase().includes(value);
        });
      }
      if (state.selectedUserId && !state.filteredUsers.some((user) => user.id === state.selectedUserId)) {
        state.selectedUserId = null;
        state.selectedUserName = '';
        updateSelectedUserLabel();
        resetSensorView();
      }
      renderUsers();
      updateUserStats();
    };

    const closeModal = () => {
      if (elements.modal) {
        hideModal(elements.modal);
      }
      if (elements.addForm) {
        elements.addForm.reset();
      }
    };

    const renderSensorsSkeleton = () => {
      if (!elements.sensorList) return;
      const skeletonCard = () => `
        <div class="skeleton-card">
          <div class="skeleton-col">
            <span class="skeleton-bar wide"></span>
            <span class="skeleton-bar mid"></span>
            <span class="skeleton-bar short"></span>
          </div>
          <div class="skeleton-col" style="width:35%;align-items:flex-end;">
            <span class="skeleton-bar mid"></span>
            <span class="skeleton-bar tiny"></span>
            <span class="skeleton-bar short"></span>
          </div>
          <div class="skeleton-actions">
            <span class="skeleton-chip"></span>
            <span class="skeleton-chip"></span>
            <span class="skeleton-chip"></span>
          </div>
        </div>
      `;
      elements.sensorList.innerHTML = `<div class="skeleton-wrapper">${[skeletonCard(), skeletonCard(), skeletonCard()].join('')}</div>`;
    };

    const renderSensors = (sensors) => {
      if (!elements.sensorList) return;
      elements.sensorList.innerHTML = '';

      if (!Array.isArray(sensors) || sensors.length === 0) {
        const message = state.selectedUserName
          ? `${state.selectedUserName} aún no tiene sensores registrados.`
          : 'Selecciona un usuario para visualizar sus sensores.';
        elements.sensorList.innerHTML = `<div style="text-align:center;color:#888;">${message}</div>`;
        return;
      }

      sensors.forEach((sensor) => {
        const online = (sensor.estado || '').toLowerCase() === 'online';
        const container = document.createElement('div');
        container.className = 'admin-sensor-row';
        container.dataset.sensorId = sensor.id;
        container.innerHTML = `
          <div style="flex:1;">
            <strong>${sensor.nombre_sensor}</strong>
            <div style="color:#888;font-size:0.9rem;">Ref: ${sensor.referencia || '—'}</div>
            <div style="color:#888;font-size:0.9rem;">Tipo: ${sensor.tipo_sensor || '—'}</div>
          </div>
          <div style="text-align:center;min-width:120px;">
            <span class="dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${online ? '#43aa8b' : '#adb5bd'};margin-right:6px;"></span>
            <span class="admin-estado" style="font-weight:600;color:${online ? '#43aa8b' : '#adb5bd'};">${online ? 'Online' : 'Offline'}</span>
            <div class="admin-tiempo-encendido" style="font-size:0.85rem;color:#43aa8b;">Tiempo activo: ${Number.isFinite(sensor.tiempo_encendido) ? `${sensor.tiempo_encendido} min` : '—'}</div>
            <div style="font-size:0.8rem;color:#6c757d;">Última lectura: ${formatDateTime(sensor.ultimo_dato)}</div>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn-toggle-sensor btn" data-id="${sensor.id}" title="Encender/Apagar" style="background:#4361ee;color:#fff;padding:0.45rem 0.75rem;border-radius:7px;"><i class="fas fa-power-off"></i></button>
            <button class="btn-calibrar-sensor btn" data-id="${sensor.id}" title="Calibrar" style="background:#ffd166;color:#222;padding:0.45rem 0.75rem;border-radius:7px;"><i class="fas fa-tools"></i></button>
            <button class="btn-eliminar-sensor btn" data-id="${sensor.id}" title="Eliminar" style="background:#e63946;color:#fff;padding:0.45rem 0.75rem;border-radius:7px;"><i class="fas fa-trash"></i></button>
          </div>
        `;
        elements.sensorList.appendChild(container);
      });
    };

    function selectUser(user) {
      if (!user) {
        state.selectedUserId = null;
        state.selectedUserName = '';
        updateSelectedUserLabel();
        resetSensorView();
        renderUsers();
        return;
      }

      state.selectedUserId = user.id;
      const nombreCompleto = `${user.nombre} ${user.apellido || ''}`.trim();
      state.selectedUserName = nombreCompleto || user.nombre;
      updateSelectedUserLabel();
      if (elements.totalSensoresUsuario) {
        elements.totalSensoresUsuario.textContent = '—';
      }
      renderUsers();
      fetchSensorsForUser(user.id);
    }

    const fetchSensorsForUser = async (userId) => {
      if (!userId) return;
      renderSensorsSkeleton();
      try {
        const { data } = await axios.get(`${API_BASE}/sensores_usuario/${userId}`, { headers: authHeaders });
        const sensors = Array.isArray(data) ? data : [];
        renderSensors(sensors);
        if (elements.totalSensoresUsuario) {
          elements.totalSensoresUsuario.textContent = sensors.length.toString();
        }
      } catch (error) {
        console.error('Error al obtener sensores del usuario:', error);
        Swal.fire('Error', 'No se pudieron cargar los sensores del usuario', 'error');
        renderSensors([]);
      }
    };

    const openModalForUser = (user) => {
      if (!user) return;
      if (state.selectedUserId !== user.id) {
        selectUser(user);
      }
      if (elements.modalTitle) {
        elements.modalTitle.textContent = `${user.nombre} ${user.apellido || ''}`.trim();
      }
      if (elements.modal) {
        showModal(elements.modal);
      }
    };

    const loadUsers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/obtener_usuarios`, { headers: authHeaders });
        const users = data?.usuarios || [];
        state.users = users.filter((user) => Number(user.rol) !== 1);
        filterUsers(elements.searchInput ? elements.searchInput.value : '');
        if (state.filteredUsers.length > 0) {
          if (state.selectedUserId) {
            const stillExists = state.users.find((user) => user.id === state.selectedUserId);
            if (stillExists) {
              selectUser(stillExists);
            } else {
              selectUser(state.filteredUsers[0]);
            }
          } else {
            selectUser(state.filteredUsers[0]);
          }
        } else {
          state.selectedUserId = null;
          state.selectedUserName = '';
          updateSelectedUserLabel();
          resetSensorView();
        }
        if (elements.lastUpdate) {
          elements.lastUpdate.textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        if (elements.tableBody) {
          elements.tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red;">No fue posible cargar los usuarios.</td></tr>';
        }
        if (elements.totalUsuarios) elements.totalUsuarios.textContent = '0';
        state.selectedUserId = null;
        state.selectedUserName = '';
        updateSelectedUserLabel();
        resetSensorView('No se pudieron cargar los sensores.');
      } finally {
        setLoading(false);
      }
    };

    const populateSensorTypes = async () => {
      if (!elements.sensorType) return;
      try {
        const { data } = await axios.get(`${API_BASE}/tipo_sensor`, { headers: authHeaders });
        const tipos = data?.data || [];
        elements.sensorType.innerHTML = '<option value="" disabled selected>Seleccione tipo</option>';
        tipos.forEach((tipo) => {
          const option = document.createElement('option');
          option.value = tipo.id;
          option.textContent = `${tipo.id} - ${tipo.nombre}`;
          elements.sensorType.appendChild(option);
        });
      } catch (error) {
        console.error('Error al cargar tipos de sensor:', error);
        elements.sensorType.innerHTML = '<option value="" disabled selected>No fue posible cargar los tipos</option>';
      }
    };

    const handleTableClick = (event) => {
      const button = event.target.closest('button[data-action="manage"]');
      if (button) {
        event.stopPropagation();
        const userId = Number(button.dataset.userId);
        const user = state.users.find((item) => item.id === userId);
        if (user) {
          selectUser(user);
          openModalForUser(user);
        }
        return;
      }

      const row = event.target.closest('tr[data-user-id]');
      if (!row) return;
      const userId = Number(row.dataset.userId);
      const user = state.users.find((item) => item.id === userId);
      if (user) {
        selectUser(user);
      }
    };

    const handleSensorActions = async (event) => {
      const toggleBtn = event.target.closest('.btn-toggle-sensor');
      const calibrateBtn = event.target.closest('.btn-calibrar-sensor');
      const deleteBtn = event.target.closest('.btn-eliminar-sensor');

      const execute = async (request) => {
        try {
          await request();
          await fetchSensorsForUser(state.selectedUserId);
        } catch (error) {
          console.error('Operación sobre sensor falló:', error);
          Swal.fire('Error', 'Operación no realizada', 'error');
        }
      };

      if (toggleBtn) {
        const sensorId = toggleBtn.dataset.id;
        await execute(() => axios.post(`${API_BASE}/toggle_sensor/${sensorId}`, {}, { headers: authHeaders }));
        Swal.fire({ icon: 'success', title: 'Estado actualizado', showConfirmButton: false, timer: 1100 });
      }

      if (calibrateBtn) {
        const sensorId = calibrateBtn.dataset.id;
        await execute(() => axios.post(`${API_BASE}/calibrar_sensor/${sensorId}`, {}, { headers: authHeaders }));
        Swal.fire({ icon: 'success', title: 'Calibración enviada', showConfirmButton: false, timer: 1100 });
      }

      if (deleteBtn) {
        const sensorId = deleteBtn.dataset.id;
        const confirmation = await Swal.fire({
          title: '¿Eliminar sensor?',
          text: 'Esta acción no se puede deshacer.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar'
        });
        if (!confirmation.isConfirmed) return;
        await execute(() => axios.delete(`${API_BASE}/eliminar_sensor/${sensorId}`, { headers: authHeaders }));
        Swal.fire({ icon: 'success', title: 'Sensor eliminado', showConfirmButton: false, timer: 1200 });
      }
    };

    const handleAddSensor = async (event) => {
      event.preventDefault();
      if (!elements.addForm || !state.selectedUserId) return;

      const nombre = elements.sensorName?.value.trim();
      const referencia = elements.sensorReference?.value.trim();
      const tipo = elements.sensorType?.value;

      if (!nombre || !referencia || !tipo) {
        Swal.fire('Error', 'Completa todos los campos del sensor', 'error');
        return;
      }

      try {
        await axios.post(`${API_BASE}/add_sensor`, {
          nombre_sensor: nombre,
          referencia,
          id_tipo_sensor: Number(tipo),
          id_usuario: state.selectedUserId
        }, { headers: authHeaders });

        Swal.fire({ icon: 'success', title: 'Sensor agregado', showConfirmButton: false, timer: 1200 });
        elements.addForm.reset();
        await fetchSensorsForUser(state.selectedUserId);
      } catch (error) {
        console.error('Error al agregar sensor:', error);
        Swal.fire('Error', 'No se pudo agregar el sensor', 'error');
      }
    };

    if (elements.refreshButton) {
      elements.refreshButton.addEventListener('click', () => {
        if (state.selectedUserId) {
          renderSensorsSkeleton();
          fetchSensorsForUser(state.selectedUserId);
        } else {
          loadUsers();
        }
      });
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (event) => filterUsers(event.target.value));
    }

    if (elements.searchButton) {
      elements.searchButton.addEventListener('click', (event) => {
        event.preventDefault();
        filterUsers(elements.searchInput ? elements.searchInput.value : '');
      });
    }

    if (elements.tableBody) {
      elements.tableBody.addEventListener('click', handleTableClick);
    }

    if (elements.sensorList) {
      elements.sensorList.addEventListener('click', handleSensorActions);
    }

    if (elements.addForm) {
      elements.addForm.addEventListener('submit', handleAddSensor);
    }

    if (elements.modal) {
      elements.modal.addEventListener('click', (event) => {
        if (event.target === elements.modal) {
          closeModal();
        }
      });
    }

    window.cerrarAdminUsuarioModal = closeModal;

    updateSelectedUserLabel();
    resetSensorView();
    loadUsers();
    populateSensorTypes();
  });
})();
