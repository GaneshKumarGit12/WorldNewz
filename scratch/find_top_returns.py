file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
in_component = False
for idx, line in enumerate(lines, start=1):
    if 'const AmazonProducts: React.FC' in line:
        in_component = True
        component_start_depth = depth
    
    opens = line.count('{')
    closes = line.count('}')
    
    if in_component and depth == component_start_depth + 1 and 'return' in line:
        print(f"Top-level return inside AmazonProducts at Line {idx}: {line.strip()}")
        
    depth += opens - closes
