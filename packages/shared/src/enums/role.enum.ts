/**
 * ASTRA System User Roles
 *
 * Defines the role-based access control (RBAC) foundation across the platform:
 * - FARMER: Registered agricultural producer seeking procurement slot & tracking queue.
 * - CHECK_IN: Gate officer verifying arrival windows and booking credentials.
 * - WEIGHMENT: Operational staff capturing gross/tare weights.
 * - QUALITY: Assessor grading crop quality and moisture parameters.
 * - PROCUREMENT: Official executing purchase transaction and quota verification.
 * - PAYMENT: Disbursal coordinator verifying settlement instructions.
 * - GOVERNMENT_ADMIN: Regulatory monitoring, quotas, and state-level audit oversight.
 */
export enum UserRole {
  FARMER = 'FARMER',
  PROCUREMENT_CENTRE_OFFICER = 'PROCUREMENT_CENTRE_OFFICER',
  CHECK_IN_OFFICER = 'CHECK_IN_OFFICER',
  WEIGHMENT_OFFICER = 'WEIGHMENT_OFFICER',
  WEIGHMENT_SUPERVISOR = 'WEIGHMENT_SUPERVISOR',
  QUALITY_OFFICER = 'QUALITY_OFFICER',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  PAYMENT_OFFICER = 'PAYMENT_OFFICER',
  FARMER_VERIFICATION_AUTHORITY = 'FARMER_VERIFICATION_AUTHORITY',
  GOVERNMENT_ADMIN = 'GOVERNMENT_ADMIN',
  // Backward compatibility aliases
  CHECK_IN = 'CHECK_IN',
  WEIGHMENT = 'WEIGHMENT',
  QUALITY = 'QUALITY',
  PROCUREMENT = 'PROCUREMENT',
  PAYMENT = 'PAYMENT',
}

