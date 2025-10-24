// ==============================
// CONTROL DE SENSORES PROFESIONAL
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    // --- Modal tipo weather-app para datos del sensor ---
    const sensorDataModal = document.getElementById('sensorDataModal');
    const sensorDataModalContent = document.getElementById('sensorDataModalContent');
    const closeSensorDataModal = document.getElementById('closeSensorDataModal');

    function openSensorDataModal(sensor) {
        let icono = 'fa-microchip';
        const tipo = (sensor.tipo_sensor || '').toLowerCase();
        if(tipo.includes('temp')) icono = 'fa-temperature-high';
        else if(tipo.includes('hum')) icono = 'fa-droplet';
        else if(tipo.includes('mov') || tipo.includes('pir')) icono = 'fa-running';
        else if(tipo.includes('gas') || tipo.includes('mq')) icono = 'fa-fire';
        else if(tipo.includes('luz') || tipo.includes('ldr')) icono = 'fa-lightbulb';

        const detalle = sensorDataModal.querySelector('.sensor-detail-card');
        if (detalle) {
            detalle.setAttribute('data-type',
                tipo.includes('temp') ? 'temperatura'
                : tipo.includes('hum') ? 'humedad'
                : tipo.includes('mov') || tipo.includes('pir') ? 'movimiento'
                : tipo.includes('gas') || tipo.includes('mq') ? 'gas'
                : tipo.includes('luz') || tipo.includes('ldr') ? 'luz'
                : 'generico'
            );
        }

        const unidad = tipo.includes('temp') ? '°C' : '';
        const valor = sensor.valor !== undefined && sensor.valor !== null ? sensor.valor : '--';
        sensorDataModalContent.innerHTML = `
            <div class="sensor-detail-icon"><i class="fas ${icono}"></i></div>
            <h3>${sensor.nombre_sensor || sensor.sensor || 'Sensor'}</h3>
            <p class="sensor-detail-type">${sensor.tipo_sensor || 'Tipo'}</p>
            <p class="sensor-detail-value">${valor}<span>${unidad}</span></p>
            <p class="sensor-detail-state">${sensor.estado || 'Sin datos'}</p>
            <div class="sensor-detail-meta">
                <span>Última lectura: <strong>${sensor.ultimo_dato || '--:--:--'}</strong></span>
                <span>Ref: <strong>${sensor.referencia || '—'}</strong></span>
            </div>
        `;
        sensorDataModal.classList.add('is-visible');
    }

    if(closeSensorDataModal && sensorDataModal) {
        const hideModal = () => sensorDataModal.classList.remove('is-visible');
        closeSensorDataModal.onclick = hideModal;
        sensorDataModal.onclick = (e) => { if(e.target === sensorDataModal) hideModal(); };
    }
    // Obtener primero el rol y el id del usuario
    const userRole = localStorage.getItem('userRole');
    const userId = Number(localStorage.getItem('userId'));

    // Si es admin, llenar el select de usuarios en el modal
    if (userRole === 'admin') {
        const userSelect = document.getElementById('sensorUser');
        if (userSelect) {
            axios.get('https://api-tmom.onrender.com/obtener_usuarios', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            .then(res => {
                const usuarios = res.data.usuarios || [];
                usuarios.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.id;
                    opt.textContent = u.nombre + ' (' + u.correo + ')';
                    userSelect.appendChild(opt);
                });
            })
            .catch(() => {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Error al cargar usuarios';
                userSelect.appendChild(opt);
            });
        }
    }
    // Mostrar/ocultar secciones según el rol
    const sensorGrid = document.getElementById("sensorGrid");
    const statsCards = document.querySelector(".stats-cards");
    const usuariosAdminSection = document.getElementById("usuariosAdminSection");

    if (userRole === 'admin') {
        if (sensorGrid) sensorGrid.style.display = "none";
        if (statsCards) statsCards.style.display = "none";
        // NO ocultes usuariosAdminSection, déjalo visible
    } else {
        if (usuariosAdminSection) usuariosAdminSection.style.display = "none";
    }

    // Elementos solo presentes en vistas admin (en user pueden ser null)
    const addSensorModal = document.getElementById("addSensorModal");
    const openAddSensorModal = document.getElementById("openAddSensorModal");
    const closeAddSensorModal = document.getElementById("closeAddSensorModal");
    const addSensorForm = document.getElementById("addSensorForm");
    const totalSensores = document.getElementById("totalSensores");

    // Renderizar sensores del usuario (solo una vez, estructura)
    async function renderizarSensoresEstructura(sensores) {
        if (!sensorGrid) return;
        sensorGrid.classList.remove('is-empty');
        sensorGrid.innerHTML = '';

        if (!sensores || sensores.length === 0) {
            sensorGrid.classList.add('is-empty');
            const empty = document.createElement('div');
            empty.className = 'sensor-empty-state';
            empty.innerHTML = `
                <i class="fas fa-satellite-dish" aria-hidden="true"></i>
                <p>Este usuario no tiene sensores asignados todavía.</p>
                ${userRole === 'admin' ? '<button class="btn btn-primary" id="ctaAgregarSensor"><i class="fas fa-plus"></i> Agregar sensor</button>' : ''}
            `;
            sensorGrid.appendChild(empty);
            const cta = empty.querySelector('#ctaAgregarSensor');
            if (cta) {
                cta.addEventListener('click', () => {
                    const modal = document.getElementById('addSensorModal');
                    if (modal) modal.style.display = 'flex';
                });
            }
            return;
        }

        sensores.forEach(sensor => {
            const card = document.createElement('div');
            const tipoTexto = (sensor.tipo_sensor || '').toString().toLowerCase();
            const tipoNormalizado = tipoTexto.includes('temp') ? 'temperatura'
                : tipoTexto.includes('hum') ? 'humedad'
                : tipoTexto.includes('mov') || tipoTexto.includes('pir') ? 'movimiento'
                : tipoTexto.includes('gas') || tipoTexto.includes('mq') ? 'gas'
                : tipoTexto.includes('luz') || tipoTexto.includes('ldr') ? 'luz'
                : 'generico';
            const iconMap = {
                temperatura: 'fa-temperature-high',
                humedad: 'fa-droplet',
                movimiento: 'fa-running',
                gas: 'fa-fire',
                luz: 'fa-lightbulb',
                generico: 'fa-microchip'
            };
            const icono = iconMap[tipoNormalizado] || iconMap.generico;
            card.className = `sensor-card-modern sensor-${tipoNormalizado}`;
            card.dataset.id = sensor.id || sensor.sensor || sensor.referencia || '';
            const nombreMostrar = sensor.nombre_sensor || sensor.sensor || 'Sensor';
            const referenciaMostrar = sensor.referencia || '—';

            // NUEVO: obtener valores reales
            const valorMostrar = sensor.valor !== undefined && sensor.valor !== null ? sensor.valor : '--';
            const unidad = tipoNormalizado === 'temperatura' ? '°C' : '';
            const estadoMostrar = sensor.estado || 'Sin datos';
            // Estado visual (color y texto)
            const online = (sensor.estado && sensor.estado.toLowerCase() === 'online');
            const colorEstado = online ? '#43aa8b' : '#adb5bd';
            const textoEstado = online ? 'Online' : 'Offline';
            const ultimoDatoMostrar = sensor.ultimo_dato || '--:--:--';
            const tiempoEncendido = sensor.tiempo_encendido !== undefined && sensor.tiempo_encendido !== null
                ? `${sensor.tiempo_encendido} min`
                : '--';

            card.innerHTML = `
                <div class="sensor-card-icon"><i class="fas ${icono}"></i></div>
                <h4 class="sensor-card-title">${nombreMostrar}</h4>
                <p class="sensor-card-type">${sensor.tipo_sensor || 'Sensor'}</p>
                <div class="sensor-valor" data-sensor-id="${sensor.id}">
                    <span class="valor-num">${valorMostrar}</span>
                    <span class="valor-unidad">${unidad}</span>
                </div>
                <div class="sensor-card-meta">
                    <span class="sensor-meta-label">Ref</span>
                    <strong>${referenciaMostrar}</strong>
                    <span class="sensor-meta-label">Estado</span>
                    <div class="sensor-status ${online ? 'online' : 'offline'} sensor-estado" data-sensor-id="${sensor.id}">
                        <span class="dot"></span>
                        <span class="estado-text">${textoEstado}</span>
                        <small class="tiempo-encendido">Encendido: <span class="tiempo-num">${tiempoEncendido}</span></small>
                    </div>
                </div>
                <div class="sensor-card-footnotes">
                    Último dato: <span class="sensor-ultimo-dato" data-sensor-id="${sensor.id}">${ultimoDatoMostrar}</span>
                </div>
                <div class="sensor-actions">
                    <button class="btn-action primary btn-view-sensor" data-id="${sensor.id}"><i class="fas fa-chart-line"></i><span>Datos</span></button>
                    ${userRole === 'admin' ? `<button class=\"btn-action danger btn-delete-sensor\" data-id=\"${sensor.id}\"><i class=\"fas fa-trash\"></i><span>Eliminar</span></button>` : ''}
                </div>
            `;
            sensorGrid.appendChild(card);
            const btnDatos = card.querySelector('.btn-view-sensor');
            if(btnDatos) {
                btnDatos.onclick = () => openSensorDataModal(sensor);
            }
        });
    }

    // Animación de número (de valor anterior a nuevo)
    function animateNumber(element, start, end, duration = 600) {
        if (start === end) {
            element.textContent = end;
            return;
        }
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.round(start + (end - start) * progress);
            element.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    // Actualizar solo los datos de los sensores (valores, estado, tiempo, último dato)
    function actualizarDatosSensores(sensores) {
        sensores.forEach(sensor => {
            // Valor
            const valorDiv = document.querySelector(`.sensor-valor[data-sensor-id="${sensor.id}"] .valor-num`);
            if (valorDiv) {
                const actual = parseFloat(valorDiv.textContent);
                const nuevo = sensor.valor !== undefined && sensor.valor !== null ? Number(sensor.valor) : '--';
                if (!isNaN(actual) && !isNaN(nuevo)) {
                    animateNumber(valorDiv, actual, nuevo);
                } else {
                    valorDiv.textContent = nuevo;
                }
            }
            // Estado y color
            const estadoDiv = document.querySelector(`.sensor-estado[data-sensor-id="${sensor.id}"]`);
            if (estadoDiv) {
                const online = sensor.estado && sensor.estado.toLowerCase() === 'online';
                const textoEstado = online ? 'Online' : 'Offline';
                estadoDiv.classList.toggle('online', online);
                estadoDiv.classList.toggle('offline', !online);
                const dot = estadoDiv.querySelector('.dot');
                if (dot) dot.style.background = '';
                const estadoText = estadoDiv.querySelector('.estado-text');
                if (estadoText) estadoText.textContent = textoEstado;
                // Tiempo encendido
                const tiempoNum = estadoDiv.querySelector('.tiempo-num');
                if (tiempoNum) tiempoNum.textContent = sensor.tiempo_encendido !== undefined && sensor.tiempo_encendido !== null
                    ? `${sensor.tiempo_encendido} min`
                    : '--';
            }
            // Último dato
            const ultimoDatoDiv = document.querySelector(`.sensor-ultimo-dato[data-sensor-id="${sensor.id}"]`);
            if (ultimoDatoDiv) {
                ultimoDatoDiv.textContent = sensor.ultimo_dato || '--:--:--';
            }
        });
    }

    // --- Cambia la lógica de actualización ---
    let sensoresEstructuraInicializada = false;
    async function cargarSensores() {
        let url = '';
        if (userRole === 'admin') {
            url = 'https://api-tmom.onrender.com/sensores_todos';
        } else {
            url = `https://api-tmom.onrender.com/sensores_usuario/${userId}`;
        }
        try {
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const sensores = res.data;
            if (!sensoresEstructuraInicializada) {
                await renderizarSensoresEstructura(sensores);
                sensoresEstructuraInicializada = true;
            }
            actualizarDatosSensores(sensores);
            totalSensores.textContent = sensores.length;
        } catch (err) {
            if (sensorGrid) {
                sensorGrid.classList.add('is-empty');
                sensorGrid.innerHTML = '<div class="sensor-empty-state"><i class="fas fa-exclamation-circle"></i><p>Error al cargar los sensores.</p></div>';
            }
            totalSensores.textContent = '0';
        }
    }

    // --- Gestión de modal/agregado de sensores SOLO si es admin y existen los elementos ---
    if (userRole === 'admin' && addSensorForm && addSensorModal) {
        if (openAddSensorModal) {
            openAddSensorModal.addEventListener("click", () => {
                addSensorModal.style.display = "flex";
            });
        }
        if (closeAddSensorModal) {
            closeAddSensorModal.addEventListener("click", () => {
                addSensorModal.style.display = "none";
                addSensorForm.reset();
            });
        }
        window.addEventListener("click", (e) => {
            if (e.target === addSensorModal) {
                addSensorModal.style.display = "none";
                addSensorForm.reset();
            }
        });
    }

    // Cargar tipos para el select del modal (usa id como value)
    async function cargarTiposSelect() {
        const sel = document.getElementById('sensorType');
        if (!sel) return;
        try {
            const res = await axios.get('https://api-tmom.onrender.com/tipo_sensor', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const tipos = res.data?.data || [];
            sel.innerHTML = '<option value="" disabled selected>Seleccione tipo</option>';
            tipos.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;          // ← value = id del tipo
                opt.textContent = t.nombre;
                sel.appendChild(opt);
            });
        } catch (e) {
            sel.innerHTML = '<option value="" disabled>Error al cargar tipos</option>';
        }
    }

    // Agregar sensor
    if (userRole === 'admin' && addSensorForm) {
        addSensorForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nombre = document.getElementById("sensorName").value.trim();
            const referencia = document.getElementById("sensorRef").value.trim(); // ← antes sensorId
            const id_tipo_sensor = Number(document.getElementById("sensorType").value); // ← id directo del select
            let id_usuario = userId;
            if (userRole === 'admin') {
                const userSelect = document.getElementById('sensorUser');
                id_usuario = userSelect ? userSelect.value : id_usuario;
            }
            if (!nombre || !referencia || !id_tipo_sensor || !id_usuario) {
                Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
                return;
            }
            try {
                await axios.post('https://api-tmom.onrender.com/add_sensor', {
                    nombre_sensor: nombre,
                    referencia: referencia,
                    id_tipo_sensor: id_tipo_sensor,
                    id_usuario: id_usuario
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                Swal.fire('Éxito', 'Sensor agregado correctamente', 'success');
                addSensorModal.style.display = "none";
                addSensorForm.reset();
                cargarSensores();
            } catch (err) {
                Swal.fire('Error', 'No se pudo agregar el sensor', 'error');
            }
        });
    }

    // Eliminar sensor (solo para el usuario dueño)
    sensorGrid.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete-sensor')) {
            const sensorId = e.target.dataset.id;
            const confirm = await Swal.fire({
                title: '¿Eliminar sensor?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });
            if (confirm.isConfirmed) {
                try {
                    await axios.delete(`https://api-tmom.onrender.com/eliminar_sensor/${sensorId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    Swal.fire('Eliminado', 'Sensor eliminado correctamente', 'success');
                    cargarSensores();
                } catch (err) {
                    Swal.fire('Error', 'No se pudo eliminar el sensor', 'error');
                }
            }
        }
    });

    // --- Refrescar sensores ---
    const refreshBtn = document.getElementById("refresh-btn");
    const lastUpdateEl = document.getElementById("last-update-text");

    function marcarActualizado() {
        if (lastUpdateEl) {
            const ahora = new Date();
            lastUpdateEl.textContent = `Última actualización: ${ahora.toLocaleTimeString()}`;
        }
    }

    async function refrescarSensores() {
        if (!refreshBtn) return;
        refreshBtn.disabled = true;
        const icon = refreshBtn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
        await cargarSensores();
        marcarActualizado();
        setTimeout(() => {
            refreshBtn.disabled = false;
            if (icon) icon.classList.remove('fa-spin');
        }, 300);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", refrescarSensores);
    }

    // Inicializar
    cargarSensores();
    cargarTiposSelect();

    // Actualización en tiempo real cada 10 segundos (solo datos, no estructura)
    setInterval(() => {
        cargarSensores();
    }, 10000);
});

