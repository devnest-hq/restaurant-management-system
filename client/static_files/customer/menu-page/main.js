// ============================
// MENU FILTER & SORT VARIABLE
// ============================

const searchInput =
    document.querySelector(".search-container input");

const categories =
    document.querySelectorAll(".category");

const sortButton =
    document.querySelector(".sort-btn");

const sortMenu =
    document.querySelector(".sort-menu");

const sortOptions =
    document.querySelectorAll(".sort-option");

const sortName =
    document.querySelector(".popular");


// =========================
// CURRENT MENU SETTINGS
// =========================

// No category selected at the beginning
let selectedCategory = null;

// All Items is the default
let currentSort = "all";


// =========================
// SEARCH
// =========================

searchInput.addEventListener("input", () => {

    refreshMenu();

});


// =========================
// CATEGORIES
// =========================

categories.forEach(category => {

    category.addEventListener("click", () => {

        // Remove active from all categories
        categories.forEach(categoryItem => {
            categoryItem.classList.remove("active");
        });

        // Add active to clicked category
        category.classList.add("active");

        // Get category name
        const categoryName =
            category.querySelector("span").textContent;

        selectedCategory =
            categoryName.toLowerCase();

        // Refresh menu
        refreshMenu();

    });

});


// SORT MENU


sortButton.addEventListener("click", () => {

    sortMenu.classList.toggle("show");

});


// SORT OPTIONS

sortOptions.forEach(option => {

    option.addEventListener("click", () => {

        // Save selected sort
        currentSort =
            option.dataset.sort;


        // =========================
        // ALL ITEMS
        // =========================

        if (currentSort === "all") {

            // Clear selected category
            selectedCategory = null;

            // Remove active from all categories
            categories.forEach(categoryItem => {
                categoryItem.classList.remove("active");
            });

        }


        // =========================
        // SORT ACTIVE STATE
        // =========================

        sortOptions.forEach(item => {
            item.classList.remove("active");
        });

        option.classList.add("active");


        // Change text beside "Sort By"
        sortName.textContent =
            option.textContent;


        // Refresh menu
        refreshMenu();


        // Close sort menu
        sortMenu.classList.remove("show");

    });

});


// =========================
// REFRESH MENU
// =========================

function refreshMenu() {

    // Start with all food items
    let filteredItems = [...itemList];


//=========================
// FILTERING
//=========================
    // CATEGORY FILTER

    if (selectedCategory !== null) {

        filteredItems =
            filteredItems.filter(item => {

                return item.category.includes(
                    selectedCategory
                );

            });

    }


    // SEARCH FILTER

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();

    if (searchText !== "") {

        filteredItems =
            filteredItems.filter(item => {

                return item.name
                    .toLowerCase()
                    .includes(searchText);

            });

    }

    
    // SORT / FILTER

    // ALL ITEMS
    if (currentSort === "all") {

        // Keep original order

    }


    // POPULAR
    else if (currentSort === "popular") {

        filteredItems =
            filteredItems.filter(item => {

                return item.popular === true;

            });

    }


    // CATEGORIES
    else if (currentSort === "categories") {

        filteredItems.sort((a, b) => {

            return a.category[0].localeCompare(
                b.category[0]
            );

        });

    }


    // A-Z
    else if (currentSort === "az") {

        filteredItems.sort((a, b) => {

            return a.name.localeCompare(
                b.name
            );

        });

    }


    // Z-A
    else if (currentSort === "za") {

        filteredItems.sort((a, b) => {

            return b.name.localeCompare(
                a.name
            );

        });

    }
    displayItems(filteredItems);
}



// =========================
// MENU ITEMS
// =========================

const foodList =
    document.querySelector(".food-list");


// FOOD DETAILS

const foodDetails =
    document.querySelector(".food-details");

const detailsBack =
    document.querySelector(".details-back");

const detailsTitle =
    document.querySelector(".details-title h1");

const detailsRating =
    document.querySelector(".details-rating");

const detailsImage =
    document.querySelector(".details-image");

const detailsPrice =
    document.querySelector(".details-price");

const detailsDescription =
    document.querySelector(".details-short-description");


// FOOD QUANTITY

const quantityMinus =
    document.querySelector(".quantity-minus");

const quantityPlus =
    document.querySelector(".quantity-plus");

const quantityValue =
    document.querySelector(".quantity-value");

let foodQuantity = 1;


// ADDITION BUTTON

quantityPlus.addEventListener("click", () => {

    foodQuantity++;

    quantityValue.textContent =
        foodQuantity;

});


// =========================
// SUBTRACTION BUTTON
// =========================

quantityMinus.addEventListener("click", () => {

    if (foodQuantity > 1) {

        foodQuantity--;

        quantityValue.textContent =
            foodQuantity;

    }

});


// =========================
// TOPPINGS
// =========================

const toppingsList =
    document.querySelector(".toppings-list");


// =========================
// BACK BUTTON
// =========================

detailsBack.addEventListener("click", () => {

    foodDetails.style.display = "none";

});


// =========================
// DISPLAY MENU ITEMS
// =========================

function displayItems(items) {

    // Clear current cards
    foodList.innerHTML = "";


    // Loop through every item
    items.forEach(item => {

        // =========================
        // FOOD CARD
        // =========================

        const foodCard =
            document.createElement("article");

        foodCard.classList.add("food-card");


        // =========================
        // CARD CLICK
        // =========================

        foodCard.addEventListener("click", () => {

            openFoodDetails(item);

        });


        // =========================
        // IMAGE
        // =========================

        const foodImage =
            document.createElement("img");

        foodImage.classList.add("food-image");

        foodImage.setAttribute(
            "src",
            item.image
        );

        foodImage.setAttribute(
            "alt",
            item.name
        );

        foodCard.appendChild(foodImage);


        // =========================
        // FOOD INFO
        // =========================

        const foodInfo =
            document.createElement("div");

        foodInfo.classList.add("food-info");

        foodCard.appendChild(foodInfo);


        // =========================
        // TITLE ROW
        // =========================

        const foodTitleRow =
            document.createElement("div");

        foodTitleRow.classList.add(
            "food-title-row"
        );

        foodInfo.appendChild(foodTitleRow);


        // =========================
        // FOOD TITLE
        // =========================

        const foodTitle =
            document.createElement("h2");

        foodTitle.textContent =
            item.name;

        foodTitleRow.appendChild(foodTitle);


        // =========================
        // RATING
        // =========================

        const rating =
            document.createElement("span");

        rating.classList.add("rating");

        rating.textContent = "5.0";

        foodTitleRow.appendChild(rating);


        // =========================
        // STAR
        // =========================

        const star =
            document.createElement("i");

        star.classList.add("fa-solid");
        star.classList.add("fa-star");

        rating.appendChild(star);


        // =========================
        // PRICE
        // =========================

        const price =
            document.createElement("div");

        price.classList.add("price");

        price.textContent =
            `₦${item.price.toLocaleString()}`;

        foodInfo.appendChild(price);


        // =========================
        // DESCRIPTION
        // =========================

        const description =
            document.createElement("p");

        description.classList.add(
            "description"
        );

        description.textContent =
            item.description;

        foodInfo.appendChild(description);


        // =========================
        // ADD CARD TO PAGE
        // =========================

        foodList.appendChild(foodCard);

    });

}


// =========================
// DISPLAY TOPPINGS
// =========================

function displayToppings() {

    toppingsList.innerHTML = "";

    const toppings =
        itemList.filter(item => {

            return item.category.includes(
                "toppings"
            );

        });


    toppings.forEach(topping => {

        // =========================
        // TOPPING ROW
        // =========================

        const toppingItem =
            document.createElement("div");

        toppingItem.classList.add(
            "topping-item"
        );


        // =========================
        // TOPPING NAME
        // =========================

        const toppingName =
            document.createElement("span");

        toppingName.classList.add(
            "topping-name"
        );

        toppingName.textContent =
            topping.name;


        // =========================
        // DOTTED LINE
        // =========================

        const toppingDots =
            document.createElement("span");

        toppingDots.classList.add(
            "topping-dots"
        );


        // =========================
        // TOPPING PRICE
        // =========================

        const toppingPrice =
            document.createElement("span");

        toppingPrice.classList.add(
            "topping-price"
        );

        toppingPrice.textContent =
            `₦${topping.price.toLocaleString()}`;


        // =========================
        // TOPPING SELECT BUTTON
        // =========================

        const toppingButton =
            document.createElement("button");

        toppingButton.classList.add(
            "topping-add"
        );

        toppingButton.setAttribute(
            "type",
            "button"
        );


        // =========================
        // ADD ELEMENTS TO ROW
        // =========================

        toppingItem.appendChild(
            toppingName
        );

        toppingItem.appendChild(
            toppingDots
        );

        toppingItem.appendChild(
            toppingPrice
        );

        toppingItem.appendChild(
            toppingButton
        );


        // =========================
        // TOPPING SELECTION
        // =========================

        toppingButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                toppingItem.classList.toggle(
                    "selected"
                );

            }
        );


        // =========================
        // ADD TOPPING TO PAGE
        // =========================

        toppingsList.appendChild(
            toppingItem
        );

    });

}


// =========================
// OPEN FOOD DETAILS
// =========================

function openFoodDetails(item) {

    foodQuantity = 1;

    quantityValue.textContent =
        foodQuantity;


    // Food name
    detailsTitle.textContent =
        item.name;


    // Food image
    detailsImage.setAttribute(
        "src",
        item.image
    );

    detailsImage.setAttribute(
        "alt",
        item.name
    );


    // Food price
    detailsPrice.textContent =
        `₦${item.price.toLocaleString()}`;


    // Food description
    detailsDescription.textContent =
        item.description;


    // Display toppings
    displayToppings();


    // Show details screen
    foodDetails.style.display =
        "block";

}


// =========================
// DISPLAY ALL ITEMS
// =========================

refreshMenu();

const header= document.getElementsByClassName('top-header');
console.log(topHeader);