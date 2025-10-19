# 🔧 Development Scripts

## Change Password Script

Simple script to change user passwords directly in the database for development purposes.

### Usage

**Method 1: Using npm script (Recommended)**
```bash
npm run change-password <email> <new-password>
```

**Method 2: Direct execution**
```bash
node scripts/change-password.js <email> <new-password>
```

### Examples

```bash
# Change password for user@example.com
npm run change-password user@example.com newpassword123

# Change password for admin
npm run change-password admin@workledger.com admin123
```

### Output

```
🔐 Changing password for: user@example.com
✅ Password changed successfully!
📧 Email: user@example.com
🔑 New password: newpassword123

✨ You can now login with the new password!
```

### Notes

- ⚠️ **Development only!** Do not use in production.
- Password is automatically hashed using bcrypt before storing
- User must already exist in the database
- Requires database to be running

### Troubleshooting

**Error: User not found**
- Check if the email exists in the database
- Use `npm run db:studio` to view all users

**Error: Cannot connect to database**
- Make sure Docker is running: `npm run docker:up`
- Check your `.env` file has correct `DATABASE_URL`
