#!/usr/bin/env node

/**
 * Simple Password Change Script for Development
 * Usage: node scripts/change-password.js <email> <new-password>
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function changePassword(email, newPassword) {
  try {
    console.log('🔐 Changing password for:', email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error('❌ User not found with email:', email);
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log('✅ Password changed successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New password:', newPassword);
    console.log('\n✨ You can now login with the new password!');

  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node scripts/change-password.js <email> <new-password>');
  console.log('Example: node scripts/change-password.js user@example.com newpass123');
  process.exit(1);
}

changePassword(email, newPassword);
