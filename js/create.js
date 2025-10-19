(() => {
  const API_BASE = 'https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net';
  const TOKEN_KEY = 'token';

  const withAuth = (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { ...(config.headers || {}) };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return axios({ ...config, headers });
  };

  function crearUsuario(event) {
    event?.preventDefault();
    const form = document.getElementById('createUserForm');
    if (!form) return;

    const formData = new FormData(form);
    const payload = {
      nombre: formData.get('nombre')?.trim(),
      apellido: formData.get('apellido')?.trim(),
      correo: formData.get('correo')?.trim(),
      password: formData.get('password')?.trim(),
      celular: formData.get('celular')?.trim(),
      rol: formData.get('rol')
    };

    const camposIncompletos = Object.entries(payload).some(([key, value]) => {
      if (key === 'celular') return !value;
      return !value;
    });

    if (camposIncompletos) {
      Swal.fire('Error', 'Completa todos los campos antes de crear el usuario', 'error');
      return;
    }

    withAuth({ method: 'POST', url: `${API_BASE}/crear_usuario`, data: payload })
      .then(({ data }) => {
        if (data?.error) {
          Swal.fire('Error', data.error, 'error');
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Usuario creado correctamente',
          timer: 1600,
          showConfirmButton: false
        });
        form.reset();
        if (window.__userModule?.reload) {
          window.__userModule.reload();
        }
      })
      .catch((error) => {
        console.error('Error creando usuario:', error);
        Swal.fire('Error', 'No se pudo crear el usuario', 'error');
      });
  }

  window.crearUsuario = crearUsuario;
})();
