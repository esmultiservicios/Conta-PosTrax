/*customer.contacts.js*/

function openCreateContactModal(clienteId) {
    $('#createContactClienteId').val(clienteId);
    $('#createContactForm')[0].reset();
    $('#createContactEsPrincipal').prop('checked', false);
    $('#createContactModal').modal('show');
}

function editContact(id) {
    fetch(`/Customer/GetContact/${id}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => {
            $('#editContactId').val(d.id);
            $('#editContactClienteId').val(d.clienteId);
            $('#editContactNombre').val(d.nombre);
            $('#editContactCargo').val(d.cargo || '');
            $('#editContactTelefono').val(d.telefono || '');
            $('#editContactEmail').val(d.email || '');
            $('#editContactEsPrincipal').prop('checked', d.esPrincipal);
            $('#editContactModal').modal('show');
        })
        .catch(() => showNotify('error', 'Error', 'No se pudo cargar el contacto'));
}

function deleteContact(id, nombre) {
    Swal.fire({
        title: `¿Eliminar contacto "${nombre}"?`,
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/Customer/DeleteContact/${id}`,
                type: 'POST',
                headers: {
                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                },
                success: function (resp) {
                    if (resp.success) {
                        Swal.fire('Eliminado', resp.message, 'success');
                        loadCustomerContacts($('#editContactClienteId').val() || $('#createContactClienteId').val());
                    } else {
                        showNotify('error', 'Error', resp.error || 'No se pudo eliminar');
                    }
                },
                error: function () {
                    showNotify('error', 'Error', 'Error al eliminar el contacto');
                }
            });
        }
    });
}

function loadCustomerContacts(clienteId) {
    $.get(`/Customer/GetContactsByCustomer/${clienteId}`, function (data) {
        $('#contacts-container').html(data);
    }).fail(function () {
        showNotify('error', 'Error', 'No se pudieron cargar los contactos');
    });
}

// Validaciones para contactos
function validateContactForm(formType = 'edit') {
    let isValid = true;
    const prefix = formType === 'edit' ? '#editContact' : '#createContact';

    $(`${prefix}Form .is-invalid`).removeClass('is-invalid');

    if (!$(`${prefix}Nombre`).val().trim()) {
        $(`${prefix}Nombre`).addClass('is-invalid');
        isValid = false;
    }

    const email = $(`${prefix}Email`).val().trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        $(`${prefix}Email`).addClass('is-invalid');
        isValid = false;
    }

    if (!isValid) {
        showNotify('error', 'Error', 'Por favor complete los campos requeridos correctamente');
    }

    return isValid;
}

// Envío de formularios (crear y editar)
$(function () {
    $('#createContactForm').on('submit', function (e) {
        e.preventDefault();
        if (!validateContactForm('create')) return;

        const form = $(this);
        const btn = form.find('button[type="submit"]');
        const original = btn.html();

        btn.html('<i class="fas fa-spinner fa-spin me-2"></i> Guardando...').prop('disabled', true);

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
                    $('#createContactModal').modal('hide');
                    Swal.fire('¡Éxito!', resp.message, 'success');
                    loadCustomerContacts($('#createContactClienteId').val());
                } else {
                    showNotify('error', 'Error', resp.error || 'Error al guardar contacto');
                }
            },
            complete: function () {
                btn.html(original).prop('disabled', false);
            }
        });
    });

    $('#editContactForm').on('submit', function (e) {
        e.preventDefault();
        if (!validateContactForm('edit')) return;

        const form = $(this);
        const btn = form.find('button[type="submit"]');
        const original = btn.html();

        btn.html('<i class="fas fa-spinner fa-spin me-2"></i> Guardando...').prop('disabled', true);

        const formData = {};
        form.serializeArray().forEach(item => formData[item.name] = item.value);
        formData.EsPrincipal = $('#editContactEsPrincipal').is(':checked');

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (resp) {
                if (resp.success) {
                    $('#editContactModal').modal('hide');
                    Swal.fire('¡Éxito!', resp.message, 'success');
                    loadCustomerContacts($('#editContactClienteId').val());
                } else {
                    showNotify('error', 'Error', resp.error || 'Error al editar contacto');
                }
            },
            complete: function () {
                btn.html(original).prop('disabled', false);
            }
        });
    });
});
