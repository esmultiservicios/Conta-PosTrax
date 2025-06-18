using System.Diagnostics;
using Conta_PosTrax.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Conta_PosTrax.Utilities;
using static Conta_PosTrax.Utilities.Utilities;
using Conta_PosTrax.Data;
using Microsoft.EntityFrameworkCore;

namespace Conta_PosTrax.Controllers
{
    [Route("Customer")]
    [Authorize]
    public class CustomerController : Controller
    {
        private readonly ILogger<CustomerController> _logger;
        private readonly IBaseDataAccess _dataAccess;
        private readonly IApplicationDbContext _context;

        public CustomerController(ILogger<CustomerController> logger, IBaseDataAccess dataAccess, IApplicationDbContext context)
        {
            _logger = logger;
            _dataAccess = dataAccess;
            _context = context;

            // Inicializa SampleData una sola vez
            SampleData.Init(_dataAccess);
        }

        // ==============================================
        // ACCIONES PRINCIPALES
        // ==============================================

        [HttpGet("GetCustomers")]
        public async Task<IActionResult> GetCustomers(string? codigo = null, string? nombre = null, string? rtn = null, string? email = null)
        {
            try
            {
                var query = _context.Clientes.AsQueryable();

                // Aplicar filtros de manera segura
                if (!string.IsNullOrWhiteSpace(codigo))
                {
                    query = query.Where(c => c.Codigo != null && c.Codigo.Contains(codigo));
                }

                if (!string.IsNullOrWhiteSpace(nombre))
                {
                    query = query.Where(c => c.Nombre != null && c.Nombre.Contains(nombre));
                }

                if (!string.IsNullOrWhiteSpace(rtn))
                {
                    query = query.Where(c => c.RTN != null && c.RTN.Contains(rtn));
                }

                if (!string.IsNullOrWhiteSpace(email))
                {
                    query = query.Where(c => c.Email != null && c.Email.Contains(email));
                }

                var clientes = await query
                    .OrderBy(c => c.Nombre)
                    .Select(c => new
                    {
                        c.Id,
                        c.Codigo,
                        c.Nombre,
                        c.RTN,
                        c.Telefono,
                        c.Email,
                        c.Balance,
                        c.CreatedAt
                    })
                    .ToListAsync();

                return Json(new { data = clientes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener clientes");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        [HttpGet("")]
        public async Task<IActionResult> Index()
        {
            var clientes = await _context.Clientes
                .OrderBy(c => c.Nombre)
                .ToListAsync();

            return View(clientes);

            // Opción con Entity Framework - más limpio y mantenible
            //var clientes = await _context.Clientes
            //    .OrderBy(c => c.Nombre)
            //    .Select(c => new Cliente // Proyección para seleccionar solo los campos necesarios
            //    {
            //        Id = c.Id,
            //        Codigo = c.Codigo,
            //        Nombre = c.Nombre,
            //        RTN = c.RTN,
            //        Direccion = c.Direccion
            //        // Solo incluye los campos que necesitas en la vista
            //    })
            //    .AsNoTracking() // Mejor rendimiento para operaciones de solo lectura
            //    .ToListAsync();

            //return View(clientes);
        }

        [HttpGet("AddCustomer")]
        public IActionResult AddCustomer()
        {
            return View(new Cliente());
        }

        [HttpPost("AddCustomer")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddCustomer(Cliente cliente)
        {
            if (ModelState.IsValid)
            {
                cliente.CreatedAt = DateTime.Now;
                _context.Add(cliente);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(cliente);
        }

        // ==============================================
        // CRUD COMPLETO
        // ==============================================

        [HttpGet("Details/{id}")]
        public async Task<IActionResult> Details(int id)
        {
            var cliente = await _context.Clientes
                .Include(c => c.Contactos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cliente == null)
            {
                return NotFound();
            }
            return View(cliente);
        }

        [HttpGet("EditCustomer/{id}")]
        public async Task<IActionResult> EditCustomer(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound();
            }
            return View(cliente);
        }

        [HttpPost("EditCustomer/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditCustomer(int id, Cliente cliente)
        {
            if (id != cliente.Id)
            {
                return Json(new
                {
                    success = false,
                    error = "El identificador del cliente no coincide."
                });
            }

            if (!ModelState.IsValid)
            {
                var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return Json(new { success = false, errors = errores });
            }

            try
            {
                var existente = await _context.Clientes.FindAsync(cliente.Id);
                if (existente == null)
                    return Json(new { success = false, error = "Cliente no encontrado" });

                // Campos editables
                existente.Codigo = cliente.Codigo;
                existente.Nombre = cliente.Nombre;
                existente.RTN = cliente.RTN;
                existente.TipoEntidad = cliente.TipoEntidad;
                existente.Tipo = cliente.Tipo;
                existente.Telefono = cliente.Telefono;
                existente.Telefono2 = cliente.Telefono2;
                existente.Email = cliente.Email;
                existente.Contacto = cliente.Contacto;
                existente.NombreSocioPrincipal = cliente.NombreSocioPrincipal;
                existente.Direccion = cliente.Direccion;
                existente.Balance = cliente.Balance;
                existente.ChecksBal = cliente.ChecksBal;
                existente.LimiteCredito = cliente.LimiteCredito;
                existente.TerminoPago = cliente.TerminoPago;
                existente.Descuento = cliente.Descuento;
                existente.ListaPrecio = cliente.ListaPrecio;
                existente.Moneda = cliente.Moneda;
                existente.Pais = cliente.Pais;
                existente.Ciudad = cliente.Ciudad;
                existente.CuentaContable = cliente.CuentaContable;
                existente.VendedorAsignado = cliente.VendedorAsignado;
                existente.Notas = cliente.Notas;
                existente.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Cliente actualizado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar cliente");
                return Json(new { success = false, error = "Error interno al actualizar el cliente" });
            }
        }

        [HttpPost("Delete/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var cliente = await _context.Clientes
                    .Include(c => c.Contactos)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (cliente == null)
                {
                    return Json(new { success = false, error = "Cliente no encontrado" });
                }

                // Eliminar primero los contactos asociados
                if (cliente.Contactos.Any())
                {
                    _context.Contactos.RemoveRange(cliente.Contactos);
                }

                _context.Clientes.Remove(cliente);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Cliente eliminado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar cliente");
                return Json(new
                {
                    success = false,
                    error = "Error interno al eliminar el cliente",
                    detailedError = ex.Message
                });
            }
        }

        [HttpGet("GetContact/{id}")]
        public async Task<IActionResult> GetContact(int id)
        {
            var contacto = await _context.Contactos.FindAsync(id);
            if (contacto == null)
            {
                return NotFound();
            }

            return Json(new
            {
                id = contacto.Id,
                clienteId = contacto.ClienteId,
                nombre = contacto.Nombre,
                cargo = contacto.Cargo,
                telefono = contacto.Telefono,
                email = contacto.Email,
                esPrincipal = contacto.EsPrincipal
            });
        }

        [HttpPost("AddContact")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddContact([FromForm] Contacto contacto)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    contacto.CreatedAt = DateTime.Now;

                    // Si es el primer contacto, marcarlo como principal
                    if (!await _context.Contactos.AnyAsync(c => c.ClienteId == contacto.ClienteId))
                    {
                        contacto.EsPrincipal = true;
                    }

                    // Si se marca como principal, quitar el principal anterior
                    if (contacto.EsPrincipal)
                    {
                        var principales = await _context.Contactos
                            .Where(c => c.ClienteId == contacto.ClienteId && c.EsPrincipal)
                            .ToListAsync();

                        foreach (var principal in principales)
                        {
                            principal.EsPrincipal = false;
                            _context.Contactos.Update(principal);
                        }
                    }

                    _context.Contactos.Add(contacto);
                    await _context.SaveChangesAsync();

                    return Json(new { success = true, message = "Contacto agregado correctamente" });
                }

                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return Json(new { success = false, errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar contacto");
                return Json(new { success = false, error = "Error interno al guardar el contacto" });
            }
        }

        [HttpPost("EditContact")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditContact([FromForm] Contacto contacto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return Json(new { success = false, errors });
            }

            try
            {
                var existente = await _context.Contactos.FindAsync(contacto.Id);
                if (existente == null)
                {
                    return Json(new { success = false, error = "Contacto no encontrado" });
                }

                // Actualizar campos
                existente.Nombre = contacto.Nombre;
                existente.Cargo = contacto.Cargo;
                existente.Telefono = contacto.Telefono;
                existente.Email = contacto.Email;
                existente.EsPrincipal = contacto.EsPrincipal;
                existente.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Contacto actualizado correctamente"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar contacto");
                return Json(new
                {
                    success = false,
                    error = "Error interno al actualizar el contacto"
                });
            }
        }

        [HttpPost("DeleteContact/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteContact(int id)
        {
            try
            {
                var contacto = await _context.Contactos.FindAsync(id);
                if (contacto == null)
                {
                    return Json(new { success = false, error = "Contacto no encontrado" });
                }

                _context.Contactos.Remove(contacto);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Contacto eliminado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar contacto");
                return Json(new { success = false, error = "Error interno al eliminar el contacto" });
            }
        }

        // ==============================================
        // MÉTODOS AUXILIARES
        // ==============================================

        private bool ClienteExists(int id)
        {
            return _context.Clientes.Any(e => e.Id == id);
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