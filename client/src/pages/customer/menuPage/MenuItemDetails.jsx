import { ChevronLeft, ShoppingCart, HeartIcon, StarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { getMenuItemById } from "../../../api/menu";
import formatPrice from "../../../utils/money";

export default function MenuItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  }

  const decreaseQuantity = () => {
    setQuantity((prevQuantity) => Math.max(1, prevQuantity - 1));
  }

  useEffect(() => {
    // If the id changes (or the user leaves) before the response arrives,
    // ignore the old response so it can't overwrite the newer one.
    let ignore = false;

    getMenuItemById(id)
      .then((data) => {
        if (!ignore) setItem(data);
      }).catch((error) => {
        console.error("Error fetching menu item:", error);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FEF3C6] px-4 text-[#2F1307]">
      <header className="mx-auto w-full max-w-lg px-4 pb-4 pt-14 sm:px-8 md:max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Go back"
              className="relative shrink-0 cursor-pointer text-[#FB7214] after:absolute after:-inset-2 after:content-['']"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft />
            </button>
            <h1 className="min-w-0 text-xl font-medium sm:text-2xl">{item?.name}</h1>
            <span className="ml-5 h-2 w-2 shrink-0 rounded-full bg-[#F9E89A]" aria-hidden="true" />
          </div>
          <button
            type="button"
            aria-label="Add to favourites"
            className="relative flex shrink-0 items-center justify-center rounded-full bg-[#FAE99B] p-1.5 text-[#767A59] shadow-[0_0_0_4px_#FCEEB4] after:absolute after:-inset-3 after:content-['']"
          >
            <HeartIcon size={16} className="fill-current" />
          </button>
        </div>
        <span className="mt-1 ml-6 inline-flex items-center gap-1 rounded-full bg-[#FB7214] pl-2 pr-1.5 text-sm font-medium text-white">
          5.0
          <StarIcon size={12} />
        </span>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 rounded-t-[2.5rem] bg-white px-5 pb-32 pt-6 md:max-w-2xl md:px-8">
        <div className="aspect-4/3 w-full overflow-hidden rounded-4xl bg-amber-100 md:aspect-16/10">
          <img src={item?.imageUrl} alt={item?.name ?? ""} className="h-full w-full object-cover" />
        </div>

        {/* Price + quantity */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-orange-200 pb-4">
          <p className="text-2xl font-extrabold text-[#d9700a] sm:text-3xl">
            {item && formatPrice(item.price)}
          </p>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={decreaseQuantity}
              className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#FCE9A0] text-xl font-bold text-[#6B5A50] after:absolute after:-inset-1.5 after:content-['']"
            >
              −
            </button>
            <span className="min-w-6 text-center text-xl sm:text-2xl">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={increaseQuantity}
              className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-orange-500 bg-[#FCE9A0] text-xl font-bold text-[#6B5A50] after:absolute after:-inset-1.5 after:content-['']"
            >
              +
            </button>
          </div>
        </div>

        {/* Description */}
        <section className="mt-4">
          <h2 className="text-lg font-medium">{item?.name}</h2>
          <p className="mt-1 leading-snug">{item?.description}</p>
        </section>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#FCE48E] px-8 py-2 text-xl font-semibold text-black sm:w-auto"
          >
            <ShoppingCart />
            Add to Cart
          </button>
        </div>
      </main>
    </div>
  );
}