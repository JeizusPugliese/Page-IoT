
document.getElementById('addSensorForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevenir recarga de la página
    
    const sensorName = document.getElementById('sensorName').value;
    const sensorReference = document.getElementById('sensorReference').value;
    
    // Enviar los datos a la API usando Axios
    axios.post('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/add_sensor', {
        sensor_name: sensorName,
        sensor_reference: sensorReference
    })
    .then(function(response) {
        console.log(response.data.message);
        document.getElementById('successMessage').style.display = 'block';
        setTimeout(() => {
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('sensorModal').classList.remove('show');
            document.body.classList.remove('modal-open');
            document.querySelector('.modal-backdrop').remove();
            document.getElementById('sensorName').value = '';
            document.getElementById('sensorReference').value = '';
        }, 2000);

        // Llamar a la función para agregar la nueva tarjeta del sensor
        addSensorCard(sensorName, sensorReference);
    })
    .catch(function(error) {
        console.error(error);
    });
});

// Función para agregar una tarjeta de sensor al dashboard
function addSensorCard(name, reference) {
    const sensorCards = document.getElementById('sensorCards');
    const newCard = `
        <div class="col-xl-3 col-md-6">
            <div class="card bg-info text-white mb-4">
                <div class="card-body">${name}</div>
                <div class="card-footer d-flex align-items-center justify-content-between">
                    <span>Referencia: ${reference}</span>
                </div>
            </div>
        </div>
    `;
    sensorCards.innerHTML += newCard;
}


