use anchor_lang::prelude::*;
use anchor_spl::{
    token,
    token::{Token, Burn, Mint},
};
use std::mem::size_of;

declare_id!("VoTe1xTNu9TrjAkRtigwACepUN94d2tfSyL23opuFGy");

#[program]
pub mod ai_tremp_vote {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, token_pubkey: Pubkey) -> Result<()> {
        let voting_account = &mut ctx.accounts.votes_storage_account;
        voting_account.token_mint_pubkey = token_pubkey;
        voting_account.total_votes_a = 0;
        voting_account.total_votes_b = 0;
        Ok(())
    }


    pub fn vote_for_a(ctx: Context<Vote>, amount: u64) -> Result<()> {
        require!(amount > 0 && amount < ctx.accounts.mint.supply, BurnError::InvalidAmount);
        require!(ctx.accounts.mint.key() == ctx.accounts.votes_storage_account.token_mint_pubkey, BurnError::InvalidToken);

        // Burn the tokens
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        // Update votes
        let votes_storage_account = &mut ctx.accounts.votes_storage_account;
        votes_storage_account.total_votes_a += amount;
        Ok(())
    }

    pub fn vote_for_b(ctx: Context<Vote>, amount: u64) -> Result<()> {
        require!(amount > 0 && amount < ctx.accounts.mint.supply, BurnError::InvalidAmount);
        require!(ctx.accounts.mint.key() == ctx.accounts.votes_storage_account.token_mint_pubkey, BurnError::InvalidToken);

        // Burn the tokens
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        // Update votes
        let votes_storage_account = &mut ctx.accounts.votes_storage_account;
        votes_storage_account.total_votes_b += amount;
        Ok(())
    }

}

#[account]
pub struct VotesStorageAccount {
    pub token_mint_pubkey: Pubkey,
    pub total_votes_a: u64,
    pub total_votes_b: u64,
}

// accounts
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = size_of::<VotesStorageAccount>() + 8, seeds = [], bump)]
    pub votes_storage_account: Account<'info, VotesStorageAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    #[account(mut)] /// CHECK: This is safe because we are burning the tokens
    pub from: AccountInfo<'info>, 
    pub authority: Signer<'info>,
    #[account(mut)]
    pub votes_storage_account: Account<'info, VotesStorageAccount>,
}

#[derive(Accounts)]
pub struct GetVote<'info> {
    #[account()]
    pub votes_storage_account: Account<'info, VotesStorageAccount>,
}

#[error_code] 
pub enum BurnError {
    #[msg("Must burn > 0 tokens and less than total supply.")]
    InvalidAmount,
    #[msg("Invalid token mint for this user account")]
    InvalidToken
}