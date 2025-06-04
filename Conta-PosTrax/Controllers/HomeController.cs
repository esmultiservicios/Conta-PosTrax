using System.Diagnostics;
using Conta_PosTrax.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Conta_PosTrax.Utilities;

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
                string query = @"
                SELECT 
                    u.Id AS 'UsuarioId',
                    u.Gafete,
                    e.Nombre AS NombreCompleto,
                    r.NombreRol AS RolNombre,
                    u.RolId,
                    u.Activo
                FROM   
                    [HEDS].[Seguridad].[Usuarios] u
                INNER JOIN [HEDS].[Seguridad].[Roles] r ON u.RolId = r.Id
                INNER JOIN [HEDS].[Coffe].[Empleados] e ON u.Gafete = e.CodEmpleado
                WHERE 
                    u.Id = @UsuarioId";

                var parameters = new Dictionary<string, object>
                {
                    { "@UsuarioId", id }
                };

                var result = await _dataAccess.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { success = false, message = "Usuario no encontrado" });
                }

                var row = result.Rows[0];

                var user = new User
                {
                    UsuarioId = Convert.ToInt32(row["UsuarioId"]),
                    NombreCompleto = row["NombreCompleto"]?.ToString() ?? string.Empty,
                    RolNombre = row["RolNombre"]?.ToString() ?? string.Empty,
                    RolId = Convert.ToInt32(row["RolId"]),
                    Activo = Convert.ToBoolean(row["Activo"]),
                    Password = "" // no se retorna nunca
                };

                return Ok(new { success = true, data = user });
            }
            catch (Exception ex)
            {
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
                return Json(new
                {
                    success = false,
                    errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                });
            }

            try
            {
                // 1. Verificar que el usuario existe
                var usuario = await _dataAccess.ExecuteQueryAsync(
                "SELECT [CodEmpleado] FROM [HEDS].[Coffe].[Empleados] WHERE [CodEmpleado] = @Gafete",
                new Dictionary<string, object> { { "@Gafete", model.Gafete } });

                if (usuario.Rows.Count == 0)
                {
                    return Json(new
                    {
                        success = false,
                        type = "error",
                        title = "Error",
                        message = "Gafete no encontrado"
                    });
                }

                // 2. Validar fortaleza de contraseña
                if (model.Password.Length < 6)
                {
                    return Json(new
                    {
                        success = false,
                        message = "La contraseña debe tener al menos 6 caracteres"
                    });
                }

                // 3. Verificar si el gafete existe
                var existe = await _dataAccess.ExecuteQueryAsync(
                    "SELECT COUNT(1) FROM [HEDS].[Seguridad].[Usuarios] WHERE Gafete = @Gafete",
                    new Dictionary<string, object> { { "@Gafete", model.Gafete } });

                if (Convert.ToInt32(existe.Rows[0][0]) > 0)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Este gafete ya está registrado"
                    });
                }

                // 4. Crear hash (DEBUG: Registrar la contraseña y hash)
                _logger.LogInformation($"Registrando: Gafete={model.Gafete}, Password={model.Password}");
                string hashedPassword = "";//Utilities.Security.HashPassword(model.Password);
                _logger.LogInformation($"Hash generado: {hashedPassword}");

                // 4. Insertar en BD
                await _dataAccess.ExecuteQueryAsync(
                    @"INSERT INTO [HEDS].[Seguridad].[Usuarios] 
                    (
                        Gafete, 
                        Password, 
                        RolId, 
                        Activo
                    ) 
                    VALUES (
                        @Gafete, 
                        @Password, 
                        2, 
                        1
                    )",

                new Dictionary<string, object>
                {
                    { "@Gafete", model.Gafete },
                    { "@Password", hashedPassword }
                });

                return Json(new
                {
                    success = true,
                    redirectUrl = Url.Action("Login", "")
                });
            }
            catch (Exception ex)
            {
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
                return Json(new
                {
                    success = false,
                    message = "Por favor complete todos los campos"
                });
            }

            try
            {
                _logger.LogInformation($"Intento de login - Correo: {model.Usuario}");

                string QueryUser = @"SELECT 
	                u.[Id],
                    u.[Usuario],
                    u.[Correo],
                    u.[Password],
                    u.[Status],
                    u.[FechaCreacion],
                    r.[RolId],
                    r.[Rol],
                    u.[CreateAt],
                    u.[UpdateAt]
                FROM [Conta_PosTrax].[Seguridad].[Usuarios] AS u
                INNER JOIN [Conta_PosTrax].[Seguridad].[Roles] AS r ON u.RolId = r.Id
                WHERE u.[Status] = @Status AND u.[Correo] = @Correo";

                var parametersQuery = new Dictionary<string, object> {
                    { "@Status", 1 },
                    { "@Correo", model.Usuario } 
                };

                var result = await _dataAccess.ExecuteQueryAsync(QueryUser, parametersQuery);

                if (result.Rows.Count == 0)
                {
                    _logger.LogWarning($"Usuario no encontrado - Gafete: {model.Usuario}");
                    return Json(new
                    {
                        success = false,
                        message = "Usuario o contraseña incorrectos"
                    });
                }

                var row = result.Rows[0];
                string storedHash = row["Password"]?.ToString() ?? string.Empty;

                _logger.LogInformation($"Hash almacenado: {storedHash}");
                _logger.LogInformation($"Contraseña recibida: {model.Password}");

                if (!Convert.ToBoolean(row["Activo"]))
                {
                    return Json(new
                    {
                        success = false,
                        message = "Cuenta desactivada. Contacte al administrador."
                    });
                }

                bool passwordValid = true;//Utilities.Security.VerifyPassword(model.Password, storedHash);
                _logger.LogInformation($"Resultado verificación: {passwordValid}");

                if (!passwordValid)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Usuario o contraseña incorrectos"
                    });
                }

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, row["Id"]?.ToString() ?? string.Empty),
                    new Claim("Correo", row["Correo"]?.ToString() ?? string.Empty),
                    new Claim(ClaimTypes.Role, row["Rol"]?.ToString() ?? string.Empty),
                    new Claim("RolId", row["RolId"]?.ToString() ?? "0")
                };

                await HttpContext.SignInAsync(
                    new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)),
                    new AuthenticationProperties
                    {
                        IsPersistent = false,
                        ExpiresUtc = DateTime.UtcNow.AddMinutes(30)
                    });

                return Json(new
                {
                    success = true,
                    redirectUrl = Url.Action("Index", "Dashboard")
                });
            }
            catch (Exception ex)
            {
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
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // Limpiar todo el almacenamiento local
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
            // Devuelve información básica del usuario
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
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
