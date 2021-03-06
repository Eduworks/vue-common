<template>
    <li
        :class="['e-HierarchyNode', editingThingClass]"
        class="section is-paddingless"
        v-cloak
        :id="obj.shortId()">
        <div
            class="columns is-gapless is-paddingless is-marginless is-mobile is-multiline">
            <div class="column is-12">
                <div class="section is-paddingless">
                    <div class="columns is-gapless is-mobile is-marginless is-paddingless is-multiline">
                        <input
                            v-if="selectMode"
                            type="checkbox"
                            v-model="checked">
                        <div class="column full-column has-background-light constrain-column">
                            <Thing
                                :obj="obj"
                                @expandEvent="onExpandEvent()"
                                @editingThing="handleEditingThing($event)"
                                @addNode="onAddNodeEvent()"
                                :parentNotEditable="!canEdit"
                                :profile="profile"
                                :childrenExpanded="childrenExpanded"
                                :children="this.hasChild.length"
                                :exportOptions="exportOptions"
                                :highlightList="highlightList"
                                :selectMode="selectMode"
                                :iframePath="iframePath"
                                :iframeText="iframeText"
                                :class="newThingClass"
                                :newFramework="newFramework"
                                :index="index"
                                @moveUp="moveUp"
                                @moveDown="moveDown"
                                @moveRight="moveRight"
                                @moveLeft="moveLeft"
                                :containerEditable="containerEditable"
                                @select="select"
                                @deleteObject="deleteObject"
                                @removeObject="removeObject"
                                @exportObject="exportObject">
                                <slot />
                            </Thing>
                        </div>
                        <div
                            v-if="!collapse && hasChild.length > 0"
                            class="column is-12 hello">
                            <ul
                                :class="'e-HierarchyNode-ul' + (dragging == true ? ' dragging' : '')">
                                <draggable
                                    :id="obj.shortId()"
                                    v-model="hasChild"
                                    :group="{ name: 'test' }"
                                    :disabled="canEdit != true"
                                    @start="beginDrag"
                                    @end="endDrag">
                                    <HierarchyNode
                                        v-for="(item, i) in hasChild"
                                        :key="item.obj.id"
                                        :obj="item.obj"
                                        :hasChild="item.children"
                                        :dragging="dragging"
                                        :canEdit="canEdit"
                                        :profile="profile"
                                        :exportOptions="exportOptions"
                                        :highlightList="highlightList"
                                        :selectMode="selectMode"
                                        :selectAll="selectAll"
                                        :iframePath="iframePath"
                                        :iframeText="iframeText"
                                        :newFramework="newFramework"
                                        :index="i"
                                        :parentStructure="hasChild"
                                        :parent="obj"
                                        :containerEditable="containerEditable"
                                        @beginDrag="beginDrag"
                                        @move="move"
                                        @select="select"
                                        @add="add"
                                        @deleteObject="deleteObject"
                                        @removeObject="removeObject"
                                        @exportObject="exportObject">
                                        <slot />
                                    </HierarchyNode>
                                    <!--<i
                                        v-if="canEdit"
                                        class="drag-footer fa fa-plus"
                                        slot="footer"
                                        @click="add(obj.shortId())" />-->
                                </draggable>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
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
        profile: Object,
        exportOptions: Array,
        highlightList: Array,
        selectMode: Boolean,
        selectAll: Boolean,
        iframePath: String,
        iframeText: String,
        newFramework: Boolean,
        index: Number,
        parentStructure: Array,
        parent: Object,
        containerEditable: Boolean
    },
    components: {Thing, draggable},
    data: function() {
        return {
            collapse: false,
            controlOnStart: false,
            checked: false,
            editingThingClass: '',
            childrenExpanded: true
        };
    },
    computed: {
        newThingClass: function() {
            if (this.$store.state.editor) {
                if (this.obj.shortId() === this.$store.state.editor.newCompetency) {
                    return 'new-thing';
                }
            }
            return '';
        }
    },
    // used to help the parent know when nodes stop rendering
    mounted() {
        this.$emit('mountingNode');
    },
    methods: {
        handleEditingThing: function(e) {
            if (e) {
                this.editingThingClass = 'editing-thing';
            } else {
                this.editingThingClass = '';
            }
        },
        onAddNodeEvent: function() {
            this.add(this.obj.shortId());
        },
        onExpandEvent: function() {
            this.collapseIfPossible();
            this.childrenExpanded = !this.childrenExpanded;
        },
        collapseIfPossible: function() {
            if (this.hasChild.length > 0) {
                this.collapse = !this.collapse;
            }
        },
        // WARNING: The Daemon of OBO lingers in these here drag and move methods. The library moves the objects, and OBO will then come get you!
        beginDrag: function(event) {
            if (event !== undefined) {
                this.controlOnStart = event.originalEvent.ctrlKey || event.originalEvent.shiftKey;
            }
            this.$emit('beginDrag');
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
            this.$emit('move', fromId, toId, fromContainerId, toContainerId, removeOldRelations, plusup);
        },
        moveUp: function(thing, index) {
            if (index - 1 < 0) {
                return;
            }
            var fromId = thing.shortId();
            var parent = this.parent.shortId();
            var toId = this.parentStructure[index - 1].obj.shortId();
            this.move(fromId, toId, parent, parent, true, 0);
        },
        moveDown: function(thing, index) {
            if (index + 1 >= this.parentStructure.length) {
                return;
            }
            var toId = null;
            var fromId = thing.shortId();
            var parent = this.parent.shortId();
            if (index + 2 !== this.parentStructure.length) {
                var toId = this.parentStructure[index + 2].obj.shortId();
            }
            this.move(fromId, toId, parent, parent, true, 0);
        },
        moveRight: function(thing, index) {
            if (index - 1 < 0) {
                return;
            }
            var fromId = thing.shortId();
            var toId = null;
            var fromContainerId = this.parent.shortId();
            var toContainerId = this.parentStructure[index - 1].obj.shortId();
            this.move(fromId, toId, fromContainerId, toContainerId, true, 0);
        },
        moveLeft: function(thing, index) {
            if (this.parent.type === "Framework") {
                return;
            }
            var fromId = thing.shortId();
            var fromContainerId = this.parent.shortId();
            var toId = null;
            var toContainerId = this.$parent.$parent.parent.shortId();
            this.move(fromId, toId, fromContainerId, toContainerId, true, 0);
        },
        add: function(containerId) {
            this.$emit('add', containerId);
        },
        select: function(objId, checked) {
            this.$emit('select', objId, checked);
        },
        deleteObject: function(thing) {
            this.$emit('deleteObject', thing);
        },
        removeObject: function(thing) {
            this.$emit('removeObject', thing);
        },
        exportObject: function(thing, type) {
            this.$emit('exportObject', thing, type);
        }
    },
    watch: {
        checked: function() {
            this.$emit('select', this.obj.id, this.checked);
        },
        selectAll: function() {
            if (this.selectMode) {
                this.checked = this.selectAll;
            }
        }
    }
};
</script>