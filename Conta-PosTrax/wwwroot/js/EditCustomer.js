$(function () {
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

    // ===== Función para editar clientes =====
    $('#editCustomerForm').on('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) return;

        const form = $(this);
        const submitBtn = form.find('button[type="submit"]');
        const originalText = submitBtn.html();

        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Guardando...').prop('disabled', true);

        // Opción 1: Usar FormData (recomendado para formularios con archivos)
        const formData = new FormData(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: formData, // No usar JSON.stringify aquí
            processData: false, // Necesario para FormData
            contentType: false, // Necesario para FormData
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

    // ===== Función para validar el formulario =====
    function validateForm() {
        let isValid = true;
        const requiredFields = ['Nombre', 'RTN', 'Telefono', 'Email'];

        // Limpiar errores previos
        $('.is-invalid').removeClass('is-invalid');

        requiredFields.forEach(field => {
            const value = $(`#${field}`).val().trim();
            if (!value) {
                $(`#${field}`).addClass('is-invalid');
                isValid = false;
            }
        });

        // Validar formato de email
        const email = $('#Email').val().trim();
        if (email && !isValidEmail(email)) {
            $('#Email').addClass('is-invalid');
            isValid = false;
        }

        // Validar formato de RTN si existe
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

    // ===== Funciones auxiliares de validación =====
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function isValidRTN(rtn) {
        // Implementa tu lógica de validación de RTN aquí
        return rtn.length >= 10; // Ejemplo básico
    }
});

// ===== Función para crear el modal de edición dinámicamente =====
function createEditContactModal() {
    const modalHtml = `
    <div class="modal fade" id="editContactModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Editar Contacto</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editContactForm" action="/Customer/EditContact" method="post">
                    <input type="hidden" name="Id" id="editContactId">
                    <input type="hidden" name="ClienteId" id="editContactClienteId">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Nombre *</label>
                            <input type="text" class="form-control" name="Nombre" id="editContactNombre" required>
                        </div>
                        <div class="form-group">
                            <label>Cargo</label>
                            <input type="text" class="form-control" name="Cargo" id="editContactCargo">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="text" class="form-control" name="Telefono" id="editContactTelefono">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-control" name="Email" id="editContactEmail">
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="EsPrincipal" id="editContactEsPrincipal">
                            <label class="form-check-label" for="editContactEsPrincipal">Contacto Principal</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times-circle"></i> Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;

    $('body').append(modalHtml);

    // ===== Función para abrir modal de creación =====
    function openCreateContactModal(clienteId) {
        $('#createContactClienteId').val(clienteId);
        $('#createContactForm')[0].reset();
        $('#createContactEsPrincipal').prop('checked', false);
        $('#createContactModal').modal('show');
    }

    // ===== Función para editar contacto =====
    function editContact(id) {
        fetch(`/Customer/GetContact/${id}`)
            .then(response => {
                if (!response.ok) throw new Error('Error al obtener contacto');
                return response.json();
            })
            .then(data => {
                // Llenar el modal con los datos
                $('#editContactId').val(data.id);
                $('#editContactClienteId').val(data.clienteId);
                $('#editContactNombre').val(data.nombre);
                $('#editContactCargo').val(data.cargo || '');
                $('#editContactTelefono').val(data.telefono || '');
                $('#editContactEmail').val(data.email || '');
                $('#editContactEsPrincipal').prop('checked', data.esPrincipal || false);

                // Mostrar el modal
                $('#editContactModal').modal('show');
            })
            .catch(error => {
                console.error('Error:', error);
                showNotify('error', 'Error', 'No se pudo cargar la información del contacto');
            });
    }

    // ===== Funcion Crear Contactos =====
    $('#createContactForm').on('submit', function (e) {
        e.preventDefault();

        if (!validateContactForm('create')) return;

        const form = $(this);
        const submitBtn = form.find('button[type="submit"]');
        const originalText = submitBtn.html();

        submitBtn.html('<i class="fas fa-spinner fa-spin me-2"></i> Guardando...').prop('disabled', true);

        const formData = new FormData(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: formData, // No usar JSON.stringify aquí
            processData: false, // Necesario para FormData
            contentType: false, // Necesario para FormData
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (resp) {
                if (resp.success) {
                    $('#createContactModal').modal('hide');
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: resp.message,
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        // Actualizar solo la tabla de contactos sin recargar toda la página
                        loadCustomerContacts($('#createContactClienteId').val());
                    });
                } else {
                    // Mostrar errores de validación del servidor
                    if (resp.errors) {
                        showNotify('error', 'Error', resp.errors.join('\n'));
                    } else if (resp.error) {
                        showNotify('error', 'Error', resp.error);
                    } else {
                        showNotify('error', 'Error', 'Error desconocido al guardar');
                    }
                }
            },
            error: function (xhr) {
                let errorMsg = 'Error al procesar la solicitud';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                }
                showNotify('error', 'Error', errorMsg);
                console.error("Error detallado:", xhr.responseText);
            },
            complete: function () {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // ===== Envío del formulario de contacto =====
    $('#editContactForm').on('submit', function (e) {
        e.preventDefault();

        if (!validateContactForm()) return;

        const form = $(this);
        const submitBtn = form.find('button[type="submit"]');
        const originalText = submitBtn.html();

        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Guardando...').prop('disabled', true);

        // Usar FormData para enviar los datos
        const formData = new FormData(this);

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: formData, // No usar JSON.stringify aquí
            processData: false, // Necesario para FormData
            contentType: false, // Necesario para FormData
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (resp) {
                if (resp.success) {
                    $('#editContactModal').modal('hide');
                    Swal.fire('¡Éxito!', resp.message, 'success').then(() => {
                        // Actualizar solo la sección de contactos en lugar de recargar toda la página
                        loadCustomerContacts($('#editContactClienteId').val());
                    });
                } else {
                    const msg = resp.error || (resp.errors ?? []).join('\n') || 'Error al actualizar el contacto';
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

    // ===== Función para validar el formulario de contacto =====
    function validateContactForm() {
        let isValid = true;

        // Limpiar errores previos
        $('#editContactForm .is-invalid').removeClass('is-invalid');

        // Validar campo Nombre (requerido)
        if (!$('#editContactNombre').val().trim()) {
            $('#editContactNombre').addClass('is-invalid');
            isValid = false;
        }

        // Validar formato de email si está presente
        const email = $('#editContactEmail').val().trim();
        if (email && !isValidEmail(email)) {
            $('#editContactEmail').addClass('is-invalid');
            isValid = false;
        }

        if (!isValid) {
            showNotify('error', 'Error', 'Por favor complete los campos requeridos correctamente');
        }

        return isValid;
    }

    // ===== Función para cargar los contactos del cliente =====
    function loadCustomerContacts(clienteId) {
        $.get(`/Customer/GetContactsByCustomer/${clienteId}`, function (data) {
            $('#contacts-container').html(data);
        }).fail(function () {
            showNotify('error', 'Error', 'No se pudieron cargar los contactos');
        });
    }
}