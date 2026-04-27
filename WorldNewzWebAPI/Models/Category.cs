namespace WorldNewzWebAPI.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<NewsArticle> Articles { get; set; } = new List<NewsArticle>();
    }

}
