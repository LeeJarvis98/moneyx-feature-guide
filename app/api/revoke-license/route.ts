import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Revoke license API - Updates account status to unlicensed in Supabase
 * Note: Records are NOT deleted to maintain history and allow future re-licensing
 */
export async function POST(request: NextRequest) {
  try {
    const { accountIds, email } = await request.json();
    console.log('[REVOKE] Received account IDs to revoke:', accountIds, 'for email:', email);

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Account IDs array is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    try {
      // Initialize Supabase client
      const supabase = getSupabaseClient();

      // === UPDATE SUPABASE STATUS TO 'UNLICENSED' ===
      console.log('[REVOKE] Updating Supabase status to unlicensed...');
      const { error: updateError } = await supabase
        .from('licensed_accounts')
        .update({ licensed_status: 'unlicensed' })
        .in('account_id', accountIds);

      if (updateError) {
        console.error('[REVOKE] Error updating Supabase status:', updateError);
      } else {
        console.log('[REVOKE] Successfully updated', accountIds.length, 'accounts to unlicensed status');
      }

      return NextResponse.json({
        success: true,
        message: 'Licenses revoked successfully in Supabase',
        updatedCount: accountIds.length,
      });

    } catch (error) {
      console.error('[REVOKE] Error during revoke operation:', error);
      throw error;
    }

  } catch (error) {
    console.error('[REVOKE] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
