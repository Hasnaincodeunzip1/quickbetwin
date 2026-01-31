-- Create function to increment bank account transactions
CREATE OR REPLACE FUNCTION public.increment_bank_transactions(account_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_bank_accounts
  SET total_transactions = total_transactions + 1
  WHERE id = account_id;
END;
$$;

-- Create function to increment bank account deposits (called when deposit is approved)
CREATE OR REPLACE FUNCTION public.increment_bank_deposits(account_id UUID, deposit_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_bank_accounts
  SET 
    total_deposits = total_deposits + 1,
    balance = balance + deposit_amount
  WHERE id = account_id;
END;
$$;

-- Create function to decrement bank balance (called when withdrawal is approved)
CREATE OR REPLACE FUNCTION public.decrement_bank_balance(account_id UUID, withdrawal_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_bank_accounts
  SET balance = balance - withdrawal_amount
  WHERE id = account_id AND balance >= withdrawal_amount;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_bank_transactions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_bank_deposits(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_bank_balance(UUID, NUMERIC) TO authenticated;