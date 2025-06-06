using System.Diagnostics;
using System.Diagnostics.Eventing.Reader;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using BCrypt.Net;
using Newtonsoft.Json;

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
        /// Proporciona funcionalidad de logging centralizado para la aplicación Conta_PosTrax.
        /// Registra mensajes estructurados en la tabla [System].[Logs] de la base de datos.
        /// </summary>
        /// <remarks>
        /// Características principales:
        /// - Registro con múltiples niveles de severidad (Information, Warning, Error, Debug)
        /// - Captura de información contextual (usuario, máquina, versión de app)
        /// - Soporte para datos adicionales en formato JSON
        /// - Manejo automático de campos NULL y truncamiento de textos largos
        /// </remarks>
        public static class AppLogger
        {
            private static IBaseDataAccess? _dataAccess;
            private static string _appVersion = "1.0.0";
            private static readonly string _machineName = Environment.MachineName;

            /// <summary>
            /// Inicializa el sistema de logging con las dependencias necesarias.
            /// </summary>
            /// <param name="dataAccess">Instancia de IBaseDataAccess configurada</param>
            /// <param name="appVersion">Versión de la aplicación (opcional, default: "1.0.0")</param>
            /// <exception cref="ArgumentNullException">Se lanza si dataAccess es null</exception>
            /// <example>
            /// AppLogger.Initialize(dataAccess, Assembly.GetExecutingAssembly().GetName().Version.ToString());
            /// </example>
            public static void Initialize(IBaseDataAccess dataAccess, string? appVersion = null)
            {
                _dataAccess = dataAccess ?? throw new ArgumentNullException(nameof(dataAccess));
                _appVersion = appVersion ?? _appVersion;
            }

            /// <summary>
            /// Método centralizado para registro de logs en la base de datos.
            /// </summary>
            /// <param name="message">Mensaje descriptivo (requerido, max 2000 chars)</param>
            /// <param name="logLevel">Nivel de severidad (default: Information)</param>
            /// <param name="tableName">Tabla/modulo relacionado (opcional, max 255 chars)</param>
            /// <param name="usuario">Usuario asociado (opcional, max 255 chars)</param>
            /// <param name="exception">Excepción relacionada (opcional)</param>
            /// <param name="additionalData">Objeto adicional para serializar como JSON (opcional)</param>
            /// <remarks>
            /// Estructura de la tabla destino:
            /// - Logs se guardan en [System].[Logs]
            /// - Campos UpdateAt no se llenan automáticamente
            /// - CreateAt se establece con la fecha actual del servidor de BD
            /// </remarks>
            public static async void Log(string message, string logLevel = "Information",
                                      string? tableName = null, string? usuario = null,
                                      Exception? exception = null, object? additionalData = null)
            {
                if (_dataAccess == null)
                {
                    Debug.WriteLine("Logger no inicializado. No se puede registrar el log.");
                    return;
                }

                try
                {
                    string? stackTrace = exception?.StackTrace;
                    string? additionalDataJson = additionalData != null
                        ? JsonConvert.SerializeObject(additionalData)
                        : null;

                    string query = @"
                    INSERT INTO [System].[Logs] (
                        [LogDate], [LogLevel], [Message], [StackTrace], 
                        [TableName], [Usuario], [MachineName], [AppVersion], 
                        [AdditionalData], [CreateAt]
                    ) VALUES (
                        @LogDate, @LogLevel, @Message, @StackTrace, 
                        @TableName, @Usuario, @MachineName, @AppVersion, 
                        @AdditionalData, @CreateAt
                    )";

                    var parameters = new Dictionary<string, object?>
                    {
                        { "@LogDate", DateTime.Now },
                        { "@LogLevel", logLevel },
                        { "@Message", message.Length > 2000 ? message[..2000] : message },
                        { "@StackTrace", stackTrace != null && stackTrace.Length > 4000 ? stackTrace[..4000] : stackTrace },
                        { "@TableName", tableName },
                        { "@Usuario", usuario },
                        { "@MachineName", _machineName },
                        { "@AppVersion", _appVersion },
                        { "@AdditionalData", additionalDataJson },
                        { "@CreateAt", DateTime.Now }
                    };

                    // Convertir a Dictionary<string, object> no nullable
                    var nonNullableParameters = new Dictionary<string, object>();
                    foreach (var kvp in parameters)
                    {
                        nonNullableParameters.Add(kvp.Key, kvp.Value ?? DBNull.Value);
                    }

                    await _dataAccess.ExecuteNonQuery(query, nonNullableParameters);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error al registrar log: {ex.Message}");
                    Console.WriteLine($"[{logLevel}] {message}");
                    if (exception != null) Console.WriteLine(exception);
                }
            }

            /// <summary>
            /// Registra un mensaje informativo en el sistema de logs.
            /// </summary>
            /// <param name="message">Mensaje descriptivo del evento (máx. 2000 caracteres)</param>
            /// <param name="tableName">Nombre de la tabla o módulo relacionado (opcional, máx. 255 caracteres)</param>
            /// <param name="usuario">Nombre del usuario asociado a la acción (opcional, máx. 255 caracteres)</param>
            /// <param name="additionalData">Objeto adicional con datos relevantes (se serializa a JSON)</param>
            /// <example>
            /// Logger.LogInformation("Usuario autenticado correctamente", "Autenticación", "jperez", 
            ///     new { SessionId = sessionId, IP = ipAddress });
            /// </example>
            /// <remarks>
            /// Nivel de severidad: Information
            /// Uso típico: Eventos normales de la aplicación que deben ser registrados
            /// </remarks>
            public static void LogInformation(string message, string? tableName = null, string? usuario = null, object? additionalData = null)
                => Log(message, "Information", tableName, usuario, null, additionalData);

            /// <summary>
            /// Registra una advertencia en el sistema de logs.
            /// </summary>
            /// <param name="message">Descripción de la situación anómala (máx. 2000 caracteres)</param>
            /// <param name="tableName">Nombre de la tabla o módulo relacionado (opcional, máx. 255 caracteres)</param>
            /// <param name="usuario">Nombre del usuario asociado a la acción (opcional, máx. 255 caracteres)</param>
            /// <param name="additionalData">Objeto adicional con datos relevantes (se serializa a JSON)</param>
            /// <example>
            /// Logger.LogWarning("Intento de acceso fallido", "Seguridad", null, 
            ///     new { Intentos = 3, UltimoIntento = DateTime.Now });
            /// </example>
            /// <remarks>
            /// Nivel de severidad: Warning
            /// Uso típico: Situaciones inusuales que no son errores pero requieren atención
            /// </remarks>            
            public static void LogWarning(string message, string? tableName = null, string? usuario = null, object? additionalData = null)
                => Log(message, "Warning", tableName, usuario, null, additionalData);

            /// <summary>
            /// Registra un error en el sistema de logs, opcionalmente con información de excepción.
            /// </summary>
            /// <param name="message">Descripción del error (máx. 2000 caracteres)</param>
            /// <param name="exception">Excepción relacionada (opcional, incluye stack trace)</param>
            /// <param name="tableName">Nombre de la tabla o módulo relacionado (opcional, máx. 255 caracteres)</param>
            /// <param name="usuario">Nombre del usuario asociado a la acción (opcional, máx. 255 caracteres)</param>
            /// <param name="additionalData">Objeto adicional con datos relevantes (se serializa a JSON)</param>
            /// <example>
            /// try {
            ///     // Código que puede fallar
            /// } catch (Exception ex) {
            ///     Logger.LogError("Error al procesar pago", ex, "Pagos", currentUser, 
            ///         new { OrderId = orderId, Amount = amount });
            ///     throw;
            /// }
            /// </example>
            /// <remarks>
            /// Nivel de severidad: Error
            /// Uso típico: Captura de excepciones y errores de negocio importantes
            /// </remarks>            
            public static void LogError(string message, Exception? exception = null, string? tableName = null, string? usuario = null, object? additionalData = null)
                => Log(message, "Error", tableName, usuario, exception, additionalData);

            /// <summary>
            /// Registra información de depuración en el sistema de logs.
            /// </summary>
            /// <param name="message">Mensaje de depuración (máx. 2000 caracteres)</param>
            /// <param name="tableName">Nombre de la tabla o módulo relacionado (opcional, máx. 255 caracteres)</param>
            /// <param name="usuario">Nombre del usuario asociado a la acción (opcional, máx. 255 caracteres)</param>
            /// <param name="additionalData">Objeto adicional con datos relevantes (se serializa a JSON)</param>
            /// <example>
            /// Logger.LogDebug($"Valor temporal calculado: {tempValue}", "Cálculos", null, 
            ///     new { InputParams = parameters, Step = currentStep });
            /// </example>
            /// <remarks>
            /// Nivel de severidad: Debug
            /// Uso típico: Información técnica útil para desarrollo y troubleshooting
            /// Nota: Estos logs suelen desactivarse en producción
            /// </remarks>
            public static void LogDebug(string message, string? tableName = null, string? usuario = null, object? additionalData = null)
                => Log(message, "Debug", tableName, usuario, null, additionalData);
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
