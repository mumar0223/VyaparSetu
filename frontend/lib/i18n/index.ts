import en from './dictionaries/en';
import hi from './dictionaries/hi';

type ValidLocale = 'en' | 'hi';

const dictionaries = {
    en,
    hi,
};

export const getDictionary = (locale: ValidLocale) => {
    return dictionaries[locale] ?? dictionaries.en;
};

// Next.js client component helper to get language from cookies / localstorage
export const getCurrentLanguage = (): ValidLocale => {
    if (typeof window === 'undefined') return 'en';

    const savedLang = localStorage.getItem('language') as ValidLocale | null;
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
        return savedLang;
    }

    return 'en';
};

export const setLanguage = (locale: ValidLocale) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('language', locale);
        // You could also set a cookie here for SSR parsing.
        document.cookie = `language=${locale}; path=/; max-age=31536000`;
    }
};
