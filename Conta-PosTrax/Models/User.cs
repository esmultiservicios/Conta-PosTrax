using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    public class User
    {
        public int? UsuarioId { get; set; }

        [Required(ErrorMessage = "La contraseña es requerida")]
        [MinLength(6, ErrorMessage = "Mínimo 6 caracteres")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nombre completo requerido")]
        public string NombreCompleto { get; set; } = string.Empty;

        [Required(ErrorMessage = "El rol es requerido")]
        public int RolId { get; set; }

        public string? RolNombre { get; set; }

        public bool Activo { get; set; } = true;
    }

    public class RegistroModel
    {
        [Required(ErrorMessage = "Correo requerido")]
        public string Correo { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nombre es requerido")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contraseña requerida")]
        [MinLength(6, ErrorMessage = "Mínimo 6 caracteres")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Confirmación de contraseña requerida")]
        [Compare("Password", ErrorMessage = "Las contraseñas no coinciden")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class LoginModel
    {
        public int Id;
        public string Usuario { get; set; } = string.Empty;

        [Required(ErrorMessage = "Correo requerido")]
        public string Correo { get; set; }= string.Empty;

        [Required(ErrorMessage = "Contraseña requerida")]
        public string Password { get; set; } = string.Empty;
    }
}
