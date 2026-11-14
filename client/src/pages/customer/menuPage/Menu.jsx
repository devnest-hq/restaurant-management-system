import Header from "../../../components/layout/Header";
import Navbar from "../../../components/layout/Navbar";
import Categories from "./Categories";
import SortRow from "./SortRow";
import MenuItemsGrid from "./MenuItemsGrid";
import { useEffect, useState } from "react";
import { getMenuItems } from "../../../api/menu";

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    getMenuItems({ category: category }).then(setMenuItems);
  }, [category]);

  return (
    <div className="min-h-screen bg-white text-[#2a2418]">
      <Header />

      <main className="mx-auto w-full max-w-275 pb-32">

        <Categories category={category} setCategory={setCategory} />

        <div className="bg-white rounded-[28px] px-7 flex flex-col gap-4 sm:px-6 sm:pt-7 pt-5 pb-8 -mt-19 z-10 relative">
          <SortRow />

          <MenuItemsGrid menuItems={menuItems} />
        </div>
      </main>

      <Navbar />
    </div>
  );
}