$(function () {
    // Función para recuperar email y manejar focus
    function initializeLogin() {
        const lastEmail = sessionStorage.getItem('lastRegisteredEmail');

        if (lastEmail) {
            $('#Usuario').val(lastEmail);
            sessionStorage.removeItem('lastRegisteredEmail');

            setTimeout(() => {
                setAutoFocus('Password'); // Pequeño delay para asegurar que el campo existe
            }, 100); // 100ms suele ser suficiente
        } else {
            // Focus inicial
            setAutoFocus('Usuario');
        }
    }

    // Ejecutar inicialización
    initializeLogin();

    // Toggle para contraseña - Versión corregida
    $('.toggle-password').on('click', function () {
        const $passGroup = $(this).closest('.pass-group');
        const $input = $passGroup.find('.pass-input');
        const type = $input.attr('type') === 'password' ? 'text' : 'password';

        $input.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');

        // Opcional: mantener el foco en el input
        $input.attr('focus');
    });

    // Manejo del formulario de login
    $('#LoginForm').on('submit', function (e) {
        e.preventDefault();

        // Validar el formulario antes de enviar
        if (!$(this).valid()) return false;

        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        const originalBtnText = $submitBtn.html();
        const token = $('input[name="__RequestVerificationToken"]').val();

        // Mostrar estado de carga
        $submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...').prop('disabled', true);

        // Realizar la petición AJAX
        $.ajax({
            url: $form.attr('action'),
            type: 'POST',
            data: $form.serialize(),
            headers: {
                'RequestVerificationToken': token
            },
            success: function (response) {
                if (response.redirectUrl) {
                    window.location.href = response.redirectUrl;
                } else if (response.message) {
                    showNotify(response.type || 'error', response.title || 'Error', response.message);
                }
            },
            error: function (xhr) {
                let errorResponse = {};
                try {
                    errorResponse = xhr.responseJSON || JSON.parse(xhr.responseText) || {};
                } catch (e) {
                    console.error("Error parsing error response:", e);
                }

                showNotify(
                    errorResponse.type || 'error',
                    errorResponse.title || 'Error',
                    errorResponse.message || 'Error en la conexión'
                );
            },
            complete: function () {
                $submitBtn.html(originalBtnText).prop('disabled', false);
            }
        });
    });

    // Validación del formulario
    if ($.validator) {
        $('#LoginForm').validate({
            rules: {
                Usuario: { required: true },
                Password: { required: true }
            },
            messages: {
                Usuario: { required: "El usuario o correo es requerido" },
                Password: { required: "La contraseña es requerida" }
            },
            errorElement: 'span',
            errorPlacement: function (error, element) {
                error.addClass('text-danger');
                element.closest('.form-group').append(error);
            },
            highlight: function (element) {
                $(element).addClass('is-invalid');
            },
            unhighlight: function (element) {
                $(element).removeClass('is-invalid');
            }
        });
    }
});