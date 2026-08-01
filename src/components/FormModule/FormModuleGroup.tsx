import { Children, Fragment, isValidElement } from "react";

import clsx from "clsx";

import { Divider } from "../Divider/Divider";

import styles from "./FormModuleGroup.module.scss";
import { FormModuleGroupProps } from "./FormModuleGroup.types";

// FormModuleGroup — stacks two or more FormModules, 32px apart, with a low
// (gray-a3) Divider between each consecutive pair. See Figma "FormModuleGroup"
// (node 28598-65185): a full-width 1px gray-a3 divider, gap on both sides
// (Daniel, 2026-07-25 — bumped to 32px / --size-8).
export default function FormModuleGroup({ children, className }: FormModuleGroupProps) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <div className={clsx(styles.group, className)}>
      {items.map((child, i) => (
        <Fragment key={child.key ?? i}>
          {i > 0 && <Divider contrast="low" />}
          {child}
        </Fragment>
      ))}
    </div>
  );
}
