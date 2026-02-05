-- Update handle_new_user function to process referred_by from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_referral_code TEXT;
  referrer_code TEXT;
  referrer_id UUID;
BEGIN
  -- Generate unique referral code
  LOOP
    new_referral_code := generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_referral_code);
  END LOOP;
  
  -- Get referred_by code from user metadata
  referrer_code := NEW.raw_user_meta_data->>'referred_by';
  
  -- Look up the referrer's user ID if a code was provided
  IF referrer_code IS NOT NULL AND referrer_code != '' THEN
    SELECT id INTO referrer_id FROM profiles WHERE referral_code = UPPER(referrer_code);
  END IF;
  
  -- Create profile with referred_by set to the referrer's code (not ID)
  INSERT INTO public.profiles (id, referral_code, name, referred_by)
  VALUES (
    NEW.id, 
    new_referral_code, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Player'),
    CASE WHEN referrer_id IS NOT NULL THEN UPPER(referrer_code) ELSE NULL END
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create referral record if we found a valid referrer
  IF referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, bonus, bonus_claimed, referred_deposited)
    VALUES (referrer_id, NEW.id, 0, false, false);
  END IF;
  
  RETURN NEW;
END;
$function$;