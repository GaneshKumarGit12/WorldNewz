using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransportationController : ControllerBase
    {
        private readonly WorldNewsDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string? _googleMapsApiKey;

        // Fallback coordinates for common locations
        private static readonly Dictionary<string, (double Lat, double Lng)> DefaultLocations = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Connaught Place", (28.6304, 77.2177) },
            { "India Gate", (28.6129, 77.2295) },
            { "Delhi Airport (IGI)", (28.5562, 77.1000) },
            { "Red Fort", (28.6562, 77.2410) },
            { "Lotus Temple", (28.5535, 77.2588) },
            { "Qutub Minar", (28.5244, 77.1855) },
            { "Akshardham Temple", (28.6127, 77.2773) },
            { "Cyber City Gurgaon", (28.4950, 77.0895) },
            { "Noida Sector 18", (28.5708, 77.3261) }
        };

        public TransportationController(WorldNewsDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _googleMapsApiKey = config["GOOGLE_MAPS_API_KEY"] 
                                ?? Environment.GetEnvironmentVariable("GOOGLE_MAPS_API_KEY")
                                ?? Environment.GetEnvironmentVariable("GoogleMapsPlatform_API_Key")
                                ?? config["GoogleMapsPlatform_API_Key"];
        }

        [HttpGet("maps-config")]
        public IActionResult GetMapsConfig()
        {
            return Ok(new
            {
                apiKey = _googleMapsApiKey ?? "",
                hasValidKey = !string.IsNullOrWhiteSpace(_googleMapsApiKey),
                defaultCenter = new { lat = 28.6139, lng = 77.2090 }, // Delhi NCR center
                defaultZoom = 12
            });
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
            return Ok(DefaultLocations.Keys.ToList());
        }

        [HttpGet("places-autocomplete")]
        public async Task<IActionResult> GetPlacesAutocomplete([FromQuery] string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return Ok(new List<object>());
            }

            if (string.IsNullOrWhiteSpace(_googleMapsApiKey))
            {
                // Fallback to local default location filtering if API key not available
                var localMatches = DefaultLocations.Keys
                    .Where(k => k.Contains(input, StringComparison.OrdinalIgnoreCase))
                    .Select(k => new
                    {
                        description = $"{k}, New Delhi, India",
                        place_id = $"local_{k.ToLower().Replace(" ", "_")}",
                        main_text = k,
                        secondary_text = "New Delhi, India"
                    })
                    .ToList();
                return Ok(localMatches);
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                string url = $"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={Uri.EscapeDataString(input)}&key={_googleMapsApiKey}&components=country:in";
                var response = await client.GetAsync(url);
                var json = await response.Content.ReadAsStringAsync();

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var suggestions = new List<object>();
                if (root.TryGetProperty("predictions", out var predictions) && predictions.ValueKind == JsonValueKind.Array)
                {
                    foreach (var pred in predictions.EnumerateArray())
                    {
                        string desc = pred.GetProperty("description").GetString() ?? "";
                        string placeId = pred.GetProperty("place_id").GetString() ?? "";
                        string mainText = desc;
                        string secondaryText = "";

                        if (pred.TryGetProperty("structured_formatting", out var sf))
                        {
                            if (sf.TryGetProperty("main_text", out var mt)) mainText = mt.GetString() ?? mainText;
                            if (sf.TryGetProperty("secondary_text", out var st)) secondaryText = st.GetString() ?? "";
                        }

                        suggestions.Add(new
                        {
                            description = desc,
                            place_id = placeId,
                            main_text = mainText,
                            secondary_text = secondaryText
                        });
                    }
                }

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch Places Autocomplete", details = ex.Message });
            }
        }

        [HttpPost("matrix")]
        public async Task<IActionResult> GetDistanceMatrix([FromBody] DistanceMatrixRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Origin) || string.IsNullOrWhiteSpace(request.Destination))
            {
                return BadRequest(new { error = "Origin and Destination are required." });
            }

            string mode = string.IsNullOrWhiteSpace(request.Mode) ? "driving" : request.Mode.ToLower();

            if (string.IsNullOrWhiteSpace(_googleMapsApiKey))
            {
                // Heuristic calculation fallback
                var p1 = GetCoordinates(request.Origin);
                var p2 = GetCoordinates(request.Destination);
                double dKm = Math.Max(1.5, Math.Sqrt(Math.Pow(p1.Lat - p2.Lat, 2) + Math.Pow(p1.Lng - p2.Lng, 2)) * 111.12);
                int sec = (int)(dKm / 35.0 * 3600);

                return Ok(new
                {
                    distanceText = $"{dKm:F1} km",
                    distanceMeters = (long)(dKm * 1000),
                    durationText = $"{sec / 60} mins",
                    durationSeconds = sec,
                    mode = mode
                });
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                string url = $"https://maps.googleapis.com/maps/api/distancematrix/json?origins={Uri.EscapeDataString(request.Origin)}&destinations={Uri.EscapeDataString(request.Destination)}&mode={mode}&key={_googleMapsApiKey}";
                var response = await client.GetAsync(url);
                var json = await response.Content.ReadAsStringAsync();

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.TryGetProperty("rows", out var rows) && rows.ValueKind == JsonValueKind.Array && rows.GetArrayLength() > 0)
                {
                    var elements = rows[0].GetProperty("elements");
                    if (elements.ValueKind == JsonValueKind.Array && elements.GetArrayLength() > 0)
                    {
                        var elem = elements[0];
                        if (elem.GetProperty("status").GetString() == "OK")
                        {
                            var distObj = elem.GetProperty("distance");
                            var durObj = elem.GetProperty("duration");

                            return Ok(new
                            {
                                distanceText = distObj.GetProperty("text").GetString(),
                                distanceMeters = distObj.GetProperty("value").GetInt64(),
                                durationText = durObj.GetProperty("text").GetString(),
                                durationSeconds = durObj.GetProperty("value").GetInt64(),
                                mode = mode
                            });
                        }
                    }
                }

                return BadRequest(new { error = "Google Distance Matrix returned no valid routes.", raw = json });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch Distance Matrix", details = ex.Message });
            }
        }

        [HttpPost("directions")]
        public async Task<IActionResult> GetDirections([FromBody] DirectionsRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Origin) || string.IsNullOrWhiteSpace(request.Destination))
            {
                return BadRequest(new { error = "Origin and Destination are required." });
            }

            string mode = string.IsNullOrWhiteSpace(request.Mode) ? "driving" : request.Mode.ToLower();

            if (string.IsNullOrWhiteSpace(_googleMapsApiKey))
            {
                // Fallback route coordinates
                var p1 = GetCoordinates(request.Origin);
                var p2 = GetCoordinates(request.Destination);

                return Ok(new
                {
                    status = "OK",
                    originCoords = new { lat = p1.Lat, lng = p1.Lng },
                    destinationCoords = new { lat = p2.Lat, lng = p2.Lng },
                    overviewPolyline = "",
                    steps = new[]
                    {
                        new { instruction = $"Depart from {request.Origin}", distance = "0.0 km", duration = "0 mins" },
                        new { instruction = $"Travel towards {request.Destination}", distance = "5.0 km", duration = "12 mins" },
                        new { instruction = $"Arrive at {request.Destination}", distance = "0.0 km", duration = "0 mins" }
                    },
                    mode = mode
                });
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                string url = $"https://maps.googleapis.com/maps/api/directions/json?origin={Uri.EscapeDataString(request.Origin)}&destination={Uri.EscapeDataString(request.Destination)}&mode={mode}&key={_googleMapsApiKey}";
                var response = await client.GetAsync(url);
                var json = await response.Content.ReadAsStringAsync();

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.TryGetProperty("routes", out var routes) && routes.ValueKind == JsonValueKind.Array && routes.GetArrayLength() > 0)
                {
                    var route = routes[0];
                    string polyline = route.GetProperty("overview_polyline").GetProperty("points").GetString() ?? "";

                    var legs = route.GetProperty("legs");
                    var leg = legs[0];

                    double startLat = leg.GetProperty("start_location").GetProperty("lat").GetDouble();
                    double startLng = leg.GetProperty("start_location").GetProperty("lng").GetDouble();
                    double endLat = leg.GetProperty("end_location").GetProperty("lat").GetDouble();
                    double endLng = leg.GetProperty("end_location").GetProperty("lng").GetDouble();

                    string distanceText = leg.GetProperty("distance").GetProperty("text").GetString() ?? "";
                    long distanceMeters = leg.GetProperty("distance").GetProperty("value").GetInt64();
                    string durationText = leg.GetProperty("duration").GetProperty("text").GetString() ?? "";
                    long durationSeconds = leg.GetProperty("duration").GetProperty("value").GetInt64();

                    var stepsList = new List<object>();
                    if (leg.TryGetProperty("steps", out var steps) && steps.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var s in steps.EnumerateArray())
                        {
                            string htmlInst = s.GetProperty("html_instructions").GetString() ?? "";
                            // Strip HTML tags for clean display
                            string cleanInst = System.Text.RegularExpressions.Regex.Replace(htmlInst, "<.*?>", " ");

                            string stepDist = s.GetProperty("distance").GetProperty("text").GetString() ?? "";
                            string stepDur = s.GetProperty("duration").GetProperty("text").GetString() ?? "";

                            stepsList.Add(new
                            {
                                instruction = cleanInst.Trim(),
                                distance = stepDist,
                                duration = stepDur,
                                travelMode = s.TryGetProperty("travel_mode", out var tm) ? tm.GetString() : mode
                            });
                        }
                    }

                    return Ok(new
                    {
                        status = "OK",
                        originCoords = new { lat = startLat, lng = startLng },
                        destinationCoords = new { lat = endLat, lng = endLng },
                        overviewPolyline = polyline,
                        distanceText,
                        distanceMeters,
                        durationText,
                        durationSeconds,
                        steps = stepsList,
                        mode
                    });
                }

                return BadRequest(new { error = "No routes found for specified locations.", raw = json });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch Directions", details = ex.Message });
            }
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
                double distanceKm = 5.0;
                int etaSeconds = 600;

                // Call Google Distance Matrix if key available
                if (!string.IsNullOrWhiteSpace(_googleMapsApiKey))
                {
                    try
                    {
                        var client = _httpClientFactory.CreateClient();
                        string mode = request.VehicleType.Equals("transit", StringComparison.OrdinalIgnoreCase) ? "transit" : "driving";
                        string url = $"https://maps.googleapis.com/maps/api/distancematrix/json?origins={Uri.EscapeDataString(request.PickupLocation)}&destinations={Uri.EscapeDataString(request.Destination)}&mode={mode}&key={_googleMapsApiKey}";
                        var res = await client.GetAsync(url);
                        var json = await res.Content.ReadAsStringAsync();

                        using var doc = JsonDocument.Parse(json);
                        var root = doc.RootElement;
                        if (root.TryGetProperty("rows", out var rows) && rows.ValueKind == JsonValueKind.Array && rows.GetArrayLength() > 0)
                        {
                            var elem = rows[0].GetProperty("elements")[0];
                            if (elem.GetProperty("status").GetString() == "OK")
                            {
                                long meters = elem.GetProperty("distance").GetProperty("value").GetInt64();
                                long seconds = elem.GetProperty("duration").GetProperty("value").GetInt64();
                                distanceKm = Math.Max(0.5, meters / 1000.0);
                                etaSeconds = (int)seconds;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Distance Matrix call during booking failed: {ex.Message}");
                    }
                }
                else
                {
                    // Fallback distance calculation
                    var pickupCoord = GetCoordinates(request.PickupLocation);
                    var destCoord = GetCoordinates(request.Destination);
                    distanceKm = Math.Max(1.0, Math.Sqrt(Math.Pow(pickupCoord.Lat - destCoord.Lat, 2) + Math.Pow(pickupCoord.Lng - destCoord.Lng, 2)) * 111.12);
                }

                // Rates matrix per vehicle category
                double baseFare = 50;
                double perKmRate = 16;

                switch (request.VehicleType.ToLower())
                {
                    case "bike":
                        baseFare = 15;
                        perKmRate = 7;
                        break;
                    case "auto":
                        baseFare = 25;
                        perKmRate = 12;
                        break;
                    case "premium":
                        baseFare = 120;
                        perKmRate = 25;
                        break;
                    case "transit":
                        baseFare = 10;
                        perKmRate = 3;
                        break;
                    case "sedan":
                    default:
                        baseFare = 50;
                        perKmRate = 16;
                        break;
                }

                double price = Math.Round(baseFare + (distanceKm * perKmRate), 2);

                // Match driver
                var pickupCoords = GetCoordinates(request.PickupLocation);
                var driver = await _db.CabDrivers
                    .Where(d => d.IsAvailable && d.VehicleType.Equals(request.VehicleType, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(d => Math.Pow(d.Latitude - pickupCoords.Lat, 2) + Math.Pow(d.Longitude - pickupCoords.Lng, 2))
                    .FirstOrDefaultAsync();

                if (driver == null)
                {
                    driver = await _db.CabDrivers
                        .Where(d => d.IsAvailable)
                        .OrderBy(d => Math.Pow(d.Latitude - pickupCoords.Lat, 2) + Math.Pow(d.Longitude - pickupCoords.Lng, 2))
                        .FirstOrDefaultAsync();
                }

                if (driver == null)
                {
                    return BadRequest(new { error = "No drivers are currently available nearby. Please try again in a few moments." });
                }

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

                var elapsedSeconds = (DateTime.UtcNow - booking.CreatedAt).TotalSeconds;
                var originalStatus = booking.Status;

                if (booking.Status != "Completed")
                {
                    if (elapsedSeconds >= 45)
                    {
                        booking.Status = "Completed";
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

                var pickup = GetCoordinates(booking.PickupLocation);
                var dest = GetCoordinates(booking.Destination);
                double currentLat = pickup.Lat;
                double currentLng = pickup.Lng;

                if (booking.Status == "Accepted" && booking.MatchedDriverId.HasValue)
                {
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
                    double progress = (elapsedSeconds - 25.0) / 20.0;
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
            if (DefaultLocations.TryGetValue(locationName, out var coords))
            {
                return coords;
            }

            var hash = Math.Abs(locationName.GetHashCode());
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

    public class DistanceMatrixRequest
    {
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string Mode { get; set; } = "driving"; // driving, transit, bicycling, walking
    }

    public class DirectionsRequest
    {
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string Mode { get; set; } = "driving"; // driving, transit, bicycling, walking
    }
}
