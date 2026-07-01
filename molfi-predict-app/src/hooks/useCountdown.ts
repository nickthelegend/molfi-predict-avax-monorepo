import { useState, useEffect, useCallback } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const useCountdown = (targetDate: string): TimeLeft => {
  const calculateTimeLeft = useCallback((): TimeLeft => {
    // Validate and parse the target date
    let parsedDate: Date;
    
    // Handle different date formats
    if (!targetDate) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
    }
    
    // Check if it's a Unix timestamp (number as string)
    if (/^\d+$/.test(targetDate)) {
      // Unix timestamp in seconds or milliseconds
      const timestamp = parseInt(targetDate);
      parsedDate = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
    } else {
      // ISO string or other date format
      parsedDate = new Date(targetDate);
    }
    
    // Validate the parsed date
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date format:', targetDate);
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
    }
    
    const difference = parsedDate.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return timeLeft;
};

