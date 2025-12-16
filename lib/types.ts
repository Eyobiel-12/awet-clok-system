export interface Profile {
  id: string
  name: string
  role: "worker" | "admin"
  avatar_url?: string | null
  banned?: boolean
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  lat: number
  lng: number
  radius_m: number
}

export interface Shift {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  lat: number | null
  lng: number | null
  duration_minutes: number | null
  created_at: string
  profiles?: Profile
}
