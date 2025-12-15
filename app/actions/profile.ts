"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getOrCreateProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Not authenticated", profile: null }
  }

  // Try to get existing profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // If profile exists, return it
  if (profile) {
    return { error: null, profile }
  }

  // If profile doesn't exist, create it using the database function
  if (profileError || !profile) {
    const { data: newProfile, error: createError } = await supabase.rpc("create_user_profile", {
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      user_role: user.user_metadata?.role || "worker",
    })

    if (createError || !newProfile) {
      return {
        error: `Failed to create profile: ${JSON.stringify(createError)}`,
        profile: null,
      }
    }

    return { error: null, profile: newProfile }
  }

  return { error: "Unknown error", profile: null }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Not authenticated", success: false }
  }

  const name = formData.get("name") as string
  const avatarFile = formData.get("avatar") as File | null

  // Validate name
  if (!name || name.trim().length === 0) {
    return { error: "Naam is verplicht", success: false }
  }

  if (name.length > 100) {
    return { error: "Naam is te lang (max 100 karakters)", success: false }
  }

  let avatarUrl: string | null = null

  // Handle avatar upload if provided
  if (avatarFile && avatarFile.size > 0) {
    // Validate file type
    if (!avatarFile.type.startsWith("image/")) {
      return { error: "Alleen afbeeldingen zijn toegestaan", success: false }
    }

    // Validate file size (max 5MB)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return { error: "Afbeelding is te groot (max 5MB)", success: false }
    }

    // Upload to Supabase Storage
    const fileExt = avatarFile.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = fileName

    // Delete old avatar if exists
    const { data: oldFiles } = await supabase.storage.from("avatars").list("", {
      search: user.id,
    })
    if (oldFiles && oldFiles.length > 0) {
      const oldFileNames = oldFiles.map((f) => f.name).filter((n) => n.startsWith(user.id))
      if (oldFileNames.length > 0) {
        await supabase.storage.from("avatars").remove(oldFileNames)
      }
    }

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      return { error: `Upload mislukt: ${uploadError.message}`, success: false }
    }

    // Get public URL - use the filePath directly
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    avatarUrl = publicUrl
    
    // Ensure the URL is properly formatted
    if (!avatarUrl) {
      return { error: "Kon public URL niet genereren", success: false }
    }
  }

  // Update profile
  const updateData: { name: string; avatar_url?: string | null } = { name: name.trim() }
  if (avatarUrl !== null) {
    updateData.avatar_url = avatarUrl
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)

  if (updateError) {
    return { error: `Update mislukt: ${updateError.message}`, success: false }
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard")
  return { error: null, success: true }
}
