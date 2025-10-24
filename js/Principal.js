(() => {
  const API_BASE = 'https://api-tmom.onrender.com';
  const TOKEN_KEY = 'token';
  const ROLE_KEY = 'userRole';
  const USER_ID_KEY = 'userId';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getRole = () => localStorage.getItem(ROLE_KEY);
  const getUserId = () => localStorage.getItem(USER_ID_KEY);

  const withAuth = (config) => {
    const token = getToken();
    const headers = { ...(config.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    return axios({ ...config, headers });
  };

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  function actualizarTotalSensoresUsuario() {
    const userId = getUserId();
    if (!userId) {
      setText('totalSensores', '0');
      setText('totalStats', '0');
      return;
    }

    withAuth({ method: 'GET', url: `${API_BASE}/sensores_usuario/${userId}` })
      .then(({ data }) => {
        const sensores = Array.isArray(data) ? data : [];
        setText('totalSensores', sensores.length);

        const activos = sensores.filter((sensor) => (sensor.estado || '').toLowerCase() === 'online').length;
        setText('totalStats', activos);
      })
      .catch((error) => {
        console.error('Error al obtener sensores del usuario:', error);
        setText('totalSensores', '0');
        setText('totalStats', '0');
      });
  }

  function actualizarTotalUsuariosDashboard() {
    if (getRole() !== 'admin') return;
    withAuth({ method: 'GET', url: `${API_BASE}/obtener_usuarios` })
      .then(({ data }) => {
        const users = data?.usuarios || [];
        setText('totalUsers', users.length);
      })
      .catch((error) => {
        console.error('Error al obtener usuarios:', error);
        setText('totalUsers', '0');
      });
  }

  function actualizarTotalSensoresAdmin() {
    if (getRole() !== 'admin') return;
    withAuth({ method: 'GET', url: `${API_BASE}/sensores_todos` })
      .then(({ data }) => {
        if (!Array.isArray(data)) {
          setText('totalSensors', '0');
          return;
        }
        const uniqueSensors = new Set(data.map((item) => item.sensor));
        setText('totalSensors', uniqueSensors.size);
      })
      .catch((error) => {
        console.error('Error al obtener sensores:', error);
        setText('totalSensors', '0');
      });
  }

  function actualizarTotalReportesAdmin() {
    if (getRole() !== 'admin') return;
    setText('totalReports', '—');
  }

  function actualizarIndicadores() {
    actualizarTotalSensoresUsuario();
    actualizarTotalUsuariosDashboard();
    actualizarTotalSensoresAdmin();
    actualizarTotalReportesAdmin();
  }

  document.addEventListener('DOMContentLoaded', actualizarIndicadores);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      actualizarIndicadores();
    }
  });
})();
