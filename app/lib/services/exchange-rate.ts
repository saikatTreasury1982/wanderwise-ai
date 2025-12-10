export interface ExchangeRateResult {
  base: string;
  rates: Record<string, number>;
  fetched_at: string;
}

/**
 * Fetch exchange rate from Yahoo Finance
 * Yahoo uses format: AUDUSD=X means 1 AUD = X USD
 */
async function fetchYahooRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    const symbol = `${fromCurrency}${toCurrency}=X`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    if (typeof price === 'number') {
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching rate for ${fromCurrency}/${toCurrency}:`, error);
    return null;
  }
}

/**
 * Get exchange rates from base currency to multiple target currencies
 */
export async function getExchangeRates(
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<ExchangeRateResult> {
  const rates: Record<string, number> = {};
  
  // Base currency to itself is always 1
  rates[baseCurrency] = 1;

  // Fetch rates for each target currency
  const uniqueTargets = [...new Set(targetCurrencies)].filter(c => c !== baseCurrency);
  
  await Promise.all(
    uniqueTargets.map(async (target) => {
      const rate = await fetchYahooRate(baseCurrency, target);
      if (rate !== null) {
        rates[target] = rate;
      }
    })
  );

  return {
    base: baseCurrency,
    rates,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
  baseCurrency: string
): { converted: number; rate: number } | null {
  if (fromCurrency === toCurrency) {
    return { converted: amount, rate: 1 };
  }

  // If converting FROM base currency TO target
  if (fromCurrency === baseCurrency && rates[toCurrency]) {
    return { converted: amount * rates[toCurrency], rate: rates[toCurrency] };
  }

  // If converting TO base currency FROM foreign
  if (toCurrency === baseCurrency && rates[fromCurrency]) {
    const rate = 1 / rates[fromCurrency];
    return { converted: amount * rate, rate };
  }

  // Cross conversion: from -> base -> to
  if (rates[fromCurrency] && rates[toCurrency]) {
    const toBaseRate = 1 / rates[fromCurrency];
    const fromBaseRate = rates[toCurrency];
    const crossRate = toBaseRate * fromBaseRate;
    return { converted: amount * crossRate, rate: crossRate };
  }

  return null;
}