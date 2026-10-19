const bookingForm = document.getElementById("bookingForm");
const bookingDate = document.getElementById("date");
const formMessage = document.getElementById("formMessage");

// Calculate today's date using the visitor's local time.
function getLocalDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Prevent selecting dates in the past.
bookingDate.min = getLocalDate();

// Validate and demonstrate form submission.
bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const eventType = document.getElementById("event").value;
    const date = bookingDate.value;
    const guests = Number(
        document.getElementById("guests").value
    );

    if (!name || !email || !eventType || !date || guests < 1) {
        formMessage.textContent =
            "Please complete all required fields correctly.";

        formMessage.style.color = "#b42318";
        return;
    }

    if (date < getLocalDate()) {
        formMessage.textContent =
            "Please choose today or a future date.";

        formMessage.style.color = "#b42318";
        return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
        formMessage.textContent =
            "Please enter a valid 10-digit phone number.";

        formMessage.style.color = "#b42318";
        return;
    }

    formMessage.textContent =
        `Thank you, ${name}! Your demonstration booking request ` +
        `for ${eventType} on ${date} has passed form validation. ` +
        `It has not been sent to the hall administrator.`;

    formMessage.style.color = "#174d35";

    // This demonstration does not save booking details.
    bookingForm.reset();

    bookingDate.min = getLocalDate();
});
