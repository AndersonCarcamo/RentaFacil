/**
 * MobileListingPage Component
 * Main wizard controller for creating/editing properties on mobile
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MobileListingLayout from './MobileListingLayout';
import StepIndicator from './StepIndicator';
import NavigationButtons from './NavigationButtons';
import Step1Basic from './steps/Step1Basic';
import Step2Location from './steps/Step2Location';
import Step3Details from './steps/Step3Details';
import Step4Price from './steps/Step4Price';
import Step5Features from './steps/Step5Features';
import Step6Images from './steps/Step6Images';
import Step7Contact from './steps/Step7Contact';
import Step8Review from './steps/Step8Review';

interface ListingData {
  // Step 1
  propertyType: string;
  operationType: 'alquiler' | 'venta';
  
  // Step 2
  address: string;
  district: string;
  city: string;
  coordinates?: { lat: number; lng: number };
  
  // Step 3
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  
  // Step 4
  price: number;
  currency: string;
  includesUtilities: boolean;
  
  // Step 5
  amenities: string[];
  furnished: boolean;
  parking: boolean;
  pets: boolean;
  
  // Step 6
  images: File[];
  
  // Step 7
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContact: 'whatsapp' | 'phone' | 'email';
}

const TOTAL_STEPS = 8;
const DRAFT_KEY = 'listing_draft';

const stepTitles = [
  'Tipo',
  'Ubicación',
  'Detalles',
  'Precio',
  'Características',
  'Fotos',
  'Contacto',
  'Revisar'
];

export default function MobileListingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form data
  const [data, setData] = useState<ListingData>({
    propertyType: '',
    operationType: 'alquiler',
    address: '',
    district: '',
    city: '',
    title: '',
    description: '',
    bedrooms: 0,
    bathrooms: 1,
    area: 0,
    price: 0,
    currency: 'S/',
    includesUtilities: false,
    amenities: [],
    furnished: false,
    parking: false,
    pets: false,
    images: [],
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    preferredContact: 'whatsapp'
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft);
        // Don't load images from localStorage (they're File objects)
        const { images, ...restData } = parsedData;
        setData({ ...data, ...restData });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Auto-save to localStorage (every 30s or on change)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      const { images, ...dataToSave } = data;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
    }, 1000); // Debounce 1s

    return () => clearTimeout(saveTimer);
  }, [data]);

  // Update data from steps
  const updateData = (newData: Partial<ListingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  // Validation per step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!data.propertyType && !!data.operationType;
      case 2:
        return !!data.address && !!data.district && !!data.city;
      case 3:
        return !!data.title && data.title.length >= 10;
      case 4:
        return data.price > 0;
      case 5:
        return true; // Optional
      case 6:
        return data.images.length > 0;
      case 7:
        return !!data.contactPhone || !!data.contactEmail;
      case 8:
        return true; // Final review
      default:
        return false;
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handlePublish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Publish listing
  const handlePublish = async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // const formData = new FormData();
      // Object.keys(data).forEach(key => {
      //   if (key === 'images') {
      //     data.images.forEach(img => formData.append('images', img));
      //   } else {
      //     formData.append(key, data[key]);
      //   }
      // });
      // await createListing(formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      // Show success
      setShowSuccess(true);

      // Redirect after 2s
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Error al publicar. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Basic
            data={{
              propertyType: data.propertyType,
              operationType: data.operationType
            }}
            onChange={updateData}
          />
        );
      case 2:
        return (
          <Step2Location
            data={{
              address: data.address,
              district: data.district,
              city: data.city,
              coordinates: data.coordinates
            }}
            onChange={updateData}
          />
        );
      case 3:
        return (
          <Step3Details
            data={{
              title: data.title,
              description: data.description,
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              area: data.area
            }}
            onChange={updateData}
          />
        );
      case 4:
        return (
          <Step4Price
            data={{
              price: data.price,
              currency: data.currency,
              includesUtilities: data.includesUtilities
            }}
            onChange={updateData}
          />
        );
      case 5:
        return (
          <Step5Features
            data={{
              amenities: data.amenities,
              furnished: data.furnished,
              parking: data.parking,
              pets: data.pets
            }}
            onChange={updateData}
          />
        );
      case 6:
        return (
          <Step6Images
            data={{
              images: data.images
            }}
            onChange={updateData}
          />
        );
      case 7:
        return (
          <Step7Contact
            data={{
              contactName: data.contactName,
              contactPhone: data.contactPhone,
              contactEmail: data.contactEmail,
              preferredContact: data.preferredContact
            }}
            onChange={updateData}
          />
        );
      case 8:
        return <Step8Review data={data} />;
      default:
        return null;
    }
  };

  return (
    <>
      <MobileListingLayout
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onClose={() => {
          if (confirm('¿Deseas guardar como borrador?')) {
            router.push('/dashboard');
          }
        }}
        onBack={currentStep > 1 ? handlePrevious : undefined}
      >
        {/* Step Indicator */}
        <StepIndicator
          steps={stepTitles.map((title, index) => ({
            number: index + 1,
            title,
            isComplete: index + 1 < currentStep,
            isCurrent: index + 1 === currentStep
          }))}
        />

        {/* Current Step Content */}
        <div className="px-4 py-4 pb-20">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <NavigationButtons
          onNext={currentStep < TOTAL_STEPS ? handleNext : undefined}
          onSubmit={currentStep === TOTAL_STEPS ? handlePublish : undefined}
          onPrevious={currentStep > 1 ? handlePrevious : undefined}
          isFirstStep={currentStep === 1}
          isLastStep={currentStep === TOTAL_STEPS}
          isNextDisabled={!isStepValid(currentStep)}
          isLoading={isLoading}
        />
      </MobileListingLayout>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¡Propiedad publicada!
            </h3>
            <p className="text-gray-600">
              Tu propiedad ya está visible para los interesados
            </p>
          </div>
        </div>
      )}
    </>
  );
}
