use anchor_lang::prelude::*;

declare_id!("HsLWrDBvv7LT5cjj879Th7HKsPme7MF3XMNYxCMKExsz");

#[program]
pub mod rps_staking {
    use super::*;

    pub fn create_game(ctx: Context<CreateGame>, stake_amount: u64, dev_wallet: Pubkey)-> Result<()>{
        let game = &mut ctx.accounts.game;
        game.player1 = ctx.accounts.player1.key();
        game.player2 = Pubkey::default();
        game.stake_amount = stake_amount;
        game.dev_wallet = dev_wallet;
        game.is_finished = false;
        game.winner = None;
        game.bump = ctx.bumps.game;
        // Transfer stake from player1 to game PDA
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player1.key(),
            &ctx.accounts.game.key(),
            stake_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.player1.to_account_info(),
                ctx.accounts.game.to_account_info(),
            ],
        )?;
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>, _stake_amount: u64)-> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.player2 == Pubkey::default(), ErrorCode::GameAlreadyStarted);
        game.player2 = ctx.accounts.player2.key();
        // Transfer stake from player2 to game PDA
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player2.key(),
            &game.key(),
            game.stake_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.player2.to_account_info(),
                game.to_account_info(),
            ],
        )?;
        Ok(())
    }

    pub fn declare_winner(ctx: Context<DeclareWinner>, winner: Pubkey) -> Result<()> {
        // Get all keys and account infos before mutable borrow
        let game_key = ctx.accounts.game.key();
        let game_bump = ctx.accounts.game.bump;
        let winner_key = ctx.accounts.winner.key();
        let dev_key = ctx.accounts.dev_wallet.key();
        let player1_key = ctx.accounts.game.player1;
        let game_account_info = ctx.accounts.game.to_account_info();
        let winner_account_info = ctx.accounts.winner.to_account_info();
        let dev_account_info = ctx.accounts.dev_wallet.to_account_info();
        let seeds = &[b"game", player1_key.as_ref(), &[game_bump]];
        // Now mutably borrow game
        let game = &mut ctx.accounts.game;
        // Only player1 or player2 can call
        let signer = ctx.accounts.signer.key();
        require!(signer == game.player1 || signer == game.player2, ErrorCode::NotAPlayer);
        // Both players must be set
        require!(game.player1 != Pubkey::default() && game.player2 != Pubkey::default(), ErrorCode::GameNotReady);
        // Not already finished
        require!(!game.is_finished, ErrorCode::GameAlreadyFinished);
        // Winner must be one of the players
        require!(winner == game.player1 || winner == game.player2, ErrorCode::InvalidWinner);
        // Calculate payouts
        let total = game.stake_amount.checked_mul(2).ok_or(ErrorCode::MathError)?;
        let winner_amount = total.checked_mul(90).ok_or(ErrorCode::MathError)?.checked_div(100).ok_or(ErrorCode::MathError)?;
        let dev_amount = total.checked_sub(winner_amount).ok_or(ErrorCode::MathError)?;
        // Transfer to winner
        let winner_ix = anchor_lang::solana_program::system_instruction::transfer(
            &game_key,
            &winner_key,
            winner_amount,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &winner_ix,
            &[game_account_info.clone(), winner_account_info.clone()],
            &[seeds],
        )?;
        // Transfer to dev
        let dev_ix = anchor_lang::solana_program::system_instruction::transfer(
            &game_key,
            &dev_key,
            dev_amount,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &dev_ix,
            &[game_account_info, dev_account_info],
            &[seeds],
        )?;
        // Update state
        game.is_finished = true;
        game.winner = Some(winner);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateGame<'info> {
    #[account(mut)]
    pub player1: Signer<'info>,
    #[account(init, space = 8+ Game::INIT_SPACE, payer = player1, seeds = [b"game", player1.key().as_ref()],
    bump,)]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
#[instruction()]
pub struct JoinGame<'info>{

    #[account(mut)]
    pub player2: Signer<'info>,
    #[account( mut,
        seeds = [b"game", game.player1.key().as_ref()],
        bump = game.bump,
    )]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
pub struct DeclareWinner<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game", game.player1.key().as_ref()],
        bump = game.bump,
        constraint = !game.is_finished @ ErrorCode::GameAlreadyFinished,
    )]
    pub game: Account<'info, Game>,

    /// CHECK: winner can be any pubkey, we will validate inside logic
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    #[account(mut, address = game.dev_wallet)]
    pub dev_wallet: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Game{
    pub player1: Pubkey,
    pub player2: Pubkey, 
    pub stake_amount: u64,
    pub winner: Option<Pubkey>,
    pub dev_wallet: Pubkey,
    pub is_finished: bool,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Game is already finished.")]
    GameAlreadyFinished,
    #[msg("Only a player can call this function.")]
    NotAPlayer,
    #[msg("Both players must join before declaring a winner.")]
    GameNotReady,
    #[msg("Invalid winner pubkey.")]
    InvalidWinner,
    #[msg("Math error.")]
    MathError,
    #[msg("Game already started.")]
    GameAlreadyStarted,
}