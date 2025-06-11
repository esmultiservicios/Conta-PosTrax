using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    [Table("Permisos", Schema = "Seguridad")]
    public class Permiso
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MenuId { get; set; }

        public int? RolId { get; set; }

        [Required]
        public string Permisos { get; set; } = string.Empty;

        public DateTime? CreateAt { get; set; }

        public DateTime? UpdateAt { get; set; }

        [ForeignKey("MenuId")]
        public virtual Menu? Menu { get; set; }

        [ForeignKey("RolId")]
        public virtual Rol? Rol { get; set; }
    }
}
