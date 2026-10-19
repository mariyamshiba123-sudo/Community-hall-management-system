import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const bookingForm = document.getElementById("bookingForm");
const bookingDate = document.getElementById("date");
const formMessage = document.getElementById("formMessage");

function getLocalDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

if (bookingForm && bookingDate && formMessage) {
    bookingDate.min = getLocalDate();

    bookingForm.addEventListener("submit", async function (event) {
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

        const submitButton = bookingForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        formMessage.textContent = "Submitting your booking request...";
        formMessage.style.color = "#174d35";

        try {
            const booking = {
                customerName: name,
                email: email,
                phone: phone,
                eventType: eventType,
                bookingDate: date,
                guests: guests,
                bookingStatus: "Pending",
                createdAt: serverTimestamp()
            };

            const documentRef = await addDoc(
                collection(db, "bookings"),
                booking
            );

            formMessage.textContent =
                `Thank you, ${name}! Your booking request was saved successfully. ` +
                `Your booking reference is ${documentRef.id}. Status: Pending.`;

            formMessage.style.color = "#174d35";

            bookingForm.reset();
            bookingDate.min = getLocalDate();

        } catch (error) {
            console.error("Booking submission error:", error);

            formMessage.textContent =
                "Sorry, we couldn't save your booking. Please try again later.";

            formMessage.style.color = "#b42318";
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}
