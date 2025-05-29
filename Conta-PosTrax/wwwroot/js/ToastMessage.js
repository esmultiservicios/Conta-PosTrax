// Configuración mejorada de Notyf con botón de cierre
const notyf = new Notyf({
    duration: 3000,
    position: {
        x: 'right',
        y: 'top',
    },
    dismissible: true, // Habilita la capacidad de cerrar manualmente
    closeOnClick: true, // Permite cerrar haciendo click en la notificación
    types: [
        {
            type: 'warning',
            background: 'orange',
            icon: {
                className: 'fas fa-exclamation-triangle fa-xl',
                tagName: 'i',
                color: 'white'
            },
            closeIcon: { // Personalización del icono de cerrar
                className: 'fas fa-times',
                color: 'white',
                tagName: 'span',
                position: 'right'
            }
        },
        {
            type: 'error',
            background: 'indianred',
            duration: 5000,
            dismissible: true,
            icon: {
                className: 'fas fa-times-circle fa-xl',
                tagName: 'i',
                color: 'white'
            },
            closeIcon: {
                className: 'fas fa-times',
                color: 'white',
                tagName: 'span',
                position: 'right'
            }
        },
        {
            type: 'info',
            background: '#1e88e5',
            duration: 5000,
            dismissible: true,
            icon: {
                className: 'fas fa-info-circle fa-xl',
                tagName: 'i',
                color: 'white'
            },
            closeIcon: {
                className: 'fas fa-times',
                color: 'white',
                tagName: 'span',
                position: 'right'
            }
        },
        {
            type: 'success',
            background: '#4caf50',
            duration: 5000,
            dismissible: true,
            icon: {
                className: 'fas fa-check-circle fa-xl',
                tagName: 'i',
                color: 'white'
            },
            closeIcon: {
                className: 'fas fa-times',
                color: 'white',
                tagName: 'span',
                position: 'right'
            }
        }
    ]
});

/**
 * Muestra una notificación estilizada usando Notyf.
 * @param {string} title - Título principal (ej: "Éxito", "Error")
 * @param {string} message - Mensaje descriptivo (ej: "Datos guardados correctamente")
 * @param {"success" | "error" | "warning" | "info"} type - Tipo de notificación
 * @returns {void}
 * 
 * @example <caption>Notificación de éxito</caption>
 * showNotify("Operación exitosa", "Los cambios fueron guardados", "success");
 * 
 * @example <caption>Notificación de error</caption>
 * showNotify("Error crítico", "No se pudo conectar a la base de datos", "error");
 */
function showNotify(type, title, message) {
    const validTypes = ['success', 'error', 'warning', 'info', 'loading'];

    console.log("El tipo recibido es: " + type);

    if (validTypes.includes(type)) {
        notyf.open({
            type: type,
            message: `<strong>${title}</strong><br>${message}`,
            settings: {
                ripple: true,
                allowHtml: true,
            }
        });
    } else {
        console.error('Tipo de notificación no válido');
    }
}
