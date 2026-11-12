import { Home, CalendarCheck, LayoutDashboard, UserGroup, Utensils, ChefHat, Package, CreditCardCheck } from "lucide-react";

export const ROLE_HOME = {
  CUSTOMER: "/menu",
  WAITER: "/waiter",
  CHEF: "/kitchen",
  ADMIN: "/admin",
};

export const NAV_LINKS = {
  CUSTOMER: [
    { label: "Home", to: "/menu", icon: Home },
    { label: "Reservations", to: "/reservation", icon: CalendarCheck },
    { label: "Checkout", to: "/checkout", icon: CreditCardCheck }
  ],
  ADMIN: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Staff", to: "/admin/staff", icon: UserGroup },
    { label: "Menu", to: "admin/menu", icon: Utensils }
  ],
  CHEF: [
    { label: "Kitchen", to: "/kitchen", icon: ChefHat },
    { label: "Inventory", to: "/inventory", icon: Package }
  ],
  WAITER: [
    { label: "Dashboard", to: "/waiter/dashboard" }
    { label: "Orders", to: "/waiter/orders" }
  ]
}