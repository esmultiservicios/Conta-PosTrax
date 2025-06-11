using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    [Table("Menus", Schema = "Seguridad")]
    public class Menu
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string DescripcionInterna { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Descripcion { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Icono { get; set; }

        [StringLength(50)]
        public string? Url { get; set; }

        [Required]
        public int Orden { get; set; }

        public int? MenuId { get; set; }

        [Required]
        public bool Activo { get; set; }

        public DateTime? CreateAt { get; set; }

        public DateTime? UpdateAt { get; set; }

        [ForeignKey("MenuId")]
        public virtual Menu? MenuPadre { get; set; }
    }
}
