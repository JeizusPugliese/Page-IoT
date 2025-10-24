function mostrarHistorial(sensorId) {
    // Mostrar spinner de carga
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = `
        <div class="spinner-icon">
            <div class="spinner-circle"></div>
        </div>
        <p>Cargando datos...</p>
    `;
    document.body.appendChild(spinner);
    
    // Realizar la petición a la API
    fetch(`https://api-tmom.onrender.com/historial?sensor=${sensorId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            // Ocultar spinner
            document.body.removeChild(spinner);
            
            // Obtener elementos del DOM
            const historialBody = document.getElementById('historialBody');
            const modalTitle = document.getElementById('historialModalLabel');
            
            // Configurar título del modal según el sensor
            const sensorNames = {
                1: 'DHT11 Temperatura',
                2: 'MQ7 Sensor',
                3: 'PIR Sensor',
                4: 'HC-SR04',
                5: 'LDR Sensor',
                6: 'DHT11 Humedad'
            };
            modalTitle.textContent = `Historial: ${sensorNames[sensorId] || 'Sensor'}`;
            
            // Limpiar tabla
            historialBody.innerHTML = '';
            
            // Llenar tabla con los datos
            if (data.length === 0) {
                historialBody.innerHTML = `
                    <tr>
                        <td colspan="2" class="no-data">No hay datos disponibles</td>
                    </tr>
                `;
            } else {
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDate(item.fecha)}</td>
                        <td>${item.valor}</td>
                    `;
                    historialBody.appendChild(row);
                });
            }
            
            // Mostrar el modal
            document.getElementById('historialModal').style.display = 'block';
            
            // Configurar ordenación y paginación (versión minimalista)
            setupTableSorting();
        })
        .catch(error => {
            console.error('Error al obtener el historial:', error);
            document.body.removeChild(spinner);
            
            // Mostrar mensaje de error
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Error al cargar los datos. Por favor, intente nuevamente.';
            document.body.appendChild(errorMessage);
            
            // Eliminar mensaje después de 3 segundos
            setTimeout(() => {
                document.body.removeChild(errorMessage);
            }, 3000);
        });
}

// Función para formatear la fecha
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    try {
        return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch (e) {
        return dateString; // Si hay error, devolver el string original
    }
}

// Configuración minimalista de ordenación para la tabla
function setupTableSorting() {
    const table = document.getElementById('historialTable');
    const headers = table.querySelectorAll('th');
    const tbody = table.querySelector('tbody');
    
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            sortTable(index);
        });
    });
    
    function sortTable(columnIndex) {
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const direction = table.getAttribute('data-sort-direction') === 'asc' ? 'desc' : 'asc';
        table.setAttribute('data-sort-direction', direction);
        
        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent.trim();
            const bValue = b.cells[columnIndex].textContent.trim();
            
            // Intentar comparar como números si es posible
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'asc' ? aNum - bNum : bNum - aNum;
            }
            
            // Comparar como strings si no son números
            return direction === 'asc' 
                ? aValue.localeCompare(bValue) 
                : bValue.localeCompare(aValue);
        });
        
        // Reinsertar filas ordenadas
        rows.forEach(row => tbody.appendChild(row));
    }
}

// Función para cerrar el modal
function cerrarModal() {
    document.getElementById('historialModal').style.display = 'none';
}




