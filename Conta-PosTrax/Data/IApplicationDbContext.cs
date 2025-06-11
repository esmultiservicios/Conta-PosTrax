using Microsoft.EntityFrameworkCore;
using Conta_PosTrax.Models;
using System.Threading.Tasks;

namespace Conta_PosTrax.Data
{
    public interface IApplicationDbContext
    {
        DbSet<Cliente> Clientes { get; set; }
        DbSet<Contacto> Contactos { get; set; }

        // Métodos base
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

        // Métodos para operaciones CRUD
        void Add<TEntity>(TEntity entity) where TEntity : class;
        void Update<TEntity>(TEntity entity) where TEntity : class;
        void Remove<TEntity>(TEntity entity) where TEntity : class;

        // Métodos de consulta
        Task<TEntity> FindAsync<TEntity>(params object[] keyValues) where TEntity : class;
    }
}