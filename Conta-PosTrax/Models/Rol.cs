using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    [Table("Roles", Schema = "Seguridad")]
    public class Rol
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Nombre { get; set; } = string.Empty; // Cambiado de "Rol" a "Nombre"

        [Column("CreateAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdateAt")]
        public DateTime? UpdatedAt { get; set; }

        // Propiedad de navegación para Usuarios (relación 1 a N)
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    }
}
