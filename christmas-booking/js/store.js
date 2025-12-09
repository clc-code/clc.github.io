const STORE_KEY = 'christmas_booking_data';

const defaultData = {
    venues: [
        {
            id: "v1",
            shortName: "A",
            name: "主堂 (Main Hall)",
            date: "2025-12-25",
            category: "Joint",
            capacity: 100,
            registered: 0,
            status: "Open",
            remark: ""
        },
        {
            id: "v3",
            shortName: "C",
            name: "禱告室 (Prayer Room)",
            date: "2025-12-25",
            category: "Single",
            capacity: 1,
            registered: 0,
            status: "Open",
            remark: "Single person only"
        }
    ],
    groups: [],
    bookings: [],
    settings: {
        openTime: "2025-12-01T00:00",
        closeTime: "2025-12-31T23:59"
    }
};

const store = {
    state: Vue.observable({
        data: null
    }),

    init() {
        const stored = localStorage.getItem(STORE_KEY);
        if (stored) {
            this.state.data = JSON.parse(stored);
            // Migration 1: Ensure groups array exists
            if (!this.state.data.groups) this.state.data.groups = [];

            // Migration 2: Ensure venues have categories
            if (this.state.data.venues) {
                this.state.data.venues.forEach(v => {
                    if (!v.category) v.category = 'Single';
                });
            }

            // Migration 3: Auto-update year to 2025 if it uses old 2023 defaults
            if (this.state.data.settings && this.state.data.settings.openTime && this.state.data.settings.openTime.includes('2023-')) {
                this.state.data.settings.openTime = "2025-12-01T00:00";
                this.state.data.settings.closeTime = "2025-12-31T23:59";
            }

        } else {
            this.state.data = JSON.parse(JSON.stringify(defaultData));
            this.save();
        }
    },

    save() {
        localStorage.setItem(STORE_KEY, JSON.stringify(this.state.data));
    },

    // Venue Methods
    getVenues() {
        return this.state.data.venues;
    },

    getVenue(id) {
        return this.state.data.venues.find(v => v.id === id);
    },

    addVenue(venue) {
        this.state.data.venues.push(venue);
        this.save();
    },

    updateVenue(updatedVenue) {
        const index = this.state.data.venues.findIndex(v => v.id === updatedVenue.id);
        if (index !== -1) {
            this.state.data.venues.splice(index, 1, updatedVenue);
            this.save();
        }
    },

    deleteVenue(id) {
        this.state.data.venues = this.state.data.venues.filter(v => v.id !== id);
        this.save();
    },

    deleteAllVenues() {
        this.state.data.venues = [];
        this.save();
    },

    importVenuesFromText(text) {
        const lines = text.trim().split('\n');
        const newVenues = [];
        lines.forEach(line => {
            const parts = line.split('\t');
            if (parts.length >= 5) {
                newVenues.push({
                    id: 'v_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    shortName: parts[0].trim(),
                    name: parts[1].trim(),
                    date: parts[2].trim(),
                    category: parts[3].trim(),
                    capacity: parseInt(parts[4].trim()) || 1,
                    registered: 0,
                    status: parts[5] ? parts[5].trim() : "Open",
                    remark: parts[6] ? parts[6].trim() : ""
                });
            }
        });
        this.state.data.venues = this.state.data.venues.concat(newVenues);
        this.save();
        return newVenues.length;
    },

    // Group Methods
    getGroups() {
        return this.state.data.groups;
    },

    addGroup(group) {
        if (!this.state.data.groups.find(g => g.id === group.id)) {
            this.state.data.groups.push(group);
        }
        this.save();
    },

    updateGroup(updatedGroup) {
        const index = this.state.data.groups.findIndex(g => g.id === updatedGroup.id);
        if (index !== -1) {
            this.state.data.groups.splice(index, 1, updatedGroup);
            this.save();
        }
    },

    deleteGroup(id) {
        this.state.data.groups = this.state.data.groups.filter(g => g.id !== id);
        this.save();
    },

    deleteAllGroups() {
        this.state.data.groups = [];
        this.save();
    },

    importGroupsFromText(text) {
        const lines = text.trim().split('\n');
        const newGroups = [];
        lines.forEach(line => {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                newGroups.push({
                    id: parts[0].trim(),
                    name: parts[1].trim(),
                    leader1: parts[2] ? parts[2].trim() : '',
                    leader2: parts[3] ? parts[3].trim() : ''
                });
            }
        });
        let count = 0;
        newGroups.forEach(g => {
            if (!this.state.data.groups.find(existing => existing.id === g.id)) {
                this.state.data.groups.push(g);
                count++;
            }
        });
        this.save();
        return count;
    },

    // Booking Methods
    getBookings() {
        return this.state.data.bookings;
    },

    addBooking(booking) {
        this.state.data.bookings.push(booking);
        const venue = this.getVenue(booking.venueId);
        if (venue) {
            venue.registered++;
        }
        this.save();
    },

    deleteBooking(id) {
        const booking = this.state.data.bookings.find(b => b.id === id);
        if (booking) {
            const venue = this.getVenue(booking.venueId);
            if (venue && venue.registered > 0) {
                venue.registered--;
            }
            this.state.data.bookings = this.state.data.bookings.filter(b => b.id !== id);
            this.save();
        }
    },

    deleteAllBookings() {
        // Reset registered counts
        this.state.data.venues.forEach(v => v.registered = 0);
        this.state.data.bookings = [];
        this.save();
    },

    // Settings
    getSettings() {
        return this.state.data.settings;
    },

    updateSettings(settings) {
        this.state.data.settings = settings;
        this.save();
    },

    resetData() {
        this.state.data = JSON.parse(JSON.stringify(defaultData));
        this.save();
    }
};

store.init();
