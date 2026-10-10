const itemList = [

    // =========================
    // SNACKS
    // =========================

    {
        name: "Mexican Appetizer",
        price: 1000,
        description: "Crispy tortilla chips served with flavorful salsa and creamy guacamole.",
        image: "images/mexicanApphetizer.png",
        category: ["snacks"],
        popular: false
    },

    {
        name: "Pork Skewer",
        price: 500,
        description: "Tender pieces of seasoned pork grilled on skewers until juicy and flavorful.",
        image: "images/porkSkewer.png",
        category: ["snacks"],
        popular: false
    },

    {
        name: "Samosa",
        price: 800,
        description: "Crispy pastry filled with a flavorful savory filling.",
        image: "images/samosa.png",
        category: ["snacks"],
        popular: true
    },

    {
        name: "Spring Rolls",
        price: 900,
        description: "Crispy rolls filled with fresh vegetables and seasoning.",
        image: "images/springRolls.png",
        category: ["snacks"],
        popular: true
    },

    {
        name: "French Fries",
        price: 1000,
        description: "Crispy golden fries served as a delicious snack.",
        image: "images/frenchFries.png",
        category: ["snacks"],
        popular: false
    },

    {
        name: "Nachos",
        price: 1500,
        description: "Crispy tortilla chips served with flavorful toppings.",
        image: "images/nachos.png",
        category: ["snacks"],
        popular: false
    },


    // =========================
    // MEALS
    // =========================

    {
        name: "Bean Vegetable Burger",
        price: 2000,
        description: "A tasty bean patty layered with fresh vegetables in a soft burger bun.",
        image: "images/beanVegetableBurger.png",
        category: ["meal", "vegan"],
        popular: false
    },

    {
        name: "Broccoli Lasagna",
        price: 2500,
        description: "Layers of tender pasta, broccoli and creamy cheese baked to perfection.",
        image: "images/broccoliLasagna.png",
        category: ["meal"],
        popular: false
    },

    {
        name: "Chicken Curry",
        price: 3000,
        description: "Tender chicken simmered in a rich and flavorful curry sauce.",
        image: "images/ChickenCurry.png",
        category: ["meal"],
        popular: false
    },

    {
        name: "Fresh Prawn Ceviche",
        price: 3500,
        description: "Fresh prawns tossed with citrus, herbs and crisp vegetables for a refreshing taste.",
        image: "images/freshPrawnCeviche.png",
        category: ["meal"],
        popular: false
    },

    {
        name: "Mushroom Risotto",
        price: 1000,
        description: "Creamy Italian rice cooked with tender mushrooms and aromatic herbs.",
        image: "images/mushroomRositto.png",
        category: ["meal"],
        popular: false
    },

    {
        name: "Jollof Rice & Chicken",
        price: 3000,
        description: "Flavorful Nigerian jollof rice served with tender, well-seasoned chicken.",
        image: "images/jellofRiceChicken.png",
        category: ["meal"],
        popular: true
    },

    {
        name: "Grilled Chicken Rice",
        price: 3200,
        description: "Grilled chicken served with flavorful seasoned rice.",
        image: "images/grilledChickenRice.png",
        category: ["meal"],
        popular: false
    },

    {
        name: "Beef Pasta",
        price: 2800,
        description: "Tender beef combined with pasta in a rich flavorful sauce.",
        image: "images/beefPasta.png",
        category: ["meal"],
        popular: false
    },

    {
        name: "Chicken Shawarma",
        price: 2500,
        description: "Seasoned chicken wrapped with fresh vegetables and sauce.",
        image: "images/chickenShawarma.png",
        category: ["meal"],
        popular: true
    },

    {
        name: "Grilled Fish",
        price: 3500,
        description: "Fresh fish grilled with herbs and flavorful seasoning.",
        image: "images/grilledFish.png",
        category: ["meal"],
        popular: false
    },

    {
        name: "Spaghetti Bolognese",
        price: 2700,
        description: "Spaghetti served with a rich beef and tomato sauce.",
        image: "images/spaghettiBolognese.png",
        category: ["meal"],
        popular: false
    },


    // =========================
    // VEGAN
    // =========================

    {
        name: "Avocado Toast",
        price: 1500,
        description: "Crispy toast topped with creamy fresh avocado.",
        image: "images/avocadoToast.png",
        category: ["vegan"],
        popular: false
    },

    {
        name: "Vegetable Stir Fry",
        price: 2000,
        description: "Fresh vegetables stir-fried with flavorful herbs and spices.",
        image: "images/vegetableStirFry.png",
        category: ["vegan"],
        popular: true
    },

    {
        name: "Falafel Plate",
        price: 1800,
        description: "Crispy falafel served with fresh vegetables and flavorful sides.",
        image: "images/falafelPlate.png",
        category: ["vegan"],
        popular: true
    },

    {
        name: "Chickpea Salad",
        price: 1600,
        description: "Fresh chickpeas mixed with vegetables and a light dressing.",
        image: "images/chickpeaSalad.png",
        category: ["vegan"],
        popular: false
    },

    {
        name: "Vegetable Curry",
        price: 2200,
        description: "A flavorful curry made with fresh mixed vegetables.",
        image: "images/vegetableCurry.png",
        category: ["vegan"],
        popular: false
    },


    // =========================
    // DESSERTS
    // =========================

    {
        name: "Chocolate Brownie",
        price: 1500,
        description: "A rich and fudgy chocolate dessert with a deliciously soft center.",
        image: "images/chocolateBrownie.png",
        category: ["dessert"],
        popular: false
    },

    {
        name: "Strawberry Cheesecake",
        price: 2500,
        description: "Creamy cheesecake topped with sweet strawberries and a delicious fruit sauce.",
        image: "images/strawberryCheesecake.png",
        category: ["dessert"],
        popular: false
    },

    {
        name: "Red Velvet Cake",
        price: 5000,
        description: "Soft red velvet cake layered with smooth and creamy frosting.",
        image: "images/redVelvetCake.png",
        category: ["dessert"],
        popular: false
    },

    {
        name: "Vanilla Cake",
        price: 5000,
        description: "Light and fluffy vanilla cake covered with smooth creamy frosting.",
        image: "images/vanillaCake.png",
        category: ["dessert"],
        popular: false
    },

    {
        name: "Vanilla Ice Cream",
        price: 1000,
        description: "Smooth and creamy vanilla ice cream.",
        image: "images/vanillaIceCream.png",
        category: ["dessert"],
        popular: true
    },

    {
        name: "Chocolate Cake",
        price: 1800,
        description: "Rich chocolate cake with a soft and delicious texture.",
        image: "images/chocolateCake.png",
        category: ["dessert"],
        popular: true
    },

    {
        name: "Apple Pie",
        price: 1600,
        description: "Sweet apple filling baked inside a delicious pastry crust.",
        image: "images/applePie.png",
        category: ["dessert"],
        popular: false
    },

    {
        name: "Donut",
        price: 700,
        description: "Soft and sweet donut with a delicious topping.",
        image: "images/donut.png",
        category: ["dessert"],
        popular: false
    },

    {
        name: "Fruit Tart",
        price: 1700,
        description: "Sweet pastry topped with fresh fruits and creamy filling.",
        image: "images/fruitTart.png",
        category: ["dessert"],
        popular: false
    },


    // =========================
    // DRINKS
    // =========================

    {
        name: "Coffee Latte",
        price: 700,
        description: "Smooth espresso blended with steamed milk and topped with creamy foam.",
        image: "images/coffeeLatte.png",
        category: ["drinks"],
        popular: false
    },

    {
        name: "Creamy Milkshakes",
        price: 900,
        description: "A thick and creamy blended drink made with milk and sweet flavors.",
        image: "images/creamyMilkshakes.png",
        category: ["drinks"],
        popular: false
    },

    {
        name: "Iced Coffee",
        price: 600,
        description: "Chilled coffee served over ice with a smooth and refreshing finish.",
        image: "images/IcedCoffee.png",
        category: ["drinks"],
        popular: false
    },

    {
        name: "Mojito",
        price: 700,
        description: "A refreshing blend of lime, mint and sparkling water served over ice.",
        image: "images/mojito.png",
        category: ["drinks"],
        popular: false
    },

    {
        name: "Orange Juice",
        price: 800,
        description: "Fresh orange juice with a naturally sweet and refreshing citrus flavor.",
        image: "images/orangeJuice.png",
        category: ["drinks"],
        popular: true
    },

    {
        name: "Strawberry Smoothie",
        price: 1200,
        description: "A smooth and refreshing strawberry blended drink.",
        image: "images/strawberrySmoothie.png",
        category: ["drinks"],
        popular: true
    },

    {
        name: "Lemonade",
        price: 700,
        description: "Refreshing lemonade made with fresh lemon juice.",
        image: "images/lemonade.png",
        category: ["drinks"],
        popular: false
    },

    {
        name: "Mango Juice",
        price: 900,
        description: "Sweet and refreshing mango juice made from ripe mangoes.",
        image: "images/mangoJuice.png",
        category: ["drinks"],
        popular: false
    },

    {
        name: "Hot Chocolate",
        price: 1000,
        description: "Warm chocolate drink with a rich and comforting flavor.",
        image: "images/hotChocolate.png",
        category: ["drinks"],
        popular: false
    },


    // =========================
    // TOPPINGS
    // =========================

    {
        name: "Guacamole",
        price: 500,
        description: "Freshly mashed avocado mixed with lime, herbs and spices.",
        image: "images/guacamole.png",
        category: ["toppings"],
        popular: false
    },

    {
        name: "Jalapeños",
        price: 300,
        description: "Fresh sliced jalapeños adding a spicy kick to your meal.",
        image: "images/jalapenos.png",
        category: ["toppings"],
        popular: false
    },

    {
        name: "Pico de Gallo",
        price: 400,
        description: "Fresh tomatoes, onions, cilantro and lime.",
        image: "images/picoDeGallo.png",
        category: ["toppings"],
        popular: false
    },

    {
        name: "Cheese",
        price: 500,
        description: "Melted cheese topping that adds a rich and creamy flavor.",
        image: "images/cheese.png",
        category: ["toppings"],
        popular: true
    },

    {
        name: "Sour Cream",
        price: 300,
        description: "Smooth and creamy sour cream served as a delicious topping.",
        image: "images/sourCream.png",
        category: ["toppings"],
        popular: false
    },

    {
        name: "Grilled Chicken",
        price: 800,
        description: "Tender grilled chicken seasoned with herbs and spices.",
        image: "images/grilledGhicken.png",
        category: ["toppings"],
        popular: true
    },

    {
        name: "Ground Beef",
        price: 700,
        description: "Seasoned ground beef cooked with aromatic herbs and spices.",
        image: "images/groundBeef.png",
        category: ["toppings"],
        popular: false
    }

];