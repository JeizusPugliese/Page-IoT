// Mostrar el total de sensores del usuario en el dashboard principal
function actualizarTotalSensoresUsuario() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        document.getElementById('totalSensores').textContent = '0';
        return;
    }
    axios.get(`https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/sensores_usuario/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(response => {
        const sensores = response.data || [];
        document.getElementById('totalSensores').textContent = sensores.length;
    })
    .catch(error => {
        console.error('Error al obtener sensores:', error);
        document.getElementById('totalSensores').textContent = '0';
    });
}


// ADMIN: Total de usuarios
function actualizarTotalUsuariosDashboard() {
    axios.get('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/obtener_usuarios')
        .then(response => {
            const usuarios = response.data.usuarios || [];
            const el = document.getElementById('totalUsers');
            if (el) el.textContent = usuarios.length;
        })
        .catch(error => {
            console.error('Error al obtener usuarios:', error);
            const el = document.getElementById('totalUsers');
            if (el) el.textContent = '0';
        });
}

// ADMIN: Total de sensores
function actualizarTotalSensoresAdmin() {
    axios.get('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/sensores')
        .then(response => {
            const sensores = response.data || [];
            const el = document.getElementById('totalSensors');
            if (el) el.textContent = sensores.length;
        })
        .catch(error => {
            console.error('Error al obtener sensores (admin):', error);
            const el = document.getElementById('totalSensors');
            if (el) el.textContent = '0';
        });
}

// ADMIN: Total de reportes (placeholder, debes ajustar el endpoint si tienes uno real)
function actualizarTotalReportesAdmin() {
    // Reemplaza este endpoint si tienes uno real para contar reportes
    axios.get('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/reportes')
        .then(response => {
            const reportes = response.data || [];
            const el = document.getElementById('totalReports');
            if (el) el.textContent = reportes.length;
        })
        .catch(error => {
            console.error('Error al obtener reportes:', error);
            const el = document.getElementById('totalReports');
            if (el) el.textContent = '0';
        });
}

// USUARIO: Total de estadísticas (placeholder, debes ajustar el endpoint si tienes uno real)
function actualizarTotalStatsUsuario() {
    // Reemplaza este endpoint si tienes uno real para contar estadísticas
    // Por ejemplo: axios.get('.../estadisticas_usuario/'+userId)
    const el = document.getElementById('totalStats');
    if (el) el.textContent = '0'; // Cambia esto por la lógica real si tienes endpoint
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    actualizarTotalSensoresUsuario();
    actualizarTotalUsuariosDashboard();
    actualizarTotalSensoresAdmin();
    actualizarTotalReportesAdmin();
    actualizarTotalStatsUsuario();
});

// Auto-actualización al volver a la pestaña
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        actualizarTotalSensoresUsuario();
        actualizarTotalUsuariosDashboard();
        actualizarTotalSensoresAdmin();
        actualizarTotalReportesAdmin();
        actualizarTotalStatsUsuario();
    }
});

        