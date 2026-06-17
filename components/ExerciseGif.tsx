'use client'

import { useState, useEffect } from 'react'
import ExerciseAnimation from './ExerciseAnimation'

interface Props {
  name: string
}

export default function ExerciseGif({ name }: Props) {
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setGifUrl(null)
    fetch(`/api/exercise-gif?name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data) => {
        setGifUrl(data.gif ?? null)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [name])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
      </div>
    )
  }

  if (error || !gifUrl) {
    return <ExerciseAnimation name={name} />
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-2xl overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={gifUrl}
        alt={name}
        className="h-full w-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  )
}
