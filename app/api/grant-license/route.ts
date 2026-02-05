import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { accountIds, email, clientUid, userId, platform, referralId } = await request.json();
    console.log('[GRANT] Received account IDs to license:', accountIds, 'for email:', email, 'UID:', clientUid, 'User ID:', userId, 'Platform:', platform, 'Referral ID:', referralId);

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

    if (!clientUid) {
      return NextResponse.json(
        { success: false, error: 'Client UID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    if (!referralId) {
      return NextResponse.json(
        { success: false, error: 'Referral ID is required' },
        { status: 400 }
      );
    }

    try {
      // Initialize Supabase client
      const supabase = getSupabaseClient();

      console.log('[GRANT] Writing licenses to Supabase...');

      // Format timestamp as ISO string
      const timestamp = new Date().toISOString();

      // === LOOK UP PARTNER ID FROM REFERRAL ID ===
      console.log('[GRANT] Looking up partner ID from referral ID:', referralId);
      const { data: referralData, error: referralError } = await supabase
        .from('own_referral_id_list')
        .select('id')
        .eq('own_referral_id', referralId)
        .maybeSingle();

      if (referralError) {
        console.error('[GRANT] Error looking up partner ID:', referralError);
        throw new Error('Failed to look up partner ID from referral ID');
      }

      if (!referralData || !referralData.id) {
        console.error('[GRANT] No partner found for referral ID:', referralId);
        return NextResponse.json(
          { success: false, error: 'Invalid referral ID. Partner not found.' },
          { status: 404 }
        );
      }

      const partnerId = referralData.id;
      console.log('[GRANT] Found partner ID:', partnerId, 'for referral ID:', referralId);

      // === UPDATE ACCOUNTS STATUS TO 'LICENSED' IN SUPABASE ===
      // All accounts should already exist from the check-email step
      // We only need to update their licensed_status to 'licensed'
      console.log('[GRANT] Updating', accountIds.length, 'accounts to licensed status in Supabase...');
      
      const { data: updatedAccounts, error: updateError } = await supabase
        .from('licensed_accounts')
        .update({ 
          licensed_status: 'licensed',
          licensed_date: timestamp,
          owner: userId // Update owner to current user
        })
        .in('account_id', accountIds)
        .eq('email', email)
        .select();

      if (updateError) {
        console.error('[GRANT] Error updating accounts status:', updateError);
        throw updateError;
      }

      const updatedCount = updatedAccounts?.length || 0;
      console.log('[GRANT] Successfully updated', updatedCount, 'accounts to licensed status');
      
      // If some accounts weren't found (shouldn't happen), log a warning
      if (updatedCount < accountIds.length) {
        console.warn('[GRANT] Warning: Only', updatedCount, 'of', accountIds.length, 'accounts were updated');
        console.warn('[GRANT] This might indicate that some accounts were not inserted during email verification');
      }

      return NextResponse.json({
        success: true,
        data: {
          updatedRows: updatedCount,
          totalAccounts: accountIds.length,
          updatedAccounts: updatedCount,
          records: updatedAccounts || [],
        },
      });

    } catch (apiError: any) {
      console.error('[GRANT] Error:', apiError);
      console.error('[GRANT] Error details:', {
        message: apiError.message,
        code: apiError.code,
        details: apiError.details,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: apiError.message || 'Failed to grant license',
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[GRANT] Server Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to grant license',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
