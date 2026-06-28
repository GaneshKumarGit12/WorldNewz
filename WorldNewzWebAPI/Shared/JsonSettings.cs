using System.Text.Json;

namespace WorldNewzWebAPI.Shared
{
    public static class JsonSettings
    {
        public static readonly JsonSerializerOptions CaseInsensitiveOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }
}
