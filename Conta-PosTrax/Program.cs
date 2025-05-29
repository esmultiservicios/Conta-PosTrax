using Conta_PosTrax.Utilities;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// 1. Configuraci�n flexible para todos los entornos
var isDevelopment = builder.Environment.IsDevelopment();

// Configuraci�n de Kestrel
if (!builder.Environment.IsDevelopment() || !OperatingSystem.IsWindows())
{
    var httpPort = Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORT") ?? "5000";
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.ListenAnyIP(int.Parse(httpPort));
    });
}

// 2. Configuraci�n de servicios
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

// 3. Configuración de acceso a datos
builder.Services.AddScoped<IBaseDataAccess, BaseDataAccess>();
//builder.Services.AddScoped<IMenuService, MenuService>();

// 4. Configuraci�n de autenticaci�n
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

// 5. Configuraci�n de pol�ticas de cookies
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
    options.Secure = isDevelopment ? CookieSecurePolicy.None : CookieSecurePolicy.SameAsRequest;
    options.HttpOnly = HttpOnlyPolicy.Always;
});

// 6. Configuraci�n para proxies inversos
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

// Configure the HTTP request pipeline.
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

// Orden Critico de middlewares
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Cachear archivos est�ticos por 1 hora
        ctx.Context.Response.Headers["Cache-Control"] = "public,max-age=3600";
    }
});

app.UseStaticFiles(); // Para servir archivos de wwwroot

// Agregar despu�s de UseRouting() y antes de UseAuthentication()
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";

// Excluir archivos est�ticos, APIs y recursos
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

// Middlewares de autenticaci�n y autorizaci�n
app.UseCookiePolicy();
app.UseAuthentication();
app.UseAuthorization();


app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
