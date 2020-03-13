
<template>
    <!-- nav bar navigation -->
    <nav
        class="navbar is-black is-fixed-top"
        role="navigation"
        aria-label="main navigation">
        <div class="navbar-brand">
            <div class="navbar-item">
                <router-link to="/">
                    <h2 class="has-text-white subtitle">
                        {{ title }}
                    </h2>
                </router-link>
            </div>
            <a
                role="button"
                class="navbar-burger burger"
                :class="{ 'is-active': navBarActive}"
                aria-label="menu"
                aria-expanded="false"
                data-target="mainDropDown"
                @click="navBarActive = !navBarActive">
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
            </a>
        </div>
        <div class="navbar-menu">
            <div class="navbar-start">
                <slot />
            </div>
            <div class="navbar-end" />
        </div>

        <!-- nav bar tablet and mobile drop down side navigation -->
        <div
            id="mainDropDown"
            class="navbar-menu is-dark is-hoverable"
            :class="{ 'is-active': navBarActive}">
            <div class="navbar-end">
                <div
                    class="navbar-item has-dropdown is-hidden-desktop"
                    :class="{ 'is-active': navBarActive}">
                    <div>
                        <slot />
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>
<script>
export default {
    name: 'TopBar',
    props: {
        title: String,
        navBarActive: {type: Boolean, default: true}
    },
    data() {
        return {
        };
    },
    watch: {
    },
    computed: {
    }
};
</script>
<style>
</style>