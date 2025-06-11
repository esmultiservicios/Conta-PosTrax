using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Conta_PosTrax.Models
{
    [Table("Logs", Schema = "System")]
    public class Log
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime LogDate { get; set; }

        [Required]
        [StringLength(50)]
        public string LogLevel { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;

        [StringLength(4000)]
        public string? StackTrace { get; set; }

        [StringLength(255)]
        public string? TableName { get; set; }

        [StringLength(255)]
        public string? Usuario { get; set; }

        [StringLength(255)]
        public string? MachineName { get; set; }

        [StringLength(50)]
        public string? AppVersion { get; set; }

        public string? AdditionalData { get; set; }

        public DateTime? CreateAt { get; set; }

        public DateTime? UpdateAt { get; set; }
    }
}
