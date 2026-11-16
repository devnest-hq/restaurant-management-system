import MenuItem from "./MenuItem";

export default function MenuItemsGrid({ menuItems }) {
  return (
    <section className="m-0 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-8 p-0">
      {menuItems.map((menuItem) => (
        <MenuItem key={menuItem.id} item={menuItem} />
      ))}
    </section>
  );
}