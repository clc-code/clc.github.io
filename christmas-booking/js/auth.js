const auth = {
    state: Vue.observable({
        user: null,
        isLoggedIn: false,
        error: null
    }),

    init() {
        const user = sessionStorage.getItem('christmas_user');
        if (user) {
            this.state.user = JSON.parse(user);
            this.state.isLoggedIn = true;
        }
    },

    login(groupId) {
        this.state.error = null;
        // Verify against store groups if we want strictrness, or just accept
        // User requirements: "Index.html just need input group id"
        // Let's check if group exists in store if store has groups.

        const groups = store.getGroups();
        let group = groups.find(g => g.id === groupId);

        if (groups.length > 0 && !group) {
            // If we have imported groups but this ID isn't found
            this.state.error = "Group ID not found.";
            return false;
        }

        // Create session user
        const user = {
            id: groupId,
            name: group ? group.name : `Group ${groupId}`,
            groupId: groupId,
            role: 'leader'
        };

        this.state.user = user;
        this.state.isLoggedIn = true;
        sessionStorage.setItem('christmas_user', JSON.stringify(user));
        return true;
    },

    logout() {
        this.state.user = null;
        this.state.isLoggedIn = false;
        sessionStorage.removeItem('christmas_user');
    },

    getUser() {
        return this.state.user;
    }
};

auth.init();
