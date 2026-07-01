import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { JarvisAiBanner } from "@/components/leverx/JarvisAiBanner";
import { PromoBanner } from "@/components/leverx/PromoBanner";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/pagination";

type Props = {
  className?: string;
};

export function MarketsPromoBanners({ className }: Props) {
  return (
    <div className={cn("markets-promo-banners", className)}>
      <Swiper
        className="markets-promo-swiper"
        modules={[Pagination]}
        slidesPerView={1.1}
        spaceBetween={8}
        pagination={{ clickable: true }}
        breakpoints={{
          640: {
            slidesPerView: 1.5,
            spaceBetween: 8,
          },
          1024: {
            slidesPerView: 2,
            spaceBetween: 8,
            allowTouchMove: false,
          },
        }}
      >
        <SwiperSlide className="markets-promo-slide">
          <PromoBanner className="h-full w-full" />
        </SwiperSlide>
        <SwiperSlide className="markets-promo-slide">
          <JarvisAiBanner className="h-full w-full" />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
