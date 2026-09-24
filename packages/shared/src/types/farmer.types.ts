import { UserRole } from '../enums/role.enum';
import { RegistrationStatus } from '../enums/registration-status.enum';
import { Gender, FarmerCategory, LandOwnershipType, FarmerState } from '../enums/farmer.enum';

export interface RequestOtpDto {
  mobile: string;
  scope?: 'LOGIN' | 'REGISTER';
}

export interface CheckFarmerRegistrationDto {
  mobile: string;
}

export interface CheckFarmerRegistrationResponseDto {
  exists: boolean;
  status: FarmerState;
  message?: string;
}

export interface RequestOtpResponseDto {
  success: boolean;
  message: string;
  cooldownSeconds: number;
  devOtp?: string;
}

export interface VerifyOtpDto {
  mobile: string;
  otp: string;
}

export interface UserSummaryDto {
  id: string;
  mobile: string;
  role: UserRole;
}

export interface LandParcelDto {
  id?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  village?: string;
  khasraNumber: string;
  surveyNumber?: string;
  areaAcres: number;
  ownershipType?: LandOwnershipType;
  landType?: string;
  cropSown?: string;
  season?: string;
}

export interface DocumentDto {
  id?: string;
  documentType: 'IDENTITY' | 'LAND' | 'BANK';
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
  verified?: boolean;
}

export interface PersonalDetailsDto {
  fullName: string;
  fatherOrSpouseName: string;
  gender: Gender;
  category: FarmerCategory;
  mobile: string;
  aadhaarNumberMasked?: string;
}

export interface AddressDetailsDto {
  state?: string;
  district: string;
  block: string;
  panchayat: string;
  village: string;
  pincode: string;
  addressLine: string;
}

export interface BankDetailsDto {
  accountHolderName: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  accountNumber: string;
  accountNumberMasked?: string;
}

export interface FarmerRegistrationDto {
  personal: PersonalDetailsDto;
  address: AddressDetailsDto;
  landParcels: LandParcelDto[];
  bank: BankDetailsDto;
  documents: DocumentDto[];
  consent?: {
    declarationConfirmed?: boolean;
    aadhaarConsent?: boolean;
  };
}

export interface FarmerProfileDto {
  id: string;
  farmerCode: string;
  fullName: string;
  fatherOrSpouseName?: string;
  gender?: Gender;
  category?: FarmerCategory;
  mobile: string;
  isVerified: boolean;
  village?: string;
  district?: string;
}

export interface RegistrationSummaryDto {
  id: string;
  registrationNumber: string;
  status: RegistrationStatus;
  submittedAt?: string;
  verifiedAt?: string;
  actionRequiredNotes?: string;
  rejectionReason?: string;
  personal?: PersonalDetailsDto;
  address?: AddressDetailsDto;
  landParcels?: LandParcelDto[];
  bank?: BankDetailsDto;
  documents?: DocumentDto[];
}

export interface VerifyOtpResponseDto {
  token: string;
  user: UserSummaryDto;
  farmerState: FarmerState;
  farmer?: FarmerProfileDto;
  registration?: RegistrationSummaryDto;
}

export interface FarmerStatusResponseDto {
  farmerState: FarmerState;
  farmer?: FarmerProfileDto;
  registration?: RegistrationSummaryDto;
}

export interface FarmerVerificationDecisionDto {
  decision: 'APPROVE' | 'REJECT' | 'RETURN_FOR_CORRECTION';
  reason?: string;
}

export interface FarmerVerificationListItemDto {
  id?: string;
  farmerId: string;
  farmerCode: string;
  registrationNumber: string;
  fullName: string;
  mobile: string;
  district: string;
  block: string;
  panchayat: string;
  village: string;
  submittedAt: string;
  status: RegistrationStatus;
  isVerified: boolean;
  landAreaAcres?: number;
}

export interface FarmerVerificationDetailDto {
  registrationId: string;
  registrationNumber: string;
  farmerId: string;
  farmerCode: string;
  status: RegistrationStatus;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  returnedAt?: string;
  returnedBy?: string;
  reason?: string;
  personal: PersonalDetailsDto;
  address: AddressDetailsDto;
  landParcels: LandParcelDto[];
  bank: BankDetailsDto;
  documents?: DocumentDto[];
  auditLogs?: any[];
}

export interface AuthorityDashboardStatsDto {
  pendingVerifications: number;
  verifiedFarmers: number;
  returnedApplications: number;
  rejectedApplications: number;
  verifiedCentres: number;
  pendingCentres: number;
  activeCentres: number;
  totalPersonnel: number;
  activePersonnel: number;
  recentActivity: any[];
}
