import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Replace this with your actual admin User UID.
const ADMIN_UID = "y5UQJNoWakaE7ey5iCcWZfHbfyJ2";

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const dashboard = document.getElementById("dashboard");
const dashboardMessage = document.getElementById("dashboardMessage");
const bookingList = document.getElementById("bookingList");
const refreshButton = document.getElementById("refreshBookings");
const logoutButton = document.getElementById("logoutButton");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Signing in...";

    try {
        const result = await signInWithEmailAndPassword(auth, email, password);

        if (result.user.uid !== ADMIN_UID) {
            await signOut(auth);
            loginMessage.textContent = "Access denied. Admin account only.";
            return;
        }

        loginMessage.textContent = "Login successful!";
    } catch (error) {
        console.error(error);
        loginMessage.textContent = "Login failed. Check your email and password.";
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user && user.uid === ADMIN_UID) {
        loginForm.hidden = true;
        dashboard.hidden = false;
        await loadBookings();
    } else {
        loginForm.hidden = false;
        dashboard.hidden = true;
    }
});

async function loadBookings() {
    bookingList.replaceChildren();
    dashboardMessage.textContent = "Loading bookings...";

    try {
        const bookingsQuery = query(
            collection(db, "bookings"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(bookingsQuery);

        if (snapshot.empty) {
            dashboardMessage.textContent = "No booking requests found.";
            return;
        }

        dashboardMessage.textContent = "";

        snapshot.forEach((bookingDocument) => {
            const booking = bookingDocument.data();

            const card = document.createElement("article");
            const title = document.createElement("h3");
            title.textContent = booking.eventType || "Booking";

            const details = document.createElement("p");
            details.textContent =
                `Customer: ${booking.customerName || ""} | ` +
                `Email: ${booking.email || ""} | ` +
                `Phone: ${booking.phone || ""} | ` +
                `Date: ${booking.bookingDate || ""} | ` +
                `Guests: ${booking.guests || 0} | ` +
                `Status: ${booking.bookingStatus || "Pending"}`;

            card.append(title, details);

            const statusSelect = document.createElement("select");

            ["Pending", "Approved", "Rejected"].forEach((status) => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });

            statusSelect.value = booking.bookingStatus || "Pending";

            const saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.textContent = "Update Status";

            saveButton.addEventListener("click", async () => {
                if (auth.currentUser?.uid !== ADMIN_UID) {
                    alert("Admin access required.");
                    return;
                }

                try {
                    await updateDoc(
                        doc(db, "bookings", bookingDocument.id),
                        { bookingStatus: statusSelect.value }
                    );

                    alert("Booking status updated.");
                    await loadBookings();
                } catch (error) {
                    console.error(error);
                    alert("Could not update booking status. Check Firestore rules.");
                }
            });

            card.append(statusSelect, saveButton);
            bookingList.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        dashboardMessage.textContent =
            "Could not load bookings. Check your Firestore rules and connection.";
    }
}

refreshButton.addEventListener("click", loadBookings);

logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    loginForm.reset();
    loginMessage.textContent = "You have logged out.";
});
