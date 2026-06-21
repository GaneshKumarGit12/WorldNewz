using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace WorldNewzWebAPI.Models
{
    public class MovieDbItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("overview")]
        public string Overview { get; set; } = string.Empty;

        [JsonPropertyName("poster_path")]
        public string? PosterPath { get; set; }

        [JsonPropertyName("backdrop_path")]
        public string? BackdropPath { get; set; }

        [JsonPropertyName("release_date")]
        public string ReleaseDate { get; set; } = string.Empty;

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("vote_count")]
        public int VoteCount { get; set; }

        [JsonPropertyName("popularity")]
        public double Popularity { get; set; }

        [JsonPropertyName("genre_ids")]
        public List<int> GenreIds { get; set; } = new();
    }

    public class MovieDbListResponse
    {
        [JsonPropertyName("page")]
        public int Page { get; set; }

        [JsonPropertyName("results")]
        public List<MovieDbItem> Results { get; set; } = new();

        [JsonPropertyName("total_pages")]
        public int TotalPages { get; set; }

        [JsonPropertyName("total_results")]
        public int TotalResults { get; set; }
    }

    public class MovieDbDetails
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("overview")]
        public string Overview { get; set; } = string.Empty;

        [JsonPropertyName("tagline")]
        public string Tagline { get; set; } = string.Empty;

        [JsonPropertyName("poster_path")]
        public string? PosterPath { get; set; }

        [JsonPropertyName("backdrop_path")]
        public string? BackdropPath { get; set; }

        [JsonPropertyName("release_date")]
        public string ReleaseDate { get; set; } = string.Empty;

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("vote_count")]
        public int VoteCount { get; set; }

        [JsonPropertyName("runtime")]
        public int? Runtime { get; set; }

        [JsonPropertyName("budget")]
        public long Budget { get; set; }

        [JsonPropertyName("revenue")]
        public long Revenue { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("genres")]
        public List<MovieDbGenre> Genres { get; set; } = new();

        [JsonPropertyName("production_companies")]
        public List<MovieDbProductionCompany> ProductionCompanies { get; set; } = new();

        // Combined data fetched asynchronously
        public MovieDbCredits? Credits { get; set; }
        public MovieDbVideosResponse? Videos { get; set; }
        public List<MovieDbItem> Recommendations { get; set; } = new();
    }

    public class MovieDbGenre
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class MovieDbProductionCompany
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("logo_path")]
        public string? LogoPath { get; set; }
    }

    public class MovieDbCredits
    {
        [JsonPropertyName("cast")]
        public List<MovieDbCastItem> Cast { get; set; } = new();

        [JsonPropertyName("crew")]
        public List<MovieDbCrewItem> Crew { get; set; } = new();
    }

    public class MovieDbCastItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("character")]
        public string Character { get; set; } = string.Empty;

        [JsonPropertyName("profile_path")]
        public string? ProfilePath { get; set; }
    }

    public class MovieDbCrewItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("job")]
        public string Job { get; set; } = string.Empty;
    }

    public class MovieDbVideosResponse
    {
        [JsonPropertyName("results")]
        public List<MovieDbVideoItem> Results { get; set; } = new();
    }

    public class MovieDbVideoItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("key")]
        public string Key { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("site")]
        public string Site { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;
    }

    public class MovieDbConfiguration
    {
        [JsonPropertyName("images")]
        public MovieDbImageConfig Images { get; set; } = new();
    }

    public class MovieDbImageConfig
    {
        [JsonPropertyName("base_url")]
        public string BaseUrl { get; set; } = "http://image.tmdb.org/t/p/";

        [JsonPropertyName("secure_base_url")]
        public string SecureBaseUrl { get; set; } = "https://image.tmdb.org/t/p/";

        [JsonPropertyName("poster_sizes")]
        public List<string> PosterSizes { get; set; } = new();

        [JsonPropertyName("backdrop_sizes")]
        public List<string> BackdropSizes { get; set; } = new();
    }
}
