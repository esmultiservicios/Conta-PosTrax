$(function () {
    /DATOS DEL USUARIO/
    loadUserInfo();

    /**
     * Función para cargar la información del usuario autenticado
     */
    function loadUserInfo() {
        $.ajax({
            url: '/api/userinfo',
            type: 'GET',
            dataType: 'json',
            beforeSend: function () {
                // Mostrar estado de carga si es necesario
            },
            success: function (response) {
                if (response.isAuthenticated) {
                    // Crear objeto unificado una sola vez
                    const userData = {
                        id: response.usuarioId,
                        nombre: response.nombre,
                        gafete: response.gafete,
                        rol: response.rol,
                        rolId: response.rolId,
                        isAuthenticated: true
                    };

                    // Guardar para uso global
                    window.currentUser = userData;

                    // Actualizar todas las UIs con el mismo objeto
                    updateUserUI(userData);
                    updateNavbarUserInfo(userData);
                }
            },
            error: function (xhr) {
                console.error('Error al cargar información:', xhr);
            }
        });
    }

    // Función para actualizar dinámicamente la información del usuario
    function updateNavbarUserInfo(userData) {
        try {
            if (!userData || !userData.nombre) {
                console.error('Datos de usuario inválidos');
                return;
            }

            // Extraer primer nombre y apellido de forma segura
            const nombreParts = (userData.nombre || '').trim().split(/\s+/);
            let nombreCorto = userData.nombre;

            if (nombreParts.length > 1) {
                nombreCorto = `${nombreParts[0]} ${nombreParts[nombreParts.length - 1]}`;
            }

            // Actualizar elementos del DOM
            const $userName = $('.account-user-name');
            const $position = $('.account-position');
            const $dropdownHeader = $('.dropdown-header .text-overflow');

            if ($userName.length) {
                $userName.html(`
                <strong>${nombreCorto}</strong>
                <span class="badge bg-primary ms-2 user-role-badge">${userData.rol || 'Sin Rol'}</span>
            `);
            }

            if ($position.length) {
                $position.text(`Gafete: ${userData.gafete || 'Sin Gafete'}`);
            }

            if ($dropdownHeader.length) {
                $dropdownHeader.text(`Bienvenido, ${userData.nombre}`);
            }
        } catch (error) {
            console.error('Error al actualizar navbar:', error);
        }
    }

    function updateUserUI(userData) {
        $('#nombreMostrado').html(`
        <strong>${userData.nombre}</strong> (Gafete: ${userData.gafete})
        <span class="badge bg-primary ms-2">${userData.rol}</span>
    `);

        window.currentUser = {
            id: userData.usuarioId,
            name: userData.nombre,
            badge: userData.gafete,
            role: userData.rol,
            roleId: userData.rolId
        };
    }

    // Cerrar sesion
    $('#logoutLink').on('click', function (e) {
        e.preventDefault();

        Swal.fire({
            title: '¿Seguro que deseas salir? 😢',
            html: '<strong>¡Te extrañaremos!</strong><br>Tu sesión se cerrará y serás redirigido.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#3498db',
            confirmButtonText: '¡Sí, salir! 🚪',
            cancelButtonText: 'No, mejor no 🙈',
            backdrop: `rgba(0,0,123,0.4) left top no-repeat`
        }).then((result) => {
            if (result.isConfirmed) {
                const $logoutLink = $('#logoutLink');
                const originalHtml = $logoutLink.html();
                $logoutLink.html('<i class="fas fa-spinner fa-spin"></i> Cerrando sesión...').prop('disabled', true);

                $.ajax({
                    url: '/Home/Logout',
                    type: 'POST',
                    headers: {
                        'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (response) {
                        if (response.clearStorage) {
                            localStorage.clear();
                        }

                        const redirectUrl = response.redirectUrl || '/';
                        window.location.href = redirectUrl;
                    },
                    error: function (xhr) {
                        $logoutLink.html(originalHtml).prop('disabled', false);

                        Swal.fire({
                            icon: 'error',
                            title: '¡Ups! 😬',
                            html: 'Ocurrió un error al intentar cerrar sesión. <br>Por favor, intenta nuevamente.',
                        });

                        console.error('Logout error:', xhr.responseText);
                    }
                });
            }
        });
    });
});

function setAutoFocus(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.focus();
    }
}

// Convertir a Mayuscula
$(document).on('input', '.mayusculas', function () {
    $(this).val(function (_, val) {
        return val.toUpperCase();
    });
});

// Inicio Datatable Bootrap
//DECLARACION DE VARIABLES
var dom = "<'row'<'col-sm-12 text-center'B>>" + // Botones de acción arriba
    "<'row mt-3'<'col-sm-3'<'form-inline'l>><'col-sm-6 text-center'f><'col-sm-3'>>" + // Área de búsqueda en el centro con margen superior
    "<'row'<'col-sm-12'tr>>" + // Tabla
    "<'row'<'col-sm-12'<'form-inline'i><'float-end'p>>'>"; // Botones de "Mostrar registros" y "Buscar" abajo


var lengthMenu = [
    [5, 10, 20, 30, 50, 100, -1],
    [5, 10, 20, 30, 50, 100, "Todo"]
];
var lengthMenu10 = [
    [10, 20, 30, 50, 100, -1],
    [10, 20, 30, 50, 100, "Todo"]
];
var lengthMenu20 = [
    [20, 30, 50, 100, -1],
    [20, 30, 50, 100, "Todo"]
];

//INICIO IDIOMA
var idioma_español = {
    "processing": "Procesando...",
    "lengthMenu": "Mostrar MENU",
    "zeroRecords": "No se encontraron resultados",
    "emptyTable": "Ningún dato disponible en esta tabla",
    "info": "Mostrando registros del START al END de un total de TOTAL registros",
    "infoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
    "infoFiltered": "(filtrado de un total de MAX registros)",
    "search": "Buscar:",
    "infoThousands": ",",
    "loadingRecords": "Cargando...",
    "paginate": {
        "first": "Primero",
        "last": "Último",
        "next": "Siguiente",
        "previous": "Anterior"
    },
    "aria": {
        "sortAscending": ": Activar para ordenar la columna de manera ascendente",
        "sortDescending": ": Activar para ordenar la columna de manera descendente"
    },
    "buttons": {
        "copy": "Copiar",
        "colvis": "Visibilidad",
        "collection": "Colección",
        "colvisRestore": "Restaurar visibilidad",
        "copyKeys": "Presione ctrl o u2318 + C para copiar los datos de la tabla al portapapeles del sistema. <br \/> <br \/> Para cancelar, haga clic en este mensaje o presione escape.",
        "copySuccess": {
            "1": "Copiada 1 fila al portapapeles",
            "_": "Copiadas %d fila al portapapeles"
        },
        "copyTitle": "Copiar al portapapeles",
        "csv": "CSV",
        "excel": "Excel",
        "pageLength": {
            "-1": "Mostrar todas las filas",
            "1": "Mostrar 1 fila",
            "_": "Mostrar %d filas"
        },
        "pdf": "PDF",
        "print": "Imprimir"
    },
    "autoFill": {
        "cancel": "Cancelar",
        "fill": "Rellene todas las celdas con <i>%d<\/i>",
        "fillHorizontal": "Rellenar celdas horizontalmente",
        "fillVertical": "Rellenar celdas verticalmentemente"
    },
    "decimal": ",",
    "searchBuilder": {
        "add": "Añadir condición",
        "button": {
            "0": "Constructor de búsqueda",
            "_": "Constructor de búsqueda (%d)"
        },
        "clearAll": "Borrar todo",
        "condition": "Condición",
        "conditions": {
            "date": {
                "after": "Despues",
                "before": "Antes",
                "between": "Entre",
                "empty": "Vacío",
                "equals": "Igual a",
                "not": "No",
                "notBetween": "No entre",
                "notEmpty": "No Vacio"
            },
            "moment": {
                "after": "Despues",
                "before": "Antes",
                "between": "Entre",
                "empty": "Vacío",
                "equals": "Igual a",
                "not": "No",
                "notBetween": "No entre",
                "notEmpty": "No vacio"
            },
            "number": {
                "between": "Entre",
                "empty": "Vacio",
                "equals": "Igual a",
                "gt": "Mayor a",
                "gte": "Mayor o igual a",
                "lt": "Menor que",
                "lte": "Menor o igual que",
                "not": "No",
                "notBetween": "No entre",
                "notEmpty": "No vacío"
            },
            "string": {
                "contains": "Contiene",
                "empty": "Vacío",
                "endsWith": "Termina en",
                "equals": "Igual a",
                "not": "No",
                "notEmpty": "No Vacio",
                "startsWith": "Empieza con"
            }
        },
        "data": "Data",
        "deleteTitle": "Eliminar regla de filtrado",
        "leftTitle": "Criterios anulados",
        "logicAnd": "Y",
        "logicOr": "O",
        "rightTitle": "Criterios de sangría",
        "title": {
            "0": "Constructor de búsqueda",
            "_": "Constructor de búsqueda (%d)"
        },
        "value": "Valor"
    },
    "searchPanes": {
        "clearMessage": "Borrar todo",
        "collapse": {
            "0": "Paneles de búsqueda",
            "_": "Paneles de búsqueda (%d)"
        },
        "count": "{total}",
        "countFiltered": "{shown} ({total})",
        "emptyPanes": "Sin paneles de búsqueda",
        "loadMessage": "Cargando paneles de búsqueda",
        "title": "Filtros Activos - %d"
    },
    "select": {
        "1": "%d fila seleccionada",
        "_": "%d filas seleccionadas",
        "cells": {
            "1": "1 celda seleccionada",
            "_": "$d celdas seleccionadas"
        },
        "columns": {
            "1": "1 columna seleccionada",
            "_": "%d columnas seleccionadas"
        }
    },
    "thousands": "."
}
//FIN IDIOMA

function toDataURL(src, callback, outputFormat) {
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var dataURL;
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
    };
    img.src = src;
    if (img.complete || img.complete === undefined) {
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        img.src = src;
    }
}

var baseUrl = window.location.origin; // Obtiene la URL base del servidor
var imagePath = '/img/logo.png'; // Ruta de la imagen relativa a la raíz del servidor
var urlmage = baseUrl + imagePath; // Construye la URL completa de la imagen

function getImagenHeaderConsulta(callback) {
    // Obtener la URL de la imagen usando Ajax
    $.ajax({
        type: "GET",
        url: urlmage, // Ruta al archivo PHP
        dataType: 'json',
        success: imageUrl => {
            // Llamar a la función de devolución de llamada con la URL de la imagen
            callback(imageUrl);
        },
        error: (xhr, status, error) => {
            console.error("Error al obtener la URL de la imagen");
            // Puedes manejar errores aquí también, si es necesario.
        }
    });
}

var imagen;
getImagenHeaderConsulta(function (imageUrl) {
    toDataURL(imageUrl, function (dataUrl) {
        imagen = dataUrl;
        // Ahora, 'imagen' contiene los datos de la imagen en formato Data URL
    });
});
// Fin Datatable Bootrap

function initializeSelectPickers() {
    if (typeof $.fn.selectpicker === 'undefined') {
        console.warn('Bootstrap-select no está cargado');
        return;
    }

    var $selects = $('.selectpicker');
    if ($selects.length) {
        $selects.selectpicker();
    }
}

// Llamar la función cuando sea necesario
initializeSelectPickers();

//INICIO FUNCIONES ADICIONALES
function convertDateFormat(string) {
    if (string == null || string == "") {
        var hoy = new Date();
        string = convertDate(hoy);
    }

    var info = string.split('-');
    return info[2] + '/' + info[1] + '/' + info[0];
}

// Función para agregar separadores de miles
const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function convertDate(inputFormat) {
    function pad(s) {
        return (s < 10) ? '0' + s : s;
    }
    var d = new Date(inputFormat);
    return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
}

function today() {
    var hoy = new Date();
    return convertDate(hoy);
}

function getMonth() {
    const hoy = new Date()
    return hoy.toLocaleString('default', {
        month: 'long'
    });
}

function getDay() {
    const hoy = new Date().getDate();
    return hoy;
}
//FIN FUNCIONES ADICIONALES