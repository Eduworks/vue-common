<template>
    <li
        class="e-HierarchyNode"
        :id="obj.shortId()">
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
            v-if="collapse == false">
            <draggable
                :id="obj.shortId()"
                v-model="hasChild"
                group="test"
                :disabled="canEdit != true"
                @start="beginDrag"
                @end="endDrag">
                <HierarchyNode
                    v-for="item in hasChild"
                    :key="item.obj.id"
                    :obj="item.obj"
                    :hasChild="item.children"
                    :canEdit="canEdit"
                    :profile="profile" />
                <i
                    v-if="canEdit"
                    class="fa fa-plus"
                    slot="footer" />
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
        showEmptyContainers: Boolean,
        profile: Object
    },
    components: {Thing, draggable},
    data: function() {
        return {
            collapse: false
        };
    },
    computed: {
    },
    methods: {
        beginDrag: function() {
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
                    if (foo.newIndex < foo.to.children.length) {
                        if (foo.to.id === "") {
                            toId = foo.to.children[foo.newIndex].id;
                        } else {
                            toId = foo.to.children[foo.newIndex + 1].id;
                        }
                    }
                }
                // plusup = -1;
            }
            this.move(
                foo.clone.id,
                toId,
                foo.from.id,
                foo.to.id,
                true, plusup);
        },
        move: function(fromId, toId, fromContainerId, toContainerId, removeOldRelations, plusup) {
            var parent = this.$parent;
            while (parent.move == null) { parent = parent.$parent; }
            parent.move(fromId, toId, fromContainerId, toContainerId, true, plusup);
        }
    }
};
</script>