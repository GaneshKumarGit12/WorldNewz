file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for idx, line in enumerate(lines, start=1):
    opens = line.count('{')
    closes = line.count('}')
    depth += opens - closes
    if idx == 845 or idx == 301 or idx == 400:
        print(f"Line {idx} (depth={depth}): {line.strip()}")
