using System;

namespace WorldNewzWebAPI.Models
{
    public class CabDriver
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty; // Bike, Auto, Sedan, Premium
        public string VehicleNumber { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsAvailable { get; set; } = true;
        public double Rating { get; set; } = 4.5;
    }

    public class RideBooking
    {
        public int Id { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string PickupLocation { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public double Price { get; set; }
        public string Status { get; set; } = string.Empty; // Requested, Accepted, Arrived, InProgress, Completed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int ETA { get; set; } // in seconds
        
        public int? MatchedDriverId { get; set; }
        public string? DriverName { get; set; }
        public string? VehicleNumber { get; set; }
    }
}
