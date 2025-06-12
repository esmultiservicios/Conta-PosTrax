// dtHelper.js - Módulo para DataTables dinámico
window.DTHelper = (function () {
    // Variables globales del módulo
    let currentTableConfig = null;
    let currentTableId = null;
    let resizeTimer = null;

    // Configuración base
// En la sección de defaultConfig dentro de dtHelper.js
const defaultConfig = {
    responsive: true,
    language: idioma_español,
    pageLength: 10,
    lengthMenu: lengthMenu10,
    processing: true,
    serverSide: false,
    scrollX: false,
    scrollCollapse: false,
    autoWidth: false,
    dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
         "<'row'<'col-sm-12'tr>>" +
         "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>" +
         "<'row'<'col-sm-12'B>>",
    // Añade estas clases para mejorar el espaciado
    drawCallback: function(settings) {
        const api = this.api();
        const info = api.page.info();
        
        // Ajustar el espaciado del texto de información
        $('.dataTables_info').addClass('px-3 py-2');
        
        // Ajustar el espaciado de la paginación
        $('.dataTables_paginate').addClass('px-3 py-2');
    }
};

    // Función para ajustar el ancho de la tabla cuando cambia el layout
    function adjustTableWidth() {
        if (!currentTableId) return;

        const table = $(currentTableId).DataTable();
        if (table) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                table.columns.adjust().responsive.recalc();
                $('.dataTables_scrollBody').css('max-width', '100%');
                $('.table-responsive').css('overflow-x', 'auto');
            }, 100);
        }
    }

    // Personalizar el input de búsqueda después de la inicialización
    function customizeSearchInput(tableId) {
        setTimeout(function () {
            try {
                const wrapper = $(`${tableId}_wrapper`);
                if (wrapper.length) {
                    $('.dataTables_filter input', wrapper)
                        .addClass('form-control form-control-sm')
                        .attr('placeholder', 'Buscar...');
                    $('.dataTables_filter label', wrapper)
                        .contents().filter(function () {
                            return this.nodeType === 3;
                        }).remove();
                    wrapper.addClass('mb-4');
                } else {
                    console.warn('No se encontró el wrapper de DataTable');
                }
            } catch (error) {
                console.error('Error al personalizar búsqueda:', error);
            }
        }, 100);
    }

    // Renderizar acciones por defecto
    function defaultActionsRender(data, type, row) {
        if (!currentTableConfig) return data;

        // Verificar si hay acciones personalizadas en la configuración
        if (currentTableConfig.customActions) {
            return renderCustomActions(data, row);
        }

        // Acciones por defecto
        return `
            <div class="dropdown dropdown-action">
                <a href="#" class="action-icon dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-ellipsis-v"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-end shadow dropdown-menu-custom">
                    <a class="dropdown-item" href="/${currentTableConfig.entity}/Details/${data}">
                        <i class="far fa-eye me-2 text-info"></i>Detalles
                    </a>
                    <a class="dropdown-item" href="/${currentTableConfig.entity}/Edit/${data}">
                        <i class="far fa-edit me-2 text-primary"></i>Editar
                    </a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item btn-delete text-danger" href="#" 
                       data-id="${data}" 
                       data-name="${row.Nombre || row.Descripcion || 'Registro'}" 
                       data-codigo="${row.Codigo || 'Sin Código'}">
                        <i class="far fa-trash-alt me-2"></i>Eliminar
                    </a>
                </div>
            </div>
        `;
    }

    // Renderizar acciones personalizadas
    function renderCustomActions(data, row) {
        let actionsHtml = `
            <div class="dropdown dropdown-action">
                <a href="#" class="action-icon dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-ellipsis-v"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-end shadow dropdown-menu-custom">
        `;

        currentTableConfig.customActions.forEach(action => {
            if (action.type === 'divider') {
                actionsHtml += `<div class="dropdown-divider"></div>`;
            } else {
                const href = action.type === 'delete' ? '#' : (typeof action.url === 'function' ? action.url(data, row) : action.url);
                const iconClass = action.iconClass || getDefaultIconClass(action.type);
                const text = action.text || getDefaultActionText(action.type);
                const textClass = action.textClass || getDefaultTextClass(action.type);
                const className = action.type === 'delete' ? 'btn-delete ' + (action.className || '') : (action.className || '');
                const attrs = action.attrs || '';

                actionsHtml += `
                    <a class="dropdown-item d-flex align-items-center ${className}" 
                       href="${href}" 
                       ${attrs}
                       ${action.type === 'delete' ? `data-id="${data}" data-name="${row.Nombre || row.Descripcion || 'Registro'}"` : ''}>
                        <i class="${iconClass} ${textClass} me-2"></i>
                        <span>${text}</span>
                    </a>
                `;
            }
        });

        actionsHtml += `
                </div>
            </div>
        `;

        return actionsHtml;
    }

    // Obtener clase de icono por defecto según el tipo de acción
    function getDefaultIconClass(actionType) {
        switch (actionType) {
            case 'details': return 'far fa-eye';
            case 'edit': return 'far fa-edit';
            case 'delete': return 'far fa-trash-alt';
            case 'custom': return 'fas fa-cog';
            default: return 'fas fa-link';
        }
    }

    // Obtener texto por defecto según el tipo de acción
    function getDefaultActionText(actionType) {
        switch (actionType) {
            case 'details': return 'Detalles';
            case 'edit': return 'Editar';
            case 'delete': return 'Eliminar';
            default: return 'Acción';
        }
    }

    // Obtener clase de texto por defecto según el tipo de acción
    function getDefaultTextClass(actionType) {
        switch (actionType) {
            case 'details': return 'text-info';
            case 'edit': return 'text-primary';
            case 'delete': return 'text-danger';
            default: return '';
        }
    }

    // Botones por defecto
    function getDefaultButtons() {
        return [
            {
                text: '<i class="fas fa-sync-alt fa-lg"></i> Actualizar',
                titleAttr: 'Actualizar',
                className: 'btn btn-info',
                action: function (e, dt, node, config) {
                    dt.ajax.reload();
                }
            },
            {
                text: '<i class="fas fa-plus fa-lg"></i> Crear',
                titleAttr: 'Crear nuevo',
                className: 'btn btn-primary',
                action: function () {
                    if (currentTableConfig) {
                        window.location.href = `/${currentTableConfig.entity}/Create`;
                    }
                }
            },
            {
                extend: 'excelHtml5',
                text: '<i class="fas fa-file-excel fa-lg"></i> Excel',
                titleAttr: 'Exportar a Excel',
                title: function () {
                    return currentTableConfig ? `Reporte ${currentTableConfig.entity}` : 'Reporte';
                },
                className: 'btn btn-success',
                exportOptions: {
                    columns: ':visible'
                }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="fas fa-file-pdf fa-lg"></i> PDF',
                titleAttr: 'Exportar a PDF',
                title: function () {
                    return currentTableConfig ? `Reporte ${currentTableConfig.entity}` : 'Reporte';
                },
                className: 'btn btn-danger',
                exportOptions: {
                    columns: ':visible'
                }
            },
            'colvis'
        ];
    }

    // Configurar eventos de dropdown con posicionamiento dinámico
    function setupDropdownEvents() {
        // Manejar la apertura del dropdown
        $(document).on('show.bs.dropdown', '.dropdown-action', function (e) {
            const $dropdown = $(this);
            const $menu = $dropdown.find('.dropdown-menu');
            const $tableContainer = $dropdown.closest('.table-responsive, .dataTables_scrollBody');

            // Agregar clase temporal para permitir overflow
            $tableContainer.addClass('table-dropdown-open');

            // Posicionamiento dinámico después de que se muestre
            setTimeout(() => {
                positionDropdown($dropdown, $menu);
            }, 1);
        });

        // Manejar el cierre del dropdown
        $(document).on('hidden.bs.dropdown', '.dropdown-action', function (e) {
            const $dropdown = $(this);
            const $tableContainer = $dropdown.closest('.table-responsive, .dataTables_scrollBody');

            // Remover clase temporal
            $tableContainer.removeClass('table-dropdown-open');

            // Limpiar estilos inline
            $dropdown.find('.dropdown-menu').removeAttr('style');
        });
    }

    // Función para posicionar el dropdown dinámicamente
    function positionDropdown($dropdown, $menu) {
        const dropdownRect = $dropdown[0].getBoundingClientRect();
        const menuHeight = $menu.outerHeight();
        const viewportHeight = window.innerHeight;
        const scrollTop = $(window).scrollTop();

        // Resetear estilos primero
        $menu.css({
            position: 'absolute',
            top: 'auto',
            bottom: 'auto',
            left: 'auto',
            right: '0',
            maxHeight: 'none',
            overflowY: 'visible'
        });

        // Calcular espacio disponible
        const spaceBelow = viewportHeight - dropdownRect.bottom + scrollTop;
        const spaceAbove = dropdownRect.top - scrollTop;

        // Posicionamiento inteligente
        if (spaceBelow > menuHeight || spaceBelow > spaceAbove) {
            // Hay espacio abajo o es mayor que arriba
            $menu.css({
                top: '100%',
                bottom: 'auto'
            });
        } else {
            // No hay espacio abajo, mostrar arriba
            $menu.css({
                top: 'auto',
                bottom: '100%'
            });
        }

        // Ajustar máximo alto si es necesario
        if (menuHeight > viewportHeight * 0.6) {
            $menu.css({
                maxHeight: viewportHeight * 0.6 + 'px',
                overflowY: 'auto'
            });
        }
    }

    // Inicializar DataTable
    function initDataTable(tableId, config) {
        // Guardar configuración actual
        currentTableConfig = config;
        currentTableId = tableId;

        // Combinar configuración personalizada con valores por defecto
        const tableConfig = {
            ...defaultConfig,
            ...config,
            ajax: {
                url: config.url || `/${config.entity}/GetAll`,
                type: 'GET',
                data: function (d) {
                    const filters = {};
                    if (config.filters) {
                        config.filters.forEach(filter => {
                            filters[filter] = $(`#filter${filter}`).val() || null;
                        });
                    }
                    return filters;
                },
                dataSrc: function (json) {
                    return json && json.data ? json.data : [];
                },
                error: function (xhr, error, code) {
                    console.error('Error en DataTable AJAX:', error);
                    if (window.Swal) {
                        Swal.fire('Error', 'Error al cargar los datos', 'error');
                    }
                }
            },
            columns: config.columns.map(col => {
                if (col.data === 'Id' && col.className && col.className.includes('text-end') && !col.render) {
                    return {
                        ...col,
                        render: defaultActionsRender
                    };
                }
                return col;
            }),
            buttons: config.buttons || getDefaultButtons(),
            initComplete: function (settings, json) {
                adjustTableWidth();
            }
        };

        // Destruir instancia previa si existe
        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().destroy();
        }

        // Inicializar DataTable
        const dataTable = $(tableId).DataTable(tableConfig);

        // Personalizar después de la inicialización
        customizeSearchInput(tableId);

        // Configurar eventos de dropdown
        setupDropdownEvents();

        // Manejar eliminación si hay columna de acciones
        if (config.columns.some(col => col.data === 'Id')) {
            $(document).off('click', `${tableId} .btn-delete`);
            $(document).off('click', `${tableId} a[data-id]`);

            $(document).on('click', `${tableId} .btn-delete, ${tableId} a[data-id]`, function (e) {
                if ($(this).hasClass('btn-delete') || $(this).attr('data-name')) {
                    handleDelete.call(this, e);
                }
            });
        }

        // Añadir event listener para redimensionamiento
        $(window).on('resize', function () {
            adjustTableWidth();
        });

        // Añadir event listener para cambios en el sidebar (si usas un sidebar)
        if (typeof window.SidebarHelper !== 'undefined') {
            $(document).on('sidebarToggled', adjustTableWidth);
        }

        return dataTable;
    }

    // Manejar eliminación de registros
    function handleDelete(e) {
        e.preventDefault();
        const $this = $(this);
        const id = $this.data('id');
        const name = $this.data('name');

        if (!window.Swal) {
            if (confirm(`¿Deseas eliminar ${name}?`)) {
                deleteRecord(id, name);
            }
            return;
        }

        Swal.fire({
            title: '¿Estás seguro?',
            html: `¿Deseas eliminar <strong>${name}</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteRecord(id, name);
            }
        });
    }

    // Eliminar registro via AJAX
    function deleteRecord(id, name) {
        if (!currentTableConfig || !currentTableId) {
            console.error('Configuración de tabla no disponible');
            return;
        }

        $.ajax({
            url: `/${currentTableConfig.entity}/Delete/${id}`,
            type: 'POST',
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function () {
                if (window.Swal) {
                    Swal.fire(
                        '¡Eliminado!',
                        `El registro ${name} ha sido eliminado.`,
                        'success'
                    );
                } else {
                    alert(`El registro ${name} ha sido eliminado.`);
                }
                // Recargar tabla
                $(currentTableId).DataTable().ajax.reload();
            },
            error: function (xhr) {
                const message = xhr.responseJSON?.message || 'Ocurrió un error al eliminar';
                if (window.Swal) {
                    Swal.fire('Error', message, 'error');
                } else {
                    alert('Error: ' + message);
                }
            }
        });
    }

    // API pública
    return {
        init: initDataTable,
        reload: function () {
            if (currentTableId) {
                $(currentTableId).DataTable().ajax.reload();
            }
        },
        destroy: function () {
            if (currentTableId && $.fn.DataTable.isDataTable(currentTableId)) {
                $(currentTableId).DataTable().destroy();
            }
            currentTableConfig = null;
            currentTableId = null;
        },
        getCurrentConfig: function () {
            return currentTableConfig;
        },
        getCurrentTableId: function () {
            return currentTableId;
        },
        adjustTableWidth: adjustTableWidth
    };
})();