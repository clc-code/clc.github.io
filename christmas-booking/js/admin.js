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
            id: null, // If null, create. If present, update.
            shortName: '', name: '', date: '', category: 'Single',
            capacity: 10, status: 'Open', remark: ''
        },
        importText: '',
        importType: 'venues', // groups | venues

        editingGroupId: null // Track which group is being edited (Pencil icon)
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
        },
        isEditingVenue() {
            return !!this.newVenue.id;
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

        openCreateVenueModal() {
            this.newVenue = { id: null, shortName: '', name: '', date: '', category: 'Single', capacity: 10, status: 'Open', remark: '' };
            $('#venueModal').modal('show');
        },

        openEditVenueModal(venue) {
            this.newVenue = JSON.parse(JSON.stringify(venue)); // Copy
            $('#venueModal').modal('show');
        },

        saveVenue() {
            if (this.newVenue.id) {
                // Update
                store.updateVenue(this.newVenue);
            } else {
                // Create
                const venue = {
                    id: 'v_' + Date.now(),
                    registered: 0,
                    ...this.newVenue
                };
                delete venue.id; // remove null id so we generated one? Oh wait we just spread it.
                // Actually, let's fix the id generation properly.
                venue.id = 'v_' + Date.now();
                store.addVenue(venue);
            }
            $('#venueModal').modal('hide');
        },

        deleteVenue(id) {
            if (confirm('Delete venue?')) {
                store.deleteVenue(id);
            }
        },

        toggleCategory(venue) {
            const newCat = (venue.category === 'Single') ? 'Joint' : 'Single';
            venue.category = newCat;
            store.updateVenue(venue);
        },

        deleteGroup(id) {
            if (confirm('Delete group?')) {
                store.deleteGroup(id);
            }
        },

        enableEditGroup(id) {
            this.editingGroupId = id;
        },

        saveGroupEdit(group) {
            store.updateGroup(group);
            this.editingGroupId = null;
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

        exportBookings() {
            const bookings = store.getBookings();
            if (bookings.length === 0) {
                alert("No bookings to export.");
                return;
            }

            let csv = "Time,Venue,Venue Name,Group ID,User\n";
            bookings.forEach(b => {
                const venue = store.getVenue(b.venueId);
                const venueShort = venue ? venue.shortName : b.venueId;
                const venueName = venue ? venue.name : 'Unknown';
                const time = new Date(b.timestamp).toLocaleString().replace(',', '');
                csv += `${time},${venueShort},${venueName},${b.groupId},${b.userName}\n`;
            });

            // BOM for Excel UTF-8
            const bom = "\uFEFF";
            const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "bookings_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        getVenueName(id) {
            const v = store.getVenue(id);
            return v ? v.name : 'Deleted (' + id.substr(-4) + ')';
        }
    }
});
