/* =========================================================
   KITCHSYNC CUSTOMER RESERVATION PAGE
   SCRIPT.JS
========================================================= */


/* =========================================================
   GET HTML ELEMENTS
========================================================= */

const reservationForm = document.getElementById("reservationForm");

const reservationDate = document.getElementById("reservationDate");
const reservationTime = document.getElementById("reservationTime");
const guestCount = document.getElementById("guestCount");

const selectedTableInput = document.getElementById("selectedTable");

const tableOptions = document.querySelectorAll(".table-option");

const summaryDate = document.getElementById("summaryDate");
const summaryTime = document.getElementById("summaryTime");
const summaryGuests = document.getElementById("summaryGuests");
const summaryTable = document.getElementById("summaryTable");

const confirmationMessage =
    document.getElementById("confirmationMessage");


/* =========================================================
   SET MINIMUM DATE
   Prevent customers from selecting a date in the past.
========================================================= */

const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

const todayString = `${year}-${month}-${day}`;

reservationDate.min = todayString;


/* =========================================================
   TABLE SELECTION
========================================================= */

tableOptions.forEach(function (table) {

    table.addEventListener("click", function () {

        // Do nothing if the table is booked
        if (table.disabled) {
            return;
        }


        // Remove selected class from all tables
        tableOptions.forEach(function (item) {
            item.classList.remove("selected");
        });


        // Select clicked table
        table.classList.add("selected");


        // Get table name
        const tableName = table.dataset.table;


        // Store selected table in hidden input
        selectedTableInput.value = tableName;


        // Update summary
        summaryTable.textContent = tableName;

    });

});


/* =========================================================
   DATE SUMMARY
========================================================= */

reservationDate.addEventListener("change", function () {

    if (reservationDate.value === "") {

        summaryDate.textContent = "Not selected";

        return;
    }


    const date = new Date(
        reservationDate.value + "T00:00:00"
    );


    const formattedDate = date.toLocaleDateString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );


    summaryDate.textContent = formattedDate;

});


/* =========================================================
   TIME SUMMARY
========================================================= */

reservationTime.addEventListener("change", function () {

    if (reservationTime.value === "") {

        summaryTime.textContent = "Not selected";

        return;
    }


    summaryTime.textContent = reservationTime.value;

});


/* =========================================================
   GUEST SUMMARY
========================================================= */

guestCount.addEventListener("change", function () {

    if (guestCount.value === "") {

        summaryGuests.textContent = "Not selected";

        return;
    }


    const guests = Number(guestCount.value);

    summaryGuests.textContent =
        guests === 1
            ? "1 Guest"
            : `${guests} Guests`;

});


/* =========================================================
   FORM SUBMISSION
========================================================= */

reservationForm.addEventListener("submit", function (event) {

    // Prevent page refresh
    event.preventDefault();


    /* ---------------------------------------------
       Check if a table has been selected
    --------------------------------------------- */

    if (selectedTableInput.value === "") {

        alert("Please select an available table.");

        return;
    }


    /* ---------------------------------------------
       Check reservation date
    --------------------------------------------- */

    if (reservationDate.value === "") {

        alert("Please select a reservation date.");

        return;
    }


    /* ---------------------------------------------
       Get form values
    --------------------------------------------- */

    const customerName =
        document.getElementById("customerName").value.trim();

    const customerEmail =
        document.getElementById("customerEmail").value.trim();

    const customerPhone =
        document.getElementById("customerPhone").value.trim();


    /* ---------------------------------------------
       Basic customer validation
    --------------------------------------------- */

    if (
        customerName === "" ||
        customerEmail === "" ||
        customerPhone === ""
    ) {

        alert("Please complete all required customer details.");

        return;
    }


    /* ---------------------------------------------
       Show confirmation
    --------------------------------------------- */

    confirmationMessage.hidden = false;


    /* ---------------------------------------------
       Create sample reservation object

       This is only sample frontend data.
       The backend can handle real reservations later.
    --------------------------------------------- */

    const reservation = {

        customerName: customerName,

        email: customerEmail,

        phone: customerPhone,

        date: reservationDate.value,

        time: reservationTime.value,

        guests: guestCount.value,

        table: selectedTableInput.value,

        specialRequest:
            document.getElementById("specialRequest").value.trim()

    };


    console.log("Reservation created:", reservation);


    /* ---------------------------------------------
       Update confirmation text
    --------------------------------------------- */

    confirmationMessage.innerHTML = `
        <strong>Reservation Confirmed!</strong>

        <p>
            Thank you, ${customerName}.
            Your table (${reservation.table})
            has been reserved for
            ${reservation.guests}
            ${Number(reservation.guests) === 1 ? "guest" : "guests"}
            on ${summaryDate.textContent}
            at ${reservation.time}.
        </p>
    `;


    /* ---------------------------------------------
       Scroll to confirmation
    --------------------------------------------- */

    confirmationMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    /* ---------------------------------------------
       Optional success message
    --------------------------------------------- */

    console.log(
        "Reservation successfully submitted."
    );

});


/* =========================================================
   RESET SUMMARY WHEN FORM IS RESET
========================================================= */

reservationForm.addEventListener("reset", function () {

    setTimeout(function () {

        summaryDate.textContent = "Not selected";

        summaryTime.textContent = "Not selected";

        summaryGuests.textContent = "Not selected";

        summaryTable.textContent = "Not selected";

        selectedTableInput.value = "";


        tableOptions.forEach(function (table) {
            table.classList.remove("selected");
        });


        confirmationMessage.hidden = true;

    }, 0);

});