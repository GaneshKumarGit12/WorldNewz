file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines, start=1):
    for char in line:
        if char == '{':
            stack.append((idx, '{'))
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"Unmatched '}}' at line {idx}")

print("Unclosed '{' count:", len(stack))
if stack:
    print("Unclosed '{' locations (line numbers):", [item[0] for item in stack[:10]])
