import { useCustomer } from "@/lib/customer";
import { accountBalances } from "@/lib/banking";

export function useAccountBalances(ledgerBalance: number, accountNumber?: string) {
  const customer = useCustomer();
  return accountBalances(ledgerBalance, !accountNumber || accountNumber === customer.accountNumber ? customer.holdAmount : 0);
}