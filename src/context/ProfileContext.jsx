import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const DEFAULT_PROFILES = [
  { id: 'profile-1', name: 'Perfil 1', photo: null, active: true, pin: null },
  { id: 'profile-2', name: 'Perfil 2', photo: null, active: false, pin: null },
  { id: 'profile-3', name: 'Perfil 3', photo: null, active: false, pin: null },
  { id: 'profile-4', name: 'Perfil 4', photo: null, active: false, pin: null },
  { id: 'profile-5', name: 'Perfil 5', photo: null, active: false, pin: null },
]

const STORAGE_KEY = 'financas-profile-state'

const ProfileContext = createContext({
  profiles: DEFAULT_PROFILES,
  activeProfiles: DEFAULT_PROFILES.filter((p) => p.active),
  selectedProfileId: DEFAULT_PROFILES[0].id,
  selectProfile: () => {},
  updateProfile: () => {},
  uploadPhoto: async () => {},
})

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES)
  const [selectedProfileId, setSelectedProfileId] = useState(DEFAULT_PROFILES[0].id)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.profiles?.length) {
          // merge to ensure new fields exist on old saved profiles
          const merged = DEFAULT_PROFILES.map((def) => {
            const saved = parsed.profiles.find((p) => p.id === def.id)
            return saved ? { ...def, ...saved } : def
          })
          setProfiles(merged)
        }
        if (parsed?.selectedProfileId) setSelectedProfileId(parsed.selectedProfileId)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles, selectedProfileId }))
    } catch (e) {
      // ignore
    }
  }, [profiles, selectedProfileId])

  const selectProfile = useCallback((id) => {
    setSelectedProfileId(id)
  }, [])

  const updateProfile = useCallback((id, data) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }, [])

  // Reads a File object and stores as base64 in the profile photo field
  const uploadPhoto = useCallback((id, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, photo: base64 } : p)))
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  const activeProfiles = useMemo(() => profiles.filter((p) => p.active), [profiles])

  const value = useMemo(
    () => ({ profiles, activeProfiles, selectedProfileId, selectProfile, updateProfile, uploadPhoto }),
    [profiles, activeProfiles, selectedProfileId, selectProfile, updateProfile, uploadPhoto]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  return useContext(ProfileContext)
}
