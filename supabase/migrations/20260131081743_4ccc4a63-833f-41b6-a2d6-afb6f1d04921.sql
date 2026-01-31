-- Create UPI accounts table for admin management
CREATE TABLE public.admin_upi_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upi_id TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  qr_code_url TEXT,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_upi_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can manage UPI accounts
CREATE POLICY "Admins can manage UPI accounts"
  ON public.admin_upi_accounts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can view active UPI accounts
CREATE POLICY "Authenticated users can view active UPI accounts"
  ON public.admin_upi_accounts
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Add assigned_upi_account_id to transactions table
ALTER TABLE public.transactions
ADD COLUMN assigned_upi_account_id UUID REFERENCES public.admin_upi_accounts(id);

-- Create function to increment UPI transactions
CREATE OR REPLACE FUNCTION public.increment_upi_transactions(account_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_upi_accounts
  SET total_transactions = total_transactions + 1
  WHERE id = account_id;
END;
$$;

-- Update IDBI bank account with IFSC code
UPDATE public.admin_bank_accounts
SET ifsc_code = 'IBKL0001060'
WHERE bank_name = 'IDBI Bank';