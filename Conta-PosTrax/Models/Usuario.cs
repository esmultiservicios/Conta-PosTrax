using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    [Table("Usuarios", Schema = "Seguridad")]
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string NombreUsuario { get; set; } = string.Empty; // Cambiado de "Usuario" a "NombreUsuario"

        [Required]
        [StringLength(150)]
        public string Correo { get; set; } = string.Empty;

        [Required]
        [StringLength(128)]
        public string Password { get; set; } = string.Empty;

        public bool Status { get; set; } = true;

        [Column("FechaCreacion")]
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public int RolId { get; set; }

        [Column("CreateAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdateAt")]
        public DateTime? UpdatedAt { get; set; }

        // Propiedad de navegación para Rol
        [ForeignKey("RolId")]
        public virtual Rol? Rol { get; set; }
    }
}
