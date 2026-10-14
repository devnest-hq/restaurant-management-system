document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  const grid = document.querySelector("#featured-dishes");
  if (grid && Array.isArray(featuredDishes)) {
    grid.innerHTML = featuredDishes.map(dish => `
      <article class="dish-card">
        <div class="dish-card-image"><span class="dish-category">${dish.category}</span></div>
        <div class="dish-card-content">
          <div class="dish-card-top"><h3>${dish.name}</h3><span class="dish-price">${dish.price}</span></div>
          <p>${dish.description}</p>
        </div>
      </article>
    `).join("");
  }
});
