using System.Data;
using Conta_PosTrax.Utilities;

namespace Conta_PosTrax.Models
{
    public class SampleData
    {
        public static List<Cliente> tbl = new List<Cliente>();
        private static IBaseDataAccess? _dta; // Ahora nullable
        private static bool _initialized = false;

        public static void Init(IBaseDataAccess dataAccess)
        {
            _dta = dataAccess ?? throw new ArgumentNullException(nameof(dataAccess));
            _initialized = true;
        }

        public static bool IsInitialized() => _initialized && _dta != null;

        public static async Task Load()
        {
            if (!IsInitialized())
            {
                throw new InvalidOperationException("SampleData no ha sido inicializado. Llame a Init() primero.");
            }

            tbl.Clear();
            string sql = "SELECT Id, codigo, Nombre, RTN, Direccion FROM Comercial.clientes";

            // Aseguramos que _dta no es null con el operador !
            DataTable dt = await _dta!.ExecuteQueryAsync(sql);

            foreach (DataRow row in dt.Rows)
            {
                tbl.Add(new Cliente
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Codigo = row["codigo"].ToString(),
                    Nombre = row["Nombre"].ToString() ?? "",
                    RTN = row["RTN"].ToString(),
                    Direccion = row["Direccion"].ToString()
                });
            }
        }
    }
}