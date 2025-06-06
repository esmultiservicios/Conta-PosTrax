using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    public class User
    {
        public int UsuarioId { get; set; }

        [Required(ErrorMessage = "El nombre de usuario es requerido")]
        public string Usuario { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo es requerido")]
        [EmailAddress(ErrorMessage = "Formato de correo inválido")]
        public string Correo { get; set; } = string.Empty;

        public string? Password { get; set; } // Solo para creación/actualización

        [Required(ErrorMessage = "El nombre es requerido")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El apellido es requerido")]
        public string Apellido { get; set; } = string.Empty;

        [Required(ErrorMessage = "El rol es requerido")]
        public int RolId { get; set; }

        public string? RolNombre { get; set; }

        public bool Activo { get; set; } = true;

        public string? FotoURL { get; set; }

        public DateTime? FechaIngreso { get; set; }
    }

    public class RegistroModel
    {
        [Required(ErrorMessage = "Correo electrónico requerido")]
        [EmailAddress(ErrorMessage = "Formato de correo inválido")]
        public string Correo { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nombre requerido")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "Apellido requerido")]
        public string Apellido { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contraseña requerida")]
        [MinLength(6, ErrorMessage = "Mínimo 6 caracteres")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Confirmación de contraseña requerida")]
        [Compare("Password", ErrorMessage = "Las contraseñas no coinciden")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class LoginModel
    {
        [Required(ErrorMessage = "Usuario o Correo requerido")]
        public string Usuario { get; set; } = string.Empty; 

        [Required(ErrorMessage = "Contraseña requerida")]
        public string Password { get; set; } = string.Empty;
    }
}