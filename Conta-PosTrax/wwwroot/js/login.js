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

    // Función para efecto de shake
    function shakeForm() {
        const $form = $('#LoginForm');
        $form.addClass('shake-animation');
        setTimeout(() => {
            $form.removeClass('shake-animation');
        }, 500);
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
        if (!$(this).valid()) {
            shakeForm();
            return false;
        }

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
                    shakeForm();
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
                shakeForm();
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
                shakeForm();
            },
            unhighlight: function (element) {
                $(element).removeClass('is-invalid');
            }
        });
    }
});

// Función para el efecto de shake (debe agregarse en tu CSS)
function addShakeAnimation() {
    const style = document.createElement('style');
    style.innerHTML = `
        .shake-animation {
            animation: shake 0.5s;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

// Agregar la animación al cargar
addShakeAnimation();