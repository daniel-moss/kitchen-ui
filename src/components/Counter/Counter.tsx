import clsx from "clsx";

import styles from "./Counter.module.scss";
import { CounterProps } from "./Counter.types";

// A small 20px pill showing a count. See Figma "Counter".
export default function Counter({ value, className, ...rest }: CounterProps) {
  return (
    <span className={clsx(styles.counter, className)} {...rest}>
      {value}
    </span>
  );
}
