import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const useRoom = (roomId) => {
  const { user } = useAuth()
  const [room, setRoom] = useState(null)
  const [partner, setPartner] = useState(null)
  const [roomLoading, setRoomLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRoomDetails = useCallback(async (id) => {
    if (!id || !user) return null
    const { data, error } = await supabase
      .from('rooms')
      .select('*, host:profiles!host_id(*), guest:profiles!guest_id(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    setRoom(data)
    if (data.host_id === user.id) {
      setPartner(data.guest)
    } else {
      setPartner(data.host)
    }
    return data
  }, [user])

  useEffect(() => {
    if (!roomId || !user) {
      return
    }

    fetchRoomDetails(roomId)

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      }, async (payload) => {
        if (payload.new.status === 'ended') {
          setRoom(null)
          setPartner(null)
        } else {
          await fetchRoomDetails(roomId)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user, fetchRoomDetails])

  const createRoom = async () => {
    setRoomLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('rooms')
      .insert({ host_id: user.id })
      .select('*, host:profiles!host_id(*)')
      .single()

    if (error) {
      setError('Failed to create room')
      setRoomLoading(false)
      return null
    }

    setRoom(data)
    subscribeToRoom(data.id)
    setRoomLoading(false)
    return data
  }

  const joinRoom = async (code) => {
    setRoomLoading(true)
    setError('')

    const cleanCode = code.trim().toUpperCase()

    // Find room
    const { data: foundRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', cleanCode)
      .eq('status', 'waiting')
      .single()

    if (!foundRoom) {
      setError('Room not found or already full')
      setRoomLoading(false)
      return null
    }

    if (foundRoom.host_id === user.id) {
      setError('Cannot join your own room')
      setRoomLoading(false)
      return null
    }

    // Join room
    const { data: updatedRoom, error: joinError } = await supabase
      .from('rooms')
      .update({
        guest_id: user.id,
        status: 'active',
        last_active_at: new Date().toISOString()
      })
      .eq('id', foundRoom.id)
      .select('*, host:profiles!host_id(*), guest:profiles!guest_id(*)')
      .single()

    if (joinError) {
      setError('Failed to join room')
      setRoomLoading(false)
      return null
    }

    setRoom(updatedRoom)
    setPartner(updatedRoom.host)
    subscribeToRoom(updatedRoom.id)
    setRoomLoading(false)
    return updatedRoom
  }

  const leaveRoom = async () => {
    const targetRoomId = room?.id || roomId
    if (!targetRoomId) return

    const currentRoom = room || await fetchRoomDetails(targetRoomId)
    if (!currentRoom) return

    if (currentRoom.host_id === user.id) {
      // Host leaves = end room
      await supabase
        .from('rooms')
        .update({ status: 'ended' })
        .eq('id', targetRoomId)
    } else {
      // Guest leaves = back to waiting
      await supabase
        .from('rooms')
        .update({ guest_id: null, status: 'waiting' })
        .eq('id', targetRoomId)
    }

    setRoom(null)
    setPartner(null)
  }

  const subscribeToRoom = (id) => {
    supabase
      .channel(`room-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${id}`
      }, async (payload) => {
        if (payload.new.status === 'ended') {
          setRoom(null)
          setPartner(null)
        } else {
          await fetchRoomDetails(id)
        }
      })
      .subscribe()
  }

  return {
    room,
    partner,
    roomLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom
  }
}

export default useRoom
