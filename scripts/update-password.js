const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updatePassword() {
  try {
    // Generate hash for password "12345678"
    const newPasswordHash = await bcrypt.hash('12345678', 10)

    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: {
        email: 'smeet@bigcircle.tech'
      },
      data: {
        password: newPasswordHash
      }
    })

    console.log('✅ Password updated successfully for:', updatedUser.email)
    console.log('New password: 12345678')
    console.log('You can now login with this password')

  } catch (error) {
    console.error('❌ Error updating password:', error.message)
    if (error.code === 'P2025') {
      console.log('User with email smeet@bigcircle.tech not found in database')
    }
  } finally {
    await prisma.$disconnect()
  }
}

updatePassword()