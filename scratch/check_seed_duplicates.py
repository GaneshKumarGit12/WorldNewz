import re
from collections import Counter

file_path = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

asins = re.findall(r'Asin\s*=\s*"([A-Z0-9]{10})"', content, re.IGNORECASE)
counts = Counter(asins)

duplicates = [asin for asin, count in counts.items() if count > 1]
print(f"Total ASIN occurrences in seedData: {len(asins)}")
print(f"Unique ASINs in seedData: {len(counts)}")
print(f"Duplicate ASINs found: {len(duplicates)}")
if duplicates:
    for dup in duplicates:
        print(f"  Duplicate ASIN: {dup} (appears {counts[dup]} times)")
