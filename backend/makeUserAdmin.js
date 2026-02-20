import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './src/models/User.js'

dotenv.config()

const userEmail = process.argv[2]

if (!userEmail) {
  console.error('❌ Please provide user email as argument')
  console.error('   Usage: node makeUserAdmin.js user@example.com')
  process.exit(1)
}

async function makeUserAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    const user = await User.findOne({ email: userEmail })
    
    if (!user) {
      console.error(`❌ User with email ${userEmail} not found`)
      process.exit(1)
    }

    if (user.role === 'admin') {
      console.log(`ℹ️  User ${user.name} (${userEmail}) is already an admin`)
    } else {
      user.role = 'admin'
      await user.save()
      console.log(`✅ User ${user.name} (${userEmail}) upgraded to admin!`)
      console.log('\n🔄 Please logout and login again to see admin features')
    }

    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

makeUserAdmin()
