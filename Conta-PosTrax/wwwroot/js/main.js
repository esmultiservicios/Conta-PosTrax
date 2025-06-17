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
                        id: response.UsuarioId,
                        Name: response.Name,
                        Correo: response.Email,
                        Rol: response.Rol,
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
            if (!userData || !userData.Name) {
                console.error('Datos de usuario inválidos');
                return;
            }

            // Extraer primer nombre y apellido de forma segura
            const nombreParts = (userData.nombre || '').trim().split(/\s+/);
            let nombreCorto = userData.Name;

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
        <strong>${userData.Name}</strong> (Correo: ${userData.Correo})
        <span class="badge bg-primary ms-2">${userData.Rolk}</span>
    `);

        window.currentUser = {
            id: userData.usuarioId,
            name: userData.Name,
            badge: userData.Correo,
            role: userData.Rol
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
            cancelButtonText: 'No, mejor no 🙈'
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

// Configuración COMPLETA del lenguaje en español
var idioma_español = {
    "processing": "Procesando...",
    "lengthMenu": "Mostrar _MENU_ registros",
    "zeroRecords": "No se encontraron resultados",
    "emptyTable": "Ningún dato disponible en esta tabla",
    "info": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
    "infoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
    "infoFiltered": "(filtrado de un total de _MAX_ registros)",
    "search": '<i class="fas fa-search"></i>',
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
            "_": "Copiadas %d filas al portapapeles"
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
    }
};

// Configuración del DOM para DataTables
var dom = "<'row'<'col-sm-12 text-center'B>>" + // Botones de acción arriba
    "<'row mt-3'<'col-sm-3'<'form-inline'l>><'col-sm-6 text-center'f><'col-sm-3'>>" + // Área de búsqueda en el centro con margen superior
    "<'row'<'col-sm-12'tr>>" + // Tabla
    "<'row'<'col-sm-12'<'form-inline'i><'float-end'p>>'>"; // Botones de "Mostrar registros" y "Buscar" abajo
//FIN IDIOMA

// Versión CORREGIDA y CONFIRMADA para tu estructura exacta
async function loadHeaderLogo() {
    // Ruta ABSOLUTAMENTE CORRECTA para tu caso
    const logoDataURL = await getImageDataURL('/assets/img/logo.png');

    if (logoDataURL.startsWith('data:image')) {
        console.log('Logo convertido a DataURL:', logoDataURL.substring(0, 50) + '...');
    } else {
        console.error('Error inesperado con el logo');
    }
    return logoDataURL;
}

// Función mejorada con verificación EXTRA
async function getImageDataURL(imagePath) {
    // Paso 1: Verificación de ruta ABSOLUTA
    const absolutePath = imagePath.startsWith('http') ? imagePath
        : `${window.location.origin}${imagePath}`;

    try {
        // Paso 2: Doble verificación con fetch
        const response = await fetch(absolutePath, { method: 'HEAD' });
        if (!response.ok) throw new Error('No encontrado');

        // Paso 3: Conversión segura
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth;
                canvas.height = this.naturalHeight;
                canvas.getContext('2d').drawImage(this, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(getDefaultImage());
            img.src = absolutePath;
        });
    } catch (error) {
        console.warn(`Fallo al cargar ${imagePath}:`, error.message);
        return getDefaultImage();
    }
}

function getDefaultImage() {
    // Imagen transparente de 1px como fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
}

// USO CORRECTO (implementación completa)
document.addEventListener('DOMContentLoaded', async () => {
    const logoURL = await loadHeaderLogo();

    // Verificación EXTRA en consola
    const imgCheck = new Image();
    imgCheck.onload = () => console.log('Logo VERIFICADO en DOM');
    imgCheck.onerror = () => console.error('Logo FALLÓ en DOM');
    imgCheck.src = '/assets/img/logo.png'; // Misma ruta que en HTML

    // Aquí puedes usar logoURL para lo que necesites
    window.appHeaderImage = logoURL;
});

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

// Formatear moneda
function formatCurrency(value) {
    if (value === null || value === undefined) return '--';
    return new Intl.NumberFormat('es-HN', {
        style: 'currency',
        currency: 'HNL'
    }).format(value);
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-HN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Función para validar RTN (formato básico)
function isValidRTN(rtn) {
    // Implementar validación específica según requisitos
    return true; // Cambiar según necesidades
}

function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'L 0.00';
    }
    return 'L ' + parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
//FIN FUNCIONES ADICIONALES