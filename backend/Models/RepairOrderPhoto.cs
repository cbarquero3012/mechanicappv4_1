namespace MechanicApp.Server.Models
{
    public class RepairOrderPhoto
    {
        public int Id { get; set; }
        public int RepairOrderId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
