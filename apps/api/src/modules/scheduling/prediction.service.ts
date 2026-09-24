import { Injectable } from '@nestjs/common';

@Injectable()
export class PredictionService {
  /**
   * Predicts expected processing duration (in minutes) at the procurement centre.
   * Uses configured baseline processing rules for First Season:
   * - Base visit overhead: 15 mins (check-in, tare/gross weighment, sampling)
   * - Variable unloading/grading duration: ~5 mins per 20 quintals
   * - Peak buffer: +3 to 5 mins uncertainty buffer
   *
   * @param quantityQuintals Expected produce volume
   */
  predictProcessingDuration(quantityQuintals: number): number {
    const baseMinutes = 15;
    const variableMinutes = Math.ceil((quantityQuintals / 20) * 5);
    const uncertaintyBuffer = 3; // First-season operational variance buffer
    const totalMinutes = baseMinutes + variableMinutes + uncertaintyBuffer;
    // Bound between 20 minutes minimum and 60 minutes maximum
    return Math.min(Math.max(totalMinutes, 20), 60);
  }

  /**
   * Predicts arrival punctuality buffer for scheduling
   */
  predictPunctualityWindowMinutes(): number {
    return 15; // 15-minute arrival window
  }
}
