import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './src/models/User.js'

dotenv.config()

async function createAdminUser() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required')
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@legal-aid.rw' })
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists')
      console.log('   Email: admin@legal-aid.rw')
      console.log('   Role:', existingAdmin.role)
      
      // Update to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin'
        await existingAdmin.save()
        console.log('✅ Updated user role to admin')
      }
    } else {
      // Create new admin user
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@legal-aid.rw',
        password: 'Admin@2024',
        district: 'Kigali',
        role: 'admin',
        language: 'en'
      })

      await admin.save()
      console.log('✅ Admin user created successfully!')
      console.log('\n📧 Login Credentials:')
      console.log('   Email: admin@legal-aid.rw')
      console.log('   Password: Admin@2024')
      console.log('\n⚠️  Please change the password after first login!')
    }

    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createAdminUser()
