import re

with open(r"d:\Astra\apps\web\src\app\farmer\verification\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update main container width
content = content.replace(
    '<main className="flex-1 max-w-[1200px] mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 font-sans">',
    '<main className="flex-1 w-[94vw] max-w-[1380px] mx-auto py-6 md:py-8 space-y-6 font-sans">'
)

# 2. Top breadcrumb & action bar
content = content.replace(
    '<div className="flex items-center justify-between border-b border-gray-100 pb-4">',
    '<div className="flex items-center justify-between pb-2">'
)

content = content.replace(
    'className="inline-flex items-center gap-2 text-sm font-medium text-[#00695C] hover:text-[#004D40] transition"',
    'className="inline-flex items-center gap-2 text-sm font-semibold text-[#00695C] hover:text-[#004D40] transition"'
)

content = content.replace(
    'className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition"',
    'className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#A7E8D0] bg-white hover:bg-[#F3FBF8] text-sm font-semibold text-[#00695C] transition shadow-sm"'
)

content = content.replace(
    'className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition active:scale-95"',
    'className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#A7E8D0] bg-white hover:bg-[#F3FBF8] text-sm font-semibold text-[#00695C] shadow-sm transition active:scale-95"'
)

content = content.replace(
    '<PhoneCall className="w-4 h-4 text-[#00695C]" />',
    '<PhoneCall className="w-4 h-4" />'
)
content = content.replace(
    '<RefreshCw className={`w-4 h-4 text-[#00695C] ${loading ? \'animate-spin\' : \'\'}`} />',
    '<RefreshCw className={`w-4 h-4 ${loading ? \'animate-spin\' : \'\'}`} />'
)


# 3. Main banner layout
content = content.replace(
    'className={`rounded-2xl border p-6 sm:p-8 shadow-sm transition relative overflow-hidden',
    'className={`rounded-3xl border p-6 md:p-10 shadow-sm transition relative overflow-hidden'
)

# 4. Action buttons in banner
content = content.replace(
    'className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white font-semibold text-sm shadow-md transition"',
    'className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white font-bold text-sm shadow-md transition"'
)

content = content.replace(
    'className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#00695C] text-[#00695C] hover:bg-[#F3FBF8] font-semibold text-sm transition"',
    'className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#00695C] text-[#00695C] hover:bg-[#F3FBF8] font-bold text-sm transition"'
)

# 5. Right application number box
content = content.replace(
    '<div className="shrink-0 bg-white border border-gray-200 shadow-sm p-5 rounded-2xl md:w-72 flex flex-col items-start space-y-1.5 z-10">',
    '<div className="shrink-0 bg-white border border-[#A7E8D0] shadow-sm p-6 rounded-2xl md:w-80 flex flex-col items-start space-y-2 z-10">'
)

content = content.replace(
    '<span className="text-lg font-bold text-[#123B3A] tracking-tight">',
    '<span className="text-xl font-bold text-[#123B3A] tracking-tight">'
)

# 6. Verification lifecycle
content = content.replace(
    'className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6"',
    'className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 md:p-10 space-y-8"'
)

content = content.replace(
    'className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 relative z-10"',
    'className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 xl:gap-8 relative z-10"'
)

content = content.replace(
    'bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-5 flex flex-col space-y-3',
    'bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-6 flex flex-col space-y-4 shadow-sm'
)
content = content.replace(
    'bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-5 flex flex-col space-y-3',
    'bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-6 flex flex-col space-y-4 shadow-sm'
)

# Replace step 3
content = content.replace(
    '<div className={`rounded-2xl p-5 flex flex-col space-y-3 border ${',
    '<div className={`rounded-2xl p-6 flex flex-col space-y-4 shadow-sm border ${'
)

# 7. Section Headers
# Personal
personal_header_old = """            <button
              onClick={() => toggleSection('personal')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8F8F3] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#00695C]" />
                </div>
                <span className="font-bold text-base text-gray-900">{t.personalTitle}</span>
              </div>"""
personal_header_new = """            <button
              onClick={() => toggleSection('personal')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#F3FBF8] hover:bg-[#E8F8F3] transition border-b border-[#A7E8D0]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#A7E8D0]">
                  <User className="w-4 h-4 text-[#00695C]" />
                </div>
                <span className="font-bold text-lg text-[#00695C]">{t.personalTitle}</span>
              </div>"""
content = content.replace(personal_header_old, personal_header_new)

# Address
address_header_old = """            <button
              onClick={() => toggleSection('address')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#0284C7]" />
                </div>
                <span className="font-bold text-base text-gray-900">{t.addressTitle}</span>
              </div>"""
address_header_new = """            <button
              onClick={() => toggleSection('address')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#F0F9FF] hover:bg-[#E0F2FE] transition border-b border-[#BAE6FD]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#BAE6FD]">
                  <MapPin className="w-4 h-4 text-[#0369A1]" />
                </div>
                <span className="font-bold text-lg text-[#0369A1]">{t.addressTitle}</span>
              </div>"""
content = content.replace(address_header_old, address_header_new)

# Land
land_header_old = """            <button
              onClick={() => toggleSection('land')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8F8F3] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-[#00695C]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-gray-900">{t.landTitle}</span>"""
land_header_new = """            <button
              onClick={() => toggleSection('land')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#F0FDF4] hover:bg-[#DCFCE7] transition border-b border-[#BBF7D0]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#BBF7D0]">
                  <Layers className="w-4 h-4 text-[#15803D]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#15803D]">{t.landTitle}</span>"""
content = content.replace(land_header_old, land_header_new)

# Bank
bank_header_old = """            <button
              onClick={() => toggleSection('bank')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-[#0284C7]" />
                </div>
                <span className="font-bold text-base text-gray-900">{t.bankTitle}</span>
              </div>"""
bank_header_new = """            <button
              onClick={() => toggleSection('bank')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#EFF6FF] hover:bg-[#DBEAFE] transition border-b border-[#BFDBFE]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#BFDBFE]">
                  <Landmark className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="font-bold text-lg text-[#1E40AF]">{t.bankTitle}</span>
              </div>"""
content = content.replace(bank_header_old, bank_header_new)

with open(r"d:\Astra\apps\web\src\app\farmer\verification\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated page.tsx")
