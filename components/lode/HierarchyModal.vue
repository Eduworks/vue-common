<template>
    <div
        class="modal"
        :class="{'is-active': showModal}">
        <div class="modal-background" />
        <div class="modal-content">
        <!-- Any other Bulma elements you want -->
        </div>
        <button
            class="modal-close is-large"
            @click="$emit('updateExportModal', false)"
            aria-label="close" />
    </div>
</template>

<script>
export default {
    name: 'HierarchyModal',
    props: {
        showModal: Boolean
    },
    data() {
        return {

        };
    }
};
</script>

<style lang="scss"></style>