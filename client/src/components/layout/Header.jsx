import { SlidersHorizontal, ShoppingCart, Bell, User } from "lucide-react";

const iconBtn =
  "relative grid p-2 place-items-center rounded-full bg-[#FFF9E8] text-[#F7941D] text-[19px] cursor-pointer hover:bg-[#ffe9b5] hover:text-[#e9830c]";

export default function Header() {
  return (
    <header className="flex relative gap-3 z-1 bg-[#FEF3C6] mx-auto w-full max-w-275 px-6 py-8 pb-12">
      <div className="flex items-center rounded-[30px] bg-white h-10 flex-1 overflow-hidden relative">
        <input className="w-full h-full pl-5 pr-1 border-none outline-none cursor-text text-[15px] text-gray-500" placeholder="Search..." />
        <button type="button" className="grid place-items-center p-2 rounded-full bg-[#f7941D] text-white text-[16px] cursor-pointer border-none shrink-0 hover:bg-[#e9830c]">
          <SlidersHorizontal aria-hidden="true" size={22} />
        </button> 
      </div>

      <div className="flex items-center gap-2.5">
        <button type="button" title="cart" aria-label="cart" className={iconBtn}>
          <ShoppingCart size={24} aria-hidden="true" />
        </button>

        <button type="button" title="notification" aria-label="notification" className={iconBtn}>
          <Bell size={24} aria-hidden="true" />
        </button>

        <button type="button" title="Profile" aria-label="Profile" className={iconBtn}>
          <User size={24} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}