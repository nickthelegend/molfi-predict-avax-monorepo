#![cfg(test)]
use super::{Vault, VaultClient};
use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, Address, Env};

fn setup(env: &Env) -> (VaultClient<'_>, Address) {
    let admin = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let asset = sac.address();
    let id = env.register(Vault, (admin, asset.clone()));
    (VaultClient::new(env, &id), asset)
}

#[test]
fn deposit_accrue_appreciate_withdraw() {
    let env = Env::default();
    env.mock_all_auths();
    let (vault, asset) = setup(&env);
    let mint = StellarAssetClient::new(&env, &asset);

    let lp = Address::generate(&env);
    let trader = Address::generate(&env);
    mint.mint(&lp, &1_000_0000000);
    mint.mint(&trader, &100_0000000);

    // LP deposits 1,000 → 1,000 shares, owns 100% of the pool.
    let shares = vault.deposit(&lp, &1_000_0000000);
    assert_eq!(shares, 1_000_0000000);
    assert_eq!(vault.tvl(), 1_000_0000000);
    assert_eq!(vault.balance_of(&lp), 1_000_0000000);

    // Trading fees flow in → NAV rises, no new shares.
    vault.accrue_fee(&trader, &100_0000000);
    assert_eq!(vault.tvl(), 1_100_0000000);
    assert_eq!(vault.total_shares(), 1_000_0000000);
    assert_eq!(vault.balance_of(&lp), 1_100_0000000); // LP earned the fee

    // Withdraw everything → deposit + earned fees.
    let owed = vault.withdraw(&lp, &shares);
    assert_eq!(owed, 1_100_0000000);
    assert_eq!(vault.tvl(), 0);
}
