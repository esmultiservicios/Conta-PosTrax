using System.Diagnostics.Eventing.Reader;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using BCrypt.Net;

namespace Conta_PosTrax.Utilities
{
    /// <summary>
    /// Clase estática que contiene métodos de utilidad general para la aplicación
    /// </summary>
    public class Utilities
    {
        /// <summary>
        /// Métodos relacionados con seguridad y contraseñas
        /// </summary>
        public static class Security
        {
            private const HashType HashAlgorithm = HashType.SHA384;
            private const int WorkFactor = 11;

            /// <summary>
            /// Genera una contraseña aleatoria segura
            /// </summary>
            public static string GenerateRandomPassword(int length = 12)
            {
                const string validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()";
                using var rng = RandomNumberGenerator.Create();
                var bytes = new byte[length];
                rng.GetBytes(bytes);

                return new string(bytes.Select(b => validChars[b % validChars.Length]).ToArray());
            }

            /// <summary>
            /// Crea un hash BCrypt seguro de una contraseña
            /// </summary>
            public static string HashPassword(string password)
            {
                return BCrypt.Net.BCrypt.EnhancedHashPassword(password, HashAlgorithm, WorkFactor);
            }

            /// <summary>
            /// Verifica una contraseña contra un hash BCrypt
            /// </summary>
            public static bool VerifyPassword(string password, string hash)
            {
                try
                {
                    return BCrypt.Net.BCrypt.EnhancedVerify(password, hash, HashAlgorithm);
                }
                catch (SaltParseException)
                {
                    return false;
                }
            }

            /// <summary>
            /// Valida la fortaleza de una contraseña
            /// </summary>
            public static bool IsPasswordStrong(string password)
            {
                var regex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$");
                return regex.IsMatch(password);
            }
        }

        /// <summary>
        /// Métodos para manipulación de strings
        /// </summary>
        public static class Strings
        {
            /// <summary>
            /// Convierte un string a formato Title Case
            /// </summary>
            public static string ToTitleCase(string str)
            {
                return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(str.ToLower());
            }

            /// <summary>
            /// Trunca un string a la longitud especificada
            /// </summary>
            public static string Truncate(string value, int maxLength)
            {
                return value.Length <= maxLength ? value : value[..maxLength] + "...";
            }
        }

        /// <summary>
        /// Métodos para trabajar con fechas
        /// </summary>
        public static class Dates
        {
            /// <summary>
            /// Calcula la edad basada en la fecha de nacimiento
            /// </summary>
            public static int CalculateAge(DateTime birthDate)
            {
                var today = DateTime.Today;
                var age = today.Year - birthDate.Year;
                if (birthDate.Date > today.AddYears(-age)) age--;
                return age;
            }

            /// <summary>
            /// Convierte una fecha a formato amigable (ej. "hace 2 días")
            /// </summary>
            public static string ToFriendlyDate(DateTime date)
            {
                var span = DateTime.Now - date;
                return span.TotalDays > 30 ? date.ToString("dd/MM/yyyy") :
                        span.TotalDays > 1 ? $"hace {span.Days} días" :
                        span.TotalHours > 1 ? $"hace {span.Hours} horas" :
                        span.TotalMinutes > 1 ? $"hace {span.Minutes} minutos" :
                        "hace unos momentos";
            }
        }

        /// <summary>
        /// Métodos para validaciones
        /// </summary>
        public static class Validations
        {
            /// <summary>
            /// Valida si un string es un email válido
            /// </summary>
            public static bool IsValidEmail(string email)
            {
                try
                {
                    var addr = new System.Net.Mail.MailAddress(email);
                    return addr.Address == email;
                }
                catch
                {
                    return false;
                }
            }

            /// <summary>
            /// Valida si un string es un número de teléfono válido
            /// </summary>
            public static bool IsValidPhoneNumber(string phone)
            {
                return Regex.IsMatch(phone, @"^\+?(\d[\d-. ]+)?(\([\d-. ]+\))?[\d-. ]+\d$");
            }
        }
    }
}
