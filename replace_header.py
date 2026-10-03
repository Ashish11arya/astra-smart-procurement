import os
import re

files = [
    (r"d:\Astra\apps\web\src\app\checkin\dashboard\page.tsx", "sky", "GATE & ARRIVAL DESK", "Check-in & Queue"),
    (r"d:\Astra\apps\web\src\app\weighment\dashboard\page.tsx", "amber", "WEIGHMENT STATION", "Weighment"),
    (r"d:\Astra\apps\web\src\app\quality\dashboard\page.tsx", "purple", "QUALITY ASSESSMENT", "Quality / Lab"),
    (r"d:\Astra\apps\web\src\app\procurement\dashboard\page.tsx", "emerald", "PROCUREMENT HUB", "Procurement")
]

def replace_header(filepath, color, badge, title):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We will find the block starting with {/* Platform Header */} or {/* Top Operations Action Header */} or {/* Top Header */}
    # And ending with {/* Tabs */} or {/* Summary KPI Cards */} or {/* Main Tabs... */}
    
    match = re.search(r'({\/\* (?:Platform Header|Top Operations Action Header|Top Header) \*\/}.*?)<div className="flex items-center gap-3', content, flags=re.DOTALL)
    if not match:
        print(f"Header match failed for {filepath}")
        return
        
    old_header_start = match.group(1)
    
    new_header = f"""{{/* Platform Header */}}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-{color}-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-sm relative overflow-hidden">
        {{/* Subtle decorative accent */}}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-{color}-500" />
        
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center px-3.5 py-1.5 bg-{color}-50 text-{color}-700 border border-{color}-300 rounded-lg text-sm font-bold tracking-widest uppercase shadow-sm">
              {badge}
            </span>
            <span className="text-sm text-slate-500 font-mono font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
              {{centreInfo?.centreCode || 'DEP-001'}}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          
          <div className="text-base text-slate-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 pt-1">
            <span className="font-bold text-slate-900 text-lg">{{centreInfo?.name || 'Procurement Depot'}}</span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span className="font-medium">National Grain Procurement Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-start mt-4 md:mt-0">"""
    
    # We need to replace `old_header_start` plus `<div className="flex items-center gap-3` with `new_header`
    # But wait, in checkin, it's `<div className="flex items-center gap-3">`.
    # In others, it might be `<div className="flex items-center gap-3 self-end md:self-auto">`
    
    content = re.sub(r'{\/\* (?:Platform Header|Top Operations Action Header|Top Header) \*\/}.*?<div className="flex items-center gap-3[^"]*">', new_header, content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for f, c, b, p in files:
    replace_header(f, c, b, p)

print("Headers updated")
