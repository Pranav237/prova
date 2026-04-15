import { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';

interface SessionTimerProps {
  startTime: Date;
}

const SessionTimer = ({ startTime }: SessionTimerProps) => {
  const [elapsed, setElapsed] = useState('0:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  return <Text style={styles.timer}>{elapsed}</Text>;
};

const styles = StyleSheet.create({
  timer: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.purple.soft,
    letterSpacing: 0.5,
  },
});

export default SessionTimer;
