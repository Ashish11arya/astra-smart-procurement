content = open(r'd:\Astra\apps\web\src\app\farmer\bookings\[id]\page.tsx', 'r', encoding='utf-8').read()

new_jsx = """  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 font-inter text-slate-800">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/farmer/dashboard"
          className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'hi' ? '← वापस' : '← Back'}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Summary & Stages */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Booking Summary Section */}
          <section
            aria-label="Booking Summary"
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
              <Calendar className="w-5 h-5 text-slate-500" />
              {locale === 'hi' ? 'बुकिंग सारांश' : 'Booking Summary'}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'किसान' : 'Farmer'}
                </p>
                <p className="text-base font-semibold text-slate-900">{booking.farmerName || 'Akash'}</p>
                <p className="text-sm text-slate-600">ASTRA-FARMER</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'दिनांक और सत्र' : 'Date & Session'}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {new Date(booking.bookingDate).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-slate-600">{booking.session} Session ({booking.windowStartTime} – {booking.windowEndTime})</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'केंद्र' : 'Centre'}
                </p>
                <p className="text-base font-semibold text-slate-900">{booking.centreName || 'Procurement Centre'}</p>
                <p className="text-sm text-slate-600 truncate">{booking.centreAddress || 'Center Address'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'मात्रा' : 'Quantity'}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {booking.expectedQuantityQuintals} {locale === 'hi' ? 'क्विंटल' : 'Quintals'}
                </p>
                <p className="text-sm text-slate-600">{booking.cropName}</p>
              </div>
            </div>
          </section>

          {/* Procurement Journey Section */}
          <section
            aria-label="Procurement Journey"
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold mb-8 flex items-center gap-2 text-slate-900">
              <ClipboardCheck className="w-5 h-5 text-slate-500" />
              {locale === 'hi' ? 'खरीद प्रक्रिया' : 'Procurement Journey'}
            </h2>

            <div className="relative ml-4 sm:ml-6">
              {journey.map((stage, idx) => {
                const isLast = idx === journey.length - 1;
                const isCompleted = stage.status === 'COMPLETED';
                const isInProgress = stage.status === 'IN_PROGRESS';
                const isWaiting = stage.status === 'WAITING';
                const isRejected = stage.status === 'REJECTED';

                return (
                  <div key={stage.id} className="relative pb-10 sm:pb-12 last:pb-0 flex items-start group">
                    {/* Vertical Line Connector */}
                    {!isLast && (
                      <div className={`absolute top-8 left-3 sm:left-4 w-px h-full -ml-[0.5px] transition-colors duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />
                    )}

                    {/* Status Node Icon */}
                    <div className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isCompleted ? 'bg-emerald-500 text-white shadow-sm' : 
                      isInProgress ? 'bg-amber-400 text-white shadow-sm ring-4 ring-amber-50' : 
                      isRejected ? 'bg-rose-500 text-white shadow-sm' :
                      'bg-white border-2 border-slate-300'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : 
                       isInProgress ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> :
                       isRejected ? <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : null}
                    </div>

                    {/* Stage Details */}
                    <div className="ml-4 sm:ml-6 flex-1 pt-0.5 sm:pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1.5">
                        <h3 className={`text-base font-semibold ${
                          isCompleted || isInProgress ? 'text-slate-900' : 'text-slate-500'
                        }`}>
                          {locale === 'hi' ? stage.titleHi : stage.titleEn}
                        </h3>
                        {getStagePill(stage.status)}
                      </div>
                      
                      <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                        {locale === 'hi' ? stage.descriptionHi : stage.descriptionEn}
                      </p>

                      {stage.timestamp && (
                        <p className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(stage.timestamp).toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Status & Gate Pass */}
        <div className="space-y-6">
          {/* Current Status Card */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              {locale === 'hi' ? 'वर्तमान स्थिति' : 'Current Status'}
            </h3>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                {getStageIcon(currentStatus.status)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg mb-1">
                  {locale === 'hi' ? currentStatus.titleHi : currentStatus.titleEn}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {locale === 'hi' ? currentStatus.descriptionHi : currentStatus.descriptionEn}
                </p>
              </div>
            </div>
          </section>

          {/* Gate Pass Access Card */}
          <section className="bg-gradient-to-br from-[#014532] to-emerald-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">
                {locale === 'hi' ? 'डिजिटल गेट पास' : 'Digital Gate Pass'}
              </h3>
              <p className="text-emerald-100/90 text-sm mb-6 max-w-[200px] leading-relaxed">
                {locale === 'hi' 
                  ? 'प्रवेश और तीव्र चेक-इन के लिए अपना पास दिखाएं।' 
                  : 'Present your pass for entry and fast-track check-in.'}
              </p>
              
              <button
                onClick={() => setPassModalOpen(true)}
                className="w-full bg-white text-[#014532] hover:bg-emerald-50 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <QrCode className="w-5 h-5" />
                {locale === 'hi' ? 'पास दिखाएं' : 'Show Pass'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Existing Digital QR Booking Pass Modal (Unchanged & Preserved) */}
      <BookingPassModal
        isOpen={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        booking={bookingPassData}
        lang={locale === 'hi' ? 'hi' : 'en'}
      />
    </main>
"""

start_marker = "  return (\n    <main className="
jsx_start = content.find(start_marker)

end_marker = "      {/* Existing Digital QR Booking Pass Modal (Unchanged & Preserved) */}"
jsx_end = content.find(end_marker, jsx_start)

if jsx_start != -1 and jsx_end != -1:
    new_content = content[:jsx_start] + new_jsx + content[jsx_end:]
    open(r'd:\Astra\apps\web\src\app\farmer\bookings\[id]\page.tsx', 'w', encoding='utf-8').write(new_content)
    print("Successfully replaced UI!")
else:
    print(f"Error: Could not find markers. jsx_start={jsx_start}, jsx_end={jsx_end}")
