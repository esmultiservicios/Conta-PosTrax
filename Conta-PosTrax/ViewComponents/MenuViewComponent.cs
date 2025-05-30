using Conta_PosTrax.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Conta_PosTrax.ViewComponents
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
            var rol = (User as ClaimsPrincipal)?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(rol))
                return Content(string.Empty);

            var menus = await _menuService.ObtenerMenusPorRol(rol);
            return View(menus);
        }
    }
}
