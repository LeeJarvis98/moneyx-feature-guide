import { NextRequest, NextResponse } from 'next/server';

const EXNESS_API_BASE = 'https://my.exnessaffiliates.com';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, method = 'GET', token, data } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`,
      },
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(`${EXNESS_API_BASE}${endpoint}`, fetchOptions);

    // Handle 204 No Content
    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Request failed', message: responseData.message },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Exness partner API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const fullUrl = `${EXNESS_API_BASE}${endpoint}`;
    console.log('[EXNESS API] Requesting:', fullUrl);
    console.log('[EXNESS API] Endpoint param received:', endpoint);
    console.log('[EXNESS API] Token present:', !!token);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`,
      },
    });

    console.log('[EXNESS API] Response status:', response.status);
    console.log('[EXNESS API] Response content-type:', response.headers.get('content-type'));

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[EXNESS API] Non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid response from Exness API', message: 'Expected JSON but received HTML. The endpoint may not exist.' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Request failed', message: data.message },
        { status: response.status }
      );
    }

    console.log('[EXNESS API] Checking endpoint for commission calculation. Endpoint:', endpoint);
    console.log('[EXNESS API] Endpoint includes check:', endpoint.includes('/api/reports/clients/accounts/'));

    // If this is a client accounts report, add commission calculations
    if (endpoint.includes('/api/reports/clients/accounts/')) {
      const TRADI_COMMISSION_PERCENTAGE = 10; // 10% for Tradi
      
      console.log('[EXNESS API] Processing client accounts report for commission calculations');
      console.log('[EXNESS API] Data structure:', JSON.stringify(data).substring(0, 200));
      console.log('[EXNESS API] Data has data array:', !!data.data);
      console.log('[EXNESS API] Data has totals:', !!data.totals);
      console.log('[EXNESS API] Totals object:', data.totals);
      
      if (data.data && Array.isArray(data.data)) {
        data.data = data.data.map((account: any) => {
          // Convert to number in case it's a string
          const rewardUsd = Number(account.reward_usd);
          const tradiCommission = rewardUsd * (TRADI_COMMISSION_PERCENTAGE / 100);
          const partnerCommission = rewardUsd - tradiCommission;
          
          return {
            ...account,
            tradi_commission: tradiCommission,
            partner_commission: partnerCommission,
          };
        });
        
        // Also update totals if present
        if (data.totals && data.totals.reward_usd !== undefined) {
          // Convert to number in case it's a string
          const totalRewardUsd = Number(data.totals.reward_usd);
          const totalTradiCommission = totalRewardUsd * (TRADI_COMMISSION_PERCENTAGE / 100);
          const totalPartnerCommission = totalRewardUsd - totalTradiCommission;
          
          console.log('[EXNESS API] Total Reward USD:', data.totals.reward_usd, 'Type:', typeof data.totals.reward_usd);
          console.log('[EXNESS API] Converted Total Reward USD:', totalRewardUsd);
          console.log('[EXNESS API] Calculated Total Tradi Commission:', totalTradiCommission);
          console.log('[EXNESS API] Calculated Total Partner Commission:', totalPartnerCommission);
          
          data.totals = {
            ...data.totals,
            tradi_commission: totalTradiCommission,
            partner_commission: totalPartnerCommission,
          };
          
          console.log('[EXNESS API] Updated totals:', data.totals);
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Exness partner API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
