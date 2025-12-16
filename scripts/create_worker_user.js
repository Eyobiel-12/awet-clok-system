/**
 * Script to create a worker user account
 * Run with: node scripts/create_worker_user.js
 */

const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ltqrnbehaultyndnmjcl.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc3NjE3MiwiZXhwIjoyMDgxMzUyMTcyfQ.yrJrrroVQEW5mjJwyBNvKzSque3FWHlA3uS2MC9NnIQ"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createWorkerUser(email, password, name) {
  try {
    console.log(`Creating worker user: ${email}...`)

    // Create the user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name,
        role: "worker",
      },
    })

    if (authError) {
      if (authError.code === "email_exists" || authError.message.includes("already registered") || authError.message.includes("already exists")) {
        console.log(`User ${email} already exists. Updating profile to worker role...`)
        
        // Get the existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) {
          console.error("Error listing users:", listError)
          return { success: false, error: listError.message }
        }
        
        const existingUser = existingUsers?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
        
        if (existingUser) {
          // Update user metadata
          const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              name: name,
              role: "worker",
            },
          })

          if (updateError) {
            console.log("Note: Could not update user metadata:", updateError.message)
          }

          // Update password if needed
          try {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              password: password,
            })
            console.log("✓ Password updated")
          } catch (pwdError) {
            console.log("Note: Could not update password:", pwdError.message)
          }

          // Ensure profile exists with worker role
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: existingUser.id,
                name: name,
                role: "worker",
              },
              { onConflict: "id" }
            )

          if (profileError) {
            console.error("Error updating profile:", profileError)
            return { success: false, error: profileError.message }
          }

          console.log(`✓ User ${email} updated to worker role`)
          return { success: true, userId: existingUser.id }
        } else {
          return { success: false, error: "User exists but could not be found" }
        }
      }
      console.error("Error creating user:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      console.error("Error: User was not created")
      return { success: false, error: "User creation failed" }
    }

    console.log(`✓ User ${email} created successfully`)
    console.log(`  User ID: ${authData.user.id}`)
    console.log(`  Email: ${authData.user.email}`)
    console.log(`  Role: worker`)

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !profile) {
      console.log("Profile not auto-created, creating manually...")
      const { error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          name: name,
          role: "worker",
        })

      if (createProfileError) {
        console.error("Error creating profile:", createProfileError)
      } else {
        console.log("✓ Profile created")
      }
    } else {
      console.log("✓ Profile verified")
    }

    return { success: true, userId: authData.user.id }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Main execution
const email = "Abigailfilmon@gmail.com"
const password = "password123"
const name = "Abigail Filmon"

createWorkerUser(email, password, name)
  .then((result) => {
    if (result.success) {
      console.log("\n✓ Worker account created successfully!")
      console.log(`\nLogin credentials:`)
      console.log(`  Email: ${email}`)
      console.log(`  Password: ${password}`)
      process.exit(0)
    } else {
      console.error(`\n✗ Failed to create account: ${result.error}`)
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
