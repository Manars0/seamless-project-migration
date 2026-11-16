import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

export function CountUp({ value, decimals = 0, format }: { value: number; decimals?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(value);
  const prev = useRef(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setN(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration: 0.9, ease: "easeOut", onUpdate: setN });
    prev.current = value;
    return () => c.stop();
  }, [value, inView, reduce]);
  return <span ref={ref} className="num">{format ? format(n) : n.toFixed(decimals)}</span>;
}
