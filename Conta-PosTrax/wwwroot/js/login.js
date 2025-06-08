$(function () {
    // Función para recuperar email y manejar focus
    function initializeLogin() {
        const lastEmail = sessionStorage.getItem('lastRegisteredEmail');

        if (lastEmail) {
            console.log('Email recuperado:', lastEmail);
            $('#Usuario').val(lastEmail);
            sessionStorage.removeItem('lastRegisteredEmail');

            // Focus en password después de llenar el email
            setTimeout(() => {
                setAutoFocus('Password');
            }, 200);
        } else {
            setAutoFocus(Usuario);
        }
    }

    // Ejecutar inicialización
    initializeLogin();

    // Agregar estilo para el efecto shake (solo una vez)
    if (!$('#shake-style').length) {
        $('head').append(`
            <style id="shake-style">
                .shake-effect {
                    animation: shake 0.5s linear;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-10px); }
                    40%, 80% { transform: translateX(10px); }
                }
                .error-highlight {
                    border-color: #ff3860 !important;
                    box-shadow: 0 0 0 2px rgba(255, 56, 96, 0.2);
                }
            </style>
        `);
    }

    // Toggle para contraseña
    $('.toggle-password').on('click', function () {
        const input = $(this).siblings('input');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
    });

    // Función para aplicar efecto de error
    function showLoginError() {
        const $form = $('#LoginForm');
        $form.addClass('shake-effect');
        $('input.is-invalid').addClass('error-highlight');

        setTimeout(() => {
            $form.removeClass('shake-effect');
            $('input.error-highlight').removeClass('error-highlight');
        }, 1000);
    }

    // Manejo del formulario
    $('#LoginForm').on('submit', function (e) {
        e.preventDefault();

        if (!$(this).valid()) {
            showLoginError();
            return false;
        }

        const $submitBtn = $('#LoginAction');
        const originalBtnText = $submitBtn.html();
        const token = $('input[name="__RequestVerificationToken"]').val();
        const formData = $(this).serialize();

        $.ajax({
            url: '/Home/Login',
            type: 'POST',
            data: formData,
            headers: {
                'RequestVerificationToken': token
            },
            beforeSend: function () {
                $submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Validando...').prop('disabled', true);
            },
            success: function (response) {
                if (response.type && response.title && response.message) {
                    showNotify(response.type, response.title, response.message);
                } else {
                    const type = response.success ? 'success' : 'error';
                    const title = response.success ? 'Éxito' : 'Error';
                    showNotify(type, title, response.message || 'Respuesta inesperada');
                }

                if (!response.success) {
                    showLoginError();
                    $submitBtn.html(originalBtnText).prop('disabled', false);
                }

                if (response.success && response.redirectUrl) {
                    setTimeout(() => {
                        window.location.href = response.redirectUrl;
                    }, 1500);
                }
            },
            error: function (xhr) {
                const errorResponse = xhr.responseJSON || {};
                showNotify(
                    errorResponse.type || 'error',
                    errorResponse.title || 'Error del servidor',
                    errorResponse.message || 'Error en la conexión'
                );
                showLoginError();
                $submitBtn.html(originalBtnText).prop('disabled', false);
            },
            complete: function (xhr) {
                if (xhr.status !== 200 && xhr.status !== 0) {
                    setTimeout(() => {
                        if ($submitBtn.prop('disabled')) {
                            $submitBtn.html(originalBtnText).prop('disabled', false);
                        }
                    }, 100);
                }
            }
        });
    });

    // Validación del formulario
    if ($.validator) {
        $('#LoginForm').validate({
            rules: {
                Usuario: { required: true },
                Password: { required: true, minlength: 6 }
            },
            messages: {
                Usuario: { required: "Usuario o correo electrónico es requerido" },
                Password: {
                    required: "La contraseña es requerida",
                    minlength: "La contraseña debe tener al menos 6 caracteres"
                }
            },
            errorElement: 'span',
            errorPlacement: function (error, element) {
                error.addClass('text-danger');
                element.closest('.form-group').append(error);
            },
            highlight: function (element) {
                $(element).addClass('is-invalid error-highlight');
            },
            unhighlight: function (element) {
                $(element).removeClass('is-invalid error-highlight');
            },
            invalidHandler: function () {
                showLoginError();
            }
        });
    }
});