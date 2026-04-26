
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

export const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      image: "/Hero-Images/hero-1.webp",
      title: "ATHLETIC FORCE 1",
      subtitle: "Engineered For Victory"
    },
    {
      image: "/Hero-Images/hero-2.webp",
      title: "CUSTOM GEAR",
      subtitle: "Designed For Your Team"
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative w-full rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden bg-slate-200 group">
      {/* Background Image Container */}
      <div className="aspect-video sm:aspect-21/9 lg:aspect-21/8 w-full relative">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 1120px, 100vw"
              className="object-cover brightness-95"
            />
            
            {/* Decorative Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div className="text-center">
                <h1 className="font-black text-white/70 text-[7vw] sm:text-[10vw] md:text-[8vw] lg:text-[90px] tracking-widest whitespace-nowrap select-none opacity-100 scale-110">
                  {slide.title}
                </h1>
                <p className="text-white/60 text-sm sm:text-base md:text-lg lg:text-xl font-semibold tracking-[0.3em] mt-2 uppercase">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 z-20"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 z-20"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Carousel Indicators with Progress Lines */}
        <div className="absolute bottom-3 sm:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex gap-3 sm:gap-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="flex flex-col items-center gap-1.5 group/indicator"
              >
                
                {/* Progress Line */}
                <div className="w-12 sm:w-16 lg:w-20 h-0.5 sm:h-1 rounded-full bg-white/20 overflow-hidden">
                  <div 
                    className={`h-full bg-white transition-all duration-300 ${
                      index === currentSlide ? 'w-full' : 'w-0'
                    }`}
                    style={{
                      transition: index === currentSlide ? 'width 5000ms linear' : 'width 300ms ease'
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
