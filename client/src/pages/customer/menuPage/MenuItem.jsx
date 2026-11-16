import { Link } from "react-router";
// import { Star } from "lucide-react";
import formatPrice from "../../../utils/money";

export default function MenuItem({ item }) {
  return (
    <article className="min-w-0 border-b border-b-red-300 pb-5">
      <Link to={`/menu/${item.id}`} className="block mb-2 overflow-hidden rounded-4xl cursor-pointer">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="aspect-16/10 max-h-56 w-full object-cover sm:aspect-4/3"
          />
      </Link>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <h3 className="min-w-0 flex-1 basis-36 text-base font-bold sm:text-[1.2rem]">
            {item.name}
          </h3>

          <div className="flex shrink-0 items-center gap-2">
            {/* <span className="flex items-center gap-1.5 rounded-xl bg-[#f7891f] px-2 text-[0.75rem] font-medium text-white">
              {item.rating}
              <Star size={12} fill="currentColor" aria-hidden="true" />
            </span> */}

            <p className="font-bold text-[#d9700a]">{formatPrice(item.price)}</p>
          </div>
        </div>

        <p className="text-[0.8rem]">{item.description}</p>
      </div>
    </article>
  );
}