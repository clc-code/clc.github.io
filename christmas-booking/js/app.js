const app = new Vue({
    el: '#app',
    data: {
        user: null,
        groupIdInput: '',
        loginError: null,
        isBooking: false, // Loading state
    },
    computed: {
        // Shared State from Store
        venues() {
            return store.state.data ? store.state.data.venues : [];
        },
        settings() {
            return store.state.data ? store.state.data.settings : {};
        },
        isLoggedIn() {
            return auth.state.isLoggedIn;
        },
        currentUser() {
            return auth.state.user;
        },

        // Categorized Venues
        singleVenues() {
            return this.venues.filter(v =>
                (v.category === 'Single' || v.category === '個別') &&
                this.isVenueVisible(v)
            );
        },
        jointVenues() {
            return this.venues.filter(v =>
                (v.category === 'Joint' || v.category === '合辦') &&
                this.isVenueVisible(v)
            );
        },

        isOpen() {
            if (!this.settings.openTime || !this.settings.closeTime) return true;
            const now = new Date();
            const open = new Date(this.settings.openTime);
            const close = new Date(this.settings.closeTime);
            return now >= open && now <= close;
        },

        statusMessage() {
            if (this.isOpen) return null;
            return `Reservation system is currently closed. Open from ${this.formatDate(this.settings.openTime)} to ${this.formatDate(this.settings.closeTime)}.`;
        }
    },
    methods: {
        login() {
            if (!this.groupIdInput) return;

            const success = auth.login(this.groupIdInput.trim());
            if (success) {
                this.user = auth.getUser();
                this.loginError = null;
            } else {
                this.loginError = auth.state.error || "Login Failed";
            }
        },

        logout() {
            auth.logout();
            this.user = null;
            this.groupIdInput = '';
        },

        isVenueVisible(venue) {
            // "If venue limit is 1, only accept 1 person... if full, hide."
            if (venue.status === 'Hidden') return false;
            if (venue.capacity === 1 && venue.registered >= 1) return false;
            return true;
        },

        canBook(venue) {
            if (!this.isOpen) return false;
            if (venue.status !== 'Open') return false;
            if (venue.registered >= venue.capacity) return false;

            // "Each group can have at most two Leader" -> implying bookings?
            // Let's assume this means a Group can only have 2 bookings total?
            // Or specific leaders? 
            // Logic: Check existing bookings for this Group.
            // User Requirement: "每個小組最多可以有兩個Leader" -> Usually "Two Leaders per Group can book".
            // But we are logging in just with Group ID. So "Group" is the user.
            // If Group IS the user, does it mean the Group can book 2 slots?
            // Let's implement: Max 2 bookings per GroupID across ALL venues.

            const myBookings = store.getBookings().filter(b => b.groupId === this.currentUser.groupId);
            if (myBookings.length >= 2) return false;

            // Check if already booked THIS venue?
            if (myBookings.find(b => b.venueId === venue.id)) return false;

            return true;
        },

        book(venue) {
            if (!this.canBook(venue)) return;

            if (!confirm(`Confirm booking for ${venue.name}?`)) return;

            const booking = {
                id: 'b_' + Date.now(),
                venueId: venue.id,
                venueName: venue.name,
                userId: this.currentUser.id,
                userName: this.currentUser.name,
                groupId: this.currentUser.groupId,
                timestamp: Date.now()
            };

            store.addBooking(booking);
            alert('Booking Successful!');
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleString();
        }
    },
    mounted() {
        this.user = auth.getUser();
    }
});
