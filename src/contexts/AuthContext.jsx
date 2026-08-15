import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined)
  // undefined = not yet checked
  // null = checked, not logged in
  // object = checked, logged in

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Check localStorage for existing session first
    // This is instant — no network call
    const existingSession = supabase.auth.getSession()

    const init = async () => {
      try {
        const { data: { session } } = await existingSession

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          // Fetch profile in background — dont await here
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false)
          })
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth init error:', err)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    init()

    // Hard timeout — never block UI more than 3 seconds
    const hardTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
        setUser(prev => prev === undefined ? null : prev)
      }
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          fetchProfile(session.user.id)
          setLoading(false)
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }

        if (event === 'INITIAL_SESSION') {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(hardTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setProfile(data)
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    })
    return { data, error }
  }

  const signUpWithEmail = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    localStorage.clear()
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    
    if (data) setProfile(data)
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      updateProfile,
      fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}
