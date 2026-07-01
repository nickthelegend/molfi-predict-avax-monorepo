/**
 * Move call targets user wallets may invoke under Enoki gas sponsorship.
 * Keep in sync with Enoki Developer Portal → Sponsored transactions allow list.
 */
export function userEnokiAllowedMoveCallTargets(
  packageId: string,
  predictPackageId: string,
): string[] {
  const targets: string[] = [];

  if (packageId) {
    const leverx = [
      "leverage_vault::deposit_liquidity",
      "leverage_vault::withdraw_liquidity",
      "trade::create_user_proxy",
      "trade::deposit_quote",
      "trade::withdraw_quote",
      "trade::place_binary_limit_mint_order",
      "trade::place_range_limit_mint_order",
      "trade::cancel_binary_limit_mint_order",
      "trade::cancel_range_limit_mint_order",
      "trade::deleverage_binary_account_balance",
      "trade::deleverage_range_account_balance",
      "trade::register_executor_entry",
      "trade::revoke_executor_entry",
      "triggers::set_automated_triggers_entry",
      "triggers::set_range_triggers",
      "triggers::clear_automated_triggers",
      "triggers::clear_range_triggers",
    ];
    for (const t of leverx) targets.push(`${packageId}::${t}`);
  }

  if (predictPackageId) {
    for (const t of ["range_key::new", "market_key::up", "market_key::down"]) {
      targets.push(`${predictPackageId}::${t}`);
    }
  }

  return targets;
}
