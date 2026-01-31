-- Create admin bank accounts table
CREATE TABLE public.admin_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  ifsc_code TEXT,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_deposits INTEGER NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage bank accounts
CREATE POLICY "Admins can manage bank accounts"
ON public.admin_bank_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can view active bank accounts (for deposits)
CREATE POLICY "Authenticated users can view active bank accounts"
ON public.admin_bank_accounts
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_bank_accounts_updated_at
BEFORE UPDATE ON public.admin_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add assigned_bank_account_id column to transactions for tracking
ALTER TABLE public.transactions 
ADD COLUMN assigned_bank_account_id UUID REFERENCES public.admin_bank_accounts(id);

-- Enable realtime for bank accounts
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_bank_accounts;

-- Insert the two initial bank accounts
INSERT INTO public.admin_bank_accounts (bank_name, account_holder_name, account_number, ifsc_code, balance)
VALUES 
  ('IDBI Bank', 'Amit Dube', '1060104000245425', NULL, 167),
  ('Baroda UP Bank', 'Amit Dube', '56690100014538', NULL, 0);