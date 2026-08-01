file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for idx in range(300, 850):
    line = lines[idx]
    opens = line.count('{')
    closes = line.count('}')
    old_depth = depth
    depth += opens - closes
    if depth != old_depth:
        print(f"Line {idx+1} (depth {old_depth} -> {depth}): {line.strip()[:60]}")
