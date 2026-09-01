import { supabase } from '../lib/supabase';
import type { WorkRelation, WorkRelationPayload } from '../types/workRelation';


/**
 * CREATE
 */
export const createWorkRelation = async (
  values: WorkRelationPayload,
): Promise<WorkRelation> => {
  const { data, error } = await supabase.rpc(
    'create_work_relation',
    {
      p_name: values.name,
      p_contract_type: values.contractType,
      p_start_date: values.startDate,
      p_employer_name: values.employerName ?? null,
      p_end_date: values.endDate ?? null,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Failed to create work relation');
  }

  return data as WorkRelation;
};

/**
 * GET ALL
 */
export const getWorkRelations = async (): Promise<
  WorkRelation[]
> => {
  const { data, error } = await supabase.rpc(
    'get_work_relations',
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkRelation[];
};

/**
 * GET ONE
 */
export const getWorkRelation = async (
  id: string,
): Promise<WorkRelation> => {
  const { data, error } = await supabase.rpc(
    'get_work_relation',
    {
      p_id: id,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Work relation not found');
  }

  return data as WorkRelation;
};

/**
 * UPDATE
 */
export const updateWorkRelation = async (
  id: string,
  values: WorkRelationPayload,
): Promise<WorkRelation> => {
  const { data, error } = await supabase.rpc(
    'update_work_relation',
    {
      p_id: id,
      p_name: values.name,
      p_contract_type: values.contractType,
      p_start_date: values.startDate,
      p_employer_name: values.employerName ?? null,
      p_end_date: values.endDate ?? null,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Failed to update work relation');
  }

  return data as WorkRelation;
};

/**
 * DELETE
 */
export const deleteWorkRelation = async (
  id: string,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc(
    'delete_work_relation',
    {
      p_id: id,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data === true;
};

/**
 * GET WORK RELATIONS AVAILABLE IN SELECTED MONTH
 */
export const getWorkRelationsForMonth = async (
  year: number,
  month: number,
): Promise<WorkRelation[]> => {
  const { data, error } = await supabase.rpc(
    'get_work_relations_for_month',
    {
      p_year: year,
      p_month: month,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkRelation[];
};