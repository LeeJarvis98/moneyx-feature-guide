import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import type { User } from '@/types/database';

interface UserSignupData {
  id: string;
  email: string;
  password: string;
}

// Validation helper functions
function validateId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }

  if (id.length < 4) {
    return { valid: false, error: 'ID must be at least 4 characters long' };
  }

  if (id.length > 50) {
    return { valid: false, error: 'ID must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(id)) {
    return { valid: false, error: 'ID can only contain letters and numbers' };
  }

  return { valid: true };
}

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const data: UserSignupData = await request.json();
    console.log('[USER-SIGNUP] Received signup data:', {
      id: data.id,
      email: data.email,
    });

    // Validate ID
    const idValidation = validateId(data.id);
    if (!idValidation.valid) {
      console.error('[USER-SIGNUP] ID validation failed:', idValidation.error);
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }

    // Validate Email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      console.error('[USER-SIGNUP] Email validation failed:', emailValidation.error);
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate Password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      console.error('[USER-SIGNUP] Password validation failed:', passwordValidation.error);
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    console.log('[USER-SIGNUP] Initializing Supabase client...');
    const supabase = getSupabaseClient();

    // BACKEND VALIDATION: Double-check ID availability
    console.log('[USER-SIGNUP] Double-checking ID availability...');
    const { data: existingId, error: idCheckError } = await supabase
      .from('users')
      .select('id')
      .ilike('id', data.id)
      .maybeSingle();

    if (idCheckError) {
      console.error('[USER-SIGNUP] Error checking ID:', idCheckError);
      throw idCheckError;
    }

    if (existingId) {
      console.error('[USER-SIGNUP] ID already exists:', data.id);
      return NextResponse.json(
        { error: 'ID này đã được sử dụng. Vui lòng chọn ID khác.' },
        { status: 409 }
      );
    }

    // BACKEND VALIDATION: Double-check Email availability
    console.log('[USER-SIGNUP] Double-checking Email availability...');
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('email')
      .ilike('email', data.email)
      .maybeSingle();

    if (emailCheckError) {
      console.error('[USER-SIGNUP] Error checking email:', emailCheckError);
      throw emailCheckError;
    }

    if (existingEmail) {
      console.error('[USER-SIGNUP] Email already exists:', data.email);
      return NextResponse.json(
        { error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.' },
        { status: 409 }
      );
    }

    console.log('[USER-SIGNUP] All validations passed. Proceeding with registration...');

    // Insert new user into database
    const insertData = {
      id: data.id,
      email: data.email,
      password: data.password,
      status: 'active' as const,
      partner_rank: '',
    };
    
    const { data: newUser, error: insertError } = (await (supabase as any)
      .from('users')
      .insert(insertData)
      .select()
      .single()) as { data: User | null; error: any };

    if (insertError) {
      console.error('[USER-SIGNUP] Error inserting user:', insertError);
      throw insertError;
    }

    if (!newUser) {
      throw new Error('Failed to create user - no data returned');
    }

    console.log('[USER-SIGNUP] Successfully registered user:', newUser.id);

    return NextResponse.json(
      { success: true, message: 'Registration successful', id: data.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('[USER-SIGNUP] Error during signup:', error);
    if (error instanceof Error) {
      console.error('[USER-SIGNUP] Error message:', error.message);
      console.error('[USER-SIGNUP] Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to register. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
