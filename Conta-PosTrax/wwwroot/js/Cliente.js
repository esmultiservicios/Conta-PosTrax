//Codigo que funciona en el datatable
$(function () {
    let clientesTable;

    // Inicializar DataTable - VERSION CORREGIDA
    function initializeClientesTable() {
        if ($.fn.DataTable.isDataTable('#clientesTable')) {
            $('#clientesTable').DataTable().destroy();
        }

        // MANTENER COMPLETAMENTE EL HTML ORIGINAL - NO TOCAR NADA
        clientesTable = $('#clientesTable').DataTable({
            responsive: true,
            processing: true,
            serverSide: false,
            ajax: {
                url: '/Customer/GetCustomers',
                type: 'GET',
                data: function (d) {
                    d.codigo = $('#filterCodigo').val() || null;
                    d.nombre = $('#filterNombre').val() || null;
                    d.rtn = $('#filterRTN').val() || null;
                    d.email = $('#filterEmail').val() || null;
                },
                dataSrc: 'data'
            },
            columns: [
                {
                    data: 'Codigo',
                    name: 'Codigo',
                    className: 'align-middle'
                },
                {
                    data: 'Nombre',
                    name: 'Nombre',
                    className: 'align-middle',
                    render: function (data, type, row) {
                        return `<a href="/Customer/Details/${row.Id}" class="text-primary text-decoration-none">${data || '--'}</a>`;
                    }
                },
                {
                    data: 'RTN',
                    name: 'RTN',
                    className: 'align-middle',
                    render: function (data) {
                        return data || '--';
                    }
                },
                {
                    data: 'Telefono',
                    name: 'Telefono',
                    className: 'align-middle',
                    render: function (data) {
                        return data || '--';
                    }
                },
                {
                    data: 'Email',
                    name: 'Email',
                    className: 'align-middle',
                    render: function (data) {
                        return data ? `<a href="mailto:${data}" class="text-decoration-none">${data}</a>` : '--';
                    }
                },
                {
                    data: 'Balance',
                    name: 'Balance',
                    className: 'text-end align-middle',
                    render: function (data) {
                        const colorClass = data < 0 ? 'text-danger' : 'text-success';
                        return `<span class="${colorClass} fw-semibold">${formatCurrency(data)}</span>`;
                    }
                },
                {
                    data: 'CreatedAt',
                    name: 'CreatedAt',
                    className: 'align-middle',
                    render: function (data) {
                        return formatDate(data);
                    }
                },
                {
                    data: 'Id',
                    name: 'Acciones',
                    className: 'text-end align-middle',
                    orderable: false,
                    searchable: false,
                    render: function (data, type, row) {
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
            buttons: [
                {
                    extend: 'excelHtml5',
                    text: '<i class="fas fa-file-excel me-1"></i> Excel',
                    titleAttr: 'Exportar a Excel',
                    title: 'Listado de Clientes',
                    exportOptions: {
                        columns: ':visible:not(:last-child)'
                    },
                    className: 'btn btn-success btn-sm me-1'
                },
                {
                    extend: 'pdfHtml5',
                    text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                    titleAttr: 'Exportar a PDF',
                    title: 'Listado de Clientes',
                    exportOptions: {
                        columns: ':visible:not(:last-child)'
                    },
                    className: 'btn btn-danger btn-sm me-1'
                },
                {
                    extend: 'colvis',
                    text: '<i class="fas fa-columns me-1"></i> Columnas',
                    titleAttr: 'Mostrar/ocultar columnas',
                    className: 'btn btn-info btn-sm'
                }
            ],
            order: [[1, 'asc']],
            language: idioma_español,
            dom: dom,
            //pageLength: 10,
            //lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
            //searching: true,
            //ordering: true,
            //info: true,
            //paging: true,
            //autoWidth: false,
            //scrollX: false,
            // Configuraciones adicionales para mantener el diseño
            drawCallback: function (settings) {
                // Reinicializar dropdowns de Bootstrap después de cada redibujado
                $('.dropdown-toggle').dropdown();

                // Asegurar que los tooltips funcionen
                $('[data-bs-toggle="tooltip"]').tooltip();

                // MANTENER las clases CSS originales sin alterar
                $('#clientesTable').removeClass().addClass('table table-center table-hover datatable');
                $('#clientesTable thead').removeClass().addClass('thead-light');
            },
            initComplete: function (settings, json) {
                // Configuraciones iniciales
                $('.dropdown-toggle').dropdown();
                $('[data-bs-toggle="tooltip"]').tooltip();

                // Asegurar responsive
                this.api().columns.adjust().responsive.recalc();

                // MANTENER las clases CSS originales EXACTAS
                //$('#clientesTable').removeClass().addClass('table table-center table-hover datatable');
                //$('#clientesTable thead').removeClass().addClass('thead-light');

                console.log('DataTable inicializado correctamente');
            },
            // Configuración responsive mejorada
            responsive: {
                details: {
                    type: 'column',
                    target: 'tr'
                }
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
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El cliente ha sido eliminado correctamente.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });

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
                            text: errorMessage,
                            icon: 'error',
                            confirmButtonText: 'Entendido'
                        });
                    }
                });
            }
        });
    });

    // Función para recargar la tabla
    window.reloadClientesTable = function () {
        if (clientesTable) {
            clientesTable.ajax.reload(null, false);
        }
    };

    // Inicializar tabla al cargar el documento
    initializeClientesTable();

    // Manejar redimensionamiento de ventana para mantener responsividad
    $(window).on('resize', function () {
        if (clientesTable) {
            clientesTable.columns.adjust().responsive.recalc();
        }
    });

    // Manejar filtros si existen
    $('#filterCodigo, #filterNombre, #filterRTN, #filterEmail').on('keyup change', function () {
        if (clientesTable) {
            clientesTable.ajax.reload();
        }
    });

    // Limpiar filtros
    $(document).on('click', '#clearFilters', function () {
        $('#filterCodigo, #filterNombre, #filterRTN, #filterEmail').val('');
        if (clientesTable) {
            clientesTable.ajax.reload();
        }
    });
});