from flask import Flask, render_template, request, redirect, url_for, flash, session
import sqlite3
from pathlib import Path
from functools import wraps
from datetime import date

app = Flask(__name__)

# Project settings
app.secret_key = "community-hall-project-secret-change-before-deployment"

app.config["ADMIN_USERNAME"] = "MariyamShiba..1"
app.config["ADMIN_PASSWORD"] = "Shiba@0011"

DATABASE = Path(__file__).with_name("community_hall.db")


# Hall details
HALLS = {
    "Grand Celebration Hall": {
        "price": 55000,
        "capacity": 1000
    },
    "Royal Banquet Hall": {
        "price": 15000,
        "capacity": 350
    },
    "Community Function Hall": {
        "price": 8000,
        "capacity": 250
    }
}


# Database connection
def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


# Create database table if it does not exist
# Existing bookings will NOT be deleted.
def initialize_database():
    connection = get_db_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                hall TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_date TEXT NOT NULL,
                guests INTEGER NOT NULL,
                message TEXT,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.commit()

    finally:
        connection.close()


initialize_database()


# Protect admin pages
def admin_required(function):
    @wraps(function)
    def decorated_function(*args, **kwargs):
        if not session.get("admin_logged_in"):
            flash(
                "Please log in to access the admin dashboard.",
                "error"
            )
            return redirect(url_for("admin_login"))

        return function(*args, **kwargs)

    return decorated_function


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# Hall listing page
@app.route("/halls")
def halls():
    return render_template("halls.html")


# Customer booking page
@app.route("/booking", methods=["GET", "POST"])
def booking():

    if request.method == "POST":

        customer_name = request.form.get(
            "customerName", ""
        ).strip()

        email = request.form.get(
            "email", ""
        ).strip()

        phone = request.form.get(
            "phone", ""
        ).strip()

        hall = request.form.get("hall", "")
        event_type = request.form.get("eventType", "")
        event_date = request.form.get("eventDate", "")

        message = request.form.get(
            "message", ""
        ).strip()

        try:
            guests = int(request.form.get("guests", "0"))
        except (ValueError, TypeError):
            guests = 0

        # Validate required fields
        if not all([
            customer_name,
            email,
            phone,
            hall,
            event_type,
            event_date
        ]):
            flash(
                "Please complete all required fields.",
                "error"
            )
            return redirect(url_for("booking"))

        # Validate phone number
        if not phone.isdigit() or len(phone) != 10:
            flash(
                "Please enter a valid 10-digit phone number.",
                "error"
            )
            return redirect(url_for("booking"))

        # Validate email format
        if "@" not in email or "." not in email.split("@")[-1]:
            flash(
                "Please enter a valid email address.",
                "error"
            )
            return redirect(url_for("booking"))

        # Validate hall selection
        if hall not in HALLS:
            flash(
                "Please select a valid hall.",
                "error"
            )
            return redirect(url_for("booking"))

        # Validate booking date
        if event_date < date.today().isoformat():
            flash(
                "Please select today or a future date.",
                "error"
            )
            return redirect(url_for("booking"))

        # Validate guest capacity
        if guests < 1 or guests > HALLS[hall]["capacity"]:
            flash(
                f"{hall} can accommodate 1 to "
                f"{HALLS[hall]['capacity']} guests.",
                "error"
            )
            return redirect(url_for("booking"))

        connection = get_db_connection()

        try:
            # Prevent duplicate pending or approved bookings
            existing = connection.execute("""
                SELECT id
                FROM bookings
                WHERE hall = ?
                  AND event_date = ?
                  AND status IN ('Pending', 'Approved')
            """, (hall, event_date)).fetchone()

            if existing:
                flash(
                    "This hall already has a pending or approved "
                    "booking request for that date. "
                    "Please choose another date or hall.",
                    "error"
                )
                return redirect(url_for("booking"))

            # Save booking without deleting existing records
            connection.execute("""
                INSERT INTO bookings (
                    customer_name,
                    email,
                    phone,
                    hall,
                    event_type,
                    event_date,
                    guests,
                    message
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                customer_name,
                email,
                phone,
                hall,
                event_type,
                event_date,
                guests,
                message
            ))

            connection.commit()

        except sqlite3.Error:
            connection.rollback()

            app.logger.exception(
                "Failed to save booking."
            )

            flash(
                "Could not save your booking. Please try again.",
                "error"
            )

            return redirect(url_for("booking"))

        finally:
            connection.close()

        flash(
            "Your booking request was submitted successfully. "
            "Your current status is Pending.",
            "success"
        )

        return redirect(
            url_for("my_bookings", email=email)
        )

    return render_template("booking.html")


# Customer booking status checker
@app.route("/my-bookings")
def my_bookings():

    email = request.args.get(
        "email", ""
    ).strip()

    bookings_list = []

    if email:
        connection = get_db_connection()

        try:
            bookings_list = connection.execute("""
                SELECT *
                FROM bookings
                WHERE email = ?
                ORDER BY created_at DESC
            """, (email,)).fetchall()

        finally:
            connection.close()

    return render_template(
        "my_bookings.html",
        bookings=bookings_list,
        search_email=email
    )


# Admin login
@app.route("/admin-login", methods=["GET", "POST"])
def admin_login():

    if request.method == "POST":

        username = request.form.get(
            "username", ""
        ).strip()

        password = request.form.get(
            "password", ""
        )

        if (
            username == app.config["ADMIN_USERNAME"]
            and password == app.config["ADMIN_PASSWORD"]
        ):
            session.clear()
            session["admin_logged_in"] = True

            flash(
                "Login successful!",
                "success"
            )

            return redirect(url_for("admin"))

        flash(
            "Incorrect username or password.",
            "error"
        )

    return render_template("login.html")


# Admin logout
@app.route("/admin-logout", methods=["GET", "POST"])
@admin_required
def admin_logout():

    session.clear()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect(url_for("admin_login"))


# Admin dashboard
@app.route("/admin", methods=["GET", "POST"])
@admin_required
def admin():

    # Approve or reject booking
    if request.method == "POST":

        booking_id = request.form.get(
            "booking_id", ""
        )

        action = request.form.get(
            "action", ""
        )

        # Validate requested action
        if action not in ("Approved", "Rejected"):
            flash(
                "Invalid booking action.",
                "error"
            )
            return redirect(url_for("admin"))

        connection = get_db_connection()

        try:
            # Find selected booking
            selected_booking = connection.execute("""
                SELECT *
                FROM bookings
                WHERE id = ?
            """, (booking_id,)).fetchone()

            if selected_booking is None:
                flash(
                    "Booking request not found.",
                    "error"
                )
                return redirect(url_for("admin"))

            # Prevent conflicting approved bookings
            if action == "Approved":

                conflict = connection.execute("""
                    SELECT id
                    FROM bookings
                    WHERE hall = ?
                      AND event_date = ?
                      AND status = 'Approved'
                      AND id != ?
                """, (
                    selected_booking["hall"],
                    selected_booking["event_date"],
                    booking_id
                )).fetchone()

                if conflict:
                    flash(
                        "Another booking for this hall and date "
                        "is already approved. This request "
                        "cannot be approved.",
                        "error"
                    )
                    return redirect(url_for("admin"))

            # Update booking status in database
            connection.execute("""
                UPDATE bookings
                SET status = ?
                WHERE id = ?
            """, (
                action,
                booking_id
            ))

            connection.commit()

        except sqlite3.Error:
            connection.rollback()

            app.logger.exception(
                "Failed to update booking status."
            )

            flash(
                "Could not update the booking status.",
                "error"
            )

            return redirect(url_for("admin"))

        finally:
            connection.close()

        # No email is sent.
        # The customer can check the updated status on the website.
        flash(
            f"Booking status successfully updated to {action}. "
            "The customer can check the status on the website.",
            "success"
        )

        return redirect(url_for("admin"))

    # Load bookings for admin dashboard
    connection = get_db_connection()

    try:
        bookings_list = connection.execute("""
            SELECT *
            FROM bookings
            ORDER BY created_at DESC
        """).fetchall()

        total = len(bookings_list)

        pending = sum(
            booking["status"] == "Pending"
            for booking in bookings_list
        )

        approved = sum(
            booking["status"] == "Approved"
            for booking in bookings_list
        )

    finally:
        connection.close()

    return render_template(
        "admin.html",
        bookings=bookings_list,
        total=total,
        pending=pending,
        approved=approved
    )


# Start application
if __name__ == "__main__":
    app.run(debug=True)