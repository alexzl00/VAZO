
export type WorkContract = 'uop' | 'mandate' | 'uod';
export type PaymentMode = 'monthly' | 'hourly' | 'fixed';

export type WorkRelation = {
  id: string;
  user_id: string;

  name: string;
  employer_name: string | null;

  contract_type: WorkContract;
  payment_mode: PaymentMode;

  start_date: string;
  end_date: string | null;

  created_at: string;
  updated_at: string;
};

export type WorkRelationPayload = {
  name: string;
  employerName?: string | null;
  contractType: WorkContract;
  paymentMode: PaymentMode;
  startDate: string;
  endDate?: string | null;
};