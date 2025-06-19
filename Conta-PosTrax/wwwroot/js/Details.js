// Inicialización cuando el documento está listo
$(function () {
    // Asegurarse de que el token antifalsificación esté disponible para las solicitudes AJAX
    $.ajaxSetup({
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        }
    });
});