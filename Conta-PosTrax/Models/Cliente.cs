using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Conta_PosTrax.Models
{
    [Table("Clientes", Schema = "Comercial")]
    public class Cliente
    {
        [Key]
        public int Id { get; set; }

        [StringLength(15)]
        public string? Codigo { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(50)]
        public string? RTN { get; set; }

        public string? Direccion { get; set; }

        [StringLength(50)]
        public string? Telefono { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(1)]
        public string? TipoEntidad { get; set; } // Compañía, Gobierno, etc.

        [StringLength(20)]
        public string? ZipCode { get; set; }

        [StringLength(50)]
        public string? Telefono2 { get; set; }

        [StringLength(90)]
        public string? Contacto { get; set; } // Campo redundante (se puede eliminar si usas la relación con Contactos)

        public string? Notas { get; set; }

        [Column(TypeName = "decimal(19, 6)")]
        public decimal? Balance { get; set; }

        [Column(TypeName = "decimal(19, 6)")]
        public decimal? ChecksBal { get; set; }

        public int? TerminoPago { get; set; }

        [Column(TypeName = "decimal(19, 6)")]
        public decimal? LimiteCredito { get; set; }

        [Column(TypeName = "decimal(19, 6)")]
        public decimal? Descuento { get; set; }

        public int? ListaPrecio { get; set; }

        public int? VendedorAsignado { get; set; }

        [StringLength(3)]
        public string? Moneda { get; set; }

        public int? Pais { get; set; }

        public int? Ciudad { get; set; }

        [StringLength(50)]
        public string? CuentaContable { get; set; }

        [StringLength(80)]
        public string? NombreSocioPrincipal { get; set; }

        [StringLength(1)]
        public string? Tipo { get; set; } // "C"=Cliente, "S"=Proveedor, "L"=Lead

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("CreatedById")]
        public virtual Usuario? CreatedBy { get; set; }

        [ForeignKey("UpdatedById")]
        public virtual Usuario? UpdatedBy { get; set; }

        // Colección de contactos (relación 1 a N)
        public virtual ICollection<Contacto> Contactos { get; set; } = new List<Contacto>();
    }
}
