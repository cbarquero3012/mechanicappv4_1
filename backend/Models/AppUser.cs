namespace MechanicApp.Server.Models
{
    public class AppUser
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "mechanic";
        public bool Active { get; set; } = true;
        public int? MechanicId { get; set; }
        public string? Country { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
