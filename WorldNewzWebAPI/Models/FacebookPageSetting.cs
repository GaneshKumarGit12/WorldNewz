using System;
using System.ComponentModel.DataAnnotations;

namespace WorldNewzWebAPI.Models
{
    public class FacebookPageSetting
    {
        [Key]
        public string PageId { get; set; } = string.Empty;
        public string PageName { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime? LastPostTime { get; set; }
    }
}
