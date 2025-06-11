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
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    cliente.UpdatedAt = DateTime.Now;
                    _context.Update(cliente);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ClienteExists(cliente.Id))
                    {
                        return NotFound();
                    }
                    throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(cliente);
        }

        [HttpPost("Delete/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente != null)
            {
                _context.Clientes.Remove(cliente);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
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
            if (ModelState.IsValid)
            {
                contacto.CreatedAt = DateTime.Now;
                _context.Contactos.Add(contacto);
                await _context.SaveChangesAsync();
                return Ok();
            }
            return BadRequest(ModelState);
        }

        [HttpPost("EditContact")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditContact([FromForm] Contacto contacto)
        {
            if (ModelState.IsValid)
            {
                contacto.UpdatedAt = DateTime.Now;
                _context.Contactos.Update(contacto);
                await _context.SaveChangesAsync();
                return Ok();
            }
            return BadRequest(ModelState);
        }

        [HttpPost("DeleteContact/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contacto = await _context.Contactos.FindAsync(id);
            if (contacto != null)
            {
                _context.Contactos.Remove(contacto);
                await _context.SaveChangesAsync();
                return Ok();
            }
            return NotFound();
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