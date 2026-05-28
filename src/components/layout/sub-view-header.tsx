"use client";

import Link from "next/link";

type SubViewHeaderProps = {
  title: string;
  backHref: string;
  icon?: string;
  iconStyle?: React.CSSProperties;
  rightContent?: React.ReactNode;
};

export function SubViewHeader({ title, backHref, icon, iconStyle, rightContent }: SubViewHeaderProps) {
  return (
    <header className="view-header border-b">
      <Link href={backHref} className="btn-icon btn-glass shrink-0" style={{ textDecoration: "none" }}>
        <i className="fa-solid fa-chevron-left" />
      </Link>
      <div className="view-title flex-1 min-w-0 justify-center px-4 flex items-center gap-2">
        {icon && <i className={`fa-solid ${icon}`} style={iconStyle} />}
        <h1 className="truncate text-center w-full text-lg font-bold">{title}</h1>
      </div>
      <div className="shrink-0" style={{ width: "2.5rem" }}>
        {rightContent}
      </div>
    </header>
  );
}
