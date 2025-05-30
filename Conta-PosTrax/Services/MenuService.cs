using Conta_PosTrax.Models;
using Conta_PosTrax.Utilities;
using System.Data;
using System.Text.Json;

namespace Conta_PosTrax.Services
{
    public interface IMenuService
    {
        Task<List<MenuModel>> ObtenerMenusPorRol(string rol);
        Task<string> ObtenerMenuComoJson(string rol);
        List<MenuModel> CargarMenuDesdeJson(string json);
    }

    public class MenuService : IMenuService
    {
        private readonly IBaseDataAccess _dataAccess;

        public MenuService(IBaseDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<List<MenuModel>> ObtenerMenusPorRol(string rol)
        {
            // Consulta para obtener los menús principales
            string query = @"
            SELECT m.*, p.PuedeVer
            FROM [Seguridad].[Menus] m
            LEFT JOIN [Seguridad].[Permisos] p ON m.Id = p.MenuId 
            INNER JOIN [Seguridad].[Roles] r ON p.RolId = r.Id AND r.NombreRol = @Rol
            WHERE m.Activo = 1 AND m.MenuPadreId IS NULL
            ORDER BY m.Orden";

            var parameters = new Dictionary<string, object> { { "@Rol", rol } };
            var result = await _dataAccess.ExecuteQueryAsync(query, parameters);

            var menus = new List<MenuModel>();
            foreach (DataRow row in result.Rows)
            {
                var menu = new MenuModel
                {
                    MenuId = Convert.ToInt32(row["Id"]),
                    Titulo = row["Titulo"].ToString() ?? string.Empty,
                    Icono = row["Icono"].ToString() ?? string.Empty,
                    Url = row["Url"].ToString() ?? string.Empty,
                    Orden = Convert.ToInt32(row["Orden"]),
                    TieneAcceso = row["PuedeVer"] != DBNull.Value && Convert.ToBoolean(row["PuedeVer"]),
                    SubMenus = await ObtenerSubMenus(Convert.ToInt32(row["Id"]), rol)  // Obtener los submenús
                };
                menus.Add(menu);
            }

            return menus.Where(m => m.TieneAcceso).OrderBy(m => m.Orden).ToList();
        }

        // Función para obtener los submenús de un menú principal
        private async Task<List<MenuModel>> ObtenerSubMenus(int MenuPadreId, string rol)
        {
            // Consulta para obtener los submenús (menús hijos)
            string query = @"
            SELECT m.*, p.PuedeVer
            FROM [Seguridad].[Menus] m
            LEFT JOIN [Seguridad].[Permisos] p ON m.Id = p.MenuId 
            INNER JOIN [Seguridad].[Roles] r ON p.RolId = r.Id AND r.NombreRol = @Rol
            WHERE m.Activo = 1 AND m.MenuPadreId = @MenuPadreId
            ORDER BY m.Orden";

            var parameters = new Dictionary<string, object>
            {
                { "@Rol", rol },
                { "@MenuPadreId", MenuPadreId }
            };

            var result = await _dataAccess.ExecuteQueryAsync(query, parameters);

            var subMenus = new List<MenuModel>();
            foreach (DataRow row in result.Rows)
            {
                subMenus.Add(new MenuModel
                {
                    MenuId = Convert.ToInt32(row["Id"]),
                    Titulo = row["Titulo"].ToString() ?? string.Empty,
                    Icono = row["Icono"].ToString() ?? string.Empty,
                    Url = row["Url"].ToString() ?? string.Empty,
                    Orden = Convert.ToInt32(row["Orden"]),
                    TieneAcceso = row["PuedeVer"] != DBNull.Value && Convert.ToBoolean(row["PuedeVer"])
                });
            }

            return subMenus.Where(m => m.TieneAcceso).OrderBy(m => m.Orden).ToList();
        }

        public async Task<string> ObtenerMenuComoJson(string rol)
        {
            var menus = await ObtenerMenusPorRol(rol);
            return JsonSerializer.Serialize(menus);
        }

        public List<MenuModel> CargarMenuDesdeJson(string json)
        {
            return JsonSerializer.Deserialize<List<MenuModel>>(json) ?? new List<MenuModel>();
        }
    }
}
