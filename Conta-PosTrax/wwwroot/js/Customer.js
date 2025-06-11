$(function () {
    let clientesTable = null;

    // Inicializar DataTable con diseño mejorado
    function initializeClientesTable() {
        if ($.fn.DataTable.isDataTable('#clientesTable')) {
            $('#clientesTable').DataTable().destroy();
        }

        // Configuración simplificada del DOM
        clientesTable = $('#clientesTable').DataTable({
            responsive: true,
            language: idioma_español,
            pageLength: 10,
            lengthMenu: lengthMenu10,
            processing: true,
            serverSide: false,
            ajax: {
                url: '/Customer/GetCustomers',
                type: 'GET',
                data: function (d) {
                    return {
                        codigo: $('#filterCodigo').val() || null,
                        nombre: $('#filterNombre').val() || null,
                        rtn: $('#filterRTN').val() || null,
                        email: $('#filterEmail').val() || null
                    };
                },
                dataSrc: function (json) {
                    return json && json.data ? json.data : [];
                }
            },
            columns: [
                {
                    data: 'Codigo',
                    className: 'align-middle',
                    render: function (data) { return data || '--'; }
                },
                {
                    data: 'Nombre',
                    className: 'align-middle',
                    render: function (data, type, row) {
                        return data ? `<a href="/Customer/Details/${row.Id || ''}" class="text-primary">${data}</a>` : '--';
                    }
                },
                {
                    data: 'RTN',
                    className: 'align-middle',
                    render: function (data) { return data || '--'; }
                },
                {
                    data: 'Telefono',
                    className: 'align-middle',
                    render: function (data) { return data || '--'; }
                },
                {
                    data: 'Email',
                    className: 'align-middle',
                    render: function (data) {
                        return data ? `<a href="mailto:${data}" class="text-primary">${data}</a>` : '--';
                    }
                },
                {
                    data: 'Balance',
                    className: 'text-end align-middle',
                    render: function (data) {
                        const amount = parseFloat(data) || 0;
                        const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                        return `<span class="${colorClass} fw-bold">${formatCurrency(data)}</span>`;
                    }
                },
                {
                    data: 'CreatedAt',
                    className: 'align-middle',
                    render: function (data) { return formatDate(data); }
                },
                {
                    data: 'Id',
                    className: 'text-end align-middle',
                    orderable: false,
                    render: function (data) {
                        return `
                            <div class="dropdown dropdown-action">
                                <a href="#" class="action-icon dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas fa-ellipsis-v"></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end shadow">
                                    <a class="dropdown-item" href="/Customer/Details/${data}">
                                        <i class="far fa-eye me-2 text-info"></i>Detalles
                                    </a>
                                    <a class="dropdown-item" href="/Customer/EditCustomer/${data}">
                                        <i class="far fa-edit me-2 text-primary"></i>Editar
                                    </a>
                                    <div class="dropdown-divider"></div>
                                    <a class="dropdown-item btn-delete text-danger" href="#" data-id="${data}">
                                        <i class="far fa-trash-alt me-2"></i>Eliminar
                                    </a>
                                </div>
                            </div>
                        `;
                    }
                }
            ],
            "buttons": [
                {
                    text: '<i class="fas fa-sync-alt fa-lg"></i> Actualizar',
                    titleAttr: 'Actualizar Usuarios',
                    className: 'btn btn-info',
                    action: () => GetUsers()
                },
                {
                    text: '<i class="fas fas fa-plus fa-lg crear"></i> Crear',
                    titleAttr: 'Registrar Usuarios',
                    className: 'btn btn-primary',
                    action: () => ModalUsers()
                },
                {
                    extend: 'excelHtml5',
                    text: '<i class="fas fa-file-excel fa-lg"></i> Excel',
                    titleAttr: 'Excel',
                    title: 'Reporte Usuarios',
                    exportOptions: {
                        columns: ':visible'  // Solo exporta las columnas visibles
                    },
                    className: 'table_reportes btn btn-success ocultar'
                },
                {
                    extend: 'pdf',
                    text: '<i class="fas fa-file-pdf fa-lg"></i> PDF',
                    titleAttr: 'PDF',
                    title: 'Reporte Usuarios',
                    messageTop: 'Fecha desde: ' + convertDateFormat(today()) + ' Fecha hasta: ' +
                        convertDateFormat(today()),
                    messageBottom: 'Fecha de Reporte: ' + convertDateFormat(today()),
                    className: 'table_reportes btn btn-danger ocultar',
                    exportOptions: {
                        columns: ':visible'  // Solo exporta las columnas visibles
                    }
                },
                'colvis'
            ],
            initComplete: function () {
                // Personalizar el buscador
                $('.dataTables_filter input')
                    .addClass('form-control form-control-sm')
                    .attr('placeholder', 'Buscar clientes...');

                $('.dataTables_filter label').contents().filter(function () {
                    return this.nodeType === 3;
                }).remove();

                // Personalizar el buscador
                $('.dataTables_filter input').addClass('form-control form-control-sm');
                $('.dataTables_filter label').contents().filter(function () {
                    return this.nodeType === 3;
                }).remove();

                // Añadir margen inferior a la tabla
                $('#clientesTable_wrapper').addClass('mb-4');
            }
        });
    }

    // Manejar eliminación de cliente
    $(document).on('click', '.btn-delete', function (e) {
        e.preventDefault();
        const id = $(this).data('id');

        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            buttonsStyling: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar loading
                Swal.fire({
                    title: 'Eliminando...',
                    text: 'Por favor espera',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                $.ajax({
                    url: `/Customer/Delete/${id}`,
                    type: 'POST',
                    headers: {
                        'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (response) {
                        showNotify('success', '¡Eliminado!', 'El cliente ha sido eliminado correctamente.');

                        // Recargar tabla sin resetear paginación
                        if (clientesTable) {
                            clientesTable.ajax.reload(null, false);
                        }
                    },
                    error: function (xhr, status, error) {
                        let errorMessage = 'Ocurrió un error al intentar eliminar el cliente.';

                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMessage = xhr.responseJSON.message;
                        } else if (xhr.responseText) {
                            errorMessage = xhr.responseText;
                        }

                        showNotify('error', 'Error', errorMessage);
                    }
                });
            }
        });
    });

    // Manejar eliminación de cliente
    $(document).on('click', '.btn-delete', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const nombre = $(this).data('nombre');
        const rtn = $(this).data('rtn');

        Swal.fire({
            title: '¿Estás seguro de eliminar este cliente?',
            html: `
                <div class="text-start">
                    <p class="mb-2"><strong>Nombre:</strong> ${nombre}</p>
                    <p><strong>RTN:</strong> ${rtn}</p>
                    <div class="alert alert-danger mt-3">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ¡Esta acción no se puede deshacer!
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '<i class="fas fa-trash-alt me-2"></i> Sí, eliminar',
            cancelButtonText: '<i class="fas fa-times me-2"></i> Cancelar',
            buttonsStyling: true,
            reverseButtons: true,
            focusCancel: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar loading
                Swal.fire({
                    title: 'Eliminando cliente...',
                    html: `
                        <div class="text-center">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p>Por favor espere mientras eliminamos el registro</p>
                        </div>
                    `,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                $.ajax({
                    url: `/Customer/Delete/${id}`,
                    type: 'POST',
                    headers: {
                        'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (response) {
                         showNotify('error', '¡Eliminado!', `El cliente "${nombre}" ha sido eliminado correctamente.`);

                        // Recargar tabla sin resetear paginación
                        if (clientesTable) {
                            clientesTable.ajax.reload(null, false);
                        }
                    },
                    error: function (xhr, status, error) {
                        let errorMessage = 'Ocurrió un error al intentar eliminar el cliente.';

                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMessage = xhr.responseJSON.message;
                        } else if (xhr.responseText) {
                            errorMessage = xhr.responseText;
                        }

                        Swal.fire({
                            title: 'Error',
                            html: `
                                <div class="text-start">
                                    <p>No se pudo eliminar el cliente:</p>
                                    <p class="fw-bold">${nombre}</p>
                                    <p class="text-danger mt-2">${errorMessage}</p>
                                </div>
                            `,
                            icon: 'error',
                            confirmButtonText: 'Entendido'
                        });
                    }
                });
            }
        });
    });


    // Inicializar cuando el DOM esté listo
    $(function () {
        initializeClientesTable();
    });
});