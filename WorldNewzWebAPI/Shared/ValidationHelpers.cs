using System.Linq;

namespace WorldNewzWebAPI.Shared
{
    public static class ValidationHelpers
    {
        private static readonly string[] BannedWords = new[] { 
            "pornography", "pronography", "sexual", "sexsual", 
            "porn", "sex", "xxx", "nsfw", "adult", "naked", 
            "erotic", "prostitute", "bitch", "bastard" 
        };

        public static bool ContainsBannedWords(string input)
        {
            if (string.IsNullOrEmpty(input)) return false;
            var lower = input.ToLower();
            return BannedWords.Any(word => lower.Contains(word));
        }

        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return false;
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
