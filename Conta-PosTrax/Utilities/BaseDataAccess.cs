using System.Data;
using System.Diagnostics;
using Microsoft.Data.SqlClient;

namespace Conta_PosTrax.Utilities
{
    public interface IBaseDataAccess
    {
        Task<bool> ExecuteNonQuery(string query, Dictionary<string, object>? parameters = null);
        Task<DataTable> ExecuteQueryAsync(string query, Dictionary<string, object>? parameters = null);
        Task<object?> ExecuteScalarAsync(string query, Dictionary<string, object>? parameters = null);
    }

    public class BaseDataAccess : IBaseDataAccess
    {
        private const string servidor = "154.38.186.111";
        private const string baseDeDatos = "Conta_PosTrax";
        private const string usuario = "sa";
        private const string contrasena = "*>R*Bg?GqZ,3YvS";

        public static string db_HEDS = $"Server={servidor};Database={baseDeDatos};User Id={usuario};Password={contrasena};Encrypt=false;TrustServerCertificate=True;";

        public async Task<bool> ExecuteNonQuery(string query, Dictionary<string, object>? parameters = null)
        {
            using (var connection = new SqlConnection(db_HEDS))
            {
                try
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(query, connection))
                    {
                        if (parameters != null)
                        {
                            foreach (var param in parameters)
                            {
                                // Mejor manejo de parámetros
                                var sqlParam = new SqlParameter(param.Key, param.Value ?? DBNull.Value);
                                command.Parameters.Add(sqlParam);
                            }
                        }

                        int rowsAffected = await command.ExecuteNonQueryAsync();
                        return rowsAffected > 0;
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error al ejecutar la consulta: {ex.Message}");
                    return false;
                }
            }
        }

        public async Task<DataTable> ExecuteQueryAsync(string query, Dictionary<string, object>? parameters = null)
        {
            using (var connection = new SqlConnection(db_HEDS))
            {
                try
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(query, connection))
                    {
                        if (parameters != null)
                        {
                            foreach (var param in parameters)
                            {
                                var sqlParam = new SqlParameter(param.Key, param.Value ?? DBNull.Value);
                                command.Parameters.Add(sqlParam);
                            }
                        }

                        using (var adapter = new SqlDataAdapter(command))
                        {
                            DataTable resultTable = new DataTable();
                            await Task.Run(() => adapter.Fill(resultTable));
                            return resultTable;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error al ejecutar la consulta: {ex.Message}");
                    throw;
                }
            }
        }

        public async Task<object?> ExecuteScalarAsync(string query, Dictionary<string, object>? parameters = null)
        {
            using (var connection = new SqlConnection(db_HEDS))
            {
                await connection.OpenAsync();
                using (var command = new SqlCommand(query, connection))
                {
                    if (parameters != null)
                    {
                        foreach (var param in parameters)
                        {
                            var sqlParam = new SqlParameter(param.Key, param.Value ?? DBNull.Value);
                            command.Parameters.Add(sqlParam);
                        }
                    }
                    return await command.ExecuteScalarAsync();
                }
            }
        }
    }
}
