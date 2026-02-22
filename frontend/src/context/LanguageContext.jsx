import { createContext, useContext, useState } from 'react'

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {}
})

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem('preferredLanguage') || 'en'
  )

  const updateLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('preferredLanguage', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
