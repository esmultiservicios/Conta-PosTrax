// Función para editar contacto
function editContact(id) {
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
            Swal.fire('Error', 'No se pudo cargar la información del contacto', 'error');
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
                        Swal.fire('Eliminado!', 'El contacto ha sido eliminado.', 'success');
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        Swal.fire('Error', 'No se pudo eliminar el contacto', 'error');
                    }
                })
                .catch(error => {
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
        success: function (response) {
            $('#addContactModal').modal('hide');
            Swal.fire('Éxito', 'Contacto agregado correctamente', 'success');
            setTimeout(() => location.reload(), 1500);
        },
        error: function (xhr) {
            Swal.fire('Error', 'Ocurrió un error al agregar el contacto', 'error');
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
            Swal.fire('Éxito', 'Contacto actualizado correctamente', 'success');
            setTimeout(() => location.reload(), 1500);
        },
        error: function (xhr) {
            Swal.fire('Error', 'Ocurrió un error al actualizar el contacto', 'error');
        }
    });
});