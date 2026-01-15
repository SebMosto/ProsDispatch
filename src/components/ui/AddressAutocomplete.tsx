import { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../lib/googleMaps';

interface AddressSelection {
  address_line1: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  description?: string;
}

interface AddressAutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: AddressSelection) => void;
}

type Prediction = {
  description: string;
  place_id: string;
  structured_formatting: { main_text: string; secondary_text?: string };
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type AutocompleteService = {
  getPlacePredictions: (
    request: { input: string; componentRestrictions?: { country: string } },
    callback: (results: Prediction[] | null, status: string) => void,
  ) => void;
};

type PlacesService = {
  getDetails: (
    request: { placeId: string; fields?: string[] },
    callback: (
      place: { address_components?: AddressComponent[]; formatted_address?: string } | null,
      status: string,
    ) => void,
  ) => void;
};

const buildSelectionFromComponents = (
  description: string,
  components: AddressComponent[] = [],
): AddressSelection => {
  const find = (type: string) => components.find((component) => component.types.includes(type));

  const city = find('locality')?.long_name || find('sublocality')?.long_name;
  const province = find('administrative_area_level_1')?.short_name;
  const postal_code = find('postal_code')?.long_name;
  const country = find('country')?.short_name;

  return {
    address_line1: description,
    city: city ?? undefined,
    province: province ?? undefined,
    postal_code: postal_code ?? undefined,
    country: country ?? undefined,
    description,
  };
};

const AddressAutocomplete = ({ value, onChange, onSelect, ...inputProps }: AddressAutocompleteProps) => {
  const [mapsReady, setMapsReady] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasError, setHasError] = useState(false);

  const autocompleteService = useRef<AutocompleteService | null>(null);
  const placesService = useRef<PlacesService | null>(null);
  const debounceHandle = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !maps) return;
        const typedMaps = maps as unknown as {
          places: {
            AutocompleteService: new () => AutocompleteService;
            PlacesService: new (element: Element) => PlacesService;
          };
        };
        autocompleteService.current = new typedMaps.places.AutocompleteService();
        placesService.current = new typedMaps.places.PlacesService(document.createElement('div'));
        setMapsReady(true);
      })
      .catch(() => {
        setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPredictions = useMemo(
    () =>
      (input: string) => {
        if (!autocompleteService.current) return;

        setIsLoading(true);
        autocompleteService.current.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'ca' },
          },
          (results: Prediction[] | null, status: string) => {
            if (status !== 'OK' || !results) {
              setPredictions([]);
              setIsLoading(false);
              return;
            }
            setPredictions(results);
            setIsLoading(false);
          },
        );
      },
    [],
  );

  useEffect(() => {
    if (!mapsReady || value.trim().length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPredictions([]);
      return undefined;
    }

    if (debounceHandle.current) {
      window.clearTimeout(debounceHandle.current);
    }

    debounceHandle.current = window.setTimeout(() => {
      fetchPredictions(value.trim());
      setShowSuggestions(true);
    }, 200);

    return () => {
      if (debounceHandle.current) {
        window.clearTimeout(debounceHandle.current);
      }
    };
  }, [value, fetchPredictions, mapsReady]);

  const handleSelect = (prediction: Prediction) => {
    setShowSuggestions(false);
    setPredictions([]);
    onChange(prediction.description);

    if (!placesService.current || !onSelect) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address'],
      },
      (place, status) => {
        const parsedPlace = place as { address_components?: AddressComponent[]; formatted_address?: string } | null;
        if (status !== 'OK' || !parsedPlace) {
          onSelect({ address_line1: prediction.description, description: prediction.description });
          return;
        }

        const selection = buildSelectionFromComponents(
          parsedPlace.formatted_address ?? prediction.description,
          parsedPlace.address_components ?? [],
        );

        onSelect(selection);
      },
    );
  };

  const renderSuggestions = () => {
    if (!showSuggestions || !predictions.length) return null;

    return (
      <ul className="mt-1 divide-y divide-slate-100 rounded-md border border-slate-200 bg-white shadow-lg" role="listbox">
        {predictions.map((prediction) => (
          <li key={prediction.place_id}>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(prediction)}
            >
              <span className="block font-medium">{prediction.structured_formatting.main_text}</span>
              <span className="block text-xs text-slate-600">
                {prediction.structured_formatting.secondary_text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  if (!mapsReady || hasError) {
    return (
      <input
        {...inputProps}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${inputProps.className ?? ''}`}
      />
    );
  }

  return (
    <div className="relative">
      <input
        {...inputProps}
        value={value}
        onFocus={() => setShowSuggestions(true)}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${inputProps.className ?? ''}`}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-busy={isLoading}
      />
      {renderSuggestions()}
    </div>
  );
};

export type { AddressSelection };
export default AddressAutocomplete;
