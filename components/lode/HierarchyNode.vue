<template>
    <li
        :class="'e-HierarchyNode'"
        :id="obj.shortId()">
        <Thing
            :obj="obj"
            :parentNotEditable="!canEdit"
            :profile="profile">
            <slot />
        </Thing>
        <span
            class="icon"
            v-if="collapse && hasChild.length > 0"
            @click="collapse = !collapse"><i class="fa fa-caret-square-right" /></span>
        <span
            class="icon"
            v-else-if="hasChild.length > 0"
            @click="collapse = !collapse"><i class="fa fa-caret-square-down" /></span>
        <ul
            :class="'e-HierarchyNode-ul' + (dragging == true ? ' dragging' : '')"
            v-if="collapse == false">
            <draggable
                :id="obj.shortId()"
                v-model="hasChild"
                :group="{ name: 'test' }"
                :disabled="canEdit != true"
                @start="beginDrag"
                @end="endDrag">
                <HierarchyNode
                    v-for="item in hasChild"
                    :key="item.obj.id"
                    :obj="item.obj"
                    :hasChild="item.children"
                    :dragging="dragging"
                    :canEdit="canEdit"
                    :profile="profile">
                    <slot />
                </HierarchyNode>
                <i
                    v-if="canEdit"
                    class="drag-footer fa fa-plus"
                    slot="footer"
                    @click="add(obj.shortId())" />
            </draggable>
        </ul>
    </li>
</template>
<script>
import Thing from './Thing.vue';
import draggable from 'vuedraggable';
export default {
    name: "HierarchyNode",
    props: {
        obj: Object,
        hasChild: Array,
        canEdit: Boolean,
        dragging: Boolean,
        profile: Object
    },
    components: {Thing, draggable},
    data: function() {
        return {
            collapse: false,
            controlOnStart: false
        };
    },
    computed: {
    },
    methods: {
        // WARNING: The Daemon of OBO lingers in these here drag and move methods. The library moves the objects, and OBO will then come get you!
        beginDrag: function(event) {
            if (event !== undefined) {
                this.controlOnStart = event.originalEvent.ctrlKey || event.originalEvent.shiftKey;
            }
            var parent = this.$parent;
            while (parent.beginDrag == null) { parent = parent.$parent; }
            parent.beginDrag();
        },
        endDrag: function(foo) {
            console.log(foo.oldIndex, foo.newIndex);
            var toId = null;
            var plusup = 0;
            if (foo.from.id === foo.to.id) {
                if (foo.newIndex + 1 < this.hasChild.length) {
                    toId = this.hasChild[foo.newIndex + 1].obj.shortId();
                }
            } else {
                if (foo.to.children[foo.newIndex] === undefined) {
                    toId = foo.to.id;
                } else {
                    if (foo.to.id === "") {
                        if (foo.newIndex < foo.to.children.length) {
                            toId = foo.to.children[foo.newIndex].id;
                        }
                    } else {
                        if (foo.newIndex + 1 < foo.to.children.length) {
                            toId = foo.to.children[foo.newIndex + 1].id;
                        }
                    }
                }
            }
            this.move(
                foo.clone.id,
                toId,
                foo.from.id,
                foo.to.id,
                !this.controlOnStart, plusup);
        },
        move: function(fromId, toId, fromContainerId, toContainerId, removeOldRelations, plusup) {
            var parent = this.$parent;
            while (parent.move == null) { parent = parent.$parent; }
            parent.move(fromId, toId, fromContainerId, toContainerId, removeOldRelations, plusup);
        },
        add: function(containerId) {
            var parent = this.$parent;
            while (parent.add == null) { parent = parent.$parent; }
            parent.add(containerId);
        }
    }
};
</script>