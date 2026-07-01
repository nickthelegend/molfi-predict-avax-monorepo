import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Props = {
  badge?: string;
  imageSrc: string;
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
  ctaVariant?: "brand" | "neutral";
  layout?: "banner" | "compact";
  className?: string;
};

export function MarketsHeroPromoCard({
  badge,
  imageSrc,
  title,
  description,
  ctaLabel,
  to,
  ctaVariant = "brand",
  layout = "banner",
  className,
}: Props) {
  if (layout === "compact") {
    return (
      <article className={cn("hero-promo-card hero-promo-card--compact", className)}>
        <img src={imageSrc} alt="" className="hero-promo-card-thumb" aria-hidden />
        <div className="hero-promo-card-copy">
          <div className="hero-promo-card-heading">
            <h2 className="hero-promo-card-title">{title}</h2>
            {badge ? <span className="hero-promo-card-badge">{badge}</span> : null}
          </div>
          <p className="hero-promo-card-desc">{description}</p>
        </div>
        <Link
          to={to}
          className={cn(
            "hero-promo-card-cta hero-promo-card-cta--compact",
            ctaVariant === "neutral" && "hero-promo-card-cta--neutral",
          )}
        >
          {ctaLabel}
        </Link>
      </article>
    );
  }

  return (
    <article
      className={cn("hero-promo-card", className)}
      style={{ "--hero-promo-image": `url(${imageSrc})` } as React.CSSProperties}
    >
      <div className="hero-promo-card-bg" aria-hidden />
      <div className="hero-promo-card-scrim" aria-hidden />
      {badge ? <span className="hero-promo-card-badge">{badge}</span> : null}
      <div className="hero-promo-card-body">
        <h2 className="hero-promo-card-title">{title}</h2>
        <p className="hero-promo-card-desc">{description}</p>
        <Link
          to={to}
          className={cn(
            "hero-promo-card-cta",
            ctaVariant === "neutral" && "hero-promo-card-cta--neutral",
          )}
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
