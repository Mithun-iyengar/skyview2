import React, { useState, useEffect } from 'react';
import FormInput from '../../components/FormInput';
import MapSelector from '../../components/admin/MapSelector';
import SeatClassConfiguration from '../../components/admin/SeatClassConfiguration';
import { createFlight, deleteFlight, fetchFlights, generateSeatLayout } from '../../utils/flightData';
import '../../styles/admin.css';

const LOCAL_FLIGHTS_KEY = 'skyline_local_flights';

/**
 * AddFlight Component
 * Premium admin page for adding new flights
 * Features: Form validation, image upload, services selection, Google Maps integration
 */

// Complete airport database with full names
const AIRPORTS = [
  { code: 'DEL', name: 'Indira Gandhi Delhi International', city: 'New Delhi' },
  { code: 'BOM', name: 'Bombay Sahar International', city: 'Mumbai' },
  { code: 'BLR', name: 'Bengaluru Kempegowda International', city: 'Bengaluru' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad' },
  { code: 'CCU', name: 'Kolkata Dum Dum International', city: 'Kolkata' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai' },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London' },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo' },
  { code: 'AUS', name: 'Austin Bergstrom International', city: 'Austin' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
  { code: 'ORD', name: 'Chicago O\'Hare International', city: 'Chicago' },
];

const INITIAL_FORM_DATA = {
  flightId: '',
  flightNumber: '',
  aircraftType: '',
  totalSeats: '',
  baseFare: '',
  taxes: '',
  businessMultiplier: '1.5',
  sourceAirport: '',
  destinationAirport: '',
  midLandingAirport: '',
  departureDate: '',
  arrivalDate: '',
  departureTime: '',
  arrivalTime: '',
  flightImage: null,
  imagePreview: null,
};

const INITIAL_SERVICES = {
  meals: false,
  wifi: false,
  baggage: false,
  entertainment: false,
  priorityBoarding: false,
};

const INITIAL_SEAT_CLASSES = [
  {
    classType: 'ECONOMY',
    className: 'Economy',
    rows: 10,
    columnsPerRow: 6,
    pricePerSeat: 0,
    totalSeats: 60,
    previewSeats: [],
  },
  {
    classType: 'BUSINESS',
    className: 'Business',
    rows: 4,
    columnsPerRow: 2,
    pricePerSeat: 0,
    totalSeats: 8,
    previewSeats: [],
  },
];

const AddFlight = () => {
  const todayDateString = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [services, setServices] = useState(INITIAL_SERVICES);

  const [seatClasses, setSeatClasses] = useState(INITIAL_SEAT_CLASSES);

  const [mapData, setMapData] = useState({
    sourceLocation: { name: '' },
    destinationLocation: { name: '' },
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const [midDropdownOpen, setMidDropdownOpen] = useState(false);
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [destSearchTerm, setDestSearchTerm] = useState('');
  const [midSearchTerm, setMidSearchTerm] = useState('');
  const [currentFlights, setCurrentFlights] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingFlightId, setDeletingFlightId] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    tone: 'info',
    text: 'Waiting for admin action',
  });

  // Validation regex patterns
  const patterns = {
    flightNumber: /^[A-Z]{2}\d{1,4}$/,
    positiveNumber: /^\d+(\.\d{1,2})?$/,
    time: /^([0-1]\d|2[0-3]):[0-5]\d$/,
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.airport-dropdown-container')) {
        setSourceDropdownOpen(false);
        setDestDropdownOpen(false);
        setMidDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const refreshCurrentFlights = async () => {
    const list = await fetchFlights();
    setCurrentFlights(list);
    setSyncStatus({
      tone: 'info',
      text: `Synced ${list.length} flight(s) with database/local cache`,
    });
  };

  useEffect(() => {
    refreshCurrentFlights();

    const handleFlightsUpdated = () => {
      refreshCurrentFlights();
    };

    window.addEventListener('flightsUpdated', handleFlightsUpdated);
    return () => {
      window.removeEventListener('flightsUpdated', handleFlightsUpdated);
    };
  }, []);

  const combineDateAndTime = (dateValue, timeValue) => {
    const [year, month, day] = String(dateValue || '').split('-').map(Number);
    const [hours, minutes] = String(timeValue || '00:00').split(':').map(Number);
    const date = new Date();
    date.setSeconds(0, 0);
    date.setFullYear(Number.isNaN(year) ? date.getFullYear() : year);
    date.setMonth(Number.isNaN(month) ? date.getMonth() : month - 1);
    date.setDate(Number.isNaN(day) ? date.getDate() : day);
    date.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
    return date;
  };

  const resizeImageForUpload = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxWidth = 1000;
          const maxHeight = 620;
          const widthScale = maxWidth / image.width;
          const heightScale = maxHeight / image.height;
          const scale = Math.min(1, widthScale, heightScale);

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Unable to process image'));
            return;
          }

          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          let quality = 0.86;
          let resizedData = canvas.toDataURL('image/jpeg', quality);
          while (resizedData.length > 250000 && quality > 0.5) {
            quality -= 0.08;
            resizedData = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(resizedData);
        };
        image.onerror = () => reject(new Error('Invalid image'));
        image.src = String(reader.result || '');
      };
      reader.onerror = () => reject(new Error('Unable to read image'));
      reader.readAsDataURL(file);
    });

  const validateForm = () => {
    const newErrors = {};
    const isRoundTripRoute =
      formData.sourceAirport &&
      formData.destinationAirport &&
      formData.sourceAirport === formData.destinationAirport;

    if (formData.flightId.trim() && !/^[-A-Za-z0-9_]+$/.test(formData.flightId.trim())) {
      newErrors.flightId = 'Use only letters, numbers, dash, or underscore';
    }

    // Validate Flight Number (e.g., AI101, BA2345)
    if (!formData.flightNumber.trim()) {
      newErrors.flightNumber = 'Flight number is required (e.g., AI101)';
    } else if (!patterns.flightNumber.test(formData.flightNumber.toUpperCase())) {
      newErrors.flightNumber = 'Invalid format. Use 2 letters + 1-4 digits (e.g., AI101)';
    }

    // Validate Aircraft Type
    if (!formData.aircraftType.trim()) {
      newErrors.aircraftType = 'Aircraft type is required (e.g., Boeing 777)';
    }

    // Validate Base Fare (INR only)
    if (!formData.baseFare.trim()) {
      newErrors.baseFare = 'Base fare (₹) is required';
    } else if (!patterns.positiveNumber.test(formData.baseFare) || parseFloat(formData.baseFare) <= 0) {
      newErrors.baseFare = 'Enter a valid INR amount (₹)';
    }

    // Validate Taxes (INR only)
    if (!formData.taxes.trim()) {
      newErrors.taxes = 'Taxes (₹) is required';
    } else if (!patterns.positiveNumber.test(formData.taxes) || parseFloat(formData.taxes) < 0) {
      newErrors.taxes = 'Enter a valid INR amount (₹)';
    }

    // Validate Source Airport
    if (!formData.sourceAirport.trim()) {
      newErrors.sourceAirport = 'Source airport is required';
    }

    // Validate Destination Airport
    if (!formData.destinationAirport.trim()) {
      newErrors.destinationAirport = 'Destination airport is required';
    }

    // If source and destination are the same, treat as round trip and require mid-landing airport.
    if (isRoundTripRoute) {
      if (!formData.midLandingAirport) {
        newErrors.midLandingAirport =
          'Round trip route selected. Please choose a mid-landing airport.';
      } else if (formData.midLandingAirport === formData.sourceAirport) {
        newErrors.midLandingAirport =
          'Mid-landing airport must be different from source/destination.';
      }
    }

    // Validate Departure Time
    if (!formData.departureDate.trim()) {
      newErrors.departureDate = 'Departure date is required';
    } else if (formData.departureDate < todayDateString) {
      newErrors.departureDate = 'Departure date cannot be before today';
    }

    if (!formData.departureTime.trim()) {
      newErrors.departureTime = 'Departure time is required (HH:MM)';
    } else if (!patterns.time.test(formData.departureTime)) {
      newErrors.departureTime = 'Invalid time format. Use HH:MM (24-hour)';
    }

    // Validate Arrival Time
    if (!formData.arrivalDate.trim()) {
      newErrors.arrivalDate = 'Arrival date is required';
    } else if (formData.arrivalDate < todayDateString) {
      newErrors.arrivalDate = 'Arrival date cannot be before today';
    }

    if (!formData.arrivalTime.trim()) {
      newErrors.arrivalTime = 'Arrival time is required (HH:MM)';
    } else if (!patterns.time.test(formData.arrivalTime)) {
      newErrors.arrivalTime = 'Invalid time format. Use HH:MM (24-hour)';
    }

    if (
      formData.departureDate &&
      formData.departureTime &&
      formData.arrivalDate &&
      formData.arrivalTime &&
      patterns.time.test(formData.departureTime) &&
      patterns.time.test(formData.arrivalTime)
    ) {
      const departureDate = combineDateAndTime(formData.departureDate, formData.departureTime);
      const arrivalDate = combineDateAndTime(formData.arrivalDate, formData.arrivalTime);
      if (arrivalDate <= departureDate) {
        newErrors.arrivalTime = 'Arrival must be later than departure';
      }
    }

    // Validate Flight Image
    if (!formData.flightImage) {
      newErrors.flightImage = 'Flight image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const fieldName = e.target.name || e.target.id;
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Auto-update seat prices when pricing fields change
    if (['baseFare', 'taxes', 'businessMultiplier'].includes(fieldName)) {
      const newFormData = { ...formData, [fieldName]: value };
      const prices = calculatePrices.call({ formData: newFormData });
      if (prices.economy > 0 && prices.business > 0) {
        updateSeatPrices(prices.economy, prices.business);
      }
    }
    
    // Clear error on change
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  // Filter airports based on search term
  const getFilteredAirports = (searchTerm) => {
    if (!searchTerm.trim()) return AIRPORTS;
    const term = searchTerm.toLowerCase();
    return AIRPORTS.filter((airport) =>
      airport.code.toLowerCase().includes(term) ||
      airport.name.toLowerCase().includes(term) ||
      airport.city.toLowerCase().includes(term)
    );
  };

  // Handle source airport selection
  const handleSourceAirportSelect = (airport) => {
    setFormData((prev) => ({
      ...prev,
      sourceAirport: airport.code,
    }));
    setMapData((prev) => ({
      ...prev,
      sourceLocation: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
      },
    }));
    setSourceSearchTerm('');
    setSourceDropdownOpen(false);
    if (errors.sourceAirport) {
      setErrors((prev) => ({ ...prev, sourceAirport: '' }));
    }
  };

  // Handle destination airport selection
  const handleDestAirportSelect = (airport) => {
    setFormData((prev) => ({
      ...prev,
      destinationAirport: airport.code,
    }));
    setMapData((prev) => ({
      ...prev,
      destinationLocation: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
      },
    }));
    setDestSearchTerm('');
    setDestDropdownOpen(false);
    if (errors.destinationAirport) {
      setErrors((prev) => ({ ...prev, destinationAirport: '' }));
    }
  };

  // Handle mid-landing airport selection
  const handleMidAirportSelect = (airport) => {
    setFormData((prev) => ({
      ...prev,
      midLandingAirport: airport.code,
    }));
    setMidSearchTerm('');
    setMidDropdownOpen(false);
    if (errors.midLandingAirport) {
      setErrors((prev) => ({ ...prev, midLandingAirport: '' }));
    }
  };

  // Handle source airport search
  const handleSourceSearch = (value) => {
    setSourceSearchTerm(value);
    setSourceDropdownOpen(true);
  };

  // Handle destination airport search
  const handleDestSearch = (value) => {
    setDestSearchTerm(value);
    setDestDropdownOpen(true);
  };

  // Handle mid-landing airport search
  const handleMidSearch = (value) => {
    setMidSearchTerm(value);
    setMidDropdownOpen(true);
  };

  // Get selected airport object
  const getSelectedAirport = (code) => {
    return AIRPORTS.find((a) => a.code === code);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          flightImage: 'Please upload a valid image file',
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          flightImage: 'Image size must be less than 5MB',
        }));
        return;
      }

      try {
        const optimizedPreview = await resizeImageForUpload(file);
        setFormData((prev) => ({
          ...prev,
          flightImage: file,
          imagePreview: optimizedPreview,
        }));
        setErrors((prev) => ({
          ...prev,
          flightImage: '',
        }));
      } catch {
        setErrors((prev) => ({
          ...prev,
          flightImage: 'Unable to process image. Please try another file',
        }));
      }
    }
  };

  const handleServiceChange = (serviceName) => {
    setServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  const upsertLocalFlight = (flight) => {
    try {
      const raw = localStorage.getItem(LOCAL_FLIGHTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const current = Array.isArray(parsed) ? parsed : [];
      const existingIndex = current.findIndex((item) => String(item.id) === String(flight.id));

      if (existingIndex >= 0) {
        current[existingIndex] = flight;
      } else {
        current.unshift(flight);
      }

      localStorage.setItem(LOCAL_FLIGHTS_KEY, JSON.stringify(current));
    } catch {
      localStorage.setItem(LOCAL_FLIGHTS_KEY, JSON.stringify([flight]));
    }
  };

  const resetManualFlightForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setMapData({
      sourceLocation: { name: '' },
      destinationLocation: { name: '' },
    });
    setServices(INITIAL_SERVICES);
    setSeatClasses(INITIAL_SEAT_CLASSES);
    setErrors({});
    setSubmitted(false);
    setSourceSearchTerm('');
    setDestSearchTerm('');
    setMidSearchTerm('');
    setSourceDropdownOpen(false);
    setDestDropdownOpen(false);
    setMidDropdownOpen(false);
  };

  const loadLuxuryFlightTemplate = () => {
    const now = new Date();
    const departure = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    departure.setHours(19, 15, 0, 0);
    const arrival = new Date(departure.getTime() + (150 * 60 * 1000));

    const baseFare = '4800';
    const taxes = '520';

    setFormData({
      flightId: '2',
      flightNumber: 'SL202',
      aircraftType: 'Airbus A320 Neo',
      totalSeats: '',
      baseFare,
      taxes,
      businessMultiplier: '1.5',
      sourceAirport: 'DEL',
      destinationAirport: 'BOM',
      midLandingAirport: '',
      departureDate: departure.toISOString().split('T')[0],
      arrivalDate: arrival.toISOString().split('T')[0],
      departureTime: '19:15',
      arrivalTime: '21:45',
      flightImage: null,
      imagePreview: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=500&fit=crop',
    });

    setServices({
      meals: true,
      wifi: true,
      baggage: true,
      entertainment: true,
      priorityBoarding: true,
    });

    setSeatClasses([
      {
        classType: 'BUSINESS',
        className: 'Business',
        rows: 4,
        columnsPerRow: 2,
        pricePerSeat: 0,
        totalSeats: 8,
        previewSeats: [],
        seats: generateSeatLayout('BUSINESS', 4, 2),
      },
      {
        classType: 'ECONOMY',
        className: 'Economy',
        rows: 10,
        columnsPerRow: 6,
        pricePerSeat: 0,
        totalSeats: 60,
        previewSeats: [],
        seats: generateSeatLayout('ECONOMY', 10, 6),
      },
    ]);

    setMapData({
      sourceLocation: { code: 'DEL', name: 'Indira Gandhi Delhi International', city: 'New Delhi' },
      destinationLocation: { code: 'BOM', name: 'Bombay Sahar International', city: 'Mumbai' },
    });

    setErrors({});
    setSubmitted(false);
    setSourceSearchTerm('');
    setDestSearchTerm('');
    setMidSearchTerm('');
    setSourceDropdownOpen(false);
    setDestDropdownOpen(false);
    setMidDropdownOpen(false);
    setSyncStatus({ tone: 'info', text: 'Luxury template loaded. Review the form and save it manually.' });
    setSuccessMessage('Luxury template applied. Adjust any field and submit manually when ready.');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  // Calculate pricing for seat classes based on base fare, tax, and business multiplier
  const calculatePrices = () => {
    if (!formData.baseFare || !formData.taxes) return { economy: 0, business: 0 };
    
    const basePrice = parseFloat(formData.baseFare);
    const taxAmount = parseFloat(formData.taxes);
    const multiplier = parseFloat(formData.businessMultiplier) || 1.5;
    
    const economyPrice = basePrice + taxAmount;
    const businessPrice = (basePrice * multiplier) + taxAmount;
    
    return {
      economy: Math.round(economyPrice),
      business: Math.round(businessPrice)
    };
  };

  const pricing = calculatePrices();

  // Auto-update seat prices when pricing fields change
  const updateSeatPrices = (economyPrice, businessPrice) => {
    setSeatClasses(prev => prev.map(sc => ({
      ...sc,
      pricePerSeat: sc.classType === 'ECONOMY' ? economyPrice : businessPrice
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (validateForm()) {
      setIsSubmitting(true);
      setSyncStatus({ tone: 'info', text: 'Saving flight locally and syncing in background...' });

      const departureDate = combineDateAndTime(formData.departureDate, formData.departureTime);
      const arrivalDate = combineDateAndTime(formData.arrivalDate, formData.arrivalTime);

      const payload = {
        flightNumber: formData.flightNumber.toUpperCase(),
        aircraftType: formData.aircraftType,
        baseFare: parseFloat(formData.baseFare || 0),
        taxes: parseFloat(formData.taxes || 0),
        businessMultiplier: parseFloat(formData.businessMultiplier || 1.5),
        sourceAirport: formData.sourceAirport,
        destinationAirport: formData.destinationAirport,
        midLandingAirport: formData.midLandingAirport || null,
        departureTime: departureDate.toISOString(),
        arrivalTime: arrivalDate.toISOString(),
        flightImage: formData.imagePreview || '',
        services: JSON.stringify(services),
        seatClasses: seatClasses.map(sc => ({
          classType: sc.classType,
          className: sc.className,
          rows: parseInt(sc.rows, 10) || 0,
          columnsPerRow: parseInt(sc.columnsPerRow, 10) || 0,
        })),
      };

      // Upsert locally so admin sees immediate result
      try {
        upsertLocalFlight(payload);
        await refreshCurrentFlights();
        window.dispatchEvent(new Event('flightsUpdated'));
        setSyncStatus({ tone: 'info', text: 'Flight saved locally. Syncing to remote DB...' });
        setSuccessMessage('✈️ Flight saved locally. Syncing to remote database in background.');
        setTimeout(() => setSuccessMessage(''), 2200);
        resetManualFlightForm();
      } catch (err) {
        // Local save should rarely fail; surface error
        setSyncStatus({ tone: 'error', text: 'Failed to save flight locally.' });
        setSuccessMessage('Unable to save flight locally. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Fire off background sync to backend but don't block UI
      (async () => {
        try {
          await createFlight(payload);
          await refreshCurrentFlights();
          window.dispatchEvent(new Event('flightsUpdated'));
          setSyncStatus({ tone: 'success', text: 'Flight synced with backend successfully.' });
        } catch (err) {
          setSyncStatus({ tone: 'error', text: 'Background sync failed. Flight saved locally only.' });
        } finally {
          // clear submitting state after background attempt
          setIsSubmitting(false);
        }
      })();
    }
  };

  const handleDeleteFlight = async (flightId) => {
    if (!flightId) return;
    setDeletingFlightId(String(flightId));
    setSyncStatus({ tone: 'info', text: 'Deleting flight from database...' });

    try {
      await deleteFlight(flightId);
      await refreshCurrentFlights();
      window.dispatchEvent(new Event('flightsUpdated'));
      setSyncStatus({ tone: 'success', text: 'Flight deleted and synced successfully.' });
      setSuccessMessage('Flight removed successfully.');
      setTimeout(() => setSuccessMessage(''), 1800);
    } catch {
      setSyncStatus({ tone: 'error', text: 'Failed to delete flight from backend.' });
    } finally {
      setDeletingFlightId(null);
    }
  };

  const totalFare =
    formData.baseFare && formData.taxes
      ? (parseFloat(formData.baseFare) + parseFloat(formData.taxes)).toFixed(2)
      : '0.00';

  const isRoundTripRoute =
    formData.sourceAirport &&
    formData.destinationAirport &&
    formData.sourceAirport === formData.destinationAirport;

  return (
    <div className="admin-add-flight-page">
      <div className="admin-container">
        {/* Page Header */}
        <div className="admin-header fade-in">
          <div className="header-content">
            <h1 className="admin-title">
              <i className="bi bi-airplane-fill"></i> Add New Flight
            </h1>
            <p className="admin-subtitle">Manually configure and publish premium flights in Skyline Airways fleet</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && <div className="admin-alert-success fade-in">{successMessage}</div>}
        <div className={`admin-sync-status ${syncStatus.tone}`}>
          <i className={`bi ${syncStatus.tone === 'success' ? 'bi-check-circle' : syncStatus.tone === 'error' ? 'bi-x-circle' : 'bi-arrow-repeat'}`}></i>
          <span>{syncStatus.text}</span>
        </div>

        <div className="admin-card luxury-template-card fade-in">
          <h3 className="admin-card-title">
            <i className="bi bi-gem"></i> Luxury Flight Template
          </h3>
          <p className="seat-config-description" style={{ marginTop: 0 }}>
            Load a luxury flight draft, edit every field manually, then save it with the regular Add Flight button.
          </p>
          <div className="luxury-template-actions">
            <button
              type="button"
              className="btn btn-seed-luxury"
              onClick={loadLuxuryFlightTemplate}
            >
              <i className="bi bi-magic"></i> Load Luxury Template
            </button>
            <button
              type="button"
              className="btn btn-reset"
              onClick={resetManualFlightForm}
            >
              <i className="bi bi-arrow-counterclockwise"></i> Clear Draft
            </button>
          </div>
          <div className="luxury-template-notes">
            <span><i className="bi bi-pencil-square"></i> Flight ID can be set manually.</span>
            <span><i className="bi bi-eye"></i> No flight is created until you submit the form.</span>
          </div>
        </div>

        {/* Form Start */}
        <form onSubmit={handleSubmit} className="admin-form fade-in">
          {/* Section 1: Flight Basic Info */}
          <div className="admin-card">
            <h3 className="admin-card-title">
              <i className="bi bi-airplane-engines"></i> Flight Information
            </h3>

            <div className="form-row">
              <FormInput
                id="flightNumber"
                label="Flight Number"
                type="text"
                value={formData.flightNumber}
                onChange={handleInputChange}
                placeholder="e.g., SG101"
                error={errors.flightNumber}
                floating={false}
                autoFocus
              />
              <FormInput
                id="aircraftType"
                label="Aircraft Type"
                type="text"
                value={formData.aircraftType}
                onChange={handleInputChange}
                placeholder="e.g., Boeing 777 / Airbus A350"
                error={errors.aircraftType}
                floating={false}
              />
            </div>

            <div className="form-row">
              <FormInput
                id="flightId"
                label="Flight ID / Route Key"
                type="text"
                value={formData.flightId}
                onChange={handleInputChange}
                placeholder="e.g., 2 or luxury-02"
                error={errors.flightId}
                floating={false}
              />
              
              {/* Source Airport Autocomplete */}
              <div className="form-group">
                <label htmlFor="sourceAirport" className="airport-label">
                  Source Airport <span className="required">⭐</span>
                </label>
                <div className="airport-dropdown-container">
                  <input
                    type="text"
                    id="sourceAirport"
                    className="auth-control airport-search-input"
                    placeholder="Search airport (e.g., Delhi, DEL)"
                    value={sourceSearchTerm || formData.sourceAirport}
                    onChange={(e) => handleSourceSearch(e.target.value)}
                    onFocus={() => setSourceDropdownOpen(true)}
                  />
                  {sourceDropdownOpen && (
                    <div className="airport-dropdown-menu">
                      {getFilteredAirports(sourceSearchTerm).slice(0, 6).map((airport) => (
                        <div
                          key={airport.code}
                          className="airport-option"
                          onClick={() => handleSourceAirportSelect(airport)}
                        >
                          <div className="airport-code">{airport.code}</div>
                          <div className="airport-details">
                            <div className="airport-name">{airport.name}</div>
                            <div className="airport-city">{airport.city}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.sourceAirport && (
                  <div className="airport-selected">
                    ✓ {getSelectedAirport(formData.sourceAirport)?.code} - {getSelectedAirport(formData.sourceAirport)?.city}
                  </div>
                )}
                {errors.sourceAirport && <p className="form-error">{errors.sourceAirport}</p>}
              </div>
            </div>

            <div className="form-row">
              {/* Destination Airport Autocomplete */}
              <div className="form-group">
                <label htmlFor="destinationAirport" className="airport-label">
                  Destination Airport <span className="required">⭐</span>
                </label>
                <div className="airport-dropdown-container">
                  <input
                    type="text"
                    id="destinationAirport"
                    className="auth-control airport-search-input"
                    placeholder="Search airport (e.g., London, LHR)"
                    value={destSearchTerm || formData.destinationAirport}
                    onChange={(e) => handleDestSearch(e.target.value)}
                    onFocus={() => setDestDropdownOpen(true)}
                  />
                  {destDropdownOpen && (
                    <div className="airport-dropdown-menu">
                      {getFilteredAirports(destSearchTerm).slice(0, 6).map((airport) => (
                        <div
                          key={airport.code}
                          className="airport-option"
                          onClick={() => handleDestAirportSelect(airport)}
                        >
                          <div className="airport-code">{airport.code}</div>
                          <div className="airport-details">
                            <div className="airport-name">{airport.name}</div>
                            <div className="airport-city">{airport.city}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.destinationAirport && (
                  <div className="airport-selected">
                    ✓ {getSelectedAirport(formData.destinationAirport)?.code} - {getSelectedAirport(formData.destinationAirport)?.city}
                  </div>
                )}
                {errors.destinationAirport && <p className="form-error">{errors.destinationAirport}</p>}
              </div>
              
              <FormInput
                id="departureDate"
                label="Departure Date"
                type="date"
                min={todayDateString}
                value={formData.departureDate}
                onChange={handleInputChange}
                error={errors.departureDate}
                floating={false}
              />
            </div>

            {isRoundTripRoute && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="midLandingAirport" className="airport-label">
                    Mid-Landing Airport (Round Trip Stop) <span className="required">⭐</span>
                  </label>
                  <div className="airport-dropdown-container">
                    <input
                      type="text"
                      id="midLandingAirport"
                      className="auth-control airport-search-input"
                      placeholder="Search mid-landing airport (e.g., Dubai, DXB)"
                      value={midSearchTerm || formData.midLandingAirport}
                      onChange={(e) => handleMidSearch(e.target.value)}
                      onFocus={() => setMidDropdownOpen(true)}
                    />
                    {midDropdownOpen && (
                      <div className="airport-dropdown-menu">
                        {getFilteredAirports(midSearchTerm)
                          .slice(0, 6)
                          .filter((airport) => airport.code !== formData.sourceAirport)
                          .map((airport) => (
                            <div
                              key={airport.code}
                              className="airport-option"
                              onClick={() => handleMidAirportSelect(airport)}
                            >
                              <div className="airport-code">{airport.code}</div>
                              <div className="airport-details">
                                <div className="airport-name">{airport.name}</div>
                                <div className="airport-city">{airport.city}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {formData.midLandingAirport && (
                    <div className="airport-selected">
                      ✓ {getSelectedAirport(formData.midLandingAirport)?.code} - {getSelectedAirport(formData.midLandingAirport)?.city}
                    </div>
                  )}
                  {errors.midLandingAirport && <p className="form-error">{errors.midLandingAirport}</p>}
                </div>
              </div>
            )}

            <div className="form-row">
              <FormInput
                id="departureTime"
                label="Departure Time"
                type="time"
                value={formData.departureTime}
                onChange={handleInputChange}
                error={errors.departureTime}
                floating={false}
              />
              <FormInput
                id="arrivalDate"
                label="Arrival Date"
                type="date"
                min={formData.departureDate || todayDateString}
                value={formData.arrivalDate}
                onChange={handleInputChange}
                error={errors.arrivalDate}
                floating={false}
              />
            </div>

            <FormInput
              id="arrivalTime"
              label="Arrival Time"
              type="time"
              value={formData.arrivalTime}
              onChange={handleInputChange}
              error={errors.arrivalTime}
              floating={false}
            />
          </div>

          {/* Section 2: Pricing */}
          <div className="admin-card">
            <h3 className="admin-card-title">
              <i className="bi bi-credit-card"></i> Pricing (INR - Indian Rupees)
            </h3>

            <div className="form-row">
              <FormInput
                id="baseFare"
                label="Base Fare (₹)"
                type="number"
                step="0.01"
                value={formData.baseFare}
                onChange={handleInputChange}
                placeholder="e.g., 5000.00"
                error={errors.baseFare}
                floating={false}
              />
              <FormInput
                id="taxes"
                label="Taxes (₹)"
                type="number"
                step="0.01"
                value={formData.taxes}
                onChange={handleInputChange}
                placeholder="e.g., 500.00"
                error={errors.taxes}
                floating={false}
              />
            </div>

            <div className="form-row">
              <FormInput
                id="businessMultiplier"
                label="Business Class Multiplier"
                type="number"
                step="0.01"
                min="1.0"
                max="3.0"
                value={formData.businessMultiplier}
                onChange={handleInputChange}
                placeholder="e.g., 1.5"
                floating={false}
              />
            </div>

            {/* Pricing Cards Display */}
            {(formData.baseFare && formData.taxes) && (
              <div className="pricing-cards-container">
                <div className="pricing-card economy-card">
                  <div className="pricing-card-header economy">
                    <i className="bi bi-person-check"></i>
                    <span>Economy Class</span>
                  </div>
                  <div className="pricing-card-content">
                    <div className="price-display">
                      ₹ {pricing.economy.toLocaleString('en-IN')}
                    </div>
                    <div className="price-breakdown">
                      <small>Base: ₹{parseFloat(formData.baseFare).toLocaleString('en-IN')}</small>
                      <small>+ Tax: ₹{parseFloat(formData.taxes).toLocaleString('en-IN')}</small>
                    </div>
                  </div>
                </div>

                <div className="pricing-card business-card">
                  <div className="pricing-card-header business">
                    <i className="bi bi-star"></i>
                    <span>Business Class</span>
                  </div>
                  <div className="pricing-card-content">
                    <div className="price-display">
                      ₹ {pricing.business.toLocaleString('en-IN')}
                    </div>
                    <div className="price-breakdown">
                      <small>Base × {parseFloat(formData.businessMultiplier) || 1.5}: ₹{(parseFloat(formData.baseFare) * (parseFloat(formData.businessMultiplier) || 1.5)).toLocaleString('en-IN')}</small>
                      <small>+ Tax: ₹{parseFloat(formData.taxes).toLocaleString('en-IN')}</small>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Fare Display */}
            <div className="fare-summary">
              <div className="fare-row">
                <span>Base Fare:</span>
                <span className="fare-value">₹ {formData.baseFare || '0.00'}</span>
              </div>
              <div className="fare-row">
                <span>Taxes:</span>
                <span className="fare-value">₹ {formData.taxes || '0.00'}</span>
              </div>
              <div className="fare-row total">
                <span>Total Fare:</span>
                <span className="fare-value-total">₹ {totalFare}</span>
              </div>
            </div>
          </div>

          {/* Section 3: In-flight Services */}
          <div className="admin-card">
            <h3 className="admin-card-title">
              <i className="bi bi-star-fill"></i> In-Flight Services
            </h3>

            <div className="services-grid">
              <label className="service-checkbox">
                <input
                  type="checkbox"
                  checked={services.meals}
                  onChange={() => handleServiceChange('meals')}
                />
                <span className="service-label">
                  <i className="bi bi-cup-hot"></i> In-flight Meals
                </span>
              </label>

              <label className="service-checkbox">
                <input
                  type="checkbox"
                  checked={services.wifi}
                  onChange={() => handleServiceChange('wifi')}
                />
                <span className="service-label">
                  <i className="bi bi-wifi"></i> WiFi
                </span>
              </label>

              <label className="service-checkbox">
                <input
                  type="checkbox"
                  checked={services.baggage}
                  onChange={() => handleServiceChange('baggage')}
                />
                <span className="service-label">
                  <i className="bi bi-bag-check"></i> Extra Baggage
                </span>
              </label>

              <label className="service-checkbox">
                <input
                  type="checkbox"
                  checked={services.entertainment}
                  onChange={() => handleServiceChange('entertainment')}
                />
                <span className="service-label">
                  <i className="bi bi-film"></i> Entertainment
                </span>
              </label>

              <label className="service-checkbox">
                <input
                  type="checkbox"
                  checked={services.priorityBoarding}
                  onChange={() => handleServiceChange('priorityBoarding')}
                />
                <span className="service-label">
                  <i className="bi bi-bookmark-star"></i> Priority Boarding
                </span>
              </label>
            </div>
          </div>

          {/* Section 4: Seating Classes Configuration */}
          <div className="admin-card">
            <SeatClassConfiguration seatClasses={seatClasses} pricing={pricing} onChange={setSeatClasses} />
          </div>

          {/* Section 5: Flight Image Upload */}
          <div className="admin-card">
            <h3 className="admin-card-title">
              <i className="bi bi-image"></i> Flight Image
            </h3>

            <div className="image-upload-container">
              <label htmlFor="flightImage" className="image-upload-label">
                <input
                  id="flightImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-upload-input"
                  aria-label="Upload flight image"
                />
                <div className="image-upload-box">
                  <i className="bi bi-cloud-arrow-up"></i>
                  <p>Click or drag image here (Max 5MB)</p>
                  <small>PNG, JPG, GIF supported</small>
                </div>
              </label>
              {errors.flightImage && <p className="form-error">{errors.flightImage}</p>}
            </div>

            {/* Image Preview */}
            {formData.imagePreview && (
              <div className="image-preview-container fade-in">
                <img src={formData.imagePreview} alt="Flight preview" className="image-preview" />
                <p className="image-filename">{formData.flightImage.name}</p>
              </div>
            )}
          </div>

          {/* Section 5: Map Selection (Optional but shown) */}
          <div className="admin-card">
            <h3 className="admin-card-title">
              <i className="bi bi-geo-alt"></i> Airport Locations
            </h3>

            <div className="map-row">
              <MapSelector
                title="Source Airport Location"
                placeholder="Choose source airport above to preview map"
                airport={getSelectedAirport(formData.sourceAirport)}
              />
            </div>

            <div className="map-row">
              <MapSelector
                title="Destination Airport Location"
                placeholder="Choose destination airport above to preview map"
                airport={getSelectedAirport(formData.destinationAirport)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="admin-actions">
            <button type="submit" className="btn btn-add-flight" disabled={isSubmitting}>
              <i className="bi bi-plus-circle"></i> Add Flight
            </button>
            <button
              type="reset"
              className="btn btn-reset"
              onClick={resetManualFlightForm}
            >
              <i className="bi bi-arrow-counterclockwise"></i> Reset
            </button>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">
              <i className="bi bi-list-check"></i> Manage Existing Flights
            </h3>

            {currentFlights.length === 0 ? (
              <p className="admin-subtle-text">No flights available yet.</p>
            ) : (
              <div className="admin-flight-list">
                {currentFlights.map((flight) => {
                  const flightId = flight.id || flight._id || flight.flightNumber;
                  return (
                    <div key={flightId} className="admin-flight-item">
                      <div className="admin-flight-meta">
                        <strong>{flight.flightNumber || 'Skyline'}</strong>
                        <span>{flight.sourceAirport} → {flight.destinationAirport}</span>
                        <span>₹{Number(flight.baseFare || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="admin-flight-actions">
                        <a href={`/flight/${flightId}`} className="btn btn-open-row" target="_blank" rel="noreferrer">
                          <i className="bi bi-eye"></i> View
                        </a>
                        <button
                          type="button"
                          className="btn btn-reset btn-delete-flight"
                          disabled={deletingFlightId === String(flightId)}
                          onClick={() => handleDeleteFlight(flightId)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFlight;
