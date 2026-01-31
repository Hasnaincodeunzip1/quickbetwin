-- Drop the insecure policy that allows any authenticated user to view bank accounts
DROP POLICY IF EXISTS "Authenticated users can view active bank accounts" ON public.admin_bank_accounts;

-- Create a new policy that only allows admins to view bank accounts
CREATE POLICY "Only admins can view bank accounts" 
ON public.admin_bank_accounts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));