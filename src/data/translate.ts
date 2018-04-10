export const Translations: Object = {
    'en': {
        'EXPORT': {
            'TITLE_INTRO': () => 'UNDERSTANDING EVICTION IN',
            'TITLE_SOURCE': () => 'A PowerPoint Presentation generated by The Eviction Lab at Princeton University',
            'TITLE_EXTRACT_DATE': () => `Data extracted on ${new Date().toISOString().slice(0, 10)}`,
            'TITLE_WEB_LINK': () => 'For further information, visit evictionlab.org',
            'UNAVAILABLE': () => 'Unavailable',
            'EVICTION': () => 'Eviction',
            'EVICTIONS': () => 'Evictions',
            'EVICTION_FILING': () => 'Eviction Filing',
            'EVICTION_FILINGS': () => 'Eviction Filings',
            'EVICTION_RATE': () => 'Eviction Rate',
            'EVICTION_FILING_RATE': () => 'Eviction Filing Rate',
            'EVICTION_RATES': () => 'Eviction Rates',
            'EVICTION_FILING_RATES': () => 'Eviction Filing Rates',
            'EVICTIONS_PER_DAY': () => 'Evictions Per Day',
            'FEATURE_TITLE': (name, total, kind, year) => `${name} experienced ${total} ${kind} in ${year}`,
            'FEATURE_TITLE_UNAVAILABLE': (name, kind, year) => `${year} ${kind} data for ${name} is unavailable`,
            'FEATURE_BULLET_ONE': (total) => `Number of evictions per day: ${total}`,
            'FEATURE_BULLET_TWO': (rateDesc, rate) => `${rateDesc}: ${rate}*`,
            'FEATURE_EVICTION_RATE_DESCRIPTION': () => '* An eviction rate is the number of evictions per 100 renter-occupied households',
            'FEATURE_EVICTION_FILING_RATE_DESCRIPTION': () => '* An eviction filing rate is the number of eviction filings per 100 renter-occupied households',
            'DEMOGRAPHIC_BREAKDOWN': () => 'Census Demographics',
            'BAR_CHART_TITLE': (subject, year) => `Comparison of ${subject} in ${year}`,
            'LINE_CHART_TITLE': (subject) => `Comparison of ${subject} over time`,
            'NO_DATA': () => 'No data',
            'FLAG_99TH': () => 'This area has an eviction/filing rate in the top 1%. Please see our FAQ section to better understand why https://evictionlab.org/help-faq/',
            'FLAG_LOW': () => 'This area\'s estimated eviction/filing rate is too low. Please see our FAQ section to better understand why https://evictionlab.org/help-faq/',
            'FLAG_MARYLAND_FILING': () => 'Because of the way Maryland records eviction notices, it has a much higher filing rate than everywhere else. Please see our FAQ section to better understand why https://evictionlab.org/help-faq/'
        },
        'DATA_PROPS': {
            'e': 'Evictions',
            'efr': 'Eviction Filing Rate',
            'ef': 'Eviction Filings',
        },
        'DEM_DATA_PROPS': {
            'p': 'Population',
            'pro': '% Renter-Occupied Households',
            'pr': 'Poverty Rate',
            'mgr': 'Median Gross Rent',
            'mhi': 'Median Household Income',
            'mpv': 'Median Property Value',
            'rb': 'Rent Burden',
            'paa': 'Black',
            'pw': 'White',
            'ph': 'Hispanic/Latinx',
            'pa': 'Asian',
            'pai': 'American Indian/Alaska Native',
            'pnp': 'Native Hawaiian/Pacific Islander',
            'pm': 'Multiple Races',
            'po': 'Other Races'
        },
        'CODEBOOK': {
            'DISCLAIMER': 'NOTE: Demographic variables are provided for context, but do not change every year because they are pulled from the 2000 and 2010 Census, as well as the 2009, 2012, and 2015 American Community Survey 5-year estimates',
            'VALUES': [
                {
                    'Column': 'GEOID',
                    'Description': 'Census FIPS code for 2010 geography'
                },
                {
                    'Column': 'name',
                    'Description': 'Census location name'
                },
                {
                    'Column': 'parent-location',
                    'Description': 'Parent location in Census hierarchy'
                },
                {
                    'Column': 'population',
                    'Description': 'Total population'
                },
                {
                    'Column': 'poverty-rate',
                    'Description': '% of the population with income in the last 12 months below the poverty level'
                },
                {
                    'Column': 'pct-renter-occupied',
                    'Description': '% of occupied housing units that are renter-occupied'
                },
                {
                    'Column': 'median-gross-rent',
                    'Description': 'Median gross rent'
                },
                {
                    'Column': 'median-household-income',
                    'Description': 'Median household income'
                },
                {
                    'Column': 'median-property-value',
                    'Description': 'Median property value'
                },
                {
                    'Column': 'rent-burden',
                    'Description': 'Median gross rent as a percentage of household income. The max value is 50%, representing >= 50%'
                },
                {
                    'Column': 'pct-white',
                    'Description': '% population that is White alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-af-am',
                    'Description': '% population that is Black or African American alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-hispanic',
                    'Description': '% population that is of Hispanic or Latino origin'
                },
                {
                    'Column': 'pct-am-ind',
                    'Description': '% population that is American Indian and Alaska Native alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-asian',
                    'Description': '% population that is Asian alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-nh-pi',
                    'Description': '% population that is Native Hawaiian and Other Pacific Islander alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-other',
                    'Description': '% population that is other race alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-multiple',
                    'Description': '% population that is two or more races and not Hispanic or Latino'
                },
                {
                    'Column': 'evictions',
                    'Description': 'Number of eviction judgments in which renters were ordered to leave in a given area and year. Only counts a single address which received an eviction judgment per year.'
                },
                {
                    'Column': 'eviction-filings',
                    'Description': 'All eviction cases filed in an area, including multiple cases filed against the same address in the same year'
                },
                {
                    'Column': 'eviction-rate',
                    'Description': 'Ratio of the number of renter-occupied households in an area that received an eviction judgement in which renters were ordered to leave. Only counts a single address which received an eviction judgment per year.'
                },
                {
                    'Column': 'eviction-filing-rate',
                    'Description': 'Ratio of the number of evictions filed in an area over the number of renter-occupied homes in that area. Counts all eviction cases filed in an area, including multiple cases filed against the same address in the same year.'
                },
                {
                    'Column': 'evictions-per-day',
                    'Description': 'The number of eviction judgments per day'
                }
            ]
        }
    },
    'es': {
        'EXPORT': {
            'TITLE_INTRO': () => 'COMPRENDER EL DESALOJO EN',
            'TITLE_SOURCE': () => 'Una presentación de PowerPoint generada por The Eviction Lab en la Universidad de Princeton',
            'TITLE_EXTRACT_DATE': () => `Datos extraídos el ${new Date().toISOString().slice(0, 10)}`,
            'TITLE_WEB_LINK': () => 'Para más información, visite evictionlab.org',
            'UNAVAILABLE': () => 'No disponible',
            'EVICTION': () => 'Desalojo',
            'EVICTIONS': () => 'Desalojos',
            'EVICTION_FILING': () => 'Presentacion de desalojo',
            'EVICTION_FILINGS': () => 'Presentaciones de desalojo',
            'EVICTION_RATE': () => 'Tasa de desalojo',
            'EVICTION_FILING_RATE': () => 'Tasa de presentaciones de desalojo',
            'EVICTION_RATES': () => 'Tasas de desalojo',
            'EVICTION_FILING_RATES': () => 'Tasas de presentaciones de desalojo',
            'EVICTIONS_PER_DAY': () => 'Desalojos por día',
            'FEATURE_TITLE': (name, total, kind, year) => `${name} experimentó ${total} ${kind} en ${year}`,
            'FEATURE_TITLE_UNAVAILABLE': (name, kind, year) => `Los datos del año ${year} de ${kind} para ${name} no están disponibles`,
            'FEATURE_BULLET_ONE': (total) => `Número de desalojos por día: ${total}`,
            'FEATURE_BULLET_TWO': (rateDesc, rate) => `${rateDesc}: ${rate}*`,
            'FEATURE_EVICTION_RATE_DESCRIPTION': () => 'Una tasa de desalojo es el número de desalojos por cada 100 viviendas ocupadas por inquilinos',
            'FEATURE_EVICTION_FILING_RATE_DESCRIPTION': () => 'Una tasa de presentación de desalojo es la cantidad de presentaciones de desalojo por cada 100 viviendas ocupadas por inquilinos',
            'DEMOGRAPHIC_BREAKDOWN': () => 'Desglose Demográfico',
            'BAR_CHART_TITLE': (subject, year) => `Comparación de las ${subject} en ${year}`,
            'LINE_CHART_TITLE': (subject) => `Comparación de las ${subject} a lo largo del tiempo`,
            'NO_DATA': () => 'Sin datos',
            'FLAG_99TH': () => 'Esta área tiene una tasa de desalojo/presentaciones en el 1% superior. Por favor, consulte nuestra sección de preguntas frecuentes para comprender mejor por qué https://evictionlab.org/en/help-faq/',
            'FLAG_LOW': () => 'La estimación de la tasa de desalojo/presentaciones de esta área es demasiado baja. Por favor, consulte nuestra sección de preguntas frecuentes para comprender mejor por qué https://evictionlab.org/en/help-faq/',
            'FLAG_MARYLAND_FILING': () => 'Debido a la forma en que Maryland registra los avisos de desalojo, tiene una tasa de presentación mucho más alta que en cualquier otro lugar. Por favor, consulte nuestra sección de preguntas frecuentes para comprender mejor por qué https://evictionlab.org/en/help-faq/'
        },
        'DATA_PROPS': {
            'e': 'Desalojos',
            'efr': 'Tasa de presentaciones de desalojo',
            'ef': 'Presentaciones de desalojo'
        },
        'DEM_DATA_PROPS': {
            'p': 'Población',
            'pro': '% Casas ocupadas por inquilinos',
            'pr': 'Tasa de pobreza',
            'mgr': 'Renta bruta mediana',
            'mhi': 'Ingreso bruto mediano',
            'mpv': 'Valor de propiedad mediano',
            'rb': 'Carga del alquiler',
            'paa': 'Negro',
            'pw': 'Blanco',
            'ph': 'Hispano/Latinx',
            'pa': 'Asiático',
            'pai': 'Indígena/Nativo de Alaska',
            'pnp': 'Nativo de Hawaii/Isleños del Pacífico',
            'pm': 'Dos o más razas',
            'po': 'Otra Raza'
        },
        'CODEBOOK': {
            'DISCLAIMER': 'NOTE: Demographic variables are provided for context, but do not change every year because they are pulled from the 2000 and 2010 Census, as well as the 2009, 2012, and 2015 American Community Survey 5-year estimates',
            'VALUES': [
                {
                    'Column': 'GEOID',
                    'Description': 'Census FIPS code for 2010 geography'
                },
                {
                    'Column': 'name',
                    'Description': 'Census location name'
                },
                {
                    'Column': 'parent-location',
                    'Description': 'Parent location in Census hierarchy'
                },
                {
                    'Column': 'population',
                    'Description': 'Total population'
                },
                {
                    'Column': 'poverty-rate',
                    'Description': '% of the population with income in the last 12 months below the poverty level'
                },
                {
                    'Column': 'pct-renter-occupied',
                    'Description': '% of occupied housing units that are renter-occupied'
                },
                {
                    'Column': 'median-gross-rent',
                    'Description': 'Median gross rent'
                },
                {
                    'Column': 'median-household-income',
                    'Description': 'Median household income'
                },
                {
                    'Column': 'median-property-value',
                    'Description': 'Median property value'
                },
                {
                    'Column': 'rent-burden',
                    'Description': 'Median gross rent as a percentage of household income. The max value is 50%, representing >= 50%'
                },
                {
                    'Column': 'pct-white',
                    'Description': '% population that is White alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-af-am',
                    'Description': '% population that is Black or African American alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-hispanic',
                    'Description': '% population that is of Hispanic or Latino origin'
                },
                {
                    'Column': 'pct-am-ind',
                    'Description': '% population that is American Indian and Alaska Native alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-asian',
                    'Description': '% population that is Asian alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-nh-pi',
                    'Description': '% population that is Native Hawaiian and Other Pacific Islander alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-other',
                    'Description': '% population that is other race alone and not Hispanic or Latino'
                },
                {
                    'Column': 'pct-multiple',
                    'Description': '% population that is two or more races and not Hispanic or Latino'
                },
                {
                    'Column': 'evictions',
                    'Description': 'Number of eviction judgments in which renters were ordered to leave in a given area and year. Only counts a single address which received an eviction judgment per year.'
                },
                {
                    'Column': 'eviction-filings',
                    'Description': 'All eviction cases filed in an area, including multiple cases filed against the same address in the same year'
                },
                {
                    'Column': 'eviction-rate',
                    'Description': 'Ratio of the number of renter-occupied households in an area that received an eviction judgement in which renters were ordered to leave. Only counts a single address which received an eviction judgment per year.'
                },
                {
                    'Column': 'eviction-filing-rate',
                    'Description': 'Ratio of the number of evictions filed in an area over the number of renter-occupied homes in that area. Counts all eviction cases filed in an area, including multiple cases filed against the same address in the same year.'
                },
                {
                    'Column': 'evictions-per-day',
                    'Description': 'The number of eviction judgments per day'
                }
            ]
        }
    }
};
