import { useCallback, useEffect, useState } from 'react'
import type { ControlProfile } from '../core/controlProfiles'

// v2 intentionally invalidates note-level remaps created against the old C4-C5
// reference trainer. BM-OC-002 uses the physical C5-B5 digital-twin contract.
const STORAGE_KEY = 'blackmamba.ocarina.control-settings.v2'

type StoredControlSettings = {
  selectedProfileId: string
  customProfile: ControlProfile | null
}

const DEFAULT_SETTINGS: StoredControlSettings = {
  selectedProfileId: 'xbox-standard',
  customProfile: null,
}

function loadSettings(): StoredControlSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<StoredControlSettings>

    return {
      selectedProfileId: typeof parsed.selectedProfileId === 'string'
        ? parsed.selectedProfileId
        : DEFAULT_SETTINGS.selectedProfileId,
      customProfile: parsed.customProfile && Array.isArray(parsed.customProfile.bindings)
        ? parsed.customProfile
        : null,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function usePersistentControlSettings() {
  const [settings, setSettings] = useState<StoredControlSettings>(loadSettings)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // The instrument remains usable if storage is unavailable/private.
    }
  }, [settings])

  const setSelectedProfileId = useCallback((selectedProfileId: string) => {
    setSettings((current) => ({ ...current, selectedProfileId }))
  }, [])

  const saveCustomProfile = useCallback((customProfile: ControlProfile) => {
    setSettings({ selectedProfileId: customProfile.id, customProfile })
  }, [])

  const clearCustomProfile = useCallback(() => {
    setSettings((current) => ({
      selectedProfileId: current.selectedProfileId === 'custom-local' ? 'xbox-standard' : current.selectedProfileId,
      customProfile: null,
    }))
  }, [])

  return {
    selectedProfileId: settings.selectedProfileId,
    customProfile: settings.customProfile,
    setSelectedProfileId,
    saveCustomProfile,
    clearCustomProfile,
  }
}
