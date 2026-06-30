using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransportationController : ControllerBase
    {
        private readonly WorldNewsDbContext _db;

        // Mock coordinate database for Delhi locations to allow path simulation
        private static readonly Dictionary<string, (double Lat, double Lng)> Locations = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Connaught Place", (28.6304, 77.2177) },
            { "India Gate", (28.6129, 77.2295) },
            { "Delhi Airport (IGI)", (28.5562, 77.1000) },
            { "Red Fort", (28.6562, 77.2410) },
            { "Lotus Temple", (28.5535, 77.2588) },
            { "Qutub Minar", (28.5244, 77.1855) },
            { "Akshardham Temple", (28.6127, 77.2773) }
        };

        public TransportationController(WorldNewsDbContext db)
        {
            _db = db;
        }

        [HttpGet("cabs")]
        public async Task<IActionResult> GetCabs()
        {
            try
            {
                var cabs = await _db.CabDrivers.ToListAsync();
                return Ok(cabs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("locations")]
        public IActionResult GetLocations()
        {
            return Ok(Locations.Keys.ToList());
        }

        [HttpPost("book")]
        public async Task<IActionResult> BookRide([FromBody] BookRideRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PickupLocation) || string.IsNullOrWhiteSpace(request.Destination))
            {
                return BadRequest(new { error = "Pickup and Destination locations are required." });
            }

            try
            {
                // Resolve coordinates
                var pickupCoord = GetCoordinates(request.PickupLocation);
                var destCoord = GetCoordinates(request.Destination);

                // Calculate distance using simple Manhattan/Euclidean distance mapped to kilometers
                double latDiff = pickupCoord.Lat - destCoord.Lat;
                double lngDiff = pickupCoord.Lng - destCoord.Lng;
                double distance = Math.Sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.12; // Approx 111.12 km per degree
                if (distance < 1.0) distance = 1.2; // Minimum distance fallback

                // Rates
                double baseFare = 50;
                double perKmRate = 16;
                int speedKmh = 40;

                switch (request.VehicleType.ToLower())
                {
                    case "bike":
                        baseFare = 15;
                        perKmRate = 7;
                        speedKmh = 45;
                        break;
                    case "auto":
                        baseFare = 25;
                        perKmRate = 12;
                        speedKmh = 35;
                        break;
                    case "premium":
                        baseFare = 120;
                        perKmRate = 25;
                        speedKmh = 50;
                        break;
                }

                double price = Math.Round(baseFare + (distance * perKmRate), 2);
                int etaSeconds = (int)Math.Max(30, (distance / speedKmh) * 3600); // Ride duration in seconds

                // Match nearest available driver of the requested vehicle type
                var driver = await _db.CabDrivers
                    .Where(d => d.IsAvailable && d.VehicleType.Equals(request.VehicleType, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(d => Math.Pow(d.Latitude - pickupCoord.Lat, 2) + Math.Pow(d.Longitude - pickupCoord.Lng, 2))
                    .FirstOrDefaultAsync();

                if (driver == null)
                {
                    // If no available driver of that specific type, match any available driver as a fallback
                    driver = await _db.CabDrivers
                        .Where(d => d.IsAvailable)
                        .OrderBy(d => Math.Pow(d.Latitude - pickupCoord.Lat, 2) + Math.Pow(d.Longitude - pickupCoord.Lng, 2))
                        .FirstOrDefaultAsync();
                }

                if (driver == null)
                {
                    return BadRequest(new { error = "No drivers are currently available nearby. Please try again in a few moments." });
                }

                // Reserve the driver
                driver.IsAvailable = false;
                _db.Entry(driver).State = EntityState.Modified;

                var booking = new RideBooking
                {
                    UserEmail = request.UserEmail ?? "anonymous@worldnewzs.in",
                    PickupLocation = request.PickupLocation,
                    Destination = request.Destination,
                    VehicleType = request.VehicleType,
                    Price = price,
                    Status = "Requested",
                    CreatedAt = DateTime.UtcNow,
                    ETA = etaSeconds,
                    MatchedDriverId = driver.Id,
                    DriverName = driver.Name,
                    VehicleNumber = driver.VehicleNumber
                };

                _db.RideBookings.Add(booking);
                await _db.SaveChangesAsync();

                return Ok(booking);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("ride/{id}")]
        public async Task<IActionResult> GetRideStatus(int id)
        {
            try
            {
                var booking = await _db.RideBookings.FindAsync(id);
                if (booking == null)
                {
                    return NotFound(new { error = "Ride booking not found." });
                }

                // Dynamic Status Update based on elapsed time to simulate progress
                var elapsedSeconds = (DateTime.UtcNow - booking.CreatedAt).TotalSeconds;
                var originalStatus = booking.Status;

                if (booking.Status != "Completed")
                {
                    if (elapsedSeconds >= 45)
                    {
                        booking.Status = "Completed";
                        
                        // Set matched driver back to available and update their location to destination
                        if (booking.MatchedDriverId.HasValue)
                        {
                            var driver = await _db.CabDrivers.FindAsync(booking.MatchedDriverId.Value);
                            if (driver != null)
                            {
                                var destCoord = GetCoordinates(booking.Destination);
                                driver.IsAvailable = true;
                                driver.Latitude = destCoord.Lat;
                                driver.Longitude = destCoord.Lng;
                                _db.Entry(driver).State = EntityState.Modified;
                            }
                        }
                    }
                    else if (elapsedSeconds >= 25)
                    {
                        booking.Status = "InProgress";
                    }
                    else if (elapsedSeconds >= 12)
                    {
                        booking.Status = "Arrived";
                    }
                    else if (elapsedSeconds >= 4)
                    {
                        booking.Status = "Accepted";
                    }

                    if (originalStatus != booking.Status)
                    {
                        _db.Entry(booking).State = EntityState.Modified;
                        await _db.SaveChangesAsync();
                    }
                }

                // Add current coordinates for mapping
                var pickup = GetCoordinates(booking.PickupLocation);
                var dest = GetCoordinates(booking.Destination);
                double currentLat = pickup.Lat;
                double currentLng = pickup.Lng;

                if (booking.Status == "Accepted" && booking.MatchedDriverId.HasValue)
                {
                    // Simulating driver approaching pickup
                    var driver = await _db.CabDrivers.FindAsync(booking.MatchedDriverId.Value);
                    if (driver != null)
                    {
                        double progress = elapsedSeconds / 12.0;
                        currentLat = driver.Latitude + (pickup.Lat - driver.Latitude) * Math.Min(1.0, progress);
                        currentLng = driver.Longitude + (pickup.Lng - driver.Longitude) * Math.Min(1.0, progress);
                    }
                }
                else if (booking.Status == "InProgress")
                {
                    // Simulating ride progress from pickup to destination
                    double progress = (elapsedSeconds - 25.0) / 20.0; // 20 seconds duration
                    currentLat = pickup.Lat + (dest.Lat - pickup.Lat) * Math.Min(1.0, progress);
                    currentLng = pickup.Lng + (dest.Lng - pickup.Lng) * Math.Min(1.0, progress);
                }
                else if (booking.Status == "Completed")
                {
                    currentLat = dest.Lat;
                    currentLng = dest.Lng;
                }

                return Ok(new
                {
                    booking.Id,
                    booking.PickupLocation,
                    booking.Destination,
                    booking.VehicleType,
                    booking.Price,
                    booking.Status,
                    booking.ETA,
                    booking.DriverName,
                    booking.VehicleNumber,
                    CurrentCoords = new { lat = currentLat, lng = currentLng },
                    PickupCoords = new { lat = pickup.Lat, lng = pickup.Lng },
                    DestinationCoords = new { lat = dest.Lat, lng = dest.Lng }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetRideHistory([FromQuery] string email)
        {
            try
            {
                var history = await _db.RideBookings
                    .Where(b => b.UserEmail == email)
                    .OrderByDescending(b => b.CreatedAt)
                    .ToListAsync();
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private (double Lat, double Lng) GetCoordinates(string locationName)
        {
            if (Locations.TryGetValue(locationName, out var coords))
            {
                return coords;
            }

            // Fallback generation centered around Delhi
            var hash = locationName.GetHashCode();
            double offsetLat = (hash % 100) / 2000.0;
            double offsetLng = ((hash / 100) % 100) / 2000.0;
            return (28.6139 + offsetLat, 77.2090 + offsetLng);
        }
    }

    public class BookRideRequest
    {
        public string PickupLocation { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string VehicleType { get; set; } = "Sedan";
        public string? UserEmail { get; set; }
    }
}
