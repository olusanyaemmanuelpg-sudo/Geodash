import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Car,
  Zap,
  Sparkles,
  Truck,
  CreditCard,
} from 'lucide-react';

export default function PassengerSidebar() {
  const [selectedTier, setSelectedTier] = useState('standard');

  const rideTiers = [
    {
      id: 'standard',
      name: 'Standard Sedan',
      capacity: 4,
      eta: '3 min',
      price: '$14.20',
      strikePrice: '$17.50',
      desc: 'Fastest pickup',
      icon: Car,
      color: 'text-zinc-900 dark:text-white',
    },
    {
      id: 'comfort',
      name: 'Comfort Electric',
      capacity: 4,
      eta: '5 min',
      price: '$18.50',
      desc: 'Zero emission • Eco Choice',
      icon: Zap,
      color: 'text-blue-500',
    },
    {
      id: 'executive',
      name: 'Velox Executive',
      capacity: 4,
      eta: '6 min',
      price: '$26.80',
      desc: 'Top-rated drivers • Quiet ride',
      icon: Sparkles,
      color: 'text-purple-500',
    },
    {
      id: 'logistics',
      name: 'Logistics XL',
      capacity: 6,
      eta: '7 min',
      price: '$32.00',
      desc: 'Luggage & groups • Spacious',
      icon: Truck,
      color: 'text-amber-500',
    },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 w-96 max-h-[calc(100vh-2rem)] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl flex flex-col overflow-hidden text-zinc-900 dark:text-white transition-colors duration-500">
      {/* Address Form Inputs */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-lg tracking-tight">Book a Ride</h1>
          <span className="text-xs bg-gray-200/70 dark:bg-zinc-800 px-2 py-1 rounded-md font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
            Leave Now ▾
          </span>
        </div>

        <div className="space-y-2 relative">
          <div className="absolute left-[1.15rem] top-7 bottom-7 w-0.5 bg-gray-200 dark:bg-zinc-700"></div>

          <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-gray-200/80 dark:border-zinc-700 shadow-sm">
            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Pickup Point
              </p>
              <p className="text-xs font-medium truncate">
                540 Howard St, San Francisco
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-gray-200/80 dark:border-zinc-700 shadow-sm">
            <Navigation className="w-4 h-4 text-zinc-900 dark:text-white flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Destination
              </p>
              <p className="text-xs font-medium truncate">
                SF Ferry Building (The Embarcadero)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ride Tiers List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[380px]">
        {rideTiers.map((tier) => {
          const IconComponent = tier.icon;
          const isSelected = selectedTier === tier.id;

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer
                ${
                  isSelected
                    ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800'
                    : 'border-gray-100 dark:border-zinc-800/50 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-zinc-700 flex-shrink-0">
                  <IconComponent className={`w-5 h-5 ${tier.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs tracking-tight">
                      {tier.name}
                    </span>
                    <span className="text-[10px] opacity-60">
                      👥 {tier.capacity}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {tier.desc}
                  </p>
                  <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {tier.eta} away
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <span className="font-bold text-sm tracking-tight">
                  {tier.price}
                </span>
                {tier.strikePrice && (
                  <p className="text-[10px] text-gray-400 line-through mt-0.5">
                    {tier.strikePrice}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Checkout Block */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Apple Pay •••• 4821</span>
          </div>
          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-semibold tracking-tight">
            -$3.30 Promo
          </span>
        </div>

        <button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 font-bold py-3 px-4 rounded-xl shadow-md transition text-sm flex items-center justify-between px-5">
          <span>
            Request{' '}
            {rideTiers.find((t) => t.id === selectedTier)?.name.split(' ')[0]}
          </span>
          <span className="opacity-90">
            {rideTiers.find((t) => t.id === selectedTier)?.price}
          </span>
        </button>
      </div>
    </div>
  );
}
