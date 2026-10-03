const fs = require('fs');
const files = [
  'd:/Astra/apps/web/src/app/weighment/dashboard/page.tsx',
  'd:/Astra/apps/web/src/app/quality/dashboard/page.tsx',
  'd:/Astra/apps/web/src/app/procurement/dashboard/page.tsx',
  'd:/Astra/apps/web/src/app/payment/dashboard/page.tsx',
  'd:/Astra/apps/web/src/app/checkin/dashboard/page.tsx',
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/className="flex items-center gap-2 border-b border-\[#334155\] pb-3 text-xs font-semibold"/g, 'className="flex items-center gap-2 border-b border-[#334155] pb-3 text-xs font-semibold overflow-x-auto scrollbar-hide"');
  
  content = content.replace(/className="([^"]*)grid grid-cols-2([^"]*)"/g, (match, p1, p2) => {
     if (p1.includes('sm:') || p1.includes('md:') || p1.includes('lg:')) return match;
     if (p2.includes('sm:') || p2.includes('md:') || p2.includes('lg:')) return match;
     return `className="${p1}grid grid-cols-1 sm:grid-cols-2${p2}"`;
  });
  content = content.replace(/className="([^"]*)grid grid-cols-3([^"]*)"/g, (match, p1, p2) => {
     if (p1.includes('sm:') || p1.includes('md:') || p1.includes('lg:')) return match;
     if (p2.includes('sm:') || p2.includes('md:') || p2.includes('lg:')) return match;
     return `className="${p1}grid grid-cols-1 sm:grid-cols-3${p2}"`;
  });
  
  content = content.replace(/className="relative min-w-\[240px\]"/g, 'className="relative w-full sm:min-w-[240px] sm:w-auto"');
  
  fs.writeFileSync(f, content);
  console.log('Fixed ' + f);
}
