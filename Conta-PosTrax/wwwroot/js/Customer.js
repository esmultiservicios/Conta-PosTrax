$(function () {
    // Configuración específica para clientes
    const clientesConfig = {
        entity: 'Customer',//Controlador
        url: '/Customer/GetCustomers',
        filters: ['Codigo', 'Nombre', 'RTN', 'Email'],
        columns: [
            {
                data: 'Codigo',
                className: 'align-middle',
                width: '100px',
                render: function (data) {
                    return data || '--';
                }
            },
            {
                data: 'Nombre',
                className: 'align-middle',
                width: '200px',
                render: function (data, type, row) {
                    return data ? `<a href="/Customer/Details/${row.Id}" class="text-primary fw-medium">${data}</a>` : '--';
                }
            },
            {
                data: 'RTN',
                className: 'align-middle',
                width: '150px',
                render: function (data) {
                    return data || '--';
                }
            },
            {
                data: 'Telefono',
                className: 'align-middle',
                width: '120px',
                render: function (data) {
                    return data || '--';
                }
            },
            {
                data: 'Email',
                className: 'align-middle',
                width: '200px',
                render: function (data) {
                    return data ? `<a href="mailto:${data}" class="text-primary">${data}</a>` : '--';
                }
            },
            {
                data: 'Balance',
                className: 'text-end align-middle',
                width: '120px',
                render: function (data) {
                    const amount = parseFloat(data) || 0;
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="${colorClass} fw-bold">${formatCurrency(data)}</span>`;
                }
            },
            {
                data: 'CreatedAt',
                className: 'align-middle',
                width: '150px',
                render: function (data) {
                    return formatDate(data);
                }
            },
            {
                data: 'Id',
                className: 'text-end align-middle',
                orderable: false,
                searchable: false,
                width: '100px'
            }
        ],
        buttons: [
            {
                text: '<i class="fas fa-sync-alt fa-lg"></i> Actualizar',
                titleAttr: 'Actualizar Clientes',
                className: 'btn btn-info btn-sm me-2',
                action: function (e, dt, node, config) {
                    dt.ajax.reload(null, false);
                }
            },
            {
                text: '<i class="fas fa-plus fa-lg"></i> Nuevo Cliente',
                titleAttr: 'Registrar Cliente',
                className: 'btn btn-primary btn-sm me-2',
                action: function () {
                    window.location.href = '/Customer/Create';
                }
            },
            {
                extend: 'excelHtml5',
                text: '<i class="fas fa-file-excel fa-lg"></i> Excel',
                titleAttr: 'Exportar a Excel',
                title: 'Reporte de Clientes',
                className: 'btn btn-success btn-sm me-2',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6]
                }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="fas fa-file-pdf fa-lg"></i> PDF',
                titleAttr: 'Exportar a PDF',
                title: 'Reporte de Clientes',
                className: 'btn btn-danger btn-sm me-2',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6]
                },
                customize: function (doc) {
                    doc.styles.title = {
                        color: '#2c3e50',
                        fontSize: '18',
                        alignment: 'center',
                        margin: [0, 0, 0, 10]
                    };
                    doc.styles.tableHeader = {
                        bold: true,
                        fontSize: 10,
                        color: 'white',
                        fillColor: '#3498db',
                        alignment: 'center'
                    };
                }
            },
            {
                extend: 'colvis',
                text: '<i class="fas fa-columns fa-lg"></i> Columnas',
                titleAttr: 'Mostrar/Ocultar Columnas',
                className: 'btn btn-secondary btn-sm'
            }
        ],
        customActions: [
            {
                type: 'details',
                url: (id) => `/Customer/Details/${id}`,
                text: 'Ver detalles',
                iconClass: 'far fa-eye',
                textClass: 'text-info'
            },
            {
                type: 'edit',
                url: (id) => `/Customer/EditCustomer/${id}`,
                text: 'Modificar cliente',
                iconClass: 'far fa-edit',
                textClass: 'text-primary'
            },
            {
                type: 'divider'
            },
            {
                type: 'custom',
                url: (id, row) => `mailto:${row.Email}?subject=Contacto desde sistema&body=Estimado/a ${row.Nombre},`,
                text: 'Enviar correo',
                iconClass: 'fas fa-envelope',
                textClass: 'text-warning',
                attrs: 'target="_blank"'
            },
            {
                type: 'custom',
                url: (id) => `/Customer/Statement/${id}`,
                text: 'Estado de cuenta',
                iconClass: 'fas fa-file-invoice-dollar',
                textClass: 'text-success'
            },
            {
                type: 'divider'
            },
            {
                type: 'delete',
                text: 'Eliminar',
                iconClass: 'far fa-trash-alt',
                textClass: 'text-danger',
                className: 'btn-delete',
                attrs: 'data-confirm="¿Está seguro de eliminar este cliente?"'
            }
        ]
    };

    // Inicializar la tabla
    const dataTable = DTHelper.init('#clientesTable', clientesConfig);

    // Eventos adicionales específicos para clientes
    $('#filterCodigo, #filterNombre, #filterRTN, #filterEmail').on('keyup change', function () {
        dataTable.ajax.reload();
    });

    $(document).on('click', '#clearFilters', function () {
        $('#filterCodigo, #filterNombre, #filterRTN, #filterEmail').val('');
        dataTable.ajax.reload();
    });

    $(document).on('click', '#clientesTable a[href^="mailto:"]', function (e) {
        const email = $(this).attr('href').replace('mailto:', '').split('?')[0];

        if (!email || email === '') {
            e.preventDefault();
            if (window.Swal) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Email no disponible',
                    text: 'Este cliente no tiene email registrado'
                });
            } else {
                alert('Este cliente no tiene email registrado');
            }
        }
    });

    // Función para recargar tabla desde otros lugares
    window.reloadClientesTable = function () {
        if (dataTable) {
            dataTable.ajax.reload(null, false);
        }
    };

    // Manejar redimensionamiento de ventana y cambios en el sidebar
    $(window).on('resize', function () {
        if (dataTable) {
            DTHelper.adjustTableWidth();
        }
    });

    // Si tienes un botón para ocultar/mostrar el sidebar
    $(document).on('click', '[data-bs-toggle="sidebar"]', function () {
        setTimeout(function () {
            DTHelper.adjustTableWidth();
        }, 300); // Ajustar después de la animación del sidebar
    });

    //Metodo para registrar un cliente
    $('#createCustomerForm').on('submit', function (e) {
        e.preventDefault();

        const form = $(this);
        const btn = form.find('button[type="submit"]');
        const originalText = btn.html();

        btn.html('<i class="fas fa-spinner fa-spin me-2"></i> Guardando...').prop('disabled', true);

        const formData = new FormData(this);

        $.ajax({
            url: form.attr('action') || '/Customer/CreateCustomer',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (resp) {
                if (resp.success) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: resp.message,
                        icon: 'success'
                    }).then(() => {
                        window.location.href = `/Customer/Details/${resp.id}`;
                    });
                } else {
                    const msg = resp.errors?.join('<br>') || resp.error || 'Ocurrió un error';
                    showNotify('error', 'Error', msg);
                }
            },
            error: function () {
                showNotify('error', 'Error', 'No se pudo guardar el cliente');
            },
            complete: function () {
                btn.html(originalText).prop('disabled', false);
            }
        });
    });
});