import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  /** Optional: show subtle watermark (e.g. for main content card) */
  watermark?: boolean;
  children: React.ReactNode;
};

const LOGO_WATERMARK_SRC = `${import.meta.env.BASE_URL}favico/apple-touch-icon.png`;

export function Card({
  title,
  description,
  watermark = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const baseClass = "card";
  const withWatermark = watermark ? " card--watermark" : "";
  const finalClass = `${baseClass}${withWatermark} ${className}`.trim();

  return (
    <section className={finalClass} {...rest}>
      {watermark ? (
        <div className="card__watermark" aria-hidden>
          <img src={LOGO_WATERMARK_SRC} alt="" />
        </div>
      ) : null}
      {title != null ? <h2 className="card__title">{title}</h2> : null}
      {description != null ? <p className="card__description muted">{description}</p> : null}
      {children}
    </section>
  );
}
