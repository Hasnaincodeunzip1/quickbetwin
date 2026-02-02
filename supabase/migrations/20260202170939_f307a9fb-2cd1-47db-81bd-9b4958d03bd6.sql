-- Create function to purchase VIP level
CREATE OR REPLACE FUNCTION public.purchase_vip(
  p_vip_level vip_level,
  p_base_price NUMERIC,
  p_tax_amount NUMERIC,
  p_total_price NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_balance NUMERIC;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user_id;
  
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_balance < p_total_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Create purchase record
  INSERT INTO vip_purchases (user_id, vip_level, base_price, tax_amount, total_paid)
  VALUES (v_user_id, p_vip_level, p_base_price, p_tax_amount, p_total_price);
  
  -- Update profile VIP level
  UPDATE profiles SET vip_level = p_vip_level WHERE id = v_user_id;
  
  -- Deduct from wallet
  UPDATE wallets SET balance = balance - p_total_price WHERE user_id = v_user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.purchase_vip TO authenticated;