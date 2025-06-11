using Microsoft.EntityFrameworkCore;
using Conta_PosTrax.Models;

namespace Conta_PosTrax.Data
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Contacto> Contactos { get; set; }

        // Implementación de los métodos de la interfaz
        public new void Add<TEntity>(TEntity entity) where TEntity : class => base.Add(entity);
        public new void Update<TEntity>(TEntity entity) where TEntity : class => base.Update(entity);
        public new void Remove<TEntity>(TEntity entity) where TEntity : class => base.Remove(entity);

        public new async Task<TEntity> FindAsync<TEntity>(params object[] keyValues) where TEntity : class
            => await base.FindAsync<TEntity>(keyValues);

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Cliente>()
                .HasMany(c => c.Contactos)
                .WithOne(c => c.Cliente)
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}