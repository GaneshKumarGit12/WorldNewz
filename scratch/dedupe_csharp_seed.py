import re

cs_file = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(cs_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find all new AmazonProduct { ... } blocks
pattern = r'(\s*new AmazonProduct\s*\{\s*Asin = "([^"]+)",[\s\S]*?\},\n)'

matches = list(re.finditer(pattern, content))
seen_asins = set()
to_remove_spans = []

for m in matches:
    full_block = m.group(1)
    asin = m.group(2)
    if asin in seen_asins:
        to_remove_spans.append(m.span(1))
    else:
        seen_asins.add(asin)

# Remove duplicates from end to start to keep indices valid
new_content = content
for start, end in reversed(to_remove_spans):
    new_content = new_content[:start] + new_content[end:]

with open(cs_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Removed {len(to_remove_spans)} duplicate blocks. Total unique products remaining: {len(seen_asins)}")
