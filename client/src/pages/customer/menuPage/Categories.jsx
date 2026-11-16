import { Soup, UtensilsCrossed, Leaf, IceCreamCone, Martini } from "lucide-react";

const categories = [
  { label: "Snacks", icon: Soup, value: "Snack" },
  { label: "Meal", icon: UtensilsCrossed, value: "Meal" },
  { label: "Vegan", icon: Leaf, value: "Vegan" },
  { label: "Dessert", icon: IceCreamCone, value: "Dessert" },
  { label: "Drinks", icon: Martini, value: "Drink" },
];
const TAB =
  "before:absolute z-10 before:-top-2.5 before:-bottom-7 before:left-1/2 before:-z-1 before:w-[min(100%,92px)] before:-translate-x-1/2 before:rounded-t-[999px] before:bg-white before:content-[''] sm:before:-top-4.5";

const SCOOPS =
  "after:absolute after:bottom-13 after:left-1/2 after:-z-10 after:h-11 after:w-[calc(min(100%,82px)_+_48px)] after:-translate-x-1/2 after:bg-no-repeat after:bg-[size:25.5px_22px] after:bg-[position:left_top,right_top] after:bg-[radial-gradient(circle_at_top_left,transparent_23.5px,white_24px),radial-gradient(circle_at_top_right,transparent_23.5px,white_24px)] after:content-['']";

export default function Categories({ category, setCategory }) {
  return (
    <section aria-label="Categories" className="relative z-2 flex items-stretch overflow-hidden rounded-[28px] bg-[#FCE99C] px-7 pt-6 sm:rounded-[40px] sm:px-2.5 sm:pt-5 h-50 -mt-5">
      {categories.map(({ label, value, icon: Icon }) => {
        const isActive = category === value;

        return (
          <div
            key={label}
            onClick={() => setCategory(value)}
            className={`relative z-1 min-w-0 flex-1 cursor-pointer pb-2 text-center text-[#333] ${
              isActive
                ? `${TAB} ${SCOOPS}`
                : ""
            }`}
          >
            <div className="mx-auto mb-1.5 flex aspect-square w-[80%] max-w-17.5 items-center justify-center rounded-full bg-[#FFF4C7] text-[#EF9142] transition-transform hover:scale-105 duration-200 ease-out sm:mb-2.5">
              <Icon aria-hidden="true" className="h-auto w-[38%] min-w-4" />
            </div>

            <span className="block whitespace-nowrap text-[clamp(10px,2.9vw,15px)] font-medium">
              {label}
            </span>
          </div>
        );
      })}
    </section>
  );
}
