-- Create a function to add balance to a user's wallet (for deposit approvals)
CREATE OR REPLACE FUNCTION public.add_wallet_balance(p_user_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can add wallet balance';
  END IF;
  
  UPDATE wallets 
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Create a function to refund balance to a user's wallet (for rejected withdrawals)
CREATE OR REPLACE FUNCTION public.refund_wallet_balance(p_user_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can refund wallet balance';
  END IF;
  
  UPDATE wallets 
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;