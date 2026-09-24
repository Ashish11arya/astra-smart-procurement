/**
 * Farmer Registration Status Lifecycle
 *
 * Defines the state transitions of a farmer's registration application:
 * - DRAFT: Registration started but not yet submitted.
 * - SUBMITTED: Registration submitted, pending authority processing.
 * - VERIFICATION_PENDING: Submitted and awaiting review by authorised procurement authority.
 * - VERIFIED: Farmer profile and credentials officially approved for procurement.
 * - REJECTED: Registration rejected (with formal reason from the verification authority).
 * - RETURNED_FOR_CORRECTION: Correction requested by the authority.
 */
export enum RegistrationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  RETURNED_FOR_CORRECTION = 'RETURNED_FOR_CORRECTION',
  // Backward-compatibility aliases
  UNDER_VERIFICATION = 'UNDER_VERIFICATION',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
}
