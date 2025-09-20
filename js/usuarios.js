function validarlogin() {
    const correo = document.getElementById('txtcorreo').value.trim();
    const password = document.getElementById('txtpassword').value.trim();

    if (correo === "" || password === "") {
        Swal.fire('Error', 'Por favor ingresa ambos campos', 'error');
        return;
    }

    axios.post('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/login', {
        correo: correo,
        password: password
    })
    .then(function (response) {
        console.log("Respuesta completa:", response); 
        console.log("Datos:", response.data); 
        const data = response.data;

        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.rol);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userName', data.nombre); // 👈 Guarda el nombre

            if (data.rol === 'admin') {
                Swal.fire('Éxito', `Bienvenido ${data.nombre} (Administrador)`, 'success').then(() => {
                    window.location.href = 'principal_admin.html'; 
                });
            } else if (data.rol === 'usuario') {
                Swal.fire('Éxito', `Bienvenido ${data.nombre}`, 'success').then(() => {
                    window.location.href = 'principal_usuario.html';  
                });
            } else {
                Swal.fire('Error', 'Rol no reconocido', 'error');
            }
        } else {
            Swal.fire('Error', 'Correo o contraseña incorrectos', 'error');
        }
    })
    .catch(function (error) {
        console.error('Error al hacer login:', error);
        Swal.fire('Error', 'Ocurrió un problema al iniciar sesión', 'error');
    });
}

document.addEventListener('DOMContentLoaded', function() {

    // Mostrar/ocultar pestañas del menú según el rol y marcar activa la pestaña correcta
    const adminTabs = document.querySelectorAll('.admin-only');
    const userTabs = document.querySelectorAll('.user-only');

    // Quitar clase 'active' de todos los enlaces
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));

    if (userRole === 'admin') {
        userTabs.forEach(tab => tab.style.display = 'none');
        adminTabs.forEach(tab => tab.style.display = '');
        // Marcar activa la pestaña de reportes admin si existe
        const repAdmin = document.querySelector('#navReportesAdmin a');
        if (repAdmin) repAdmin.classList.add('active');
    } else if (userRole === 'usuario') {
        adminTabs.forEach(tab => tab.style.display = 'none');
        userTabs.forEach(tab => tab.style.display = '');
        // Marcar activa la pestaña de reportes user si existe
        const repUser = document.querySelector('#navReportesUser a');
        if (repUser) repUser.classList.add('active');
    } else {
        adminTabs.forEach(tab => tab.style.display = 'none');
        userTabs.forEach(tab => tab.style.display = 'none');
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const userRole = localStorage.getItem('userRole');
    console.log('Rol del usuario:', userRole);
    
    if (userRole === 'admin') {
        document.body.classList.add('admin-user');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName') || 'Usuario';
    
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userIcon = document.getElementById('userIcon');
    const welcomeMsg = document.querySelector('.welcome-msg');
    
    // Ocultamos el span del usernameDisplay
    usernameDisplay.style.display = 'none';
    
    if (userRole === 'admin') {
        userIcon.className = 'fas fa-user-shield';
        userIcon.parentElement.classList.add('admin-avatar');
        welcomeMsg.innerHTML = `<strong>Bienvenido Administrador ${userName}</strong>`;
    } else {
        userIcon.className = 'fas fa-user-circle';
        userIcon.parentElement.classList.add('user-avatar');
        welcomeMsg.innerHTML = `<strong>Bienvenido ${userName}</strong>`;
    }
});

function logout() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: "¿Estás seguro de que deseas salir del sistema?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4361ee',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const token = localStorage.getItem('token');
            axios.post('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/logout', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(response => {
                Swal.fire({
                    icon: 'success',
                    title: 'Sesión cerrada con éxito',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    localStorage.clear();
                    // Usar replace en lugar de href para evitar que la página quede en el historial
                    window.location.replace('login.html');
                });
            })
            .catch(error => {
                console.error("Error al cerrar sesión:", error);
                // Aún así limpiamos el localStorage y redirigimos
                localStorage.clear();
                window.location.replace('login.html');
            });
        }
    });
}
// Prevenir que el usuario pueda volver atrás después del logout
window.onload = function() {
    window.history.forward();
};


document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token'); 
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!token && !isLoginPage) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            text: 'Debe iniciar sesión nuevamente.',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            window.location.href = 'login.html';
        });
    } else if (token && !isLoginPage) {
        verificarToken(token);
    }
});

function verificarToken(token) {
    axios.post('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/verificar_token', {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.data.success) {
            manejarTokenInvalido();
        }
    })
    .catch(error => {
        console.error("Error verificando el token:", error);
        manejarTokenInvalido();
    });
}



   // Función para mostrar/ocultar contraseña
    function setupPasswordToggle() {
      const togglePasswordBtn = document.getElementById('togglePasswordBtn');
      const passwordInput = document.getElementById('txtpassword');
      
      if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
          // Cambiar el tipo de input
          if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePasswordBtn.innerHTML = '<i class="far fa-eye-slash"></i>';
          } else {
            passwordInput.type = 'password';
            togglePasswordBtn.innerHTML = '<i class="far fa-eye"></i>';
          }
        });
      }
    }

    // Esperar a que el DOM esté completamente cargado
    document.addEventListener('DOMContentLoaded', function() {
      setupPasswordToggle();
    });

    // También asegurarnos de que funcione si el DOM ya está cargado
    if (document.readyState !== 'loading') {
      setupPasswordToggle();
    }



 // PAGINA DE USUARIOS (usuarios.html)

        // Variables globales
        let usuarios = [];
        let currentPage = 1;
        const usersPerPage = 10;
        let filteredUsers = [];
        
        // Función para alternar visibilidad de contraseña
        function togglePassword(fieldId) {
            const passwordField = document.getElementById(fieldId);
            const toggleBtn = passwordField.nextElementSibling.querySelector('i');
            
            if (passwordField.type === "password") {
                passwordField.type = "text";
                toggleBtn.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordField.type = "password";
                toggleBtn.classList.replace('fa-eye-slash', 'fa-eye');
            }
        }
        
        // Función para cerrar modales
        function cerrarModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        // Función para abrir modal de edición
        function abrirModalEdicion(correo) {
            // Buscar el usuario en la lista
            const usuario = usuarios.find(u => u.correo === correo);
            
            if (usuario) {
                document.getElementById('editNombre').value = usuario.nombre;
                document.getElementById('editApellido').value = usuario.apellido;
                document.getElementById('editCorreo').value = usuario.correo;
                document.getElementById('editCelular').value = usuario.celular;
                document.getElementById('editRol').value = usuario.rol;
                document.getElementById('editPassword').value = '';
                
                document.getElementById('editUserModal').style.display = 'flex';
            }
        }
        
        // Función para abrir modal de confirmación de eliminación
        function abrirModalEliminacion(correo, nombreCompleto) {
            document.getElementById('userToDelete').textContent = nombreCompleto;
            document.getElementById('deleteCorreo').value = correo;
            document.getElementById('confirmDeleteModal').style.display = 'flex';
        }
        
        // Función para cargar usuarios desde la API
        function cargarUsuarios() {
            document.getElementById('refreshUsers').classList.add('loading');
            
            axios.get('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/obtener_usuarios')
                .then(response => {
                    usuarios = response.data.usuarios || [];
                    filteredUsers = [...usuarios];
                    
                    // Actualizar estadísticas
                    actualizarEstadisticas();
                    
                    // Renderizar tabla
                    renderizarTablaUsuarios();
                    
                    // Actualizar marca de tiempo
                    const ahora = new Date();
                    document.getElementById('lastUpdateTime').textContent = 
                        `Hoy a las ${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')}`;
                })
                .catch(error => {
                    console.error('Error al cargar usuarios:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo cargar la lista de usuarios',
                    });
                })
                .finally(() => {
                    document.getElementById('refreshUsers').classList.remove('loading');
                });
        }
        
        // Función para actualizar las estadísticas
        function actualizarEstadisticas() {
            const total = usuarios.length;
            const admins = usuarios.filter(u => u.rol == 1).length;
            
            document.getElementById('totalUsers').textContent = total;
            document.getElementById('adminUsers').textContent = admins;
        }
        
        // Función para renderizar la tabla de usuarios
        function renderizarTablaUsuarios() {
            const tableBody = document.getElementById('usersTableBody');
            tableBody.innerHTML = '';
            
            const startIndex = (currentPage - 1) * usersPerPage;
            const endIndex = Math.min(startIndex + usersPerPage, filteredUsers.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const usuario = filteredUsers[i];
                const row = document.createElement('tr');
                
                // Mapear roles a texto
                let rolTexto = '';
                let rolClase = '';
                switch(usuario.rol) {
                    case 1: rolTexto = 'Admin'; rolClase = 'admin'; break;
                    case 2: rolTexto = 'Usuario'; rolClase = 'user'; break;
                }
                
                
                row.innerHTML = `
                    <td>
                        <div class="user-avatar">
                            <i class="fas fa-user-circle"></i>
                            <span>${usuario.nombre} ${usuario.apellido}</span>
                        </div>
                    </td>
                    <td>${usuario.correo}</td>
                    <td><span class="badge ${rolClase}">${rolTexto}</span></td>
                    <td>
                        <button class="btn-action edit" title="Editar" onclick="abrirModalEdicion('${usuario.correo}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" title="Eliminar" onclick="abrirModalEliminacion('${usuario.correo}', '${usuario.nombre} ${usuario.apellido}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            }
            
            // Actualizar información de paginación
            document.getElementById('paginationInfo').textContent = 
                `Mostrando ${startIndex + 1}-${endIndex} de ${filteredUsers.length} usuarios`;
            document.getElementById('currentPage').textContent = currentPage;
            
            // Habilitar/deshabilitar botones de paginación
            document.getElementById('prevPage').disabled = currentPage === 1;
            document.getElementById('nextPage').disabled = endIndex >= filteredUsers.length;
        }
        
        // Función para buscar usuarios
        function buscarUsuarios() {
            const searchTerm = document.getElementById('userSearch').value.toLowerCase();
            
            if (searchTerm === '') {
                filteredUsers = [...usuarios];
            } else {
                filteredUsers = usuarios.filter(u => 
                    u.nombre.toLowerCase().includes(searchTerm) || 
                    u.apellido.toLowerCase().includes(searchTerm) ||
                    u.correo.toLowerCase().includes(searchTerm)
                );
            }
            
            currentPage = 1; // Resetear a la primera página
            renderizarTablaUsuarios();
        }
        
        // Función para eliminar usuario confirmado
        function eliminarUsuarioConfirmado() {
            const correo = document.getElementById('deleteCorreo').value;
            
            axios.delete(`https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/eliminar_usuario/${correo}`)
                .then(response => {
                    if (response.data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Usuario eliminado',
                            text: 'El usuario ha sido eliminado correctamente',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        
                        // Cerrar modal y recargar lista
                        cerrarModal('confirmDeleteModal');
                        cargarUsuarios();
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo eliminar el usuario',
                        });
                    }
                })
                .catch(error => {
                    console.error('Error al eliminar usuario:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Hubo un problema al eliminar el usuario',
                    });
                });
        }
        
        // Event listeners
        document.getElementById('refreshUsers').addEventListener('click', function() {
            this.classList.add('loading');
            cargarUsuarios();
        });
        document.getElementById('prevPage').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderizarTablaUsuarios();
            }
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderizarTablaUsuarios();
            }
        });
        
        // Cargar usuarios al iniciar
        document.addEventListener('DOMContentLoaded', cargarUsuarios);




        /*usuer y admiin*/ 
        if (user.rol === "admin") {
    window.location.href = "principal_admin.html";
} else {
    window.location.href = "principal_usuario.html";
}

