function crearUsuario() {
    event.preventDefault(); 

    const formData = new FormData(document.getElementById('createUserForm')); 

    const data = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        correo: formData.get('correo'),
        password: formData.get('password'),
        celular: formData.get('celular'),
        rol: formData.get('rol')
    };

    axios.post('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/crear_usuario', data)
        .then(response => {
            // Mostrar animación de éxito usando SweetAlert
            Swal.fire({
                icon: 'success',
                title: 'Usuario creado exitosamente!',
                showConfirmButton: false,
                timer: 1500
            });

            // Resetear el formulario
            document.getElementById('createUserForm').reset();  
        })
        .catch(error => {
            if (error.response && error.response.status === 409) {
                // Mostrar mensaje de error si el correo ya está registrado
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'El correo ya está registrado!',
                });
            } else {
                console.error('Error creando usuario:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al crear el usuario.',
                });
            }
        });
}


function eliminarUsuario(event) {
    event.preventDefault();
    const correo = document.getElementById('deleteCorreo').value;
    if (correo) {
        axios.delete(`https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/eliminar_usuario/${correo}`)
            .then(function (response) {
                if (response.data.success) {
                    
                    Swal.fire(
                        'Eliminado',
                        'El usuario ha sido eliminado con éxito',
                        'success'
                    );
                    document.getElementById('deleteUserForm').reset();
                } else {
                    
                    Swal.fire(
                        'No encontrado',
                        'El correo ingresado no corresponde a ningún usuario',
                        'error'
                    );
                }
            })
            .catch(function (error) {
                
                Swal.fire(
                    'Error',
                    'Hubo un problema al eliminar el usuario',
                    'error'
                );
            });
    } else {
        Swal.fire(
            'Error',
            'Por favor ingrese un correo válido',
            'error'
        );
    }
}



function buscarUsuario() {
    const correo = document.getElementById('searchCorreo').value;

    axios.get(`https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/obtener_usuario/${correo}`)
        .then(response =>  {
            
            if (response.data.success) {

                const usuario = response.data.usuario;

                // Llenar los datos del usuario en el modal de edición
                document.getElementById('editNombre').value = usuario.nombre;
                document.getElementById('editApellido').value = usuario.apellido;
                document.getElementById('editCorreo').value = usuario.correo; // readonly, no editable
                document.getElementById('editPassword').value = usuario.password;
                document.getElementById('editCelular').value = usuario.celular;
                
                // Cerrar el modal de búsqueda
                const searchUserModal = bootstrap.Modal.getInstance(document.getElementById('searchUserModal'));
                searchUserModal.hide();
                
                // Limpiar el campo de búsqueda
                document.getElementById('searchCorreo').value = '';

                // Abrir el modal de edición
                const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
                editUserModal.show();
                
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Usuario no encontrado',
                    text: 'No existe un usuario registrado con este correo.',
                });
            }
        })
        .catch(function (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al buscar el usuario.',
            });
        });
}




function guardarCambios(event) {
    event.preventDefault();
    const nombre = document.getElementById('editNombre').value;
    const apellido = document.getElementById('editApellido').value;
    const correo = document.getElementById('editCorreo').value; // no editable
    const password = document.getElementById('editPassword').value;
    const celular = document.getElementById('editCelular').value;

    axios.put(`https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/actualizar_usuario`, {
        nombre: nombre,
        apellido: apellido,
        correo: correo,
        password: password,
        celular: celular
    })
    .then(function (response) {
        Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: 'Los datos del usuario han sido actualizados correctamente.',
        });

        // Cerrar el modal de edición
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.hide();
    })
    .catch(function (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al guardar los cambios del usuario.',
        });
    });
}


