import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Get credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin'; // Change this!
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    // Validate credentials
    if (username !== adminUsername) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // For first-time setup, hash the password
    // In production, store hashed passwords
    const passwordMatch = password === adminPassword;

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      token,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}