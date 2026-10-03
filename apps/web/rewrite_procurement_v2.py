import re

file_path = r"d:\Astra\apps\web\src\app\farmer\bookings\[id]\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# First, find where bookingPassData is defined
booking_pass_idx = content.find("const bookingPassData = {")
if booking_pass_idx == -1:
    print("Could not find bookingPassData marker")
    exit(1)

# Find the next 'return (' after bookingPassData
jsx_start = content.find("return (", booking_pass_idx)
end_marker = "      {/* Existing Digital QR Booking Pass Modal"
jsx_end = content.find(end_marker, jsx_start)

if jsx_start == -1 or jsx_end == -1:
    print("Could not find JSX markers")
    exit(1)

new_jsx = """return (
    <main className="flex-1 max-w-[1240px] mx-auto w-full p-4 sm:p-8 space-y-6 sm:space-y-8 pb-24 text-[#014532]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-emerald-800/80 hover:text-[#014532] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'hi' ? 'वापस' : 'Back'}</span>
        </button>

        <button
          onClick={() => fetchBookingDetail(true)}
          disabled={loading || refreshing}
          className="px-4 py-2 rounded-xl text-emerald-900/80 hover:text-[#014532] hover:bg-emerald-50 bg-white shadow-sm border border-emerald-100/60 text-sm font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-700' : ''}`} />
          <span className="hidden sm:inline">
            {refreshing ? (locale === 'hi' ? 'अपडेट हो रहा...' : 'Syncing...') : (locale === 'hi' ? 'रिफ्रेश' : 'Refresh')}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. BOOKING DETAIL HEADER CARD                                */}
      {/* ============================================================ */}
      <section
        aria-label="Procurement Booking Summary"
        className="bg-white rounded-[20px] border border-emerald-100/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 border-b border-emerald-50 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold tracking-wider uppercase text-emerald-700">
                {locale === 'hi' ? 'खरीद बुकिंग' : 'PROCUREMENT BOOKING'}
              </span>
              <span className="text-emerald-300">•</span>
              <span className="font-mono text-[13px] font-bold text-emerald-800/70">
                {booking.bookingNumber}
              </span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-bold text-[#014532] tracking-tight leading-tight">
              {booking.centreName}
            </h1>

            <p className="text-[15px] font-medium text-emerald-800/70 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{booking.centreAddress}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-[#E6F4EA] text-[#014532] border border-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{currentStatus.label}</span>
            </div>

            <button
              onClick={() => setPassModalOpen(true)}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#014532] hover:bg-[#003828] text-white font-semibold text-sm shadow-sm transition active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4" />
              <span>{locale === 'hi' ? 'डिजिटल क्यूआर पास' : 'QR BOOKING PASS'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-[16px] bg-[#F8FBF9] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700/80 font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{locale === 'hi' ? 'निर्धारित तिथि' : 'Scheduled Date'}</span>
            </div>
            <span className="font-bold text-[#014532] text-base block">
              {formatDate(booking.bookingDate)}
            </span>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8FBF9] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700/80 font-bold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{locale === 'hi' ? 'आगमन समय' : 'Arrival Window'}</span>
            </div>
            <span className="font-bold font-mono text-[#014532] text-base block">
              {booking.windowStartTime} – {booking.windowEndTime}
            </span>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8FBF9] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700/80 font-bold uppercase tracking-wider mb-1">
              <Package className="w-3.5 h-3.5" />
              <span>{locale === 'hi' ? 'फसल जींस' : 'Crop / Commodity'}</span>
            </div>
            <span className="font-bold text-[#014532] text-base block">
              {cropName}
            </span>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8FBF9] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700/80 font-bold uppercase tracking-wider mb-1">
              <Scale className="w-3.5 h-3.5" />
              <span>{locale === 'hi' ? 'मात्रा' : 'Booked Quantity'}</span>
            </div>
            <span className="font-extrabold font-mono text-[#014532] text-base block">
              {booking.expectedQuantityQuintals} <span className="font-medium font-sans text-emerald-800/70 text-sm">qtl</span>
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TWO-COLUMN WORKFLOW LAYOUT                                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: THE 7-STAGE TRANSACTION JOURNEY */}
        <div className="lg:col-span-8 space-y-6">
          <section
            aria-label="Procurement Journey"
            className="bg-white rounded-[20px] border border-emerald-100/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-50 pb-5">
              <div>
                <h2 className="text-xl sm:text-[22px] font-bold text-[#014532] flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>{locale === 'hi' ? 'खरीद लेनदेन यात्रा (7 चरण)' : 'Procurement Journey (7 Stages)'}</span>
                </h2>
                <p className="text-[15px] font-medium text-emerald-800/70 mt-1">
                  {locale === 'hi'
                    ? 'बुकिंग से लेकर सीधे बैंक खाते (DBT) में भुगतान तक का रीयल-टाइम रिकॉर्ड।'
                    : 'Real-time stage-by-stage transaction audit from reservation to DBT payment disbursal.'}
                </p>
              </div>

              {/* Journey Summary */}
              {(() => {
                const completedCount = journey.filter(s => s.state === 'COMPLETED').length;
                const currentCount = journey.filter(s => s.state === 'IN_PROGRESS' || s.state === 'ACTION_REQUIRED').length;
                const pendingCount = journey.filter(s => s.state === 'WAITING' || s.state === 'NOT_STARTED').length;
                
                return (
                  <div className="flex items-center gap-3 shrink-0 bg-[#F8FBF9] px-3.5 py-2 rounded-[12px] border border-emerald-100/50">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" /> <span>{completedCount}</span>
                    </div>
                    <div className="w-px h-4 bg-emerald-200"></div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#014532]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <span>{currentCount}</span>
                    </div>
                    <div className="w-px h-4 bg-emerald-200"></div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <span className="w-2 h-2 rounded-full border-2 border-slate-400"></span> <span>{pendingCount}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-4 relative pt-2">
              {journey.map((stage, idx) => {
                const isLast = idx === journey.length - 1;
                const isCompleted = stage.state === 'COMPLETED';
                const isInProgress = stage.state === 'IN_PROGRESS' || stage.state === 'ACTION_REQUIRED';
                const isPending = stage.state === 'WAITING' || stage.state === 'NOT_STARTED';

                return (
                  <div key={stage.stageId} className="flex gap-4 sm:gap-6 relative group">
                    {/* Timeline Line */}
                    {!isLast && (
                      <div
                        className={`absolute top-9 left-[19px] sm:left-[23px] w-0.5 h-[calc(100%+0.5rem)] transition-colors ${
                          isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Timeline Icon */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.2)]'
                          : isInProgress
                          ? 'bg-[#014532] text-white shadow-[0_4px_16px_rgba(1,69,50,0.25)] ring-4 ring-[#E6F4EA]'
                          : 'bg-[#F1F5F9] text-slate-400 border-2 border-slate-200/60'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : isInProgress ? (
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-300" />
                      )}
                    </div>

                    {/* Card Content */}
                    <div
                      className={`flex-1 rounded-[16px] p-4 sm:p-5 transition-all duration-300 ${
                        isInProgress
                          ? 'bg-[#F4F9F7] border border-[#A7F3D0] shadow-sm'
                          : isCompleted
                          ? 'bg-white border border-emerald-50 hover:bg-emerald-50/30'
                          : 'bg-white border border-slate-100 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`text-[15px] sm:text-base font-bold font-mono ${isInProgress ? 'text-[#014532]' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                            0{stage.stepNumber}
                          </span>
                          <h4 className={`text-[17px] sm:text-[19px] font-bold ${isInProgress ? 'text-[#014532]' : isCompleted ? 'text-emerald-900' : 'text-slate-600'}`}>
                            {stage.title}
                          </h4>
                        </div>
                        
                        <div>
                          {isCompleted && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-100/80 text-emerald-700">
                              ✓ {locale === 'hi' ? 'पूर्ण' : 'COMPLETED'}
                            </span>
                          )}
                          {isInProgress && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#014532] text-white">
                              {locale === 'hi' ? 'वर्तमान' : 'CURRENT'}
                            </span>
                          )}
                          {stage.state === 'WAITING' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
                              {locale === 'hi' ? 'प्रतीक्षारत' : 'WAITING'}
                            </span>
                          )}
                          {stage.state === 'NOT_STARTED' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                              {locale === 'hi' ? 'शुरू नहीं हुआ' : 'NOT STARTED'}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className={`text-[15px] font-medium leading-relaxed mb-3 ${isInProgress ? 'text-[#014532]/90' : isCompleted ? 'text-emerald-800/80' : 'text-slate-500'}`}>
                        {stage.summary}
                      </p>

                      <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
                        <span className={`inline-flex items-center gap-1.5 ${isInProgress ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <Building className="w-3.5 h-3.5" />
                          {stage.department}
                        </span>
                        
                        {(stage.timestamp || (isInProgress && stage.stageId === 'CHECK_IN')) && (
                          <>
                            <span className={isCompleted ? 'text-emerald-200' : 'text-slate-300'}>•</span>
                            <span className={`inline-flex items-center gap-1.5 ${isInProgress ? 'text-[#014532]' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              {stage.timestamp ? (
                                <span className="font-mono">
                                  {isCompleted ? 'Completed: ' : 'Expected: '} 
                                  {formatDate(stage.timestamp)} {formatTime(stage.timestamp)}
                                </span>
                              ) : (
                                <span className="font-mono">Expected: {booking.windowStartTime} – {booking.windowEndTime}</span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: CURRENT STATUS & CARDS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[20px] border border-emerald-100/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 space-y-5">
            <span className="text-[13px] font-bold uppercase tracking-wider text-emerald-700 block">
              {locale === 'hi' ? 'वर्तमान स्थिति' : 'Current Status'}
            </span>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#014532] flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{currentStatus.label}</span>
              </h3>
              <p className="text-[15px] font-medium text-emerald-800/80 leading-relaxed">
                {currentStatus.description}
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold uppercase tracking-wider text-emerald-700">
                  {locale === 'hi' ? 'भौतिक कतार' : 'Physical Queue'}
                </span>
                {queueInfo.isQueued ? (
                  <span className="text-sm font-bold bg-[#E6F4EA] text-[#014532] px-2 py-0.5 rounded-md font-mono">
                    #{queueInfo.queuePosition}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-emerald-800/70">
                    {locale === 'hi' ? 'लंबित' : 'Pending Check-in'}
                  </span>
                )}
              </div>

              {queueInfo.isQueued ? (
                <div className="space-y-2 text-[15px] font-medium text-emerald-800/80 bg-[#F8FBF9] p-3 rounded-[12px] border border-emerald-50">
                  {queueInfo.farmersAhead !== null && (
                    <div className="flex justify-between items-center">
                      <span>{locale === 'hi' ? 'आगे कतार में किसान:' : 'Farmers ahead:'}</span>
                      <strong className="text-[#014532]">
                        {queueInfo.farmersAhead === 0
                          ? locale === 'hi' ? '0 (अगला नंबर)' : '0 (Next)'
                          : queueInfo.farmersAhead}
                      </strong>
                    </div>
                  )}
                  {queueInfo.checkedInTime && (
                    <div className="flex justify-between items-center">
                      <span>{locale === 'hi' ? 'चेक-इन समय:' : 'Checked in:'}</span>
                      <span className="font-mono text-[#014532] font-bold">
                        {formatTime(queueInfo.checkedInTime)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#F8FBF9] p-4 rounded-[12px] border border-emerald-50">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    {locale === 'hi' ? 'अगली कार्रवाई' : 'Next Action'}
                  </span>
                  <p className="text-[14px] font-medium text-[#014532] leading-snug">
                    {locale === 'hi'
                      ? 'केंद्र पर अपनी निर्धारित समय विंडो के दौरान पहुंचें।'
                      : 'Arrive at the procurement centre during your assigned window.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick QR Card */}
          <div className="bg-white rounded-[20px] border border-emerald-100/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <h4 className="text-[14px] font-bold text-[#014532] uppercase tracking-wider">
                {locale === 'hi' ? 'गेट क्लीयरेंस पास' : 'Gate Clearance Pass'}
              </h4>
            </div>
            <p className="text-[14px] font-medium text-emerald-800/80 leading-relaxed">
              {locale === 'hi'
                ? 'केंद्र के प्रवेश द्वार पर सुरक्षा कर्मी को यह कोड दिखाएं।'
                : 'Present this digital pass at the entrance security gate for fast-track arrival acknowledgment.'}
            </p>
            <button
              onClick={() => setPassModalOpen(true)}
              type="button"
              className="w-full py-3 rounded-[12px] bg-white hover:bg-[#F8FBF9] text-[#014532] border-2 border-emerald-100 font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>{locale === 'hi' ? 'पास खोलें व प्रिंट करें' : 'Open Pass & Print'}</span>
            </button>
          </div>

          {/* Transport Info */}
          {booking.vehicleNumber && (
            <div className="bg-white rounded-[20px] border border-emerald-100/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#014532] font-bold text-[15px]">
                <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <span>{booking.vehicleType || 'Standard Transport'}</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                {booking.vehicleNumber}
              </span>
            </div>
          )}
        </div>
      </div>
\n"""

new_content = content[:jsx_start] + new_jsx + content[jsx_end:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Rewrite successful.")
