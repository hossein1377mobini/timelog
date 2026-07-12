import { useState, useCallback } from "react"

export interface RatingDialogState {
  rateOpen: boolean
  rating: number
  setRateOpen: (v: boolean) => void
  setRating: (v: number) => void
  resetRating: () => void
}

export function useRatingDialog(): RatingDialogState {
  const [rateOpen, setRateOpen] = useState(false)
  const [rating, setRating] = useState(0)

  const resetRating = useCallback(() => {
    setRating(0)
  }, [])

  return {
    rateOpen,
    rating,
    setRateOpen,
    setRating,
    resetRating,
  }
}
