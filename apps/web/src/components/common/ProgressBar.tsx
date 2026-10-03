'use client';

import React from 'react';
import { Check, User, MapPin, Landmark, Building2, FileText, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  allowJumpToCompleted?: boolean;
}

const STEP_ICONS = [User, MapPin, Landmark, Building2, FileText, CheckCircle];

export function ProgressBar({
  currentStep,
  totalSteps,
  onStepClick,
  allowJumpToCompleted = true,
}: ProgressBarProps) {
  const { t } = useLanguage();

  const stepLabels = [t.step1, t.step2, t.step3, t.step4, t.step5, t.step6];

  return (
    <div className="w-full bg-white mb-2">
      {/* Mobile step indicator text */}
      <div className="flex items-center justify-between sm:hidden mb-3 px-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {t.stepOf.replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}
        </span>
        <span className="text-xs font-bold text-[#0BAA72] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          {stepLabels[currentStep - 1]}
        </span>
      </div>

      {/* Visual Step Bar */}
      <div className="relative px-2">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-4 right-4 sm:left-8 sm:right-8 -translate-y-1/2 h-[2px] bg-slate-200 z-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0BAA72] transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Circles */}
        <div className="relative z-10 flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const isPending = stepNum > currentStep;
            const Icon = STEP_ICONS[i] || User;

            const canClick = allowJumpToCompleted && isCompleted && onStepClick;

            return (
              <button
                key={stepNum}
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick(stepNum)}
                className={`flex flex-col items-center group focus:outline-none ${
                  canClick ? 'cursor-pointer' : 'cursor-default'
                } bg-white px-0.5 sm:px-4`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-sm transition-all bg-white z-10 ${
                    isCurrent || isCompleted
                      ? 'bg-[#0BAA72] text-white border-2 border-white sm:border-none'
                      : 'border-[2px] border-slate-200 text-slate-400'
                  } ${isCurrent ? 'ring-2 ring-emerald-100 sm:ring-0' : ''}`}
                >
                  {stepNum}
                </div>

                <div className={`hidden sm:flex flex-col items-center mt-2 transition ${
                  isCurrent || isCompleted ? 'text-[#0BAA72]' : 'text-slate-400'
                }`}>
                  <Icon className="w-3.5 h-3.5 mb-0.5" />
                  <span className={`text-[11px] ${isCurrent || isCompleted ? 'font-[700]' : 'font-[500]'}`}>
                    {stepLabels[i]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
