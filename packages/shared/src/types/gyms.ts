export interface Gym {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  ownerId: string;
  /** IANA time zone the gym's schedule runs in, e.g. America/Los_Angeles */
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGymRequest {
  name: string;
  address: string;
  phoneNumber: string;
  ownerId: string;
  timezone: string;
}

export interface UpdateGymRequest {
  name?: string;
  address?: string;
  phoneNumber?: string;
  ownerId?: string;
  timezone?: string;
}

export interface GymListParams {
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
}