using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    [Table("Contactos", Schema = "Comercial")]
    public class Contacto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Cargo { get; set; }

        [StringLength(20)]
        public string? Telefono { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        public bool EsPrincipal { get; set; } = false;

        public int? ClienteId { get; set; } // FK a Clientes (puede ser Cliente o Proveedor)

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Propiedad de navegación (nullable)
        [ForeignKey("ClienteId")]
        public virtual Cliente? Cliente { get; set; }
    }
}
