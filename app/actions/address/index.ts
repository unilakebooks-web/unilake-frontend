import api from "@/app/lib/axios";
import type { SavedAddress, CreateAddressInput, UpdateAddressInput } from "@/app/types/address";

export async function fetchAddresses(): Promise<SavedAddress[]> {
  const { data } = await api.get<SavedAddress[]>("/api/user/addresses");
  return data;
}

export async function createAddress(input: CreateAddressInput): Promise<SavedAddress> {
  const { data } = await api.post<SavedAddress>("/api/user/addresses", input);
  return data;
}

export async function updateAddress(id: string, input: UpdateAddressInput): Promise<SavedAddress> {
  const { data } = await api.patch<SavedAddress>(`/api/user/addresses/${id}`, input);
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/api/user/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<SavedAddress> {
  const { data } = await api.post<SavedAddress>(`/api/user/addresses/${id}/set-default`);
  return data;
}
