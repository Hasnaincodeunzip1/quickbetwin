-- Drop the insecure policy that allows any authenticated user to view UPI accounts
DROP POLICY IF EXISTS "Authenticated users can view active UPI accounts" ON public.admin_upi_accounts;

-- Create a new policy that only allows admins to view UPI accounts
CREATE POLICY "Only admins can view UPI accounts" 
ON public.admin_upi_accounts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));