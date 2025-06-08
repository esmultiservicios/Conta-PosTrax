$(function () {
    //register.js

    setAutoFocus('Nombre');

    // Toggle para contraseña (similar al login)
    $('.toggle-password').on('click', function () {
        const input = $(this).siblings('input');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
    });

    // Manejo del formulario de registro
    $('#registroForm').on('submit', function (e) {
        e.preventDefault();

        // Validar el formulario antes de enviar
        if (!$(this).valid()) return false;

        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        const originalBtnText = $submitBtn.html();
        const token = $('input[name="__RequestVerificationToken"]').val();

        // Mostrar estado de carga
        $submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Registrando...').prop('disabled', true);

        // Variable para controlar el estado de éxito
        let isSuccess = false;
        let shouldRedirect = false;

        // Realizar la petición AJAX
        $.ajax({
            url: $form.attr('action'),
            type: 'POST',
            data: $form.serialize(),
            headers: {
                'RequestVerificationToken': token
            },
            success: function (response) {
                // Mostrar notificación con datos del servidor
                if (response.type && response.title && response.message) {
                    showNotify(response.type, response.title, response.message);

                    // Guardar el correo en sessionStorage SOLO si es exitoso
                    if (response.type === 'success') {
                        const email = $('#Correo').val();
                        if (email) {
                            sessionStorage.setItem('lastRegisteredEmail', email);
                            console.log('Email guardado en sessionStorage:', email);
                        }
                        isSuccess = true;
                        shouldRedirect = !!response.redirectUrl;
                    }
                } else {
                    // Fallback para compatibilidad
                    const type = response.success ? 'success' : 'error';
                    const title = response.success ? 'Éxito' : 'Error';
                    showNotify(type, title, response.message || 'Respuesta inesperada');

                    if (response.success) {
                        const email = $('#Correo').val();
                        if (email) {
                            sessionStorage.setItem('lastRegisteredEmail', email);
                            console.log('Email guardado en sessionStorage:', email);
                        }
                        isSuccess = true;
                        shouldRedirect = !!response.redirectUrl;
                    }
                }

                // Redirección si es exitoso
                if (isSuccess && response.redirectUrl) {
                    setTimeout(() => {
                        window.location.href = response.redirectUrl;
                    }, 1500);
                }
            },
            error: function (xhr) {
                // Manejo de errores de conexión
                let errorResponse = {};
                try {
                    errorResponse = xhr.responseJSON || JSON.parse(xhr.responseText) || {};
                } catch (e) {
                    console.error("Error parsing error response:", e);
                }

                // Mostrar errores de validación si existen
                if (errorResponse.errors) {
                    let errorList = '';
                    $.each(errorResponse.errors, function (index, error) {
                        errorList += `<li>${error}</li>`;
                    });
                    showNotify('error', 'Errores en el formulario', `
                    <ul class="mb-0">${errorList}</ul>
                `);
                } else {
                    showNotify(
                        errorResponse.type || 'error',
                        errorResponse.title || 'Error del servidor',
                        errorResponse.message || 'Error en la conexión'
                    );
                }
            },
            complete: function () {
                // Restaurar botón solo si no fue exitoso o no hay redirección
                if (!isSuccess || !shouldRedirect) {
                    $submitBtn.html(originalBtnText).prop('disabled', false);
                }
            }
        });
    });

    // Validación del formulario (similar al login)
    if ($.validator) {
        $('#registroForm').validate({
            rules: {
                Nombre: { required: true },
                Apellido: { required: true },
                Correo: {
                    required: true,
                    email: true
                },
                Password: {
                    required: true,
                    minlength: 6
                },
                ConfirmPassword: {
                    required: true,
                    equalTo: "#Password"
                }
            },
            messages: {
                Nombre: { required: "El nombre es requerido" },
                Apellido: { required: "El apellido es requerido" },
                Correo: {
                    required: "El correo electrónico es requerido",
                    email: "Por favor ingresa un correo electrónico válido"
                },
                Password: {
                    required: "La contraseña es requerida",
                    minlength: "La contraseña debe tener al menos 6 caracteres"
                },
                ConfirmPassword: {
                    required: "Por favor confirma tu contraseña",
                    equalTo: "Las contraseñas no coinciden"
                }
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

    // Validación en tiempo real para la confirmación de contraseña (mejorada)
    $('#Password, #ConfirmPassword').on('keyup', function () {
        const password = $('#Password').val();
        const confirmPassword = $('#ConfirmPassword').val();
        const $confirmInput = $('#ConfirmPassword');
        const $feedback = $('#confirmPasswordFeedback');

        if (confirmPassword.length > 0 && password !== confirmPassword) {
            $feedback.removeClass('d-none').text('Las contraseñas no coinciden');
            $confirmInput.addClass('is-invalid');
        } else {
            $feedback.addClass('d-none');
            $confirmInput.removeClass('is-invalid');
        }
    });
});