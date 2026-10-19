const bookingForm = document.getElementById("bookingForm");
const message = document.getElementById("message");
const dateInput = document.getElementById("date");

// Prevent users from selecting past dates.
const today = new Date();

const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

dateInput.min = localToday;

// Handle booking form submission.
bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const bookingDate = dateInput.value;
    const guests = Number(
        document.getElementById("guests").value
    );

    if (!name || !bookingDate || guests < 1) {
        message.textContent = "Please enter valid booking details.";
        return;
    }

    message.textContent =
        "Thank you, " + name +
        "! Your booking request has been submitted successfully.";

    message.style.color = "#174d35";

    bookingForm.reset();
    dateInput.min = localToday;
});
