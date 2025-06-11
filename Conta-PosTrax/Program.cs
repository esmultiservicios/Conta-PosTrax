using Conta_PosTrax.Data;
using Conta_PosTrax.Services;
using Conta_PosTrax.Utilities;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración flexible para todos los entornos
var isDevelopment = builder.Environment.IsDevelopment();

// Configuración de Kestrel
if (!builder.Environment.IsDevelopment() || !OperatingSystem.IsWindows())
{
    var httpPort = Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORT") ?? "5000";
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.ListenAnyIP(int.Parse(httpPort));
    });
}

// 2. Configuración de servicios
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

// 3. Configuración de acceso a datos
builder.Services.AddScoped<IBaseDataAccess, BaseDataAccess>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<IApplicationDbContext, ApplicationDbContext>();

// Configuración del DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 4. Configuración de autenticación
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/";
        options.AccessDeniedPath = "/";
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
        options.SlidingExpiration = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = isDevelopment ? CookieSecurePolicy.None : CookieSecurePolicy.SameAsRequest;
        options.Cookie.HttpOnly = true;
        options.Cookie.Name = "HEDS.Auth";
    });

// 5. Configuración de políticas de cookies
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
    options.Secure = isDevelopment ? CookieSecurePolicy.None : CookieSecurePolicy.SameAsRequest;
    options.HttpOnly = HttpOnlyPolicy.Always;
});

// 6. Configuración para proxies inversos
if (!isDevelopment)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
}

var app = builder.Build();

// Configuración del pipeline
if (isDevelopment)
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseForwardedHeaders();
    app.UseHsts();
}

// Orden CRÍTICO de middlewares
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Cachear archivos estáticos por 1 hora
        ctx.Context.Response.Headers["Cache-Control"] = "public,max-age=3600";
    }
});

// Asegúrate de que esta línea esté ANTES de app.UseRouting();
app.UseStaticFiles(); // Para servir archivos de wwwroot

app.UseRouting();

// Agregar después de UseRouting() y antes de UseAuthentication()
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";

    // Excluir archivos estáticos, APIs y recursos
    if (path.StartsWith("/api") ||
        path.StartsWith("/_") ||
        path.StartsWith("/css") ||
        path.StartsWith("/js") ||
        path.StartsWith("/lib") ||
        path.StartsWith("/img"))
    {
        await next();
        return;
    }

    // Configurar no-cache para todas las respuestas HTML
    context.Response.OnStarting(() =>
    {
        if (context.Response.ContentType?.Contains("text/html") == true)
        {
            context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            context.Response.Headers["Pragma"] = "no-cache";
            context.Response.Headers["Expires"] = "0";
        }
        return Task.CompletedTask;
    });

    await next();
});

// Middlewares de autenticación y autorización
app.UseCookiePolicy();
app.UseAuthentication();
app.UseAuthorization();

// Configuración de rutas
app.MapControllerRoute(
    name: "dashboard",
    pattern: "Dashboard/{action=Index}/{id?}",
    defaults: new { controller = "Dashboard" });

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Login}/{id?}");

app.Run();