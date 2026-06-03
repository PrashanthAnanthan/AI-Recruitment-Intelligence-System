import { createContext, useContext, useState } from 'react'

const ScreeningContext = createContext(null)

export function ScreeningProvider({ children }) {
  const [currentJob, setCurrentJob] = useState(null)
  const [screeningResults, setScreeningResults] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' })

  return (
    <ScreeningContext.Provider value={{
      currentJob, setCurrentJob,
      screeningResults, setScreeningResults,
      isProcessing, setIsProcessing,
      progress, setProgress,
    }}>
      {children}
    </ScreeningContext.Provider>
  )
}

export const useScreening = () => useContext(ScreeningContext)
