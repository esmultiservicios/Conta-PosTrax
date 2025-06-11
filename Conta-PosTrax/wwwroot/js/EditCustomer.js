$(function () {
    // Cargar información del usuario
    loadUserInfo();

    // Inicializar select pickers
    initializeSelectPickers();

    // Convertir a mayúsculas
    $(document).on('input', '.mayusculas', function () {
        $(this).val(function (_, val) {
            return val.toUpperCase();
        });
    });

    // Formatear campos numéricos
    $('.currency-input').on('blur', function () {
        const value = parseFloat($(this).val().replace(/,/g, '')) || 0;
        $(this).val(formatCurrency(value));
    });

    // Manejar el envío del formulario principal
    $('#editCustomerForm').on('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) {
            return false;
        }

        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Guardando...').prop('disabled', true);

        const formData = {
            Id: $('#Id').val(),
            Codigo: $('#Codigo').val(),
            Nombre: $('#Nombre').val(),
            RTN: $('#RTN').val(),
            Direccion: $('#Direccion').val(),
            Telefono: $('#Telefono').val(),
            Telefono2: $('#Telefono2').val(),
            Email: $('#Email').val(),
            TipoEntidad: $('#TipoEntidad').val(),
            ZipCode: $('#ZipCode').val(),
            Contacto: $('#Contacto').val(),
            Notas: $('#Notas').val(),
            Balance: parseFloat($('#Balance').val().replace(/,/g, '')) || 0,
            ChecksBal: parseFloat($('#ChecksBal').val().replace(/,/g, '')) || 0,
            TerminoPago: $('#TerminoPago').val(),
            LimiteCredito: parseFloat($('#LimiteCredito').val().replace(/,/g, '')) || 0,
            Descuento: parseFloat($('#Descuento').val()) || 0,
            ListaPrecio: $('#ListaPrecio').val(),
            VendedorAsignado: $('#VendedorAsignado').val(),
            Moneda: $('#Moneda').val(),
            Pais: $('#Pais').val(),
            Ciudad: $('#Ciudad').val(),
            CuentaContable: $('#CuentaContable').val(),
            NombreSocioPrincipal: $('#NombreSocioPrincipal').val(),
            Tipo: $('#Tipo').val()
        };

        $.ajax({
            url: '/Customer/UpdateCustomer',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'Cliente actualizado correctamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        window.location.href = '/Customer';
                    });
                } else {
                    showNotify('error', 'Error', response.message || 'Error al actualizar el cliente');
                }
            },
            error: function (xhr) {
                let errorMessage = 'Error al procesar la solicitud';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }

                showNotify('error', 'Error', errorMessage);
            },
            complete: function () {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // Función para editar contacto
    window.editContact = function (id) {
        fetch(`/Customer/GetContact/${id}`)
            .then(response => response.json())
            .then(data => {
                $('#editContactId').val(data.id);
                $('#editContactNombre').val(data.nombre);
                $('#editContactCargo').val(data.cargo);
                $('#editContactTelefono').val(data.telefono);
                $('#editContactEmail').val(data.email);
                $('#editContactEsPrincipal').prop('checked', data.esPrincipal);

                $('#editContactModal').modal({
                    backdrop: 'static',
                    keyboard: false
                });
            })
            .catch(error => {
                showNotify('error', 'Error', 'No se pudo cargar la información del contacto');
            });
    };

    // Función para eliminar contacto
    window.deleteContact = function (id, nombre) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar el contacto "${nombre}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/Customer/DeleteContact/${id}`, {
                    method: 'POST',
                    headers: {
                        'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val(),
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => {
                        if (response.ok) {
                            showNotify('success', '¡Eliminado!', 'El contacto ha sido eliminado.');
                            setTimeout(() => location.reload(), 1500);
                        } else {
                            showNotify('error', 'Error', 'No se pudo eliminar el contacto.');
                        }
                    })
                    .catch(error => {
                        showNotify('error', 'Error', 'Ocurrió un error al eliminar el contacto.');
                    });
            }
        });
    };

    // Manejar el envío del formulario de agregar contacto
    $('#addContactForm').on("submit", function (e) {
        e.preventDefault();

        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: $(this).serialize(),
            success: function (response) {
                $('#addContactModal').modal('hide');
                showNotify('success', 'Éxito', 'Contacto agregado correctamente');
                setTimeout(() => location.reload(), 1500);
            },
            error: function (xhr) {
                showNotify('error', 'Error', 'Ocurrió un error al agregar el contacto');
            }
        });
    });

    // Manejar el envío del formulario de editar contacto
    $('#editContactForm').on("submit", function (e) {
        e.preventDefault();

        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: $(this).serialize(),
            success: function (response) {
                $('#editContactModal').modal('hide');
                showNotify('success', 'Éxito', 'Contacto actualizado correctamente');
                setTimeout(() => location.reload(), 1500);
            },
            error: function (xhr) {
                showNotify('error', 'Error', 'Ocurrió un error al actualizar el contacto');
            }
        });
    });

    // Función para validar el formulario
    function validateForm() {
        let isValid = true;
        const requiredFields = ['Nombre', 'RTN', 'Telefono', 'Email'];

        requiredFields.forEach(field => {
            const value = $(`#${field}`).val().trim();
            if (!value) {
                $(`#${field}`).addClass('is-invalid');
                isValid = false;
            } else {
                $(`#${field}`).removeClass('is-invalid');
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
});