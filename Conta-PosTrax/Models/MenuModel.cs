// Models/MenuModel.cs
namespace Conta_PosTrax.Models
{
    public class MenuModel
    {
        public int Id { get; set; }
        public string DescripcionInterna { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Icono { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public int Orden { get; set; }
        public bool TieneAcceso { get; set; }
        public bool PuedeEditar { get; set; }
        public bool PuedeEliminar { get; set; }
        public string Grupo { get; set; } = "Main";
        public List<MenuModel> SubMenus { get; set; } = new List<MenuModel>();
    }

    public class PermisoModel
    {
        public string Rol { get; set; } = string.Empty;
        public int MenuId { get; set; }
        public bool PuedeVer { get; set; }
        public bool PuedeEditar { get; set; }
        public bool PuedeEliminar { get; set; }
    }
}