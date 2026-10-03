import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace text-slate-900 with text-white if it's inside a className that also contains a dark bg class.
    # Dark bg classes: bg-sky-600, bg-amber-600, bg-purple-600, bg-emerald-600, bg-rose-600, bg-indigo-600, bg-slate-800, bg-slate-900
    
    # Let's find all className="..." strings.
    def replacer(match):
        cls_str = match.group(0)
        # Check if the class string has a dark bg
        if re.search(r'\bbg-(sky|amber|purple|emerald|rose|indigo|slate)-(600|700|800|900)\b', cls_str):
            # Replace text-slate-900 with text-white
            cls_str = re.sub(r'\btext-slate-900\b', 'text-white', cls_str)
            cls_str = re.sub(r'\btext-slate-800\b', 'text-white', cls_str)
        return cls_str

    new_content = re.sub(r'className="[^"]+"', replacer, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
files = [
    r"d:\Astra\apps\web\src\app\checkin\dashboard\page.tsx",
    r"d:\Astra\apps\web\src\app\weighment\dashboard\page.tsx",
    r"d:\Astra\apps\web\src\app\quality\dashboard\page.tsx",
    r"d:\Astra\apps\web\src\app\procurement\dashboard\page.tsx"
]

for f in files:
    print("Processing:", f)
    process_file(f)

print("Done")
