namespace Conta_PosTrax.Models
{
    // MenuModel.cs
    public class MenuModel
    {
        public int MenuId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Icono { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public int Orden { get; set; }
        public bool TieneAcceso { get; set; }
        public List<MenuModel> SubMenus { get; set; } = new List<MenuModel>();
    }

    // PermisoModel.cs
    public class PermisoModel
    {
        public string Rol { get; set; } = string.Empty;
        public int MenuId { get; set; }
        public bool PuedeVer { get; set; }
    }
}
