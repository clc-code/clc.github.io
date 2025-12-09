const app = new Vue({
    el: '#app',
    data: {
        isAdminLoggedIn: false, // Default false to show login screen
        login: {
            account: '',
            password: ''
        },
        loginError: '',

        activeTab: 'venues',
        newVenue: {
            shortName: '', name: '', date: '', category: 'Single',
            capacity: 10, status: 'Open', remark: ''
        },
        importText: '',
        importType: 'groups', // groups | venues
    },
    computed: {
        venues() {
            return store.state.data ? store.state.data.venues : [];
        },
        groups() {
            return store.state.data ? store.state.data.groups : [];
        },
        settings() {
            return store.state.data ? store.state.data.settings : {};
        },
        bookings() {
            return store.state.data ? store.state.data.bookings : [];
        }
    },
    methods: {
        // LOGIN
        async checkLogin() {
            if (!this.login.account || !this.login.password) return;

            const userInput = this.login.account.trim();
            const pwdInput = this.login.password.trim();

            // Hashes for 'CLC' and '1225' (SHA-256)
            const userHash = '3f0395803f7ea56f6a4fb83e760e3a271ba228c87293aa36fc65f1020074ac98';
            const pwdHash = '6ecf763ff6e7cef7b47e6611e1bf76fe2608a2e32a97b2d88b083ae1d8d02c82';

            const uH = await this.sha256(userInput);
            const pH = await this.sha256(pwdInput);

            if (uH === userHash && pH === pwdHash) {
                this.isAdminLoggedIn = true;
                this.loginError = '';
            } else {
                this.loginError = 'Invalid Account or Password';
            }
        },

        async sha256(message) {
            // encode as UTF-8
            const msgBuffer = new TextEncoder().encode(message);
            // hash the message
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            // convert ArrayBuffer to Array
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            // convert bytes to hex string                  
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        },

        // LOGIC
        saveSettings() {
            store.updateSettings(this.settings);
            alert('Settings Saved');
        },

        createVenue() {
            const venue = {
                id: 'v_' + Date.now(),
                registered: 0,
                ...this.newVenue
            };
            store.addVenue(venue);
            this.newVenue = { shortName: '', name: '', date: '', category: 'Single', capacity: 10, status: 'Open', remark: '' };
            $('#venueModal').modal('hide');
        },

        deleteVenue(id) {
            if (confirm('Delete venue?')) {
                store.deleteVenue(id);
            }
        },

        toggleCategory(venue) {
            // Toggle Single <-> Joint
            const newCat = (venue.category === 'Single') ? 'Joint' : 'Single';
            venue.category = newCat; // Direct mutate reactive object works in Vue 2 if properly initialized
            store.updateVenue(venue);
        },

        deleteGroup(id) {
            if (confirm('Delete group?')) {
                store.deleteGroup(id);
            }
        },

        updateGroup(group) {
            store.updateGroup(group);
        },

        processImport() {
            if (!this.importText) return;

            let count = 0;
            if (this.importType === 'groups') {
                count = store.importGroupsFromText(this.importText);
                alert(`Imported/Merged ${count} groups.`);
            } else {
                count = store.importVenuesFromText(this.importText);
                alert(`Imported ${count} venues.`);
            }
            this.importText = '';
        },

        clearAllGroups() {
            if (confirm('Are you sure you want to delete ALL groups? This cannot be undone.')) {
                store.deleteAllGroups();
            }
        },
        clearAllVenues() {
            if (confirm('Are you sure you want to delete ALL venues? This cannot be undone.')) {
                store.deleteAllVenues();
            }
        },

        deleteBooking(id) {
            if (confirm('Cancel this booking?')) {
                store.deleteBooking(id);
            }
        },

        clearAllBookings() {
            if (confirm('CLEAR ALL BOOKINGS? This will reset usage counts.')) {
                store.deleteAllBookings();
            }
        },

        getVenueName(id) {
            const v = store.getVenue(id);
            return v ? v.name : id;
        }
    }
});
