<template>
    <li class="e-HierarchyNode">
        <Thing
            :obj="obj"
            :parentNotEditable="!canEdit"
            :profile="profile" />
        <span
            class="icon"
            v-if="collapse && hasChild != null"
            @click="collapse = !collapse"><i class="fa fa-caret-square-right" /></span>
        <span
            class="icon"
            v-else-if="hasChild != null"
            @click="collapse = !collapse"><i class="fa fa-caret-square-down" /></span>
        <ul
            class="e-HierarchyNode-ul"
            v-if="collapse == false || collapse == null">
            <HierarchyNode
                v-for="item in hasChild"
                :key="item.obj.id"
                :obj="item.obj"
                :hasChild="item.children"
                :profile="profile" />
        </ul>
    </li>
</template>
<script>
import Thing from './Thing.vue';
export default {
    name: "HierarchyNode",
    props: {
        obj: Object,
        hasChild: Array,
        canEdit: Boolean,
        profile: Object
    },
    components: {Thing},
    data: function() {
        return {
            collapse: false
        };
    }
};
</script>