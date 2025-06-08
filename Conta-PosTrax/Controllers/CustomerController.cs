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
    [Route("Customer")]
    [Authorize]
    public class CustomerController : Controller
    {
        private readonly ILogger<CustomerController> _logger;
        private readonly IBaseDataAccess _dataAccess;

        public CustomerController(ILogger<CustomerController> logger, IBaseDataAccess dataAccess)
        {
            _logger = logger;
            _dataAccess = dataAccess;
        }

        [HttpGet("")]
        [AllowAnonymous]
        public IActionResult Index()
        {           
            return View();
        }

        [HttpGet("AddCustomer")]
        [AllowAnonymous]
        public IActionResult AddCustomer()
        {
            return View();
        }

        [HttpGet("EditCustomer")]
        [AllowAnonymous]
        public IActionResult EditCustomer()
        {
            return View();
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