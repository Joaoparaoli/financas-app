import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const DEFAULT_PROFILES = [
  { id: 'profile-1', name: 'Perfil 1', photo: null },
  { id: 'profile-2', name: 'Perfil 2', photo: null },
  { id: 'profile-3', name: 'Perfil 3', photo: null },
  { id: 'profile-4', name: 'Perfil 4', photo: null },
  { id: 'profile-5', name: 'Perfil 5', photo: null },
]

const STORAGE_KEY = 'financas-profile-state'

const ProfileContext = createContext({
  profiles: DEFAULT_PROFILES,
  selectedProfileId: DEFAULT_PROFILES[0].id,
  selectProfile: () => {},
  updateProfile: () => {},
})

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES)
  const [selectedProfileId, setSelectedProfileId] = useState(DEFAULT_PROFILES[0].id)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.profiles?.length) setProfiles(parsed.profiles)
        if (parsed?.selectedProfileId) setSelectedProfileId(parsed.selectedProfileId)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profiles, selectedProfileId })
      )
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

  const value = useMemo(
    () => ({ profiles, selectedProfileId, selectProfile, updateProfile }),
    [profiles, selectedProfileId, selectProfile, updateProfile]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  return useContext(ProfileContext)
}
