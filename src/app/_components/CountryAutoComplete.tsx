"use client"
import { KeyboardEvent, useEffect, useState } from "react";

interface Country {
    names: {
        common: string;
    }
}

function CountryAutoComplete() {
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<Country[]>([])
    const [error, setError] = useState<string | null>(null)
    const [highlightedCountryIndex, setHighlightedCountryIndex] = useState(-1)
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)

    const listBoxId = "country-listbox"


    async function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
        const response = await fetch(`https://api.restcountries.com/countries/v5?q=${query}`, {
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_REST_COUNTRIES_API_KEY}`,
            },
            signal
        })
        if (!response.ok) {
            throw new Error("Something went wrong");
        }
        const result = await response.json()
        return result.data.objects
    }

    useEffect(() => {
        if (query.length === 0) {
            return
        }

        const controller = new AbortController()

        const timeOutId = setTimeout(async()=> {
            setLoading(true)
            try {
                const countries = await searchCountries(query, controller.signal)
                setResults(countries)
                setHighlightedCountryIndex(-1)
                setError(null)
            } catch (error:unknown) {
                if (error instanceof Error && error.name !== "AbortError") {
                    setError("Failed to load countries. Please try again.")
                }
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => {
            clearTimeout(timeOutId)
            controller.abort()
        }
    }, [query])

    const displayedResults = results.length === 0 ? [] : results;

    function handleSelectCountry(country: Country) {
        setSelectedCountry(country)
        setQuery(country.names.common)
        setResults([])
        setHighlightedCountryIndex(-1)
    }


    function handleKeyboardNavigation(event: KeyboardEvent<HTMLInputElement>) {
        if (displayedResults.length === 0) {
            return
        }

        if (event.key === "ArrowDown") {
            event.preventDefault()
            setHighlightedCountryIndex(prev => (prev + 1) % displayedResults.length)
        } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setHighlightedCountryIndex(prev => (prev - 1 + displayedResults.length) % displayedResults.length)
        } else if (event.key === "Enter") {
            if (highlightedCountryIndex >= 0) {
                event.preventDefault()
                handleSelectCountry(displayedResults[highlightedCountryIndex])
            }
        }  else if (event.key === "Escape") {
            event.preventDefault()
            setResults([])
            setHighlightedCountryIndex(-1)
        }
    }

    return (
        <div className="space-y-5 w-full md:max-w-xl p-6">
            <form className="flex flex-col gap-2 w-full">
                <label className="" htmlFor="country-search sr-only">
                    Search Country...
                </label>
                <input
                    id="country-search"
                    role="combobox"
                    aria-expanded={displayedResults.length > 0}
                    aria-controls={listBoxId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        highlightedCountryIndex >= 0 ? `country-option-${highlightedCountryIndex}` : undefined
                    }
                    type="text"
                    className="border border-gray-400 h-10 rounded-2xl px-5 w-full"
                    placeholder="Search countries..."
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setSelectedCountry(null)
                    }}
                    onKeyDown={handleKeyboardNavigation}
                />
            </form>
                

            {
                query && !selectedCountry && (
                    <div className="max-h-90 overflow-y-auto p-5 border border-gray-400 rounded-2xl w-full">
                        {
                            loading
                            ? <p>Loading..</p>
                            : error
                            ? <p className="text-center text-md text-gray-800">{error}</p>
                            : <ul className="flex flex-col gap-1" id={listBoxId} role="listbox">
                                {
                                    displayedResults.map((country, index)=>(
                                        <li
                                            key={country.names.common}
                                            id={`country-option-${index}`}
                                            role="option"
                                            aria-selected={index === highlightedCountryIndex}
                                            
                                        >
                                            <button
                                                onClick={() => handleSelectCountry(country)}
                                                onMouseEnter={() => setHighlightedCountryIndex(index)}
                                                className={`w-full text-left cursor-pointer px-2 py-1 rounded ${
                                                    index === highlightedCountryIndex
                                                    ? "bg-gray-100 "
                                                    : "bg-white"
                                                }`}
                                            >
                                                {country.names.common}
                                            </button>
                                        </li>
                                    ))
                                }
                            </ul>
                        }
                    </div>
                    
                )
            }
        </div>
    )
}

export default CountryAutoComplete