-- Create VIP level enum
CREATE TYPE public.vip_level AS ENUM ('none', 'bronze', 'silver', 'gold', 'platinum', 'diamond');

-- Create VIP purchases table to track all purchases
CREATE TABLE public.vip_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vip_level vip_level NOT NULL,
  base_price NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL,
  total_paid NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add VIP level to profiles
ALTER TABLE public.profiles ADD COLUMN vip_level vip_level NOT NULL DEFAULT 'none';

-- Update referrals table to track if referred user deposited
ALTER TABLE public.referrals ADD COLUMN referred_deposited BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.referrals ADD COLUMN bonus_claimed BOOLEAN NOT NULL DEFAULT false;

-- Create lottery draws table for admin-controlled lotteries
CREATE TABLE public.lottery_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vip_level vip_level NOT NULL,
  prize_amount NUMERIC NOT NULL,
  winner_user_id UUID REFERENCES auth.users(id),
  winner_ticket_id UUID REFERENCES lottery_tickets(id),
  status TEXT NOT NULL DEFAULT 'pending',
  draw_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vip_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

-- VIP purchases policies
CREATE POLICY "Users can view their own VIP purchases"
ON public.vip_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own VIP purchases"
ON public.vip_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all VIP purchases"
ON public.vip_purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Lottery draws policies
CREATE POLICY "Anyone can view completed lottery draws"
ON public.lottery_draws FOR SELECT
USING (status = 'completed');

CREATE POLICY "Admins can manage lottery draws"
ON public.lottery_draws FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update lottery_tickets to include vip_level at time of earning
ALTER TABLE public.lottery_tickets ADD COLUMN vip_level vip_level NOT NULL DEFAULT 'bronze';

-- Create trigger for lottery_draws updated_at
CREATE TRIGGER update_lottery_draws_updated_at
BEFORE UPDATE ON public.lottery_draws
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for lottery_draws
ALTER PUBLICATION supabase_realtime ADD TABLE public.lottery_draws;