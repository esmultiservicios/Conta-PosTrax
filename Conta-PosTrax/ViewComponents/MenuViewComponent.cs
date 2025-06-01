// Components/MenuViewComponent.cs
using Conta_PosTrax.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Conta_PosTrax.Components
{
    public class MenuViewComponent : ViewComponent
    {
        private readonly IMenuService _menuService;

        public MenuViewComponent(IMenuService menuService)
        {
            _menuService = menuService;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            // Mantener tu lógica original para obtener el rol
            var rol = (User as ClaimsPrincipal)?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            // Establecer "Super Administrador" si es nulo o vacío
            rol = string.IsNullOrEmpty(rol) ? "Super Administrador" : rol;

            var menus = await _menuService.ObtenerMenusPorRol(rol);
            return View(menus);
        }
    }
}