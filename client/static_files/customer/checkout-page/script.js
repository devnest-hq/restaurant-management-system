/* =========================================================
   KITCHSYNC
   CUSTOMER CHECKOUT - SCRIPT.JS
========================================================= */


/* =========================================================
   1. GET HTML ELEMENTS
========================================================= */

const checkoutForm =
    document.getElementById("checkoutForm");

const paymentMethod =
    document.getElementById("paymentMethod");

const cardPaymentFields =
    document.getElementById("cardPaymentFields");

const cardNumber =
    document.getElementById("cardNumber");

const expiryDate =
    document.getElementById("expiryDate");

const cvv =
    document.getElementById("cvv");

const confirmationMessage =
    document.getElementById("confirmationMessage");

const orderItemsContainer =
    document.getElementById("orderItems");

const subtotalElement =
    document.getElementById("subtotal");

const serviceFeeElement =
    document.getElementById("serviceFee");

const totalElement =
    document.getElementById("total");

const placeOrderButton =
    checkoutForm.querySelector(".primary-button");


/* =========================================================
   2. FORMAT USD CURRENCY
========================================================= */

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2
        }
    ).format(amount);

}


/* =========================================================
   3. DISPLAY ORDER ITEMS
========================================================= */

function displayOrderItems() {

    orderItemsContainer.innerHTML = "";

    menuItems.forEach(function (item) {

        const orderItem =
            document.createElement("div");

        orderItem.className = "order-item";

        orderItem.innerHTML = `

            <img
                src="${item.image}"
                alt="${item.name}"
                class="item-image"
            >

            <div class="item-details">

                <h3>
                    ${item.name}
                </h3>

                <p>
                    Quantity: ${item.quantity}
                </p>

                <span>
                    ${formatCurrency(item.price)} each
                </span>

            </div>

            <strong>
                ${formatCurrency(
                    item.price * item.quantity
                )}
            </strong>

        `;

        orderItemsContainer.appendChild(orderItem);

    });

}


/* =========================================================
   4. CALCULATE SUBTOTAL
========================================================= */

function calculateSubtotal() {

    let subtotal = 0;

    menuItems.forEach(function (item) {

        subtotal +=
            item.price * item.quantity;

    });

    return subtotal;

}


/* =========================================================
   5. CALCULATE ORDER TOTALS
========================================================= */

const subtotal =
    calculateSubtotal();

const serviceFee =
    subtotal * 0.05;

const total =
    subtotal + serviceFee;


/* =========================================================
   6. DISPLAY ORDER TOTALS
========================================================= */

subtotalElement.textContent =
    formatCurrency(subtotal);

serviceFeeElement.textContent =
    formatCurrency(serviceFee);

totalElement.textContent =
    formatCurrency(total);


/* =========================================================
   7. DISPLAY ORDER ITEMS ON PAGE
========================================================= */

displayOrderItems();


/* =========================================================
   8. PAYMENT METHOD SELECTION
========================================================= */

paymentMethod.addEventListener(
    "change",
    function () {

        const selectedMethod =
            paymentMethod.value;


        /* Show card fields */

        if (selectedMethod === "card") {

            cardPaymentFields.style.display =
                "block";

            cardNumber.required = true;

            expiryDate.required = true;

            cvv.required = true;

        }


        /* Hide card fields */

        else {

            cardPaymentFields.style.display =
                "none";

            cardNumber.required = false;

            expiryDate.required = false;

            cvv.required = false;

            cardNumber.value = "";

            expiryDate.value = "";

            cvv.value = "";

        }

    }
);


/* =========================================================
   9. FORMAT CARD NUMBER
========================================================= */

cardNumber.addEventListener(
    "input",
    function () {

        let value =
            cardNumber.value
                .replace(/\D/g, "")
                .substring(0, 16);

        let formatted =
            value.match(/.{1,4}/g);

        cardNumber.value =
            formatted
                ? formatted.join(" ")
                : "";

    }
);


/* =========================================================
   10. FORMAT EXPIRY DATE
========================================================= */

expiryDate.addEventListener(
    "input",
    function () {

        let value =
            expiryDate.value
                .replace(/\D/g, "")
                .substring(0, 4);


        if (value.length >= 3) {

            value =
                value.substring(0, 2)
                + "/"
                + value.substring(2);

        }


        expiryDate.value =
            value;

    }
);


/* =========================================================
   11. FORMAT CVV
========================================================= */

cvv.addEventListener(
    "input",
    function () {

        cvv.value =
            cvv.value
                .replace(/\D/g, "")
                .substring(0, 4);

    }
);


/* =========================================================
   12. FORM SUBMISSION
========================================================= */

checkoutForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        /* =================================================
           GET CUSTOMER INFORMATION
        ================================================= */

        const customerName =
            document
                .getElementById("customerName")
                .value
                .trim();

        const customerEmail =
            document
                .getElementById("customerEmail")
                .value
                .trim();

        const customerPhone =
            document
                .getElementById("customerPhone")
                .value
                .trim();

        const address =
            document
                .getElementById("address")
                .value
                .trim();

        const orderNotes =
            document
                .getElementById("orderNotes")
                .value
                .trim();

        const selectedPaymentMethod =
            paymentMethod.value;


        /* =================================================
           BASIC VALIDATION
        ================================================= */

        if (
            customerName === "" ||
            customerEmail === "" ||
            customerPhone === "" ||
            address === "" ||
            selectedPaymentMethod === ""
        ) {

            alert(
                "Please complete all required fields."
            );

            return;

        }


        /* =================================================
           CARD VALIDATION
        ================================================= */

        if (
            selectedPaymentMethod === "card"
        ) {

            const cleanCardNumber =
                cardNumber.value
                    .replace(/\s/g, "");


            /* Check card number */

            if (
                cleanCardNumber.length !== 16
            ) {

                alert(
                    "Please enter a valid 16-digit card number."
                );

                cardNumber.focus();

                return;

            }


            /* Check expiry date */

            if (
                expiryDate.value.length !== 5
            ) {

                alert(
                    "Please enter the expiry date in MM/YY format."
                );

                expiryDate.focus();

                return;

            }


            /* Check CVV */

            if (
                cvv.value.length < 3
            ) {

                alert(
                    "Please enter a valid CVV."
                );

                cvv.focus();

                return;

            }

        }


        /* =================================================
           CREATE ORDER OBJECT
        ================================================= */

        const order = {

            orderId:
                "#KS" +
                Math.floor(
                    100000 +
                    Math.random() * 900000
                ),

            customer: {

                name:
                    customerName,

                email:
                    customerEmail,

                phone:
                    customerPhone,

                address:
                    address

            },

            items:
                menuItems,

            paymentMethod:
                selectedPaymentMethod,

            notes:
                orderNotes,

            subtotal:
                subtotal,

            serviceFee:
                serviceFee,

            total:
                total,

            currency:
                "USD",

            status:
                "Placed",

            createdAt:
                new Date().toISOString()

        };


        /* =================================================
           SAVE ORDER LOCALLY
        ================================================= */

        localStorage.setItem(
            "kitchsyncLastOrder",
            JSON.stringify(order)
        );


        /* =================================================
           DISPLAY ORDER IN CONSOLE
        ================================================= */

        console.log(
            "Kitchsync Order:",
            order
        );


        /* =================================================
           SHOW SUCCESS MESSAGE
        ================================================= */

        confirmationMessage.hidden =
            false;

        confirmationMessage.innerHTML = `

            <div class="success-icon">
                ✓
            </div>

            <div>

                <strong>
                    Order Placed Successfully!
                </strong>

                <p>

                    Thank you,
                    ${customerName}.

                    Your order
                    ${order.orderId}
                    has been received.

                    Total:
                    ${formatCurrency(total)}

                </p>

            </div>

        `;


        /* =================================================
           CHANGE BUTTON
        ================================================= */

        placeOrderButton.disabled =
            true;

        placeOrderButton.textContent =
            "Order Placed";


        /* =================================================
           SCROLL TO SUCCESS MESSAGE
        ================================================= */

        confirmationMessage.scrollIntoView(
            {
                behavior: "smooth",
                block: "center"
            }
        );

    }
);


/* =========================================================
   13. LOAD PREVIOUS ORDER
========================================================= */

const savedOrder =
    localStorage.getItem(
        "kitchsyncLastOrder"
    );


if (savedOrder) {

    try {

        const previousOrder =
            JSON.parse(savedOrder);

        console.log(
            "Previous Kitchsync order:",
            previousOrder
        );

    }

    catch (error) {

        console.log(
            "Could not load previous order."
        );

    }

}


/* =========================================================
   END OF CHECKOUT SCRIPT
========================================================= */