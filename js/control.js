// ==============================
// CONTROL DE SENSORES PROFESIONAL
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    // --- Modal tipo weather-app para datos del sensor ---
    const sensorDataModal = document.getElementById('sensorDataModal');
    const sensorDataModalContent = document.getElementById('sensorDataModalContent');
    const closeSensorDataModal = document.getElementById('closeSensorDataModal');

    function openSensorDataModal(sensor) {
        // Puedes personalizar el fondo dinámicamente según tipo si lo deseas
        let icono = '<i class="fas fa-microchip"></i>';
        const tipo = (sensor.tipo_sensor || '').toLowerCase();
        if(tipo.includes('temp')) icono = '<i class="fas fa-temperature-high"></i>';
        else if(tipo.includes('hum')) icono = '<i class="fas fa-droplet"></i>';
        else if(tipo.includes('mov') || tipo.includes('pir')) icono = '<i class="fas fa-running"></i>';
        else if(tipo.includes('gas') || tipo.includes('mq')) icono = '<i class="fas fa-fire"></i>';
        else if(tipo.includes('luz') || tipo.includes('ldr')) icono = '<i class="fas fa-lightbulb"></i>';

        sensorDataModalContent.innerHTML = `
            <div style="margin-bottom:1.2rem;">${icono}</div>
            <div style="font-size:2.1rem;font-weight:700;letter-spacing:1px;">${sensor.nombre_sensor || sensor.sensor || 'Sensor'}</div>
            <div style="font-size:1.1rem;margin-bottom:0.7rem;">${sensor.tipo_sensor || 'Tipo'}</div>
            <div style="font-size:4.2rem;font-weight:800;line-height:1;margin-bottom:0.5rem;text-shadow:2px 4px 8px #0007;">${sensor.valor !== undefined ? sensor.valor : '--'}<span style="font-size:2.2rem;font-weight:400;vertical-align:super;">${tipo.includes('temp') ? '°C' : ''}</span></div>
            <div style="font-size:1.3rem;font-style:italic;font-weight:600;margin-bottom:0.7rem;">${sensor.estado || 'Sin datos'}</div>
            <div style="font-size:1.1rem;">Última lectura: <b>${sensor.ultimo_dato || '--:--:--'}</b></div>
            <div style="font-size:1.05rem;margin-top:1.2rem;opacity:0.85;">Ref: ${sensor.referencia || '—'}</div>
        `;
        sensorDataModal.style.display = 'flex';
    }

    if(closeSensorDataModal && sensorDataModal) {
        closeSensorDataModal.onclick = () => { sensorDataModal.style.display = 'none'; };
        sensorDataModal.onclick = (e) => { if(e.target === sensorDataModal) sensorDataModal.style.display = 'none'; };
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
        sensorGrid.innerHTML = '';
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
            card.className = `sensor-card user-sensor sensor-${tipoNormalizado}`;
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
                <div class="sensor-card-modern" style="background:#fff;border-radius:18px;box-shadow:0 4px 18px 0 rgba(67,97,238,0.10);padding:1.2rem 1.1rem 1.1rem 1.1rem;min-width:180px;max-width:220px;min-height:210px;position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;margin:auto;">
                    <div style="position:absolute;top:1.1rem;right:1.1rem;font-size:2.2rem;color:#4361ee;">
                        <i class="fas ${icono}"></i>
                    </div>
                    <div style="margin-bottom:0.7rem;width:100%;">
                        <span class="sensor-name" style="font-size:1.1rem;font-weight:600;color:#222;">${nombreMostrar}</span>
                    </div>
                    <div class="sensor-valor" data-sensor-id="${sensor.id}" style="font-size:2.1rem;font-weight:700;color:#222;line-height:1;margin-bottom:0.2rem;">
                        <span class="valor-num">${sensor.valor !== undefined && sensor.valor !== null ? sensor.valor : '--'}</span>
                        <span class="valor-unidad" style="font-size:1.1rem;font-weight:400;vertical-align:super;">${unidad}</span>
                    </div>
                    <div style="font-size:0.95rem;color:#888;margin-bottom:0.5rem;">${sensor.tipo_sensor || 'Sensor'}</div>
                    <div style="display:flex;flex-direction:row;gap:1.2rem;width:100%;justify-content:space-between;margin-bottom:0.2rem;">
                        <div style="text-align:left;">
                            <div style="font-size:0.9rem;color:#888;">Ref</div>
                            <div style="font-size:1.05rem;color:#495057;">${referenciaMostrar}</div>
                        </div>
                        <div style="text-align:left;">
                            <div style="font-size:0.9rem;color:#888;">Estado</div>
                            <div class="sensor-estado" data-sensor-id="${sensor.id}" style="font-size:1.05rem;color:#adb5bd;">
                                <span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${colorEstado};margin-right:4px;"></span>
                                <span class="estado-text">${textoEstado}</span>
                                <div class="tiempo-encendido" style="font-size:0.85rem;color:#43aa8b;margin-top:0.2rem;">Encendido: <span class="tiempo-num">${tiempoEncendido}</span></div>
                            </div>
                        </div>
                    </div>
                    <div style="font-size:0.9rem;color:#888;margin-bottom:0.2rem;">Último dato</div>
                    <div class="sensor-ultimo-dato" data-sensor-id="${sensor.id}" style="font-size:1.05rem;color:#495057;margin-bottom:0.7rem;">${ultimoDatoMostrar}</div>
                    <div class="sensor-actions" style="display:flex;gap:0.5rem;justify-content:center;width:100%;margin-top:auto;">
                        <button class="btn-action primary btn-view-sensor" data-id="${sensor.id}" style="background:#4361ee;color:#fff;border:none;padding:0.35rem 0.8rem;border-radius:7px;cursor:pointer;display:flex;align-items:center;gap:0.4rem;font-size:0.95rem;width:100%;justify-content:center;"><i class="fas fa-chart-line"></i><span>Datos</span></button>
                        ${userRole === 'admin' ? `<button class=\"btn-action danger btn-delete-sensor\" data-id=\"${sensor.id}\" style=\"background:#e63946;color:#fff;border:none;padding:0.35rem 0.8rem;border-radius:7px;cursor:pointer;display:flex;align-items:center;gap:0.4rem;font-size:0.95rem;\"><i class=\"fas fa-trash\"></i><span>Eliminar</span></button>` : ''}
                    </div>
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
                const colorEstado = online ? '#43aa8b' : '#adb5bd';
                const textoEstado = online ? 'Online' : 'Offline';
                const dot = estadoDiv.querySelector('.dot');
                if (dot) dot.style.background = colorEstado;
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
            sensorGrid.innerHTML = '<p style="text-align:center;color:red;">Error al cargar sensores.</p>';
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

