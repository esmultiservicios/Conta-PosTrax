// Función para editar contacto
function editContact(id) {
    fetch(`/Customer/GetContact/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener contacto');
            }
            return response.json();
        })
        .then(data => {
            // Crear el modal de edición si no existe
            if ($('#editContactModal').length === 0) {
                createEditContactModal();
            }

            $('#editContactId').val(data.id);
            $('#editContactClienteId').val(data.clienteId);
            $('#editContactNombre').val(data.nombre);
            $('#editContactCargo').val(data.cargo || '');
            $('#editContactTelefono').val(data.telefono || '');
            $('#editContactEmail').val(data.email || '');
            $('#editContactEsPrincipal').prop('checked', data.esPrincipal || false);

            $('#editContactModal').modal('show');
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo cargar la información del contacto', 'error');
        });
}

// Función para crear el modal de edición dinámicamente
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

    // Configurar el envío del formulario de edición
    $('#editContactForm').on("submit", function (e) {
        e.preventDefault();

        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: $(this).serialize(),
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (response) {
                if (response.success) {
                    $('#editContactModal').modal('hide');
                    Swal.fire('Éxito', response.message, 'success');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Swal.fire('Error', response.errors ? response.errors.join('\n') : 'Error al guardar', 'error');
                }
            },
            error: function (xhr) {
                Swal.fire('Error', 'Ocurrió un error al actualizar el contacto', 'error');
            }
        });
    });
}

// Función para eliminar contacto
function deleteContact(id, nombre) {
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
                        return response.json();
                    }
                    throw new Error('Error en la respuesta del servidor');
                })
                .then(data => {
                    if (data.success) {
                        Swal.fire('Eliminado!', data.message, 'success');
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        Swal.fire('Error', data.error || 'Error al eliminar', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire('Error', 'Ocurrió un error al eliminar el contacto', 'error');
                });
        }
    });
}

// Manejar el envío del formulario de agregar contacto
$('#addContactForm').on("submit", function (e) {
    e.preventDefault();

    $.ajax({
        url: $(this).attr('action'),
        type: 'POST',
        data: $(this).serialize(),
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (response.success) {
                $('#addContactModal').modal('hide');
                Swal.fire('Éxito', response.message, 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                Swal.fire('Error', response.errors ? response.errors.join('\n') : 'Error al guardar', 'error');
            }
        },
        error: function (xhr) {
            Swal.fire('Error', 'Ocurrió un error al agregar el contacto', 'error');
        }
    });
});

// Inicialización cuando el documento está listo
$(function () {
    // Asegurarse de que el token antifalsificación esté disponible para las solicitudes AJAX
    $.ajaxSetup({
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        }
    });
});