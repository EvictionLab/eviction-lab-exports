export const Translations: Object = {
    'en': {
        'EXPORT': {
            'TITLE_INTRO': () => 'UNDERSTANDING EVICTION IN',
            'TITLE_SOURCE': () => 'A PowerPoint Presentation generated by The Eviction Lab at Princeton University',
            'TITLE_EXTRACT_DATE': () => `Data extracted on ${new Date().toISOString().slice(0, 10)}`,
            'TITLE_WEB_LINK': () => 'For further information, visit www.evictionlab.org',
            'UNAVAILABLE': () => 'Unavailable',
            'EVICTION': () => 'Eviction',
            'EVICTIONS': () => 'Evictions',
            'TOTAL_EVICTIONS': () => 'Total Evictions',
            'EVICTION_FILING': () => 'Eviction Filing',
            'EVICTION_FILINGS': () => 'Eviction Filings',
            'TOTAL_EVICTION_FILINGS': () => 'Total Eviction Filings',
            'EVICTION_RATE': () => 'Eviction Rate',
            'EVICTION_FILING_RATE': () => 'Eviction Filing Rate',
            'EVICTIONS_PER_DAY': () => 'Evictions Per Day',
            'FEATURE_TITLE': (name, total, kind, year) => `${name} experienced ${total} ${kind} in ${year}`,
            'FEATURE_TITLE_UNAVAILABLE': (name, kind, year) => `${year} ${kind} data for ${name} is unavailable`,
            'FEATURE_BULLET_ONE': (total) => `Number of evictions per day: ${total}`,
            'FEATURE_BULLET_TWO': (rateDesc, rate) => `Overall ${rateDesc}: ${rate}*`,
            'FEATURE_EVICTION_RATE_DESCRIPTION': () => '* An eviction rate is the number of evictions per 100 renter-occupied households',
            'FEATURE_EVICTION_FILING_RATE_DESCRIPTION': () => '* An eviction filing rate is the number of eviction filings per 100 renter-occupied households',
            'RACE_ETHNICITY': () => 'Race/Ethnicity',
            'BAR_CHART_TITLE': (subject, year) => `Comparison of ${subject} rates in ${year}`,
            'LINE_CHART_TITLE': (subject) => `Comparison of ${subject} rates over time`,
            'NO_DATA': () => 'No data'
        },
        'DATA_PROPS': {
            'p': 'Population',
            'pro': '% Renter-Occupied Households',
            'pr': 'Poverty Rate',
            'mgr': 'Median Gross Rent',
            'mhi': 'Median Household Income',
            'mpv': 'Median Property Value',
            'rb': 'Rent Burden'
        },
        'DEM_DATA_PROPS': {
            'paa': 'Black',
            'pw': 'White',
            'ph': 'Hispanic/Latinx',
            'pa': 'Asian',
            'pai': 'American Indian/Alaska Native',
            'pnp': 'Native Hawaiian/Pacific Islander',
            'pm': 'Multiple Races',
            'po': 'Other Races'
        }
    },
    'es': {
        'EXPORT': {
            'TITLE_INTRO': () => 'UNDERSTANDING EVICTION IN',
            'TITLE_SOURCE': () => 'A PowerPoint Presentation generated by The Eviction Lab at Princeton University',
            'TITLE_EXTRACT_DATE': () => `Data extracted on ${new Date().toISOString().slice(0, 10)}`,
            'TITLE_WEB_LINK': () => 'For further information, visit www.evictionlab.org',
            'UNAVAILABLE': () => 'Unavailable',
            'EVICTION': () => 'Eviction',
            'EVICTIONS': () => 'Evictions',
            'TOTAL_EVICTIONS': () => 'Total Evictions',
            'EVICTION_FILING': () => 'Eviction Filing',
            'EVICTION_FILINGS': () => 'Eviction Filings',
            'TOTAL_EVICTION_FILINGS': () => 'Total Eviction Filings',
            'EVICTION_RATE': () => 'Eviction Rate',
            'EVICTION_FILING_RATE': () => 'Eviction Filing Rate',
            'EVICTIONS_PER_DAY': () => 'Desalojos por Día',
            'FEATURE_TITLE': (name, total, kind, year) => `${name} experienced ${total} ${kind} in ${year}`,
            'FEATURE_TITLE_UNAVAILABLE': (name, kind, year) => `${year} ${kind} data for ${name} is unavailable`,
            'FEATURE_BULLET_ONE': (total) => `Number of evictions per day: ${total}`,
            'FEATURE_BULLET_TWO': (rateDesc, rate) => `Overall ${rateDesc}: ${rate}*`,
            'FEATURE_EVICTION_RATE_DESCRIPTION': () => '* An eviction rate is the number of evictions per 100 renter-occupied households',
            'FEATURE_EVICTION_FILING_RATE_DESCRIPTION': () => '* An eviction filing rate is the number of eviction filings per 100 renter-occupied households',
            'RACE_ETHNICITY': () => 'Race/Ethnicity',
            'BAR_CHART_TITLE': (subject, year) => `Comparison of ${subject} rates in ${year}`,
            'LINE_CHART_TITLE': (subject) => `Comparison of ${subject} rates over time`,
            'NO_DATA': () => 'No data'
        },
        'DATA_PROPS': {
            'p': 'Población',
            'pro': '% Casas Ocupadas por Inquilinos',
            'pr': 'Tasa de Pobreza',
            'mgr': 'Renta Bruta Mediana',
            'mhi': 'Ingreso Bruto Mediano',
            'mpv': 'Valor de Propiedad Mediano',
            'rb': 'Rent Burden'
        },
        'DEM_DATA_PROPS': {
            'paa': 'Negro',
            'pw': 'Blanco',
            'ph': 'Hispánico',
            'pa': 'Asiático',
            'pai': 'Indígena/Nativo de Alaska',
            'pnp': 'Nativo de Hawaii/Isleños del Pacífico',
            'pm': 'Dos o Más Razas',
            'po': 'Otra Raza'
        }
    }
};
