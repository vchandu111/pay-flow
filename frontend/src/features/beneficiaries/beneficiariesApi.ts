import { apiClient } from '../../services/apiClient';
import type { Beneficiary } from './types';

export async function listBeneficiariesRequest(): Promise<Beneficiary[]> {
  const res = await apiClient.get<{ beneficiaries: Beneficiary[] }>('/beneficiaries');
  return res.data.beneficiaries;
}

export async function addBeneficiaryRequest(input: { name: string; identifier: string }): Promise<Beneficiary> {
  const res = await apiClient.post<{ beneficiary: Beneficiary }>('/beneficiaries', input);
  return res.data.beneficiary;
}
