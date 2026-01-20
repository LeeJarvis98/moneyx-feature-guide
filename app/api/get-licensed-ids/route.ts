import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterEmail = searchParams.get('email'); // Optional email filter
    
    console.log('[GET-LICENSED-IDS] Fetching licensed account IDs from Google Sheets...');
    if (filterEmail) {
      console.log('[GET-LICENSED-IDS] Filtering by email:', filterEmail);
    }

    try {
      // Initialize Supabase client
      const supabase = getSupabaseClient();

      console.log('[GET-LICENSED-IDS] Fetching licensed account IDs from database...');
      if (filterEmail) {
        console.log('[GET-LICENSED-IDS] Filtering by email:', filterEmail);
      }

      // Build query
      let query = supabase
        .from('licensed_accounts')
        .select('email, uid, account_id, licensed_date')
        .order('licensed_date', { ascending: false });

      // Filter by email if provided
      if (filterEmail) {
        query = query.ilike('email', filterEmail);
      }

      const { data: licensedAccounts, error: queryError } = await query;

      if (queryError) {
        console.error('[GET-LICENSED-IDS] Database error:', queryError);
        throw queryError;
      }

      console.log('[GET-LICENSED-IDS] Found', licensedAccounts?.length || 0, 'accounts');

      // Transform data
      const accountDetails = (licensedAccounts || []).map((account) => ({
        email: account.email,
        uid: account.uid,
        accountId: account.account_id,
        timestamp: account.licensed_date,
      }));

      // Return just the account IDs array for filtering
      const accountIds = accountDetails.map((account) => account.accountId);

      console.log('[GET-LICENSED-IDS] Returning', accountIds.length, 'licensed account IDs');

      return NextResponse.json({
        success: true,
        data: accountIds,
        details: accountDetails, // Include full details with timestamps
      });

    } catch (apiError: any) {
      console.error('[GET-LICENSED-IDS] Database Error:', apiError);
      console.error('[GET-LICENSED-IDS] Error details:', {
        message: apiError.message,
        code: apiError.code,
        details: apiError.details,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: apiError.message || 'Failed to read from database',
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[GET-LICENSED-IDS] Server Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
