import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

const sortOptions = ["All menu", "Popular", "Categories", "A-Z", "Z-A"];

export default function SortRow() {
  const [toggleSortOptions, setToggleSortOptions] = useState(false);
  const [sortBy, setSortBy] = useState(null);

  return (
    <div className="flex items-center justify-between relative bg-transparent">
      <p className="m-0 flex items-center text-sm">
        Sort by
        <span className={`rounded-full text-[#EF9142] px-2.5 py-0.5 text-xs ${sortBy ? 'block' : 'hidden'} `}>
          {sortBy}
        </span>
      </p>
          
      {/* Sort Options */}
      <div className={`absolute top-12.5 right-0 rounded-[15px] p-2 w-40 z-20 bg-white shadow-md ${toggleSortOptions ? 'block' : 'hidden'}`}>
        {sortOptions.map((option) => (
          <button key={option}
            className="w-full text-left border-none px-3 py-2.5 bg-transparent text-gray-600 text-[14px] cursor-pointer transition-[background, color] duration-200 ease-out hover:bg-[#FFF4c7] hover:color-[#F7941D] rounded-xl"
            onClick={() => {
              setSortBy(option);
              setToggleSortOptions(false);
            }}>
            {option}
          </button>
        ))}
      </div>

      <button type="button" aria-label="Change sort order" title="Sort" className="grid p-1 place-items-center cursor-pointer rounded-full bg-[#f7891f] text-white" onClick={() => setToggleSortOptions(prev => !prev)}>
        <ArrowUpDown size={22} aria-hidden="true" />
      </button>
    </div>
  );
}