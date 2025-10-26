'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ZodiacIcon } from './ZodiacIcon';

const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const RadionicSpinner: React.FC = () => {
  const [currentZodiacIndex, setCurrentZodiacIndex] = useState(0);
  const [zodiacVisible, setZodiacVisible] = useState(true);

  // Motion values for continuous rotations
  const ring1Rotation = useMotionValue(0);
  const ring2Rotation = useMotionValue(0);
  const ellipseAngle = useMotionValue(0);

  // Calculate planet position on ellipse
  const ellipsePlanetX = useTransform(ellipseAngle, (angle) => {
    const angleInRadians = (angle * Math.PI) / 180;
    const tiltAngle = -20; // degrees
    const tiltRadians = (tiltAngle * Math.PI) / 180;

    const a = 125; // semi-major axis (horizontal) - wider
    const b = 65; // semi-minor axis (vertical)

    // Calculate position on ellipse
    const xEllipse = a * Math.cos(angleInRadians);
    const yEllipse = b * Math.sin(angleInRadians);

    // Apply rotation to match the tilted ellipse
    const x = xEllipse * Math.cos(tiltRadians) - yEllipse * Math.sin(tiltRadians);

    return x;
  });

  const ellipsePlanetY = useTransform(ellipseAngle, (angle) => {
    const angleInRadians = (angle * Math.PI) / 180;
    const tiltAngle = -20; // degrees
    const tiltRadians = (tiltAngle * Math.PI) / 180;

    const a = 125; // semi-major axis (horizontal) - wider
    const b = 65; // semi-minor axis (vertical)

    // Calculate position on ellipse
    const xEllipse = a * Math.cos(angleInRadians);
    const yEllipse = b * Math.sin(angleInRadians);

    // Apply rotation to match the tilted ellipse
    const y = xEllipse * Math.sin(tiltRadians) + yEllipse * Math.cos(tiltRadians);

    return y;
  });

  useEffect(() => {
    // Start continuous rotations
    const ring1Animation = animate(ring1Rotation, [0, 360], {
      duration: 5,
      repeat: Infinity,
      ease: 'linear',
    });

    const ring2Animation = animate(ring2Rotation, [0, -360], {
      duration: 7,
      repeat: Infinity,
      ease: 'linear',
    });

    const ellipseAnimation = animate(ellipseAngle, [0, 360], {
      duration: 8,
      repeat: Infinity,
      ease: 'linear',
    });

    // Zodiac symbol cycling with fade effect
    const zodiacInterval = setInterval(() => {
      setZodiacVisible(false);
      setTimeout(() => {
        setCurrentZodiacIndex((prev) => (prev + 1) % ZODIAC_SIGNS.length);
        setZodiacVisible(true);
      }, 500);
    }, 3000);

    return () => {
      ring1Animation.stop();
      ring2Animation.stop();
      ellipseAnimation.stop();
      clearInterval(zodiacInterval);
    };
  }, [ring1Rotation, ring2Rotation, ellipseAngle]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="relative w-[280px] h-[280px] flex items-center justify-center"
    >
      {/* Elliptical orbit - outermost */}
      <div className="absolute w-[260px] h-[150px] flex items-center justify-center">
        <svg
          width="260"
          height="150"
          className="absolute"
          style={{ overflow: 'visible' }}
        >
          <ellipse
            cx="130"
            cy="75"
            rx="123"
            ry="63"
            stroke="#F6D99F"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            transform="rotate(-20 130 75)"
          />
        </svg>
        {/* Planet on ellipse */}
        <motion.div
          className="absolute w-[14px] h-[14px] rounded-full bg-[#F6D99F]"
          style={{
            x: ellipsePlanetX,
            y: ellipsePlanetY,
          }}
        />
      </div>

      {/* First ring - full circle */}
      <div className="absolute w-[192px] h-[192px] flex items-center justify-center">
        <div className="w-[192px] h-[192px] rounded-full border-2 border-[#F6D99F] opacity-50" />
        {/* Planet on first ring */}
        <motion.div
          className="absolute w-[192px] h-[192px]"
          style={{ rotate: ring1Rotation }}
        >
          <div className="w-[12px] h-[12px] rounded-full bg-[#F6D99F] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
      </div>

      {/* Second ring - full circle */}
      <div className="absolute w-[144px] h-[144px] flex items-center justify-center">
        <div className="w-[144px] h-[144px] rounded-full border-2 border-[#F6D99F] opacity-50" />
        {/* Planet on second ring */}
        <motion.div
          className="absolute w-[144px] h-[144px]"
          style={{ rotate: ring2Rotation }}
        >
          <div className="w-[10px] h-[10px] rounded-full bg-[#F6D99F] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
      </div>

      {/* Center zodiac symbol */}
      <motion.div
        className="absolute z-10 flex items-center justify-center w-[50px] h-[50px]"
        animate={{ opacity: zodiacVisible ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <ZodiacIcon sign={ZODIAC_SIGNS[currentZodiacIndex]} size={32} color="#F6D99F" />
      </motion.div>
    </motion.div>
  );
};

export default RadionicSpinner;
