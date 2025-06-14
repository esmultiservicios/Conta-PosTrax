﻿using System.Data;
using System.Diagnostics;
using DBase_Operations;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Conta_PosTrax.Utilities
{
    /// <summary>
    /// Interfaz que define las operaciones básicas de acceso a datos
    /// </summary>
    public interface IBaseDataAccess
    {
        /// <summary>
        /// Ejecuta una consulta que no devuelve resultados (INSERT, UPDATE, DELETE)
        /// </summary>
        /// <param name="query">Consulta SQL a ejecutar</param>
        /// <param name="parameters">Parámetros opcionales para la consulta</param>
        /// <returns>True si la operación afectó al menos una fila, False en caso contrario</returns>
        Task<bool> ExecuteNonQuery(string query, Dictionary<string, object>? parameters = null);

        /// <summary>
        /// Ejecuta una consulta que devuelve múltiples filas de resultados
        /// </summary>
        /// <param name="query">Consulta SQL a ejecutar</param>
        /// <param name="parameters">Parámetros opcionales para la consulta</param>
        /// <returns>DataTable con los resultados de la consulta</returns>
        Task<DataTable> ExecuteQueryAsync(string query, Dictionary<string, object>? parameters = null);

        /// <summary>
        /// Ejecuta una consulta que devuelve un único valor
        /// </summary>
        /// <param name="query">Consulta SQL a ejecutar</param>
        /// <param name="parameters">Parámetros opcionales para la consulta</param>
        /// <returns>El valor de la primera columna de la primera fila en el conjunto de resultados</returns>
        Task<object?> ExecuteScalarAsync(string query, Dictionary<string, object>? parameters = null);

        /// <summary>
        /// Ejecuta una inserción y devuelve el ID generado (identity)
        /// </summary>
        /// <param name="query">Consulta SQL de inserción</param>
        /// <param name="parameters">Parámetros para la consulta de inserción</param>
        /// <returns>El ID generado para el nuevo registro, o -1 si no se pudo obtener</returns>
        Task<int> ExecuteInsertWithIdentity(string query, Dictionary<string, object> parameters);

        /// <summary>
        /// Obtiene el servicio de encriptación
        /// </summary>
        Encrypt Encrypt { get; }

        /// <summary>
        /// Obtiene el acceso de bajo nivel a la base de datos MULTIFAST
        /// </summary>
        MSSQLServerLowLevel _dataMULTIFAST { get; }
    }

    /// <summary>
    /// Implementación concreta de acceso a datos para SQL Server
    /// </summary>
    public class BaseDataAccess : IBaseDataAccess
    {
        private readonly string _connectionString;

        /// <summary>
        /// Instancia de bajo nivel para operaciones con la base de datos MULTIFAST
        /// </summary>
        public MSSQLServerLowLevel _dataMULTIFAST { get; }

        /// <summary>
        /// Servicio de encriptación para proteger datos sensibles
        /// </summary>
        public Encrypt Encrypt { get; } = new Encrypt();

        /// <summary>
        /// Constructor que recibe la configuración para obtener el connection string
        /// </summary>
        /// <param name="configuration">Interfaz de configuración de la aplicación</param>
        public BaseDataAccess(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ??
                throw new ArgumentNullException("No se encontró la cadena de conexión 'DefaultConnection' en la configuración");

            // Inicializa _dataMULTIFAST con los valores del connection string
            var builder = new SqlConnectionStringBuilder(_connectionString);
            _dataMULTIFAST = new MSSQLServerLowLevel(
                builder.DataSource,
                builder.InitialCatalog,
                builder.UserID,
                builder.Password);
        }

        /// <summary>
        /// Ejecuta una consulta que no devuelve resultados (INSERT, UPDATE, DELETE)
        /// </summary>
        /// <param name="query">Consulta SQL a ejecutar</param>
        /// <param name="parameters">Parámetros opcionales para la consulta</param>
        /// <returns>True si la operación afectó al menos una fila, False en caso contrario o si ocurrió un error</returns>
        public async Task<bool> ExecuteNonQuery(string query, Dictionary<string, object>? parameters = null)
        {
            using (var connection = new SqlConnection(_connectionString))
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

        /// <summary>
        /// Ejecuta una consulta que devuelve múltiples filas de resultados
        /// </summary>
        /// <param name="query">Consulta SQL a ejecutar</param>
        /// <param name="parameters">Parámetros opcionales para la consulta</param>
        /// <returns>DataTable con los resultados de la consulta</returns>
        /// <exception cref="Exception">Se lanza cuando ocurre un error durante la ejecución de la consulta</exception>
        public async Task<DataTable> ExecuteQueryAsync(string query, Dictionary<string, object>? parameters = null)
        {
            using (var connection = new SqlConnection(_connectionString))
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

        /// <summary>
        /// Ejecuta una consulta que devuelve un único valor
        /// </summary>
        /// <param name="query">Consulta SQL a ejecutar</param>
        /// <param name="parameters">Parámetros opcionales para la consulta</param>
        /// <returns>El valor de la primera columna de la primera fila en el conjunto de resultados, o null si no hay resultados</returns>
        public async Task<object?> ExecuteScalarAsync(string query, Dictionary<string, object>? parameters = null)
        {
            using (var connection = new SqlConnection(_connectionString))
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

        /// <summary>
        /// Ejecuta una inserción y devuelve el ID generado (identity)
        /// </summary>
        /// <param name="query">Consulta SQL de inserción</param>
        /// <param name="parameters">Parámetros para la consulta de inserción</param>
        /// <returns>El ID generado para el nuevo registro, o -1 si no se pudo obtener</returns>
        /// <exception cref="Exception">Se lanza cuando ocurre un error durante la ejecución de la consulta</exception>
        public async Task<int> ExecuteInsertWithIdentity(string query, Dictionary<string, object> parameters)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        string modifiedQuery = query;

                        if (!query.TrimEnd().EndsWith(";"))
                            modifiedQuery += ";";

                        modifiedQuery += "\nSELECT CAST(SCOPE_IDENTITY() AS INT);";

                        using (var command = new SqlCommand(modifiedQuery, connection, transaction))
                        {
                            foreach (var param in parameters)
                            {
                                command.Parameters.Add(new SqlParameter(param.Key, param.Value ?? DBNull.Value));
                            }

                            var result = await command.ExecuteScalarAsync();
                            await transaction.CommitAsync();

                            if (result == null || result == DBNull.Value)
                                return -1;

                            return Convert.ToInt32(result);
                        }
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }
            }
        }
    }
}