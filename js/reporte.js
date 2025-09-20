// Variables globales para almacenar los datos actuales
let datosActuales = [];
let chartTendencias = null;

function mostrarEstadisticas(datos) {
    // Total de registros
    document.getElementById('totalRegistros').textContent = datos.length;
    // Sensores distintos
    const sensores = [...new Set(datos.map(d => d.nombreSensor || d.sensor))];
    document.getElementById('totalSensores').textContent = sensores.length;
    // Rango de fechas
    if (datos.length > 0) {
        const fechas = datos.map(d => new Date(d.fecha)).sort((a, b) => a - b);
        const inicio = fechas[0].toLocaleDateString();
        const fin = fechas[fechas.length - 1].toLocaleDateString();
        document.getElementById('rangoFechas').textContent = `${inicio} - ${fin}`;
    } else {
        document.getElementById('rangoFechas').textContent = '-';
    }
}

function mostrarResumenFiltros(filtros) {
    const resumen = document.getElementById('resumenFiltros');
    resumen.style.display = 'block';
    resumen.innerHTML = `<strong>Filtros aplicados:</strong> Sensor: <b>${filtros.nombreSensor || 'Todos'}</b>, Desde: <b>${filtros.fechaInicio || '-'}</b>, Hasta: <b>${filtros.fechaFin || '-'}</b>`;
}

function mostrarGrafico(datos) {
    if (!datos || datos.length === 0) {
        document.getElementById('graficoTendencias').style.display = 'none';
        return;
    }
    document.getElementById('graficoTendencias').style.display = 'block';
    // Agrupar por fecha
    const agrupado = {};
    datos.forEach(d => {
        const fecha = d.fecha.split('T')[0];
        if (!agrupado[fecha]) agrupado[fecha] = [];
        agrupado[fecha].push(Number(d.valor));
    });
    const labels = Object.keys(agrupado).sort();
    const valores = labels.map(f => {
        const arr = agrupado[f];
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    if (chartTendencias) chartTendencias.destroy();
    chartTendencias = new Chart(document.getElementById('chartTendencias'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Promedio diario',
                data: valores,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67,97,238,0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Tendencia de valores por fecha' }
            },
            responsive: true
        }
    });
}

function inicializarDataTable() {
    if ($.fn.dataTable.isDataTable('#tablaResultados')) {
        $('#tablaResultados').DataTable().clear();  
        $('#tablaResultados').DataTable().destroy();  
    }
    $('#tablaResultados').DataTable({
        paging: true,
        searching: true,
        ordering: true,
        info: true,
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/Spanish.json'
        },
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'print'
        ],
        columnDefs: [
            { targets: '_all', className: 'mdc-data-table__cell' }
        ]
    });
}

// Manejo del formulario de filtros

document.getElementById('formReporte').addEventListener('submit', function(e) {
    e.preventDefault();
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const nombreSensor = document.getElementById('nombreSensor').value;
    Swal.fire({
        title: 'Consultando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    axios.post('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/consultar_reportes', {
        fechaInicio, fechaFin, nombreSensor
    })
    .then(function(response) {
        Swal.close();
        const resultados = response.data;
        if (!resultados || resultados.length === 0) {
            // Limpiar tabla y estadísticas
            document.getElementById('tablaResultados').querySelector('tbody').innerHTML = '';
            mostrarEstadisticas([]);
            mostrarResumenFiltros({fechaInicio, fechaFin, nombreSensor});
            mostrarGrafico([]);
            Swal.fire('Sin datos', 'No se encontraron registros para los filtros seleccionados.', 'info');
            return;
        }
        datosActuales = resultados;
        // Llenar tabla
        const tbody = document.getElementById('tablaResultados').querySelector('tbody');
        tbody.innerHTML = '';
        resultados.forEach(result => {
            const row = `<tr>
                            <td>${result.nombreSensor}</td>
                            <td>${result.valor}</td>
                            <td>${result.fecha}</td>
                        </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        mostrarEstadisticas(resultados);
        mostrarResumenFiltros({fechaInicio, fechaFin, nombreSensor});
        mostrarGrafico(resultados);
        inicializarDataTable();
        // Mostrar modal
        const modalEl = document.getElementById('resultadosModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    })
    .catch(function(error) {
        Swal.close();
        Swal.fire('Error', 'No se pudieron obtener los reportes.', 'error');
    });
});

// Consultar todos los sensores

document.getElementById('consultarTodos').addEventListener('click', function () {
    Swal.fire({
        title: 'Consultando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    axios.get('https://apigreentech-e7g6a3e8hbbwdxf8.brazilsouth-01.azurewebsites.net/sensores_todos')
        .then(function (response) {
            Swal.close();
            const datos = response.data;
            if (!datos || datos.length === 0) {
                document.getElementById('tablaResultados').getElementsByTagName('tbody')[0].innerHTML = '';
                mostrarEstadisticas([]);
                mostrarResumenFiltros({nombreSensor: 'Todos', fechaInicio: '', fechaFin: ''});
                mostrarGrafico([]);
                Swal.fire('Sin datos', 'No hay registros de sensores en la base de datos.', 'info');
                return;
            }
            datosActuales = datos.map(sensor => ({
                nombreSensor: sensor.sensor,
                valor: sensor.valor,
                fecha: sensor.fecha
            }));
            const tablaResultados = document.getElementById('tablaResultados').getElementsByTagName('tbody')[0];
            tablaResultados.innerHTML = '';
            datosActuales.forEach(function (sensor) {
                const fila = tablaResultados.insertRow();
                fila.insertCell(0).textContent = sensor.nombreSensor;
                fila.insertCell(1).textContent = sensor.valor;
                fila.insertCell(2).textContent = sensor.fecha;
            });
            mostrarEstadisticas(datosActuales);
            mostrarResumenFiltros({nombreSensor: 'Todos', fechaInicio: '', fechaFin: ''});
            mostrarGrafico(datosActuales);
            inicializarDataTable();
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('resultadosModal'));
            modal.show();
        })
        .catch(function (error) {
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al obtener los datos de los sensores.'
            });
        });
});

// Exportar PDF mejorado

document.getElementById('descargarPDF').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    // Portada
    doc.setFillColor(67, 97, 238);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(22);
    doc.text('Reporte de Sensores IoT', 105, 18, {align:'center'});
    doc.setFontSize(12);
    doc.text('Generado por: ' + (localStorage.getItem('userName') || 'Usuario'), 105, 28, {align:'center'});
    doc.setFontSize(10);
    doc.text('Fecha de generación: ' + new Date().toLocaleString(), 105, 35, {align:'center'});
    // Logo (opcional, si tienes base64 o url)
    // doc.addImage('data:image/png;base64,...', 'PNG', 10, 10, 20, 20);
    doc.setTextColor(0,0,0);
    doc.setFontSize(12);
    doc.text('Filtros aplicados:', 14, 50);
    const filtros = document.getElementById('resumenFiltros').innerText;
    doc.setFontSize(10);
    doc.text(filtros, 14, 56);
    // Tabla
    doc.autoTable({
        startY: 65,
        head: [['Sensor', 'Valor', 'Fecha']],
        body: datosActuales.map(d => [d.nombreSensor, d.valor, d.fecha]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [67, 97, 238], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 244, 255] },
        margin: { left: 14, right: 14 }
    });
    // Totales
    const total = datosActuales.length;
    const sensores = [...new Set(datosActuales.map(d => d.nombreSensor))];
    doc.setFontSize(11);
    doc.text(`Total de registros: ${total}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(`Sensores distintos: ${sensores.length}`, 14, doc.lastAutoTable.finalY + 16);
    doc.save('reporte_sensores.pdf');
});

// Flatpickr (si lo usas, si no, puedes quitar esto)
if (window.flatpickr) {
  flatpickr("#fechaInicio", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    locale: flatpickr.l10ns.es,
    altInputClass: "form-control"
  });
  flatpickr("#fechaFin", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    minDate: "today",
    locale: flatpickr.l10ns.es,
    altInputClass: "form-control"
  });
}



