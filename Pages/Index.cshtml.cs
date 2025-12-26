using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace TokenForge.Pages;

public class IndexModel : PageModel
{
    [BindProperty]
    public string Template { get; set; } = "";

    [BindProperty]
    public string TokensJson { get; set; } = "[]";

    public string Output { get; set; } = "";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public void OnGet()
    {
        TokensJson = "[]";
        Template = "";
        Output = "";
    }

    public void OnPost()
    {
        var tokens = SafeParseTokens(TokensJson);

        var map = tokens
            .Select(t => new
            {
                Placeholder = $"{{{{{Slug(t.Name)}}}}}",
                Value = t.Value ?? ""
            })
            .OrderByDescending(x => x.Placeholder.Length)
            .ToList();

        var result = Template ?? "";

        foreach (var item in map)
        {
            result = result.Replace(item.Placeholder, item.Value, StringComparison.OrdinalIgnoreCase);
        }

        Output = result;

        TokensJson = JsonSerializer.Serialize(tokens);
    }

    private static List<TokenItem> SafeParseTokens(string json)
    {
        try
        {
            var tokens = JsonSerializer.Deserialize<List<TokenItem>>(json, JsonOpts) ?? new();
            foreach (var t in tokens)
            {
                t.Id = string.IsNullOrWhiteSpace(t.Id) ? Guid.NewGuid().ToString("N") : t.Id.Trim();
                t.Name = (t.Name ?? "").Trim();
                t.Value ??= "";
            }
            return tokens;
        }
        catch
        {
            return new();
        }
    }

    private static string Slug(string? name)
    {
        var s = (name ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(s)) return "token";

        var sb = new StringBuilder();
        bool lastUnderscore = false;

        foreach (var ch in s)
        {
            if (char.IsLetterOrDigit(ch))
            {
                sb.Append(ch);
                lastUnderscore = false;
            }
            else
            {
                if (!lastUnderscore)
                {
                    sb.Append('_');
                    lastUnderscore = true;
                }
            }
        }

        var slug = sb.ToString().Trim('_');
        return string.IsNullOrWhiteSpace(slug) ? "token" : slug;
    }
}

public class TokenItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Value { get; set; } = "";
}
