import { type FC, useMemo, type ChangeEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation' 

interface LanguageSwitcherProps {
  field?: any 
}

const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ field }) => {
  const t = useTranslations('language')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const languageOptions = useMemo(() => [
    { label: `🇬🇧 ${t('englishUk')}`, value: 'en' },
    { label: `🇮🇹 ${t('italian')}`, value: 'it' },
  ], [t])

const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
  const nextLocale = e.target.value

  if (field?.onChange) {
    field.onChange(nextLocale)
  }
  
  const segments = pathname.split('/')
  segments[1] = nextLocale
  const newPath = segments.join('/')

  router.replace(newPath)
}

  const currentValue = field?.value ?? locale

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="language-switcher" className="text-sm font-medium">
        {t('label')}
      </label>

      <select
        id="language-switcher"
        value={currentValue}
        onChange={handleLanguageChange}
        disabled={field?.disabled}
        className="w-full rounded-md border border-gray-300 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...field}
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {t('description') && (
        <p className="text-xs text-gray-500">{t('description')}</p>
      )}
    </div>
  )
}

export default LanguageSwitcher