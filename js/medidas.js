function cargardatos() {
    axios.get('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/get_medidas')
        .then(function (response) {
            console.log(response)
            var data = response.data;
            

            var table = document.getElementById('datatablesSimple').getElementsByTagName('tbody')[0];
         
            table.innerHTML = ''; // Limpiar la tabla antes de llenarla

            data.forEach(function (item) {
                var row = table.insertRow();
                row.insertCell(0).innerText = item.id;
                row.insertCell(1).innerText = item.id_sensor;
                row.insertCell(2).innerText = item.id_usuarios;
                row.insertCell(3).innerText = item.valor_de_la_medida;
                row.insertCell(4).innerText = item.fecha;
            });



        })



        .catch(function (error) {
            console.error('Error al obtener los datos:', error);
        });
}

