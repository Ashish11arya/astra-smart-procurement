import os
import re

mapping = {
    'bg-[#151C2F]': 'bg-white',
    'bg-[#0B1020]': 'bg-slate-50',
    'bg-[#1B2438]': 'bg-slate-100',
    'border-[#334155]': 'border-slate-200',
    'divide-[#334155]': 'divide-slate-200',
    'text-white': 'text-slate-900',
    'text-slate-100': 'text-slate-800',
    'text-slate-200': 'text-slate-700',
    'text-slate-300': 'text-slate-600',
    'text-slate-400': 'text-slate-500',
    'hover:text-white': 'hover:text-slate-900',
    
    'bg-sky-500/10': 'bg-sky-50',
    'bg-sky-500/15': 'bg-sky-50',
    'border-sky-500/30': 'border-sky-200',
    'border-sky-500/50': 'border-sky-300',
    'text-sky-400': 'text-sky-700',
    'text-sky-300': 'text-sky-600',
    'bg-sky-950/70': 'bg-sky-100',
    'border-sky-800/80': 'border-sky-300',

    'bg-emerald-500/10': 'bg-emerald-50',
    'bg-emerald-500/15': 'bg-emerald-50',
    'border-emerald-500/30': 'border-emerald-200',
    'border-emerald-500/70': 'border-emerald-300',
    'border-emerald-500/50': 'border-emerald-300',
    'text-emerald-400': 'text-emerald-700',
    'text-emerald-300': 'text-emerald-600',
    'text-emerald-200': 'text-emerald-700',
    'bg-emerald-950/80': 'bg-emerald-100',
    'bg-emerald-950/70': 'bg-emerald-100',
    'bg-emerald-950/30': 'bg-emerald-50',
    'border-emerald-700/60': 'border-emerald-300',
    'border-emerald-700/50': 'border-emerald-300',
    'border-emerald-800/60': 'border-emerald-200',
    'border-emerald-800': 'border-emerald-300',
    'bg-emerald-900/60': 'bg-emerald-100',

    'bg-amber-500/15': 'bg-amber-50',
    'border-amber-500/30': 'border-amber-200',
    'border-amber-500/70': 'border-amber-300',
    'text-amber-400': 'text-amber-700',
    'text-amber-300': 'text-amber-600',
    'text-amber-200': 'text-amber-700',
    'bg-amber-950/30': 'bg-amber-50',
    'border-amber-800/60': 'border-amber-200',
    'bg-amber-900/60': 'bg-amber-100',
    
    'bg-amber-500/20': 'bg-amber-100',
    'border-amber-500/40': 'border-amber-300',

    'bg-rose-500/10': 'bg-rose-50',
    'border-rose-500/30': 'border-rose-200',
    'text-rose-400': 'text-rose-600',
    'text-rose-300': 'text-rose-600',
    'text-rose-200': 'text-rose-700',
    'bg-rose-950/40': 'bg-rose-50',
    'bg-rose-950/30': 'bg-rose-50',
    'hover:bg-rose-900/40': 'hover:bg-rose-100',
    'border-rose-800/60': 'border-rose-200',
    'border-rose-800/40': 'border-rose-200',
    'border-rose-800/80': 'border-rose-200',

    'bg-purple-500/15': 'bg-purple-50',
    'border-purple-500/30': 'border-purple-200',
    'text-purple-400': 'text-purple-700',
    'text-purple-300': 'text-purple-600',
    
    'bg-purple-500/10': 'bg-purple-50',
    
    'bg-slate-900/50': 'bg-slate-50',
    'bg-slate-800/50': 'bg-slate-100',
    'bg-slate-800/80': 'bg-slate-100',
    
    'shadow-lg': 'shadow-sm',
    'shadow-xl': 'shadow-md',
    
    # Body backgrounds inside pages if any
    'bg-[#0B1020] text-slate-100': 'bg-slate-50 text-slate-800'
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in mapping.items():
        # Replace only if it's a discrete word/class
        content = re.sub(r'(?<![a-zA-Z0-9_-])' + re.escape(old) + r'(?![a-zA-Z0-9_-])', new, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
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
