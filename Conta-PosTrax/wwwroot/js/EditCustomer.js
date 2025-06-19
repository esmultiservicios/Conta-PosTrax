$(function () {
    // Inicializar select pickers
    initializeSelectPickers();

    // Formatear campos numéricos con comas
    $('.currency-input').on('blur', function () {
        const value = parseFloat($(this).val().replace(/,/g, '')) || 0;
        $(this).val(formatCurrency(value));
    });

    // Enviar formulario de edición de cliente
    $('#editCustomerForm').on('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) return;

        const form = $(this);
        const submitBtn = form.find('button[type="submit"]');
        const originalText = submitBtn.html();

        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Guardando...').prop('disabled', true);

        const formData = new FormData(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (resp) {
                if (resp.success) {
                    Swal.fire('¡Éxito!', resp.message, 'success').then(() => {
                        window.location.href = '/Customer';
                    });
                } else {
                    const msg = resp.error || (resp.errors ?? []).join('\n') || 'Error al actualizar el cliente';
                    showNotify('error', 'Error', msg);
                }
            },
            error: function (xhr) {
                showNotify('error', 'Error', 'Error al procesar la solicitud');
                console.error("Error detallado:", xhr.responseText);
            },
            complete: function () {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // Validar campos del cliente antes de enviar
    function validateForm() {
        let isValid = true;
        const requiredFields = ['Nombre', 'RTN', 'Telefono', 'Email'];

        $('.is-invalid').removeClass('is-invalid');

        requiredFields.forEach(field => {
            const value = $(`#${field}`).val().trim();
            if (!value) {
                $(`#${field}`).addClass('is-invalid');
                isValid = false;
            }
        });

        const email = $('#Email').val().trim();
        if (email && !isValidEmail(email)) {
            $('#Email').addClass('is-invalid');
            isValid = false;
        }

        const rtn = $('#RTN').val().trim();
        if (rtn && !isValidRTN(rtn)) {
            $('#RTN').addClass('is-invalid');
            isValid = false;
        }

        if (!isValid) {
            showNotify('error', "Error", 'Por favor complete todos los campos requeridos correctamente');
        }

        return isValid;
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function isValidRTN(rtn) {
        return rtn.length >= 10;
    }
});
