using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace WorldNewzWebAPI.Models
{
    public class SpoonacularRecipe
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("image")]
        public string Image { get; set; } = string.Empty;

        [JsonPropertyName("imageType")]
        public string ImageType { get; set; } = string.Empty;

        [JsonPropertyName("readyInMinutes")]
        public int ReadyInMinutes { get; set; }

        [JsonPropertyName("servings")]
        public int Servings { get; set; }

        [JsonPropertyName("healthScore")]
        public double HealthScore { get; set; }

        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("diets")]
        public List<string> Diets { get; set; } = new();

        [JsonPropertyName("cuisines")]
        public List<string> Cuisines { get; set; } = new();

        [JsonPropertyName("dishTypes")]
        public List<string> DishTypes { get; set; } = new();
    }

    public class SpoonacularSearchResponse
    {
        [JsonPropertyName("results")]
        public List<SpoonacularRecipe> Results { get; set; } = new();

        [JsonPropertyName("offset")]
        public int Offset { get; set; }

        [JsonPropertyName("number")]
        public int Number { get; set; }

        [JsonPropertyName("totalResults")]
        public int TotalResults { get; set; }
    }

    public class SpoonacularRandomResponse
    {
        [JsonPropertyName("recipes")]
        public List<SpoonacularRecipe> Recipes { get; set; } = new();
    }

    public class SpoonacularIngredient
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("original")]
        public string Original { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public double Amount { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = string.Empty;

        [JsonPropertyName("image")]
        public string? Image { get; set; }
    }

    public class SpoonacularInstructionStep
    {
        [JsonPropertyName("number")]
        public int Number { get; set; }

        [JsonPropertyName("step")]
        public string Step { get; set; } = string.Empty;
    }

    public class SpoonacularInstructionStepGroup
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("steps")]
        public List<SpoonacularInstructionStep> Steps { get; set; } = new();
    }

    public class SpoonacularNutrient
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public double Amount { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = string.Empty;

        [JsonPropertyName("percentOfDailyNeeds")]
        public double PercentOfDailyNeeds { get; set; }
    }

    public class SpoonacularCaloricBreakdown
    {
        [JsonPropertyName("percentProtein")]
        public double PercentProtein { get; set; }

        [JsonPropertyName("percentFat")]
        public double PercentFat { get; set; }

        [JsonPropertyName("percentCarbs")]
        public double PercentCarbs { get; set; }
    }

    public class SpoonacularNutrition
    {
        [JsonPropertyName("nutrients")]
        public List<SpoonacularNutrient> Nutrients { get; set; } = new();

        [JsonPropertyName("caloricBreakdown")]
        public SpoonacularCaloricBreakdown CaloricBreakdown { get; set; } = new();
    }

    public class SpoonacularRecipeDetails : SpoonacularRecipe
    {
        [JsonPropertyName("instructions")]
        public string Instructions { get; set; } = string.Empty;

        [JsonPropertyName("extendedIngredients")]
        public List<SpoonacularIngredient> ExtendedIngredients { get; set; } = new();

        [JsonPropertyName("analyzedInstructions")]
        public List<SpoonacularInstructionStepGroup> AnalyzedInstructions { get; set; } = new();

        [JsonPropertyName("nutrition")]
        public SpoonacularNutrition Nutrition { get; set; } = new();
    }
}
