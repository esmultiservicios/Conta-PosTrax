using Conta_PosTrax.Models;
using Conta_PosTrax.Utilities;
using System.Data;
using System.Diagnostics;
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
            _dataAccess = dataAccess ?? throw new ArgumentNullException(nameof(dataAccess));
        }

        public async Task<List<MenuModel>> ObtenerMenusPorRol(string rol)
        {
            if (string.IsNullOrEmpty(rol))
            {
                return new List<MenuModel>();
            }

            try
            {
                string query = @"SELECT	m.Id,m.Descripcion,m.DescripcionInterna,
		                                m.Icono,m.Url,m.Orden,
		                                CASE WHEN p.Permisos LIKE '%""ver"":true%' OR p.Permisos LIKE '%""ver"": 1%' THEN 1 ELSE 0 END AS TieneAcceso,
		                                CASE WHEN p.Permisos LIKE '%""editar"":true%' OR p.Permisos LIKE '%""editar"": 1%' THEN 1 ELSE 0 END AS PuedeEditar,
		                                CASE WHEN p.Permisos LIKE '%""eliminar"":true%' OR p.Permisos LIKE '%""eliminar"": 1%' THEN 1 ELSE 0 END AS PuedeEliminar,
		                                'Main' AS Grupo,p.Permisos
                                FROM [Seguridad].[Menus] m
	                                LEFT JOIN [Seguridad].[Permisos] p 
		                                ON m.Id = p.MenuId 
	                                INNER JOIN [Seguridad].[Roles] r 
		                                ON p.RolId = r.Id AND r.Rol =  @Rol
                                WHERE m.Activo = 1 AND m.MenuId IS NULL
                                ORDER BY m.Orden";

                var parameters = new Dictionary<string, object> { { "@Rol", rol } };
                var result = await _dataAccess.ExecuteQueryAsync(query, parameters);

                if (result == null)
                {
                    return new List<MenuModel>();
                }

                var menus = new List<MenuModel>();
                foreach (DataRow row in result.Rows)
                {
                    var menu = new MenuModel
                    {
                        Id = row["Id"] != DBNull.Value ? Convert.ToInt32(row["Id"]) : 0,
                        Descripcion = row["Descripcion"]?.ToString() ?? string.Empty,
                        DescripcionInterna = row["DescripcionInterna"]?.ToString() ?? string.Empty,
                        Icono = row["Icono"]?.ToString() ?? string.Empty,
                        Url = row["Url"]?.ToString() ?? string.Empty,
                        Orden = row["Orden"] != DBNull.Value ? Convert.ToInt32(row["Orden"]) : 0,
                        Grupo = row["Grupo"]?.ToString() ?? "Main",
                        TieneAcceso = row["TieneAcceso"] != DBNull.Value && Convert.ToBoolean(row["TieneAcceso"]),
                        PuedeEditar = row["PuedeEditar"] != DBNull.Value && Convert.ToBoolean(row["PuedeEditar"]),
                        PuedeEliminar = row["PuedeEliminar"] != DBNull.Value && Convert.ToBoolean(row["PuedeEliminar"]),
                        SubMenus = await ObtenerSubMenus(Convert.ToInt32(row["Id"]), rol)
                    };

                    if (menu.TieneAcceso)
                    {
                        menus.Add(menu);
                    }
                }

                return menus.OrderBy(m => m.Orden).ToList();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error al obtener menús: {ex.Message}");
                return new List<MenuModel>();
            }
        }

        private async Task<List<MenuModel>> ObtenerSubMenus(int menuPadreId, string rol)
        {
            if (menuPadreId <= 0 || string.IsNullOrEmpty(rol))
            {
                return new List<MenuModel>();
            }

            try
            {
                string query = @"
                SELECT 
                    m.Id,
                    m.Descripcion,
                    m.DescripcionInterna,
                    m.Icono,
                    m.Url,
                    m.Orden,
                    CASE WHEN p.Permisos LIKE '%""ver"":true%' OR p.Permisos LIKE '%""ver"": 1%' THEN 1 ELSE 0 END AS TieneAcceso,
                    CASE WHEN p.Permisos LIKE '%""editar"":true%' OR p.Permisos LIKE '%""editar"": 1%' THEN 1 ELSE 0 END AS PuedeEditar,
                    CASE WHEN p.Permisos LIKE '%""eliminar"":true%' OR p.Permisos LIKE '%""eliminar"": 1%' THEN 1 ELSE 0 END AS PuedeEliminar,
                    p.Permisos
                FROM [Seguridad].[Menus] m
                LEFT JOIN [Seguridad].[Permisos] p ON m.Id = p.MenuId 
                INNER JOIN [Seguridad].[Roles] r ON p.RolId = r.Id AND r.Rol = @Rol
                WHERE m.Activo = 1 AND m.MenuId = @MenuPadreId
                ORDER BY m.Orden";

                var parameters = new Dictionary<string, object>
                {
                    { "@Rol", rol },
                    { "@MenuPadreId", menuPadreId }
                };

                var result = await _dataAccess.ExecuteQueryAsync(query, parameters);

                if (result == null || result.Rows.Count == 0)
                {
                    return new List<MenuModel>();
                }

                var subMenus = new List<MenuModel>();
                foreach (DataRow row in result.Rows)
                {
                    var subMenu = new MenuModel
                    {
                        Id = row["Id"] != DBNull.Value ? Convert.ToInt32(row["Id"]) : 0,
                        Descripcion = row["Descripcion"]?.ToString() ?? string.Empty,
                        DescripcionInterna = row["DescripcionInterna"]?.ToString() ?? string.Empty,
                        Icono = row["Icono"]?.ToString() ?? string.Empty,
                        Url = row["Url"]?.ToString() ?? string.Empty,
                        Orden = row["Orden"] != DBNull.Value ? Convert.ToInt32(row["Orden"]) : 0,
                        TieneAcceso = row["TieneAcceso"] != DBNull.Value && Convert.ToBoolean(row["TieneAcceso"]),
                        PuedeEditar = row["PuedeEditar"] != DBNull.Value && Convert.ToBoolean(row["PuedeEditar"]),
                        PuedeEliminar = row["PuedeEliminar"] != DBNull.Value && Convert.ToBoolean(row["PuedeEliminar"])
                    };

                    if (subMenu.TieneAcceso)
                    {
                        subMenus.Add(subMenu);
                    }
                }

                return subMenus.OrderBy(m => m.Orden).ToList();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error al obtener submenús: {ex.Message}");
                return new List<MenuModel>();
            }
        }

        public async Task<string> ObtenerMenuComoJson(string rol)
        {
            if (string.IsNullOrEmpty(rol))
            {
                return "[]";
            }

            var menus = await ObtenerMenusPorRol(rol);
            return JsonSerializer.Serialize(menus ?? new List<MenuModel>());
        }

        public List<MenuModel> CargarMenuDesdeJson(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                return new List<MenuModel>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<MenuModel>>(json) ?? new List<MenuModel>();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error al cargar menú desde JSON: {ex.Message}");
                return new List<MenuModel>();
            }
        }
    }
}