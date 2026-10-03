import re
import os

def process_file(filepath, color, badge_text, page_title):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Wrap the main container
    # Find the main div. In checkin: <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    # In others: <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-800">
    main_div_pattern = r'(<div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6[^"]*">)'
    
    # We replace it with the wrapper and the container, but only the first occurrence.
    if '<div className="min-h-screen bg-[#F4F7FA] w-full">' not in content:
        content = re.sub(
            main_div_pattern, 
            r'<div className="min-h-screen bg-[#F4F7FA] w-full py-4 sm:py-8">\n      \1', 
            content, 
            count=1
        )
        # Also need to add a closing div at the very end before the last closing tags.
        # It's usually `</div>\n    </div>\n  );\n}` or similar.
        # Let's find `);\n}` and replace.
        content = re.sub(r'(\);\n})$', r'    </div>\n  \1', content)

    # 2. Text size bump: text-xs -> text-sm, text-[11px] -> text-xs
    # We will do this carefully so we don't blow up icons or layout.
    content = re.sub(r'\btext-xs\b', 'text-sm', content)
    content = re.sub(r'text-\[11px\]', 'text-xs', content)
    
    # KPI card numbers text-2xl -> text-3xl
    content = re.sub(r'\btext-2xl font-bold\b', 'text-3xl font-bold text-slate-900', content)
    
    # 3. Tinted Cards
    # Replace plain `bg-white border border-slate-200` with `bg-white border border-color-100 shadow-sm`
    content = content.replace('bg-white border border-slate-200', f'bg-white border border-{color}-100 shadow-sm')

    # 4. Refactor Header
    # We need to replace the entire top header block.
    # It varies by page. Let's just use regex to find the header div and replace its inner content.
    
    # For Checkin:
    # <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
    # ...
    # </div>
    
    # For Weighment/Quality/Procurement:
    # <div className="min-w-0 w-full bg-white rounded-2xl border border-color-100 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
    # (Since we just replaced border-slate-200)
    
    # I will write a custom python string replacement for each based on their current structure.

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files_info = [
    (r"d:\Astra\apps\web\src\app\checkin\dashboard\page.tsx", "sky", "GATE & ARRIVAL DESK", "Check-in & Queue"),
    (r"d:\Astra\apps\web\src\app\weighment\dashboard\page.tsx", "amber", "HARDWARE SYNCED", "Weighment"),
    (r"d:\Astra\apps\web\src\app\quality\dashboard\page.tsx", "purple", "FAQ GRADING STATION", "Quality Assessment"),
    (r"d:\Astra\apps\web\src\app\procurement\dashboard\page.tsx", "emerald", "MSP ACQUISITION", "Procurement")
]

for f, c, b, p in files_info:
    process_file(f, c, b, p)

print("Pre-processed basic layout and sizes")
