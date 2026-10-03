import re

with open('d:/Astra/apps/web/src/app/farmer/visits/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace container
content = content.replace(
    '<div className="w-full min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-[#014532]">',
    '<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8" style={{ maxWidth: \'min(92vw, 1420px)\', fontFamily: "\'Inter\', sans-serif" }}>'
)

# Hero section redesign
old_hero = """      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#014532] tracking-tight">
            {lang === 'hi' ? 'मेरी खरीद यात्राएं' : 'My Procurement Visits'}
          </h1>
          <p className="text-emerald-800/80 text-base mt-1">
            {lang === 'hi'
              ? 'अपनी निर्धारित यात्रा, आगमन समय और वास्तविक समय की स्थिति देखें।'
              : 'Track your scheduled visits, assigned arrival windows, and real-time processing status.'}
          </p>
        </div>

        <Link
          href="/farmer/centres"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#014532] rounded-xl text-sm sm:text-base font-bold shadow-md transition active:scale-[0.99]"
        >
          <span>{lang === 'hi' ? 'नई यात्रा बुक करें' : 'Book New Visit'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>"""

new_hero = """      <div className="bg-gradient-to-r from-[#014532] to-[#025a42] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {lang === 'hi' ? 'मेरी खरीद यात्राएं' : 'My Procurement Visits'}
          </h1>
          <p className="text-emerald-50 text-base sm:text-lg mt-2 max-w-2xl font-medium">
            {lang === 'hi'
              ? 'अपनी निर्धारित यात्रा, आगमन समय और वास्तविक समय की स्थिति देखें।'
              : 'Track your scheduled visits, assigned arrival windows, and real-time processing status.'}
          </p>
        </div>

        <Link
          href="/farmer/centres"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#014532] hover:bg-gray-50 rounded-xl text-base font-bold shadow-sm transition-all active:scale-[0.98] border border-transparent"
        >
          <span>{lang === 'hi' ? 'नई यात्रा बुक करें' : 'Book New Visit'}</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>"""
content = content.replace(old_hero, new_hero)

# Tabs redesign
old_tabs_full = content[content.find('      {/* Status Filter Tabs */}'):content.find('      {loading ? (')]

new_tabs_full = """      {/* Status Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 text-sm scrollbar-hide">
        {[
          { key: 'ALL', labelEn: 'All Visits', labelHi: 'सभी यात्राएं', count: visits.length },
          {
            key: 'ACTIVE',
            labelEn: 'Active',
            labelHi: 'सक्रिय',
            count: visits.filter(
              (v) =>
                v.status === 'CHECKED_IN' ||
                v.status === 'WEIGHMENT' ||
                v.status === 'QUALITY_ASSESSMENT' ||
                v.status === 'PROCUREMENT' ||
                v.status === 'PAYMENT' ||
                (v.status === 'BOOKED' && v.bookingDate.startsWith(todayStr))
            ).length,
          },
          {
            key: 'UPCOMING',
            labelEn: 'Upcoming',
            labelHi: 'आगामी',
            count: visits.filter((v) => v.status === 'BOOKED' && v.bookingDate >= todayStr).length,
          },
          {
            key: 'COMPLETED',
            labelEn: 'Completed',
            labelHi: 'पूर्ण',
            count: visits.filter((v) => v.status === 'COMPLETED').length,
          },
          {
            key: 'CANCELLED',
            labelEn: 'Cancelled',
            labelHi: 'रद्द',
            count: visits.filter((v) => v.status === 'CANCELLED' || v.status === 'NO_SHOW').length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key as any)}
            className={`px-5 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-2.5 border ${
              filterTab === tab.key
                ? 'bg-[#014532] text-white border-[#014532] shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#014532]/30 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <span className="text-[15px]">{lang === 'hi' ? tab.labelHi : tab.labelEn}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filterTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
\n"""
content = content.replace(old_tabs_full, new_tabs_full)

# Status badges redesign
old_status_badges = """  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40 text-sm font-bold font-mono">BOOKED</span>;
      case 'CHECKED_IN':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold font-mono">CHECKED IN</span>;
      case 'WEIGHMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold font-mono">WEIGHMENT</span>;
      case 'QUALITY_ASSESSMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 text-sm font-bold font-mono">QUALITY GRADING</span>;
      case 'PROCUREMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-sm font-bold font-mono">PURCHASE CONFIRMED</span>;
      case 'PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-sm font-bold font-mono">PAYMENT PROCESSING</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-700 border border-emerald-600 text-sm font-bold font-mono">SETTLED &amp; COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-800/80 border border-emerald-100 text-sm font-bold font-mono">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-900/80 border border-emerald-100 text-sm font-bold font-mono">{status}</span>;
    }
  };"""

new_status_badges = """  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[13px] font-bold tracking-wide uppercase">BOOKED</span>;
      case 'CHECKED_IN':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[13px] font-bold tracking-wide uppercase">CHECKED IN</span>;
      case 'WEIGHMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[13px] font-bold tracking-wide uppercase">WEIGHMENT</span>;
      case 'QUALITY_ASSESSMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[13px] font-bold tracking-wide uppercase">QUALITY GRADING</span>;
      case 'PROCUREMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[13px] font-bold tracking-wide uppercase">PURCHASE CONFIRMED</span>;
      case 'PAYMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[13px] font-bold tracking-wide uppercase">PAYMENT PROCESSING</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F0F8F6] text-[#014532] border border-[#014532]/20 text-[13px] font-bold tracking-wide uppercase">SETTLED &amp; COMPLETED</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[13px] font-bold tracking-wide uppercase">CANCELLED</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-[13px] font-bold tracking-wide uppercase">{status}</span>;
    }
  };"""
content = content.replace(old_status_badges, new_status_badges)

# Empty state redesign
old_empty = """        <div className="rounded-xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl p-8 sm:p-10 text-center space-y-4 shadow-md">
          <Calendar className="w-12 h-12 text-emerald-700/80 mx-auto" />
          <div>
            <h3 className="font-bold text-[#014532] text-base">
              {lang === 'hi' ? 'इस श्रेणी में कोई यात्रा नहीं मिली' : 'No Visits in this Category'}
            </h3>
            <p className="text-sm text-emerald-800/80 mt-1 max-w-md mx-auto">
              {lang === 'hi'
                ? 'नजदीकी अधिकृत खरीद केंद्र का चयन करें और अपनी आगमन समय खिड़की बुक करें।'
                : 'Schedule a visit at an authorized government grain procurement centre.'}
            </p>
          </div>
          <Link
            href="/farmer/centres"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#014532] rounded-xl text-base font-semibold shadow-md transition"
          >
            <span>{lang === 'hi' ? 'सत्यापित खरीद केंद्र खोजें' : 'Find Procurement Centre'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>"""

new_empty = """        <div className="rounded-2xl border border-gray-200 bg-white p-10 sm:p-14 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {lang === 'hi' ? 'इस श्रेणी में कोई यात्रा नहीं मिली' : 'No Visits in this Category'}
            </h3>
            <p className="text-base text-gray-500 mt-2 max-w-md mx-auto">
              {lang === 'hi'
                ? 'नजदीकी अधिकृत खरीद केंद्र का चयन करें और अपनी आगमन समय खिड़की बुक करें।'
                : 'Schedule a visit at an authorized government grain procurement centre.'}
            </p>
          </div>
          <Link
            href="/farmer/centres"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#014532] hover:bg-[#025a42] text-white rounded-xl text-base font-semibold shadow-sm transition-all"
          >
            <span>{lang === 'hi' ? 'सत्यापित खरीद केंद्र खोजें' : 'Find Procurement Centre'}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>"""
content = content.replace(old_empty, new_empty)

# Visit cards redesign
old_card_start = """              <div
                key={visit.id}
                className="rounded-xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl p-5 sm:p-6 shadow-md space-y-4 transition-all hover:border-slate-500 text-[#014532]"
              >"""

new_card_start = """              <div
                key={visit.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8 space-y-6 transition-all hover:border-[#014532]/30 hover:shadow-md text-[#014532]"
              >"""
content = content.replace(old_card_start, new_card_start)

# Card Header
old_card_header = """                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                  <div className="space-y-0.5">
                    <span className="text-sm text-emerald-800/80 font-mono">
                      Ref: <strong className="text-emerald-700 font-bold">{visit.bookingNumber}</strong>
                    </span>
                    <h3 className="font-bold text-[#014532] text-base sm:text-lg">
                      {visit.centreName}
                    </h3>
                    <p className="text-sm text-emerald-800/80 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{visit.centreAddress}</span>
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(visit.status)}
                  </div>
                </div>"""

new_card_header = """                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        <Layers className="w-3.5 h-3.5" />
                        Ref: <strong className="text-gray-900 font-bold tracking-wide">{visit.bookingNumber}</strong>
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#014532]" />
                      {visit.centreName}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 font-medium mt-1">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{visit.centreAddress}</span>
                    </p>
                  </div>
                  <div className="shrink-0 pt-1">
                    {getStatusBadge(visit.status)}
                  </div>
                </div>"""
content = content.replace(old_card_header, new_card_header)

# Details Grid
old_grid = """                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-2.5 rounded-lg bg-[#F4F9F7] border border-emerald-100">
                    <span className="text-sm text-emerald-800/80 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'निर्धारित तिथि' : 'Scheduled Date'}
                    </span>
                    <span className="font-bold text-[#014532] text-base">
                      {new Date(visit.bookingDate).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-sm text-emerald-700 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'आगमन खिड़की' : 'Arrival Window'}
                    </span>
                    <span className="font-bold text-emerald-600 font-mono text-base">
                      {visit.windowStartTime} – {visit.windowEndTime}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F4F9F7] border border-emerald-100">
                    <span className="text-sm text-emerald-800/80 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'अपेक्षित मात्रा' : 'Expected Quantity'}
                    </span>
                    <span className="font-bold text-[#014532] text-base font-mono">
                      {visit.expectedQuantityQuintals} qtl
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F4F9F7] border border-emerald-100">
                    <span className="text-sm text-emerald-800/80 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'सत्र' : 'Session'}
                    </span>
                    <span className="font-bold text-emerald-900/80 text-base">
                      {visit.session}
                    </span>
                  </div>
                </div>"""

new_grid = """                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'निर्धारित तिथि' : 'Scheduled Date'}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg block">
                      {new Date(visit.bookingDate).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F0F8F6] border border-[#014532]/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#014532] mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'आगमन खिड़की' : 'Arrival Window'}
                      </span>
                    </div>
                    <span className="font-bold text-[#014532] text-lg block tracking-wide">
                      {visit.windowStartTime} – {visit.windowEndTime}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                      <Truck className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'अपेक्षित मात्रा' : 'Expected Quantity'}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg block">
                      {visit.expectedQuantityQuintals} <span className="text-sm font-medium text-gray-500">qtl</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'सत्र' : 'Session'}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg block capitalize">
                      {visit.session.toLowerCase()}
                    </span>
                  </div>
                </div>"""
content = content.replace(old_grid, new_grid)

# Processing Summary Highlights
old_summary = """                {/* Processing Summary Highlights */}
                {(visit.weighment || visit.quality || visit.procurement || visit.payment) && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      {visit.weighment && (
                        <div className="flex items-center gap-1.5 text-emerald-900/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Weighed: <b className="text-[#014532] font-mono">{visit.weighment.approvedFinalWeight || visit.weighment.originalHardwareWeight} qtl</b></span>
                        </div>
                      )}
                      {visit.quality && (
                        <div className="flex items-center gap-1.5 text-emerald-900/80">
                          <Award className="w-3.5 h-3.5 text-purple-400" />
                          <span>Quality: <b className="text-[#014532]">{visit.quality.grade}</b> ({visit.quality.moisturePercent}% moisture)</span>
                        </div>
                      )}
                      {visit.procurement && (
                        <div className="flex items-center gap-1.5 text-emerald-900/80">
                          <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                          <span>Total Payout: <b className="text-emerald-700 font-mono font-bold">₹{visit.procurement.totalAmount.toLocaleString('en-IN')}</b></span>
                        </div>
                      )}
                      {visit.payment && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>DBT Status: <b className="text-[#014532]">{visit.payment.paymentStatus}</b></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}"""

new_summary = """                {/* Processing Summary Highlights */}
                {(visit.weighment || visit.quality || visit.procurement || visit.payment) && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      {visit.weighment && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Weighed: <b className="text-gray-900">{visit.weighment.approvedFinalWeight || visit.weighment.originalHardwareWeight} qtl</b></span>
                        </div>
                      )}
                      {visit.quality && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Quality: <b className="text-gray-900">{visit.quality.grade}</b> ({visit.quality.moisturePercent}%)</span>
                        </div>
                      )}
                      {visit.procurement && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Payout: <b className="text-[#014532] font-bold">₹{visit.procurement.totalAmount.toLocaleString('en-IN')}</b></span>
                        </div>
                      )}
                      {visit.payment && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">DBT Status: <b className="text-gray-900">{visit.payment.paymentStatus}</b></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}"""
content = content.replace(old_summary, new_summary)


# Action Buttons
old_actions = """                {/* Action buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100">
                  {/* Dedicated Link to full 7-stage Booking Transaction Journey */}
                  <Link
                    href={`/farmer/bookings/${visit.id}`}
                    className="text-sm text-[#014532] font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
                  >
                    <span>{lang === 'hi' ? 'खरीद विवरण व यात्रा देखें' : 'View Procurement Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex flex-wrap items-center gap-2">
                    {visit.procurement && (
                      <button
                        onClick={() => {
                          const p = visit.procurement!;
                          const w = visit.weighment;
                          const q = visit.quality;
                          const pay = visit.payment;
                          const voucherData: ProcurementVoucherData = {
                            id: p.id || visit.id,
                            bookingNumber: visit.bookingNumber,
                            centreName: visit.centreName || 'Muzaffarpur Central Grain Procurement Depot',
                            centreCode: visit.centreCode || 'DEP-BIH-04',
                            centreAddress: visit.centreAddress || 'Industrial Area, Phase 2, Muzaffarpur, Bihar - 842001',
                            bookingDate: visit.bookingDate,
                            session: visit.session,
                            farmerName: (visit as any).farmerName || farmer?.fullName || (user as any)?.name || (user as any)?.fullName || 'Farmer',
                            farmerCode: (visit as any).farmerCode || farmer?.farmerCode || 'ASTRA-FARMER',
                            farmerMobile: (visit as any).farmerMobile || farmer?.mobile || user?.mobile || '',
                            commodityName: 'Wheat (गेहूं)',
                            qualityGrade: q?.grade || 'Grade A',
                            moisturePercent: q?.moisturePercent ?? 11.8,
                            actualWeightQuintals: w?.approvedFinalWeight || w?.originalHardwareWeight || visit.expectedQuantityQuintals,
                            acceptedQuantityQuintals: p.acceptedQuantityQuintals,
                            ratePerQuintal: p.ratePerQuintal,
                            totalAmount: p.totalAmount,
                            deductions: 0,
                            decidedAt: p.decidedAt || visit.bookingDate,
                            decidedBy: p.decidedBy || 'Procurement Officer (ASTRA Authorized)',
                            paymentStatus: pay?.paymentStatus || (visit.status === 'COMPLETED' ? 'SETTLED' : 'PENDING'),
                            transactionRef: pay?.transactionRef || `ASTRA-DBT-${visit.bookingNumber.slice(-6)}`,
                            bankAccountMasked: pay ? (pay as any).bankAccountMasked : undefined,
                          };
                          setSelectedVoucherForPrint(voucherData);
                        }}
                        className="text-sm text-emerald-700 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-[#232F48] transition shadow-xs"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{lang === 'hi' ? 'वाउचर' : 'Voucher'}</span>
                      </button>
                    )}

                    {visit.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setSelectedBookingForPass({
                          id: visit.id,
                          bookingNumber: visit.bookingNumber,
                          centreName: visit.centreName,
                          centreAddress: visit.centreAddress,
                          centreCode: visit.centreCode,
                          bookingDate: visit.bookingDate,
                          session: visit.session,
                          windowStartTime: visit.windowStartTime,
                          windowEndTime: visit.windowEndTime,
                          expectedQuantityQuintals: visit.expectedQuantityQuintals,
                          vehicleNumber: visit.vehicleNumber,
                          vehicleType: visit.vehicleType,
                          farmerName: (visit as any).farmerName || farmer?.fullName || 'Farmer',
                          farmerCode: (visit as any).farmerCode || farmer?.farmerCode || null,
                          status: visit.status,
                        })}
                        className="text-sm text-emerald-900/80 hover:text-[#014532] font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-100 bg-[#F4F9F7] hover:bg-emerald-50 transition shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-800/80" />
                        <span>{lang === 'hi' ? 'क्यूआर पास' : 'QR Pass'}</span>
                      </button>
                    )}

                    {isBooked && (
                      <button
                        onClick={() => handleCancelBooking(visit.id)}
                        disabled={cancellingId === visit.id}
                        className="text-sm text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{cancellingId === visit.id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>"""

new_actions = """                {/* Action buttons */}
                <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                  {/* Dedicated Link to full 7-stage Booking Transaction Journey */}
                  <Link
                    href={`/farmer/bookings/${visit.id}`}
                    className="w-full sm:w-auto text-base text-white font-bold inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#014532] hover:bg-[#025a42] transition shadow-sm"
                  >
                    <span>{lang === 'hi' ? 'खरीद विवरण व यात्रा देखें' : 'View Procurement Details'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-end gap-3">
                    {visit.procurement && (
                      <button
                        onClick={() => {
                          const p = visit.procurement!;
                          const w = visit.weighment;
                          const q = visit.quality;
                          const pay = visit.payment;
                          const voucherData: ProcurementVoucherData = {
                            id: p.id || visit.id,
                            bookingNumber: visit.bookingNumber,
                            centreName: visit.centreName || 'Muzaffarpur Central Grain Procurement Depot',
                            centreCode: visit.centreCode || 'DEP-BIH-04',
                            centreAddress: visit.centreAddress || 'Industrial Area, Phase 2, Muzaffarpur, Bihar - 842001',
                            bookingDate: visit.bookingDate,
                            session: visit.session,
                            farmerName: (visit as any).farmerName || farmer?.fullName || (user as any)?.name || (user as any)?.fullName || 'Farmer',
                            farmerCode: (visit as any).farmerCode || farmer?.farmerCode || 'ASTRA-FARMER',
                            farmerMobile: (visit as any).farmerMobile || farmer?.mobile || user?.mobile || '',
                            commodityName: 'Wheat (गेहूं)',
                            qualityGrade: q?.grade || 'Grade A',
                            moisturePercent: q?.moisturePercent ?? 11.8,
                            actualWeightQuintals: w?.approvedFinalWeight || w?.originalHardwareWeight || visit.expectedQuantityQuintals,
                            acceptedQuantityQuintals: p.acceptedQuantityQuintals,
                            ratePerQuintal: p.ratePerQuintal,
                            totalAmount: p.totalAmount,
                            deductions: 0,
                            decidedAt: p.decidedAt || visit.bookingDate,
                            decidedBy: p.decidedBy || 'Procurement Officer (ASTRA Authorized)',
                            paymentStatus: pay?.paymentStatus || (visit.status === 'COMPLETED' ? 'SETTLED' : 'PENDING'),
                            transactionRef: pay?.transactionRef || `ASTRA-DBT-${visit.bookingNumber.slice(-6)}`,
                            bankAccountMasked: pay ? (pay as any).bankAccountMasked : undefined,
                          };
                          setSelectedVoucherForPrint(voucherData);
                        }}
                        className="text-sm text-gray-700 font-bold inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 transition shadow-sm"
                      >
                        <FileCheck2 className="w-4 h-4 text-gray-500" />
                        <span>{lang === 'hi' ? 'वाउचर' : 'Voucher'}</span>
                      </button>
                    )}

                    {visit.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setSelectedBookingForPass({
                          id: visit.id,
                          bookingNumber: visit.bookingNumber,
                          centreName: visit.centreName,
                          centreAddress: visit.centreAddress,
                          centreCode: visit.centreCode,
                          bookingDate: visit.bookingDate,
                          session: visit.session,
                          windowStartTime: visit.windowStartTime,
                          windowEndTime: visit.windowEndTime,
                          expectedQuantityQuintals: visit.expectedQuantityQuintals,
                          vehicleNumber: visit.vehicleNumber,
                          vehicleType: visit.vehicleType,
                          farmerName: (visit as any).farmerName || farmer?.fullName || 'Farmer',
                          farmerCode: (visit as any).farmerCode || farmer?.farmerCode || null,
                          status: visit.status,
                        })}
                        className="text-sm text-gray-700 font-bold inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 transition shadow-sm"
                      >
                        <QrCode className="w-4 h-4 text-gray-500" />
                        <span>{lang === 'hi' ? 'क्यूआर पास' : 'QR Pass'}</span>
                      </button>
                    )}

                    {isBooked && (
                      <button
                        onClick={() => handleCancelBooking(visit.id)}
                        disabled={cancellingId === visit.id}
                        className="text-sm text-red-700 hover:text-red-800 font-bold inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{cancellingId === visit.id ? 'Cancelling...' : 'Cancel Visit'}</span>
                      </button>
                    )}
                  </div>
                </div>"""
content = content.replace(old_actions, new_actions)


with open('d:/Astra/apps/web/src/app/farmer/visits/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
