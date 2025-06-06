using System.Diagnostics;
using Conta_PosTrax.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Conta_PosTrax.Utilities;
using static Conta_PosTrax.Utilities.Utilities;

namespace Conta_PosTrax.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IBaseDataAccess _dataAccess;

        public HomeController(ILogger<HomeController> logger, IBaseDataAccess dataAccess)
        {
            _logger = logger;
            _dataAccess = dataAccess;
        }

        [HttpGet("GetUser/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUser(int id)
        {
            try
            {
                // Registro de inicio de operación
                AppLogger.LogInformation($"Iniciando obtención de usuario ID: {id}", "Usuarios", User.Identity?.Name);

                string query = @"
                SELECT 
                    u.Id AS UsuarioId,
                    u.Usuario,
                    u.Correo,
                    u.Status AS Activo,
                    r.Id AS RolId,
                    r.Nombre AS RolNombre,
                    e.Id AS EmpleadoId,
                    e.Nombre,
                    e.Apellido,
                    e.FechaIngreso,
                    e.FotoURL
                FROM   
                    [Seguridad].[Usuarios] u
                INNER JOIN [Seguridad].[Roles] r ON u.RolId = r.Id
                INNER JOIN [RRHH].[Empleados] e ON u.Id = e.UsuarioId
                WHERE 
                    u.Id = @UsuarioId";

                var parameters = new Dictionary<string, object> { { "@UsuarioId", id } };

                var result = await _dataAccess.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    AppLogger.LogWarning($"Usuario no encontrado ID: {id}", "Usuarios", User.Identity?.Name);
                    return NotFound(new { success = false, message = "Usuario no encontrado" });
                }

                var row = result.Rows[0];

                var user = new
                {
                    UsuarioId = Convert.ToInt32(row["UsuarioId"]),
                    Usuario = row["Usuario"]?.ToString(),
                    Correo = row["Correo"]?.ToString(),
                    RolId = Convert.ToInt32(row["RolId"]),
                    RolNombre = row["RolNombre"]?.ToString(),
                    Activo = Convert.ToBoolean(row["Activo"]),
                    Empleado = new
                    {
                        Id = Convert.ToInt32(row["EmpleadoId"]),
                        Nombre = row["Nombre"]?.ToString(),
                        Apellido = row["Apellido"]?.ToString(),
                        FechaIngreso = row["FechaIngreso"] != DBNull.Value ? Convert.ToDateTime(row["FechaIngreso"]) : (DateTime?)null,
                        FotoURL = row["FotoURL"]?.ToString()
                    }
                };

                AppLogger.LogInformation($"Usuario obtenido exitosamente ID: {id}", "Usuarios", User.Identity?.Name);
                return Ok(new { success = true, data = user });
            }
            catch (Exception ex)
            {
                AppLogger.LogError($"Error al obtener usuario ID: {id}", ex, "Usuarios", User.Identity?.Name, new { UserId = id });
                _logger.LogError(ex, $"Error al obtener usuario ID: {id}");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [Route("Home/Registro")]
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Registro([FromForm] RegistroModel model)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);

                AppLogger.LogWarning("Registro fallido - Modelo inválido", "Registro", null, new { Errores = errors });

                return Json(new
                {
                    success = false,
                    errors = errors
                });
            }

            try
            {
                AppLogger.LogDebug($"Iniciando registro para: {model.Correo}", "Registro");

                // 1. Verificar si el correo ya está registrado
                var existeUsuario = await _dataAccess.ExecuteQueryAsync(
                    "SELECT COUNT(1) FROM [Seguridad].[Usuarios] WHERE Correo = @Correo",
                    new Dictionary<string, object> { { "@Correo", model.Correo } });

                if (Convert.ToInt32(existeUsuario.Rows[0][0]) > 0)
                {
                    AppLogger.LogWarning($"Intento de registro con correo existente: {model.Correo}", "Registro");
                    return Json(new
                    {
                        success = false,
                        message = "Este correo ya está registrado"
                    });
                }

                // 2. Validar fortaleza de contraseña
                if (model.Password.Length < 6)
                {
                    AppLogger.LogWarning("Contraseña demasiado corta", "Registro", null, new { Longitud = model.Password.Length });
                    return Json(new
                    {
                        success = false,
                        message = "La contraseña debe tener al menos 6 caracteres"
                    });
                }

                // 3. Crear hash de contraseña
                string hashedPassword = _dataAccess.Encrypt.EncryptString(model.Password);
                AppLogger.LogDebug("Contraseña encriptada exitosamente", "Registro");

                // 4. Insertar en transacción
                await _dataAccess.ExecuteNonQuery("BEGIN TRANSACTION");

                // 4.1 Insertar usuario
                string nombreUsuario = model.Correo.Split('@')[0];
                await _dataAccess.ExecuteNonQuery(
                    @"INSERT INTO [Seguridad].[Usuarios] 
                        (Usuario, Correo, Password, Status, RolId)
                        VALUES (@Usuario, @Correo, @Password, 1, 2)",
                    new Dictionary<string, object>
                    {
                        { "@Usuario", nombreUsuario },
                        { "@Correo", model.Correo },
                        { "@Password", hashedPassword }
                    });

                // 4.2 Obtener ID del nuevo usuario
                var userId = await _dataAccess.ExecuteScalarAsync("SELECT SCOPE_IDENTITY()");

                if (userId == null)
                {
                    AppLogger.LogError("No se pudo obtener ID de usuario durante registro", null, "Registro");
                    throw new InvalidOperationException("No se pudo obtener el ID del usuario creado");
                }

                // 4.3 Insertar empleado
                await _dataAccess.ExecuteNonQuery(
                    @"INSERT INTO [RRHH].[Empleados]
                    (UsuarioId, Nombre, Apellido, FechaIngreso, Estado)
                    VALUES (@UsuarioId, @Nombre, @Apellido, GETDATE(), 1)",
                    new Dictionary<string, object>
                    {
                        { "@UsuarioId", userId },
                        { "@Nombre", model.Nombre },
                        { "@Apellido", model.Apellido }
                    });

                await _dataAccess.ExecuteNonQuery("COMMIT TRANSACTION");

                AppLogger.LogInformation($"Registro exitoso para: {model.Correo}", "Registro", nombreUsuario);
                return Json(new
                {
                    success = true,
                    redirectUrl = Url.Action("Login", "Home")
                });
            }
            catch (Exception ex)
            {
                await _dataAccess.ExecuteNonQuery("IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION");
                AppLogger.LogError("Error en registro", ex, "Registro", null, new { Correo = model.Correo });
                _logger.LogError(ex, "Error en registro");
                return Json(new
                {
                    success = false,
                    message = "Error interno al registrar: " + ex.Message
                });
            }
        }

        [Route("Home/Login")]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login([FromForm] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);

                AppLogger.LogWarning("Login fallido - Modelo inválido", "Login", null, new { Errores = errors });

                return Json(new
                {
                    success = false,
                    message = "Por favor complete todos los campos",
                    errors = errors
                });
            }

            try
            {
                AppLogger.LogDebug($"Intento de login: {model.Usuario}", "Login");

                string query = @"SELECT 
                    u.[Id],
                    u.[Usuario],
                    u.[Correo],
                    u.[Password],
                    u.[Status],
                    r.[Id] AS RolId,
                    r.[Nombre] AS Rol,
                    e.[Nombre],
                    e.[Apellido]
                FROM [Seguridad].[Usuarios] u
                INNER JOIN [Seguridad].[Roles] r ON u.RolId = r.Id
                LEFT JOIN [RRHH].[Empleados] e ON u.Id = e.UsuarioId
                WHERE u.[Status] = 1 
                AND (u.[Usuario] = @Credencial OR u.[Correo] = @Credencial)";

                var parameters = new Dictionary<string, object> { { "@Credencial", model.Usuario } };

                var result = await _dataAccess.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    AppLogger.LogWarning($"Credenciales no encontradas: {model.Usuario}", "Login");
                    _logger.LogWarning($"Credenciales no encontradas: {model.Usuario}");
                    return Json(new
                    {
                        success = false,
                        message = "Usuario/Correo o contraseña incorrectos"
                    });
                }

                var row = result.Rows[0];
                string storedHash = row["Password"]?.ToString() ?? string.Empty;

                // Verificación de contraseña usando DecryptString
                bool passwordValid = false;
                try
                {
                    string decryptedPassword = _dataAccess.Encrypt.DecryptString(storedHash);
                    passwordValid = model.Password == decryptedPassword;
                }
                catch (Exception decryptEx)
                {
                    AppLogger.LogError("Error al desencriptar contraseña", decryptEx, "Login");
                    _logger.LogError(decryptEx, "Error al desencriptar contraseña");
                    passwordValid = false;
                }

                if (!passwordValid)
                {
                    AppLogger.LogWarning("Contraseña inválida", "Login", row["Usuario"]?.ToString());
                    return Json(new
                    {
                        success = false,
                        message = "Usuario/Correo o contraseña incorrectos"
                    });
                }

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, row["Id"]?.ToString() ?? string.Empty),
                    new Claim(ClaimTypes.Name, $"{row["Nombre"]?.ToString() ?? ""} {row["Apellido"]?.ToString() ?? ""}".Trim()),
                    new Claim(ClaimTypes.Email, row["Correo"]?.ToString() ?? string.Empty),
                    new Claim(ClaimTypes.Role, row["Rol"]?.ToString() ?? string.Empty),
                    new Claim("Usuario", row["Usuario"]?.ToString() ?? string.Empty)
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(new ClaimsIdentity(claims)),
                    new AuthenticationProperties
                    {
                        IsPersistent = false,
                        ExpiresUtc = DateTime.UtcNow.AddHours(8)
                    });

                AppLogger.LogInformation($"Login exitoso para: {model.Usuario}", "Login", row["Usuario"]?.ToString());
                return Json(new
                {
                    success = true,
                    redirectUrl = Url.Action("Index", "Dashboard")
                });
            }
            catch (Exception ex)
            {
                AppLogger.LogError("Error en login", ex, "Login", null, new { Usuario = model.Usuario });
                _logger.LogError(ex, "Error en login");
                return Json(new
                {
                    success = false,
                    message = "Error interno del servidor. Intente nuevamente."
                });
            }
        }

        [HttpGet("")]
        [AllowAnonymous]
        public IActionResult Login()
        {
            if (User.Identity?.IsAuthenticated ?? false)
            {
                return RedirectToAction("Index", "Dashboard");
            }
            return View("Login");
        }

        [HttpGet("Home/ForgotPassword")]
        [AllowAnonymous]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpGet("Home/Register")]
        [AllowAnonymous]
        public IActionResult Register()
        {
            return View();
        }

        [HttpPost("Home/Logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var username = User.Identity?.Name;
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            AppLogger.LogInformation("Logout exitoso", "Logout", username);

            return Json(new
            {
                redirectUrl = Url.Action("Login", ""),
                clearStorage = true
            });
        }

        [HttpGet("api/auth/check")]
        [Authorize]
        public IActionResult CheckAuth()
        {
            AppLogger.LogDebug("Verificación de autenticación", "AuthCheck", User.Identity?.Name);

            return Ok(new
            {
                authenticated = true,
                username = User.Identity?.Name,
                roles = User.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
            });
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            var requestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
            AppLogger.LogError("Error en la aplicación", null, "Global", null, new { RequestId = requestId });

            return View(new ErrorViewModel { RequestId = requestId });
        }
    }
}