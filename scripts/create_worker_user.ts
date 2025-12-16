/**
 * Script to create a worker user account
 * Run with: npx tsx scripts/create_worker_user.ts
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { resolve } from "path"

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc3NjE3MiwiZXhwIjoyMDgxMzUyMTcyfQ.yrJrrroVQEW5mjJwyBNvKzSque3FWHlA3uS2MC9NnIQ"

if (!SUPABASE_URL) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL must be set")
  process.exit(1)
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY must be set")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createWorkerUser(email: string, password: string, name: string) {
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
      if (authError.message.includes("already registered")) {
        console.log(`User ${email} already exists. Updating profile to worker role...`)
        
        // Get the existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
        
        if (existingUser) {
          // Update user metadata
          await supabase.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              name: name,
              role: "worker",
            },
          })

          // Ensure profile exists with worker role
          const { error: profileError } = await supabase.rpc("create_user_profile", {
            user_id: existingUser.id,
            user_name: name,
            user_role: "worker",
          })

          if (profileError) {
            // If RPC fails, try direct insert/update
            const { error: upsertError } = await supabase
              .from("profiles")
              .upsert(
                {
                  id: existingUser.id,
                  name: name,
                  role: "worker",
                },
                { onConflict: "id" }
              )

            if (upsertError) {
              console.error("Error updating profile:", upsertError)
              return { success: false, error: upsertError.message }
            }
          }

          console.log(`✓ User ${email} updated to worker role`)
          return { success: true, userId: existingUser.id }
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

